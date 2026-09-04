/* Study 2 — the participant-facing API: session start / resume / ping, page
   saves, screen-out, completion. The same shape as Study 1's session.js and
   save.js, against the s2_ tables and the Study 2 plan. */

import { q, withTx } from "../db.js";
import { config } from "../config.js";
import { newToken, newShortCode, hashIp, clientIp } from "../routes/session.js";
import { assignS2Cell, releaseS2Cell, s2HasCapacity, S2FullError } from "./allocation.js";
import { buildS2Plan, publicS2Plan, s2PlanIndex, s2PlanItems, S2_VERSION } from "../../shared/s2-instrument.js";

/* Platform identifiers, matched without regard to case. Same keys as Study 1
   so the same Connect configuration works for both. */
const PID_KEYS     = ["participantId", "PROLIFIC_PID", "prolific_pid", "workerId", "worker_id", "pid"];
const STUDY_KEYS   = ["projectId", "project_id", "STUDY_ID", "study_id", "hitId", "hit_id"];
const SESSION_KEYS = ["assignmentId", "assignment_id", "SESSION_ID", "session_id"];

const firstOf = (obj, keys) => {
  const lower = new Map(Object.entries(obj ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower.get(k.toLowerCase());
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 128);
  }
  return null;
};
const externalIds = params => ({
  pid:     firstOf(params, PID_KEYS),
  study:   firstOf(params, STUDY_KEYS),
  session: firstOf(params, SESSION_KEYS)
});

const BACKFILL_SQL = `
  external_pid     = COALESCE(external_pid,     $2),
  external_study   = COALESCE(external_study,   $3),
  external_session = COALESCE(external_session, $4)`;

const completionFor = p => ({
  code: config.s2CompletionCode || p.short_code,
  redirectUrl: config.s2CompletionRedirectUrl || null,
  platform: config.recruitment
});

function sessionView(p) {
  return {
    participantId: p.id,
    shortCode: p.short_code,
    status: p.status,
    pageKey: p.page_key,
    pageIndex: p.page_index,
    plan: publicS2Plan(buildS2Plan(p.seg_order)),
    completion: completionFor(p)
  };
}

/* Answer validation. The client sends an item id and a value; every label is
   looked up here so a tampered page cannot write text of its own. */
