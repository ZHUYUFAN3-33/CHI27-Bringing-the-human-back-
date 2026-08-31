import { q, withTx } from "../db.js";
import { config } from "../config.js";
import { SCALE, ATTENTION_CHECK_VALUE } from "../../shared/instrument.js";
import { runtimePlan, runtimeIndex, runtimeItems } from "../instrument-runtime.js";

/* ---------------------------------------------------------------------------
   Answer validation.

   The client sends only an item id and a numeric value. Every label written to
   the database is looked up from shared/instrument.js on the server, so the
   stored text can never disagree with the questionnaire, however the page was
   tampered with. Anything that does not type-check is dropped and reported
   back rather than 500-ing the request: losing one malformed item is always
   better than losing the page.
--------------------------------------------------------------------------- */

function coerce(item, raw) {
  const num = raw?.num;
  const text = raw?.text;

  switch (item.type) {
    case "likert7": {
      const n = Number(num);
      if (!Number.isInteger(n) || n < 1 || n > 7) return null;
      return { value_num: n, value_text: SCALE[n - 1] };
    }
    case "mc": {
      const n = Number(num);
      if (!Number.isInteger(n) || n < 0 || n >= item.options.length) return null;
      return { value_num: n, value_text: item.options[n] };
    }
    case "rank": {
      const n = Number(num);
      if (!Number.isInteger(n) || n < 1 || n > item.maxRank) return null;
      return { value_num: n, value_text: item.actor };
    }
    case "select": {
      /* The client sends the option key. It is stored only if the instrument
         still offers it, so a stale page or a hand-edited request cannot put a
         country code in the table that the codebook does not define. */
      const key = String(text ?? "").trim();
      const opt = item.options?.find(o => o.value === key);
      if (!opt) return null;
      return { value_num: null, value_text: opt.value };
    }
    case "number": {
      const n = Number(num);
      if (!Number.isFinite(n)) return null;
      if (item.min != null && n < item.min) return null;
      if (item.max != null && n > item.max) return null;
      return { value_num: n, value_text: null };
    }
    case "text": {
      const s = String(text ?? "").trim();
      if (!s) return null;
      return { value_num: null, value_text: s.slice(0, item.maxLength ?? 500) };
    }
    default:
      return null;
  }
}

const tsOrNull = v => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
};
const intOrNull = v => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : null);

/* --------------------------------------------------------------- routes */

