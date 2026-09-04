/* Study 2 — exports. Same streaming keyset scan as src/routes/export.js, over
   the s2_ tables. Behind requireAdmin. */

import { pool } from "../db.js";
import { row, BOM } from "../csv.js";
import {
  buildS2Plan, s2PlanItems, s2AllItemIds, S2_ORDER_KEYS, S2_ORDERS, S2_SEGMENT_KEYS, S2_VERSION
} from "../../shared/s2-instrument.js";

const PARTICIPANT_COLUMNS = [
  "id", "short_code", "seg_order", "pos_REL", "pos_ADV", "pos_COL", "instrument_ver", "status",
  "screen_out_reason", "source", "external_pid", "external_study", "external_session", "is_test",
  "complete_pass", "attention_pass", "answered_count", "started_at", "first_answer_at", "last_answer_at",
  "completed_at", "last_seen_at", "timezone", "ui_language", "screen_w", "screen_h", "ip_hash", "user_agent"
];

/* Where each clip sat for this participant, so an analysis of order effects
   needs no lookup. */
function positions(p) {
  const segs = S2_ORDERS[p.seg_order] ?? [];
  return Object.fromEntries(S2_SEGMENT_KEYS.map(s => [`pos_${s}`, segs.indexOf(s) + 1 || null]));
}

function filters(query) {
  const where = ["TRUE"];
  const params = [];
  if (!/^(1|true|yes)$/i.test(String(query.include_test ?? ""))) where.push("NOT p.is_test");
  if (query.status) { params.push(String(query.status)); where.push(`p.status = $${params.length}`); }
  else where.push("p.status <> 'in_progress'");
  if (/^(1|true|yes)$/i.test(String(query.usable_only ?? ""))) {
    where.push("p.status = 'completed'");
    where.push("COALESCE(p.complete_pass, TRUE)");
    /* Rows submitted before the check existed have NULL here and are kept:
       usable_only must not silently drop a participant for failing a question
       they were never asked. */
    where.push("COALESCE(p.attention_pass, TRUE)");
  }
  if (query.since) { params.push(String(query.since)); where.push(`p.started_at >= $${params.length}::timestamptz`); }
  return { where: where.join(" AND "), params };
}

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "").replace(/-/g, "");

function asCsv(reply, name) {
  reply.header("content-type", "text/csv; charset=utf-8");
  reply.header("content-disposition", `attachment; filename="${name}_${stamp()}.csv"`);
  reply.header("cache-control", "no-store");
}
function beginStream(reply, contentType, filename) {
  reply.hijack();
  reply.raw.writeHead(200, {
    "content-type": contentType,
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": "no-store"
  });
  return reply.raw;
}
const beginCsv  = (reply, name) => beginStream(reply, "text/csv; charset=utf-8", `${name}_${stamp()}.csv`);
const beginJson = (reply, name) => beginStream(reply, "application/json; charset=utf-8", `${name}_${stamp()}.json`);

async function* scanParticipants(where, params, batch = 500) {
  let after = null;
  for (;;) {
    const p = [...params];
    let clause = "";
    if (after) {
      p.push(after.started_at, after.id);
      clause = `AND (p.started_at, p.id) > ($${p.length - 1}::timestamptz, $${p.length}::uuid)`;
    }
    const { rows } = await pool.query(
      `SELECT p.*, p.started_at::text AS scan_started_at FROM s2_participants p
        WHERE ${where} ${clause}
        ORDER BY p.started_at, p.id
        LIMIT ${batch}`, p
    );
    if (!rows.length) return;
    after = { started_at: rows.at(-1).scan_started_at, id: rows.at(-1).id };
    for (const r of rows) delete r.scan_started_at;
    yield rows;
    if (rows.length < batch) return;
  }
}