function coerce(item, raw) {
  switch (item.type) {
    case "mc": {
      const n = Number(raw?.num);
      if (!Number.isInteger(n) || n < 0 || n >= item.options.length) return null;
      return { value_num: n, value_text: item.options[n] };
    }
    /* Seven-point items are stored 1..7, the way Study 1 stores them, so a
       column from either study means the same thing without rescaling. The
       label comes from the item's own options — the agreement anchors for the
       evaluation items, the confidence wording for the confidence item. */
    case "likert7": {
      const n = Number(raw?.num);
      if (!Number.isInteger(n) || n < 1 || n > 7) return null;
      return { value_num: n, value_text: item.options?.[n - 1] ?? null };
    }
    case "number": {
      const n = Number(raw?.num);
      if (!Number.isFinite(n)) return null;
      if (item.min != null && n < item.min) return null;
      if (item.max != null && n > item.max) return null;
      return { value_num: n, value_text: null };
    }
    case "text": {
      const s = String(raw?.text ?? "").replace(/\s+/g, " ").trim();
      if (!s) return null;
      if (item.minLength != null && s.length < item.minLength) return null;
      return { value_num: null, value_text: s.slice(0, item.maxLength ?? 2000) };
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

export default async function s2ParticipantRoutes(app) {

  app.post("/api/s2/session/start", {
    config: { rateLimit: { max: config.sessionStartRateMax, timeWindow: 60_000 } }
  }, async (req, reply) => {
    const body = req.body ?? {};
    const existing = String(body.token || "").trim();

    if (existing) {
      const ext = externalIds(body.params ?? {});
      const { rows } = await q(
        `UPDATE s2_participants SET last_seen_at = now(), ${BACKFILL_SQL}
          WHERE token = $1 RETURNING *`,
        [existing, ext.pid, ext.study, ext.session]
      );
      if (rows.length) return { resumed: true, token: existing, ...sessionView(rows[0]) };
    }

    const params = body.params ?? {};
    const isTest = /^(1|true|yes)$/i.test(String(params.test ?? params.preview ?? ""));
    const ext    = externalIds(params);

    /* One row per platform participant: a return visit gets its own row back. */
    if (!isTest && ext.pid) {
      /* Matched on lower(external_pid), not on the text as it arrived. A
         platform id that comes back with different casing is the same person,
         and treating it as a new one would both duplicate their row and slip
         them past the Study 1 exclusion below. The partial unique index in
         db/s2-schema.sql is on the same expression, so two starts racing under
         one id cannot both insert. */
      const { rows: prior } = await q(
        `UPDATE s2_participants SET last_seen_at = now()
          WHERE id = (SELECT id FROM s2_participants
                       WHERE lower(external_pid) = lower($1) AND NOT is_test
                       ORDER BY started_at DESC LIMIT 1)
          RETURNING *`,
        [ext.pid]
      );
      if (prior.length) {
        req.log.info({ pid: prior[0].id, external_pid: ext.pid, status: prior[0].status }, "s2 session rejoined by platform id");
        return { resumed: true, rejoined: true, token: prior[0].token, ...sessionView(prior[0]) };
      }

      /* A fresh sample. Anyone who opened Study 1 under this platform id has
         already read one of its framings of who controls OriHime, which is
         the very thing this study asks people to guess. The platform's own
         exclusion list is the first line; this is the second. */
      if (config.s2ExcludeStudy1) {
        const { rows: s1 } = await q(
          `SELECT 1 FROM participants
            WHERE lower(external_pid) = lower($1) AND NOT is_test LIMIT 1`, [ext.pid]
        );
        if (s1.length) {
          req.log.info({ external_pid: ext.pid }, "s2 start refused: took part in study 1");
          return reply.code(403).send({
            error: "took_part_before",
            message: "You have already taken part in a related study, so you are not eligible for this one."
          });
        }
      }
    }

    if (!config.s2StudyOpen) {
      return reply.code(503).send({ error: "study_closed", message: "This study is not currently accepting responses." });
    }
    if (!(await s2HasCapacity())) {
      return reply.code(503).send({ error: "study_full", message: "This study has reached the number of responses it needs." });
    }

    let cell;
    try {
      cell = await assignS2Cell();
    } catch (err) {
      if (err instanceof S2FullError) {
        return reply.code(503).send({ error: "study_full", message: "This study has reached the number of responses it needs." });
      }
      throw err;
    }

    const token = newToken();
    const { rows } = await q(
      `INSERT INTO s2_participants (
         token, short_code, seg_order, instrument_ver, source,
         external_pid, external_study, external_session, is_test,
         user_agent, screen_w, screen_h, timezone, ui_language, ip_hash, page_key, page_index
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        token, newShortCode(), cell.seg_order, S2_VERSION, config.recruitment,
        ext.pid, ext.study, ext.session, isTest,
        String(req.headers["user-agent"] || "").slice(0, 400),
        Number.isFinite(body.screenW) ? Math.trunc(body.screenW) : null,
        Number.isFinite(body.screenH) ? Math.trunc(body.screenH) : null,
        String(body.timezone || "").slice(0, 64) || null,
        String(body.language || "").slice(0, 32) || null,
        hashIp(clientIp(req)),
        "intro", 0
      ]
    );
    if (isTest) await releaseS2Cell(cell.cell);

    req.log.info({ cell: cell.cell, test: isTest }, "s2 session started");
    return { resumed: false, token, ...sessionView(rows[0]) };
  });

  app.post("/api/s2/session/resume", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });

    const { rows: answers } = await q(
      `SELECT item_id, value_num, value_text FROM s2_responses WHERE participant_id = $1`, [p.id]
    );
    const { rows: videos } = await q(
      `SELECT segment, MAX(watch_s) AS watch_s, bool_or(event = 'gate_open') AS gate_open
         FROM s2_video_events WHERE participant_id = $1 GROUP BY segment`, [p.id]
    );
    const ext = externalIds(req.body?.params ?? {});
    const { rows: upd } = await q(
      `UPDATE s2_participants SET last_seen_at = now(), ${BACKFILL_SQL}
        WHERE id = $1 RETURNING *`,
      [p.id, ext.pid, ext.study, ext.session]
    );
    return {
      resumed: true,
      token: p.token,
      ...sessionView(upd[0] ?? p),
      answers: Object.fromEntries(answers.map(a => [a.item_id, { num: a.value_num, text: a.value_text }])),
      gates: Object.fromEntries(videos.map(v => [v.segment, { watch_s: Number(v.watch_s ?? 0), done: v.gate_open }]))
    };
  });

  app.post("/api/s2/session/ping", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });
    await q(`UPDATE s2_participants SET last_seen_at = now() WHERE id = $1`, [p.id]);
    return { ok: true };
  });

  /* One call per page turn; answers, dwell and video telemetry in one
     transaction. */
  app.post("/api/s2/save", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });
    if (p.status === "completed") return { ok: true, ignored: "already_completed" };

    const body = req.body ?? {};
    const index = s2PlanIndex(buildS2Plan(p.seg_order));

    const rows = [];
    const rejected = [];
    for (const raw of Array.isArray(body.answers) ? body.answers.slice(0, 100) : []) {
      const item = index.get(String(raw?.id ?? ""));
      if (!item) { rejected.push({ id: raw?.id, why: "unknown_item" }); continue; }
      const v = coerce(item, raw);
      if (!v) { rejected.push({ id: item.id, why: "bad_value" }); continue; }
      rows.push({
        item_id: item.id, page_key: item.pageKey, item_type: item.type,
        segment: item.segment, seg_position: item.segPosition,
        value_num: v.value_num, value_text: v.value_text,
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
          `INSERT INTO s2_responses (participant_id, item_id, page_key, item_type, segment,
                                     seg_position, value_num, value_text, answered_at, latency_ms, revisions)
           SELECT $1, u.item_id, u.page_key, u.item_type, u.segment, u.seg_position,
                  u.value_num, u.value_text, u.answered_at, u.latency_ms, u.revisions
             FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::smallint[],
                         $7::float8[], $8::text[], $9::timestamptz[], $10::int[], $11::int[])
               AS u(item_id, page_key, item_type, segment, seg_position,
                    value_num, value_text, answered_at, latency_ms, revisions)
           ON CONFLICT (participant_id, item_id) DO UPDATE SET
             page_key = EXCLUDED.page_key, item_type = EXCLUDED.item_type,
             segment = EXCLUDED.segment, seg_position = EXCLUDED.seg_position,
             value_num = EXCLUDED.value_num, value_text = EXCLUDED.value_text,
             answered_at = EXCLUDED.answered_at, latency_ms = EXCLUDED.latency_ms,
             revisions = GREATEST(s2_responses.revisions, EXCLUDED.revisions)`,
          [
            p.id,
            rows.map(r => r.item_id), rows.map(r => r.page_key), rows.map(r => r.item_type),
            rows.map(r => r.segment), rows.map(r => r.seg_position),
            rows.map(r => r.value_num), rows.map(r => r.value_text),
            rows.map(r => r.answered_at), rows.map(r => r.latency_ms), rows.map(r => r.revisions)
          ]
        );
      }

      if (page.key) {
        await client.query(
          `INSERT INTO s2_page_times (participant_id, page_key, visit, page_index, entered_at, left_at, dwell_ms)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (participant_id, page_key, visit) DO UPDATE SET
             left_at = EXCLUDED.left_at,
             dwell_ms = GREATEST(COALESCE(s2_page_times.dwell_ms, 0), COALESCE(EXCLUDED.dwell_ms, 0))`,
          [p.id, String(page.key).slice(0, 64), Math.max(1, intOrNull(page.visit) ?? 1),
           intOrNull(page.index), tsOrNull(page.enteredAt), tsOrNull(page.leftAt), intOrNull(page.dwellMs)]
        );
      }

      if (videos.length) {
        await client.query(
          `INSERT INTO s2_video_events (participant_id, segment, seg_position, video_id, event, detail, position_s, watch_s, at)
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

      await client.query(
        `UPDATE s2_participants
            SET page_key        = COALESCE($2, page_key),
                page_index      = GREATEST(page_index, COALESCE($3, 0)),
                last_seen_at    = now(),
                answered_count  = (SELECT COUNT(*) FROM s2_responses WHERE participant_id = $1),
                /* text_chars is left at its default: s2-v3 collects no free
                   text at all. The column stays so that re-introducing an open
                   question is an instrument change and not a migration; the
                   sum over item_type = 'text' comes back with it. */
                first_answer_at = LEAST(first_answer_at, (SELECT MIN(answered_at) FROM s2_responses WHERE participant_id = $1)),
                last_answer_at  = GREATEST(last_answer_at, (SELECT MAX(answered_at) FROM s2_responses WHERE participant_id = $1))
          WHERE id = $1`,
        [p.id, body.nextPageKey ? String(body.nextPageKey).slice(0, 64) : null, intOrNull(body.nextPageIndex)]
      );
    });

    if (rejected.length) req.log.warn({ pid: p.id, rejected }, "s2 save: items dropped");
    return { ok: true, saved: rows.length, rejected };
  });

  app.post("/api/s2/screen-out", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });
    const reason = String(req.body?.reason ?? "unspecified").slice(0, 40);
    const { rowCount } = await q(
      `UPDATE s2_participants
          SET status = 'screened_out', screen_out_reason = $2, completed_at = now(), last_seen_at = now()
        WHERE id = $1 AND status = 'in_progress'`,
      [p.id, reason]
    );
    const released = rowCount === 1 && !p.is_test;
    if (released) await releaseS2Cell(p.seg_order);
    req.log.info({ pid: p.id, reason, released }, "s2 screened out");
    return { ok: true, reason };
  });

  /* Final submit. `complete_pass` is derived from what is in the table. */
  app.post("/api/s2/complete", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });

    const items = s2PlanItems(buildS2Plan(p.seg_order));
    const { rows: stored } = await q(
      `SELECT item_id, value_num FROM s2_responses WHERE participant_id = $1`, [p.id]
    );
    const got = new Map(stored.map(r => [r.item_id, r.value_num]));
    const required = items.filter(i => i.required);
    const missing = required.filter(i => !got.has(i.id)).map(i => i.id);

    /* Both checks are scored here, against keys the browser was never sent.
       Not answering one is not passing it. Null only if the instrument carries
       no such check at all — which is what keeps rows collected under an
       earlier instrument out of the failure counts rather than in them. */
    const scored = group => {
      const it = items.find(i => i.group === group);
      return it ? Number(got.get(it.id)) === it.expected : null;
    };
    const attentionPass = scored("attention");
    const comprehensionPass = scored("comprehension");

    const { rows } = await withTx(async client => {
      await client.query(
        `INSERT INTO s2_submissions (participant_id, payload) VALUES ($1, $2::jsonb)
         ON CONFLICT (participant_id) DO UPDATE SET payload = EXCLUDED.payload, received_at = now()`,
        [p.id, JSON.stringify({
          client: req.body ?? {},
          derived: {
            missing, itemsExpected: required.length, itemsStored: got.size,
            attentionPass, comprehensionPass
          }
        })]
      );
      const upd = await client.query(
        `UPDATE s2_participants
            SET status = 'completed', completed_at = now(), last_seen_at = now(),
                page_key = 'finish', page_index = GREATEST(page_index, 5),
                complete_pass = $2,
                attention_pass = $3,
                comprehension_pass = $4,
                answered_count = (SELECT COUNT(*) FROM s2_responses WHERE participant_id = $1)
          WHERE id = $1
          RETURNING short_code`,
        [p.id, missing.length === 0, attentionPass, comprehensionPass]
      );
      if (p.status !== "completed" && !p.is_test) {
        await client.query(`UPDATE s2_allocation SET completed = completed + 1 WHERE cell = $1`, [p.seg_order]);
      }
      return upd;
    });

    req.log.info({ pid: p.id, order: p.seg_order, missing: missing.length,
                   attentionPass, comprehensionPass }, "s2 completed");
    const code = completionFor({ short_code: rows[0]?.short_code ?? p.short_code });
    return { ok: true, shortCode: rows[0]?.short_code ?? p.short_code,
             completionCode: code.code, redirectUrl: code.redirectUrl, missing };
  });
}