export default async function saveRoutes(app) {

  /* One call per page turn. Everything the page produced — answers, dwell,
     video telemetry — lands in a single transaction, so a page is either
     recorded whole or not at all. */
  app.post("/api/save", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });
    if (p.status === "completed") return { ok: true, ignored: "already_completed" };

    const body = req.body ?? {};
    const index = runtimeIndex(p.condition, p.seg_order, p.optional_block);

    const rows = [];
    const rejected = [];
    for (const raw of Array.isArray(body.answers) ? body.answers.slice(0, 300) : []) {
      const item = index.get(String(raw?.id ?? ""));
      if (!item) { rejected.push({ id: raw?.id, why: "unknown_item" }); continue; }
      const v = coerce(item, raw);
      if (!v) { rejected.push({ id: item.id, why: "bad_value" }); continue; }
      rows.push({
        item_id: item.id,
        page_key: item.pageKey,
        item_type: item.type,
        segment: item.segment,
        seg_position: item.segPosition,
        value_num: v.value_num,
        value_text: v.value_text,
        answered_at: tsOrNull(raw.at) ?? new Date().toISOString(),
        latency_ms: intOrNull(raw.latencyMs),
        revisions: Math.max(0, intOrNull(raw.revisions) ?? 0)
      });
    }

    const page = body.page ?? {};
    const videos = Array.isArray(body.videoEvents) ? body.videoEvents.slice(0, 100) : [];

    await withTx(async client => {
      if (rows.length) {
        await client.query(
          `INSERT INTO responses (participant_id, item_id, page_key, item_type, segment,
                                  seg_position, value_num, value_text, answered_at, latency_ms, revisions)
           SELECT $1, u.item_id, u.page_key, u.item_type, u.segment, u.seg_position,
                  u.value_num, u.value_text, u.answered_at, u.latency_ms, u.revisions
             FROM unnest($2::text[],  $3::text[],  $4::text[],  $5::text[],  $6::smallint[],
                         $7::float8[], $8::text[], $9::timestamptz[], $10::int[], $11::int[])
               AS u(item_id, page_key, item_type, segment, seg_position,
                    value_num, value_text, answered_at, latency_ms, revisions)
           ON CONFLICT (participant_id, item_id) DO UPDATE SET
             page_key     = EXCLUDED.page_key,
             item_type    = EXCLUDED.item_type,
             segment      = EXCLUDED.segment,
             seg_position = EXCLUDED.seg_position,
             value_num    = EXCLUDED.value_num,
             value_text   = EXCLUDED.value_text,
             answered_at  = EXCLUDED.answered_at,
             latency_ms   = EXCLUDED.latency_ms,
             revisions    = GREATEST(responses.revisions, EXCLUDED.revisions)`,
          [
            p.id,
            rows.map(r => r.item_id),  rows.map(r => r.page_key),
            rows.map(r => r.item_type), rows.map(r => r.segment),
            rows.map(r => r.seg_position),
            rows.map(r => r.value_num), rows.map(r => r.value_text),
            rows.map(r => r.answered_at), rows.map(r => r.latency_ms),
            rows.map(r => r.revisions)
          ]
        );
      }

      if (page.key) {
        await client.query(
          `INSERT INTO page_times (participant_id, page_key, visit, page_index, entered_at, left_at, dwell_ms)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (participant_id, page_key, visit) DO UPDATE SET
             left_at  = EXCLUDED.left_at,
             /* GREATEST, not +: the client sends the visit's total dwell in one
                save, and delivery is at-least-once (timeout retries, and
                beaconFlush re-sends without dequeuing). Adding would double the
                dwell for exactly the participants on flaky connections. */
             dwell_ms = GREATEST(COALESCE(page_times.dwell_ms, 0), COALESCE(EXCLUDED.dwell_ms, 0))`,
          [p.id, String(page.key).slice(0, 64), Math.max(1, intOrNull(page.visit) ?? 1),
           intOrNull(page.index), tsOrNull(page.enteredAt), tsOrNull(page.leftAt), intOrNull(page.dwellMs)]
        );
      }

      if (videos.length) {
        await client.query(
          `INSERT INTO video_events (participant_id, segment, seg_position, video_id, event, detail, position_s, watch_s, at)
           SELECT $1, u.segment, u.seg_position, u.video_id, u.event, u.detail, u.position_s, u.watch_s, u.at
             FROM unnest($2::text[], $3::smallint[], $4::text[], $5::text[], $6::text[],
                         $7::float8[], $8::float8[], $9::timestamptz[])
               AS u(segment, seg_position, video_id, event, detail, position_s, watch_s, at)`,
          [
            p.id,
            videos.map(v => String(v.segment ?? "").slice(0, 8)),
            videos.map(v => intOrNull(v.segPosition)),
            videos.map(v => String(v.videoId ?? "").slice(0, 32) || null),
            videos.map(v => String(v.event ?? "").slice(0, 24)),
            videos.map(v => (v.detail == null ? null : String(v.detail).slice(0, 200))),
            videos.map(v => (Number.isFinite(Number(v.positionS)) ? Number(v.positionS) : null)),
            videos.map(v => (Number.isFinite(Number(v.watchS)) ? Number(v.watchS) : null)),
            videos.map(v => tsOrNull(v.at) ?? new Date().toISOString())
          ]
        );
      }

      /* answered_count is recomputed from the table rather than incremented,
         so a retried save cannot inflate it. */
      await client.query(
        `UPDATE participants
            SET page_key        = COALESCE($2, page_key),
                page_index      = GREATEST(page_index, COALESCE($3, 0)),
                last_seen_at    = now(),
                answered_count  = (SELECT COUNT(*) FROM responses WHERE participant_id = $1),
                first_answer_at = LEAST(first_answer_at, (SELECT MIN(answered_at) FROM responses WHERE participant_id = $1)),
                last_answer_at  = GREATEST(last_answer_at, (SELECT MAX(answered_at) FROM responses WHERE participant_id = $1))
          WHERE id = $1`,
        [p.id, body.nextPageKey ? String(body.nextPageKey).slice(0, 64) : null, intOrNull(body.nextPageIndex)]
      );
    });

    if (rejected.length) req.log.warn({ pid: p.id, rejected }, "save: items dropped");
    return { ok: true, saved: rows.length, rejected };
  });

  /* Screen-out: E1/E2/E3 answered No. The response itself is already stored by
     the preceding /api/save, so this only closes the record. */
  app.post("/api/screen-out", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });
    const reason = String(req.body?.reason ?? "unspecified").slice(0, 40);
    await q(
      `UPDATE participants
          SET status = 'screened_out', screen_out_reason = $2,
              completed_at = now(), last_seen_at = now()
        WHERE id = $1 AND status = 'in_progress'`,
      [p.id, reason]
    );
    req.log.info({ pid: p.id, reason }, "screened out");
    return { ok: true, reason };
  });

  /* Final submit. Derives the quality flags from what is actually in the
     database, not from anything the client claims. */
  app.post("/api/complete", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });

    const items = runtimeItems(p.condition, p.seg_order, p.optional_block);

    const { rows: stored } = await q(
      `SELECT item_id, value_num FROM responses WHERE participant_id = $1`, [p.id]
    );
    const got = new Map(stored.map(r => [r.item_id, r.value_num]));

    const attentionItem = items.find(i => i.group === "attention");
    const attentionPass = attentionItem
      ? got.get(attentionItem.id) === ATTENTION_CHECK_VALUE
      : null;

    const required = items.filter(i => i.required);
    const missing = required.filter(i => !got.has(i.id)).map(i => i.id);

    const { rows } = await withTx(async client => {
      await client.query(
        `INSERT INTO submissions (participant_id, payload)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (participant_id) DO UPDATE SET payload = EXCLUDED.payload, received_at = now()`,
        [p.id, JSON.stringify({
          client: req.body ?? {},
          derived: { attentionPass, missing, itemsExpected: required.length, itemsStored: got.size }
        })]
      );
      const upd = await client.query(
        `UPDATE participants
            SET status = 'completed', completed_at = now(), last_seen_at = now(),
                page_key = 'debrief',
                attention_pass = $2,
                answered_count = (SELECT COUNT(*) FROM responses WHERE participant_id = $1)
          WHERE id = $1
          RETURNING short_code, condition, cell`,
        [p.id, attentionPass]
      );
      /* Test runs are randomised like everyone else so the team sees a real
         participant's experience, but they gave their slot back at start and
         must not be counted towards the target here either. */
      if (p.status !== "completed" && !p.is_test) {
        await client.query(`UPDATE allocation SET completed = completed + 1 WHERE cell = $1`, [p.cell]);
      }
      return upd;
    });

    req.log.info(
      { pid: p.id, cell: p.cell, missing: missing.length, attentionPass },
      "completed"
    );

    return {
      ok: true,
      shortCode: rows[0]?.short_code ?? p.short_code,
      completionCode: config.completionCode || rows[0]?.short_code || p.short_code,
      redirectUrl: config.completionRedirectUrl || null,
      missing
    };
  });
}