export default async function s2ExportRoutes(app) {

  app.get("/api/s2/export/participants.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const out = beginCsv(reply, "s2_participants");
    out.write(BOM + row(PARTICIPANT_COLUMNS));
    for await (const batch of scanParticipants(where, params)) {
      let chunk = "";
      for (const p of batch) {
        const full = { ...p, ...positions(p) };
        chunk += row(PARTICIPANT_COLUMNS.map(c => full[c]));
      }
      out.write(chunk);
    }
    out.end();
  });

  app.get("/api/s2/export/responses.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const cols = ["participant_id", "short_code", "seg_order", "status", "is_test", "item_id", "page_key",
                  "item_type", "segment", "seg_position", "value_num", "value_text", "latency_ms",
                  "revisions", "answered_at"];
    const out = beginCsv(reply, "s2_responses_long");
    out.write(BOM + row(cols));
    for await (const batch of scanParticipants(where, params)) {
      const { rows } = await pool.query(
        `SELECT r.*, p.short_code, p.seg_order, p.status, p.is_test
           FROM s2_responses r JOIN s2_participants p ON p.id = r.participant_id
          WHERE r.participant_id = ANY($1::uuid[])
          ORDER BY p.started_at, r.participant_id, r.item_id`, [batch.map(p => p.id)]
      );
      let chunk = "";
      for (const r of rows) chunk += row(cols.map(c => r[c]));
      out.write(chunk);
    }
    out.end();
  });

  /* One row per participant, one column per item. The header comes from the
     instrument, so two exports stack without realigning. `labels=1` writes the
     option text instead of its index; free text is text either way. */
  app.get("/api/s2/export/wide.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const itemIds = s2AllItemIds();
    const meta = ["participant_id", "short_code", "seg_order", "pos_REL", "pos_ADV", "pos_COL",
                  "status", "source", "external_pid", "is_test", "complete_pass", "attention_pass",
                  "duration_s", "answered_count", "started_at", "completed_at", "instrument_ver"];
    const labels = /^(1|true|yes)$/i.test(String(req.query.labels ?? ""));
    const out = beginCsv(reply, labels ? "s2_wide_labels" : "s2_wide");
    out.write(BOM + row([...meta, ...itemIds]));
    for await (const batch of scanParticipants(where, params)) {
      const ids = batch.map(p => p.id);
      const { rows } = await pool.query(
        `SELECT participant_id, item_id, value_num, value_text FROM s2_responses WHERE participant_id = ANY($1::uuid[])`, [ids]
      );
      const byPid = new Map(ids.map(id => [id, new Map()]));
      for (const r of rows) byPid.get(r.participant_id)?.set(r.item_id, r);
      let chunk = "";
      for (const p of batch) {
        const answers = byPid.get(p.id) ?? new Map();
        const pos = positions(p);
        const dur = p.first_answer_at && p.last_answer_at
          ? Math.round((Date.parse(p.last_answer_at) - Date.parse(p.first_answer_at)) / 1000) : null;
        const metaVals = [
          p.id, p.short_code, p.seg_order, pos.pos_REL, pos.pos_ADV, pos.pos_COL,
          p.status, p.source, p.external_pid, p.is_test, p.complete_pass, p.attention_pass,
          dur, p.answered_count, p.started_at, p.completed_at, p.instrument_ver
        ];
        const itemVals = itemIds.map(id => {
          const a = answers.get(id);
          if (!a) return "";
          if (labels) return a.value_text ?? a.value_num;
          return a.value_num ?? a.value_text;
        });
        chunk += row([...metaVals, ...itemVals]);
      }
      out.write(chunk);
    }
    out.end();
  });

  app.get("/api/s2/export/page_times.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const cols = ["participant_id", "short_code", "seg_order", "page_key", "visit", "page_index",
                  "dwell_ms", "entered_at", "left_at"];
    const out = beginCsv(reply, "s2_page_times");
    out.write(BOM + row(cols));
    for await (const batch of scanParticipants(where, params)) {
      const { rows } = await pool.query(
        `SELECT t.*, p.short_code, p.seg_order
           FROM s2_page_times t JOIN s2_participants p ON p.id = t.participant_id
          WHERE t.participant_id = ANY($1::uuid[])
          ORDER BY t.participant_id, t.page_index, t.visit`, [batch.map(p => p.id)]
      );
      let chunk = "";
      for (const r of rows) chunk += row(cols.map(c => r[c]));
      out.write(chunk);
    }
    out.end();
  });

  app.get("/api/s2/export/video_events.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const cols = ["participant_id", "short_code", "seg_order", "segment", "seg_position", "video_id",
                  "event", "detail", "position_s", "watch_s", "at"];
    const out = beginCsv(reply, "s2_video_events");
    out.write(BOM + row(cols));
    for await (const batch of scanParticipants(where, params)) {
      const { rows } = await pool.query(
        `SELECT v.*, p.short_code, p.seg_order
           FROM s2_video_events v JOIN s2_participants p ON p.id = v.participant_id
          WHERE v.participant_id = ANY($1::uuid[])
          ORDER BY v.participant_id, v.id`, [batch.map(p => p.id)]
      );
      let chunk = "";
      for (const r of rows) chunk += row(cols.map(c => r[c]));
      out.write(chunk);
    }
    out.end();
  });

  app.get("/api/s2/export/codebook.csv", async (_req, reply) => {
    const cols = ["item_id", "block", "item_type", "segment", "seg_position", "required", "group", "value_coding", "stem"];
    const seen = new Map();
    for (const ord of S2_ORDER_KEYS) {
      for (const it of s2PlanItems(buildS2Plan(ord))) {
        const prev = seen.get(it.id);
        if (prev) { if (prev.seg_position !== it.segPosition) prev.seg_position = "varies with order"; continue; }
        seen.set(it.id, { item: it, block: it.segment ? `clip (${it.segment})` : it.pageKey, seg_position: it.segPosition });
      }
    }
    let out = BOM + row(cols);
    for (const e of seen.values()) {
      const it = e.item;
      /* mc is stored 0-based, the seven-point items 1-based — the same coding
         Study 1 uses, and the reason this column exists at all. */
      const coding =
        it.type === "mc"      ? it.options.map((o, i) => `${i}=${o}`).join(" | ") :
        it.type === "likert7" ? it.options.map((o, i) => `${i + 1}=${o}`).join(" | ") :
        it.type === "number"  ? `integer${it.min != null ? `, ${it.min}–${it.max}` : ""}` :
        `free text, ${it.minLength ?? 1}–${it.maxLength ?? 2000} characters`;
      out += row([it.id, e.block, it.type, it.segment, e.seg_position, it.required, it.group ?? "", coding, it.stem]);
    }
    asCsv(reply, "s2_codebook");
    reply.send(out);
    return reply;
  });

  app.get("/api/s2/export/all.json", async (req, reply) => {
    const { where, params } = filters(req.query);
    const out = beginJson(reply, "study2");
    out.write('{"exportedAt":' + JSON.stringify(new Date().toISOString()) +
              ',"instrumentVersion":' + JSON.stringify(S2_VERSION) + ',"participants":[');
    let first = true;
    for await (const batch of scanParticipants(where, params)) {
      const ids = batch.map(p => p.id);
      const [{ rows: answers }, { rows: times }, { rows: vids }] = await Promise.all([
        pool.query(`SELECT * FROM s2_responses    WHERE participant_id = ANY($1::uuid[])`, [ids]),
        pool.query(`SELECT * FROM s2_page_times   WHERE participant_id = ANY($1::uuid[])`, [ids]),
        pool.query(`SELECT * FROM s2_video_events WHERE participant_id = ANY($1::uuid[])`, [ids])
      ]);
      const group = rowsIn => {
        const m = new Map(ids.map(id => [id, []]));
        for (const r of rowsIn) m.get(r.participant_id)?.push(r);
        return m;
      };
      const A = group(answers), T = group(times), V = group(vids);
      for (const p of batch) {
        const { token, ...safe } = p;
        out.write((first ? "" : ",") + JSON.stringify({
          ...safe, ...positions(p), responses: A.get(p.id), pageTimes: T.get(p.id), videoEvents: V.get(p.id)
        }));
        first = false;
      }
    }
    out.write("]}");
    out.end();
  });
}
