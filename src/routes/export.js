import { pool } from "../db.js";
import { row, BOM } from "../csv.js";
import { allItemIds, CONDITION_KEYS, ORDER_KEYS } from "../../shared/instrument.js";
import { runtimeItems, overrideEntries, currentVersion, publicationHistory } from "../instrument-runtime.js";

/* ---------------------------------------------------------------------------
   Export endpoints. All are behind requireAdmin (see server.js).

   Rows are streamed with a cursor-free keyset scan rather than buffered, so a
   full export of several thousand participants never holds the whole result in
   memory and never blocks the event loop long enough to affect participants
   who are answering at the same time.
--------------------------------------------------------------------------- */

const PARTICIPANT_COLUMNS = [
  "id", "short_code", "condition", "ctrl", "profile", "seg_order", "optional_block", "cell",
  "instrument_ver", "status", "screen_out_reason", "source", "external_pid", "external_study",
  "external_session", "is_test", "attention_pass", "check_c1_pass", "check_c2_pass",
  "answered_count", "started_at", "first_answer_at", "last_answer_at", "completed_at",
  "last_seen_at", "timezone", "ui_language", "screen_w", "screen_h", "ip_hash", "user_agent"
];

function filters(query) {
  const where = ["TRUE"];
  const params = [];
  if (!/^(1|true|yes)$/i.test(String(query.include_test ?? ""))) where.push("NOT p.is_test");
  if (query.status) { params.push(String(query.status)); where.push(`p.status = $${params.length}`); }
  else where.push("p.status <> 'in_progress'");
  if (/^(1|true|yes)$/i.test(String(query.usable_only ?? ""))) {
    where.push("p.status = 'completed'");
    where.push("COALESCE(p.attention_pass, TRUE)");
  }
  if (query.since) { params.push(String(query.since)); where.push(`p.started_at >= $${params.length}::timestamptz`); }
  return { where: where.join(" AND "), params };
}

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "").replace(/-/g, "");

/* For the small exports, which go out through reply.send(). */
function asCsv(reply, name) {
  reply.header("content-type", "text/csv; charset=utf-8");
  reply.header("content-disposition", `attachment; filename="${name}_${stamp()}.csv"`);
  reply.header("cache-control", "no-store");
}

/* For the streamed exports, which write the body with reply.raw so a file of
   several thousand participants never sits in memory. A header set through
   reply.header() only reaches the wire when reply.send() runs, and these routes
   never call it — so every streamed file went out with no content-type and no
   filename, and a click in the dashboard opened it as text in the tab instead
   of downloading it. The response is taken over here and the headers written
   straight to the socket before the first byte of the body. Nothing may be
   returned from a handler after this: Fastify would try to send it. */
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

/* A pg Cursor would need an extra dependency; a keyset scan over started_at+id
   gives the same streaming behaviour with the driver we already have. */
async function* scanParticipants(where, params, batch = 500) {
  let after = null;
  for (;;) {
    const p = [...params];
    let clause = "";
    if (after) {
      p.push(after.started_at, after.id);
      clause = `AND (p.started_at, p.id) > ($${p.length - 1}::timestamptz, $${p.length}::uuid)`;
    }
    /* The keyset cursor must carry started_at at full microsecond precision.
       node-postgres parses timestamptz into a JS Date, which keeps only
       milliseconds — feeding that truncated value back into the > comparison
       re-emits the batch-boundary row, and the export then holds the same
       participant twice. The ::text cast round-trips exactly. */
    const { rows } = await pool.query(
      `SELECT p.*, p.started_at::text AS scan_started_at FROM participants p
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

export default async function exportRoutes(app) {

  /* -- one row per participant ------------------------------------------- */
  app.get("/api/export/participants.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const out = beginCsv(reply, "participants");
    out.write(BOM + row(PARTICIPANT_COLUMNS));
    for await (const batch of scanParticipants(where, params)) {
      let chunk = "";
      for (const p of batch) chunk += row(PARTICIPANT_COLUMNS.map(c => p[c]));
      out.write(chunk);
    }
    out.end();
  });

  /* -- long format: one row per answer ----------------------------------- */
  app.get("/api/export/responses.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const cols = ["participant_id", "short_code", "condition", "ctrl", "profile", "seg_order",
                  "optional_block", "status", "is_test", "item_id", "page_key", "item_type",
                  "segment", "seg_position", "value_num", "value_text", "latency_ms",
                  "revisions", "answered_at"];
    const out = beginCsv(reply, "responses_long");
    out.write(BOM + row(cols));
    for await (const batch of scanParticipants(where, params)) {
      const ids = batch.map(p => p.id);
      const { rows } = await pool.query(
        `SELECT r.*, p.short_code, p.condition, p.ctrl, p.profile, p.seg_order,
                p.optional_block, p.status, p.is_test
           FROM responses r JOIN participants p ON p.id = r.participant_id
          WHERE r.participant_id = ANY($1::uuid[])
          ORDER BY p.started_at, r.participant_id, r.item_id`, [ids]
      );
      let chunk = "";
      for (const r of rows) chunk += row(cols.map(c => (c === "participant_id" ? r.participant_id : r[c])));
      out.write(chunk);
    }
    out.end();
  });

  /* -- wide format: one row per participant, one column per item ---------
     The header is derived from the instrument, not from the data, so the
     column set is identical whichever participants happen to be in the file
     and two exports taken a week apart can be stacked without realigning. */
  app.get("/api/export/wide.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const itemIds = allItemIds();
    const meta = ["participant_id", "short_code", "condition", "ctrl", "profile", "seg_order",
                  "optional_block", "status", "source", "external_pid", "is_test",
                  "attention_pass", "check_c1_pass", "check_c2_pass",
                  "duration_s", "answered_count", "started_at", "completed_at"];
    const labels = /^(1|true|yes)$/i.test(String(req.query.labels ?? ""));
    /* In labels mode a rank item must still export its rank: its value_text is
       the actor's name (the row header), which is the same for every rank and
       says nothing about the answer. */
    const rankIds = new Set();
    if (labels) {
      for (const cond of CONDITION_KEYS) {
        for (const ord of ORDER_KEYS) {
          for (const it of runtimeItems(cond, ord, true)) if (it.type === "rank") rankIds.add(it.id);
        }
      }
    }

    const out = beginCsv(reply, labels ? "wide_labels" : "wide");
    out.write(BOM + row([...meta, ...itemIds]));

    for await (const batch of scanParticipants(where, params)) {
      const ids = batch.map(p => p.id);
      const { rows } = await pool.query(
        `SELECT participant_id, item_id, value_num, value_text
           FROM responses WHERE participant_id = ANY($1::uuid[])`, [ids]
      );
      const byPid = new Map(ids.map(id => [id, new Map()]));
      for (const r of rows) byPid.get(r.participant_id)?.set(r.item_id, r);

      let chunk = "";
      for (const p of batch) {
        const answers = byPid.get(p.id) ?? new Map();
        const dur = p.first_answer_at && p.last_answer_at
          ? Math.round((Date.parse(p.last_answer_at) - Date.parse(p.first_answer_at)) / 1000)
          : null;
        const metaVals = [
          p.id, p.short_code, p.condition, p.ctrl, p.profile, p.seg_order, p.optional_block,
          p.status, p.source, p.external_pid, p.is_test,
          p.attention_pass, p.check_c1_pass, p.check_c2_pass,
          dur, p.answered_count, p.started_at, p.completed_at
        ];
        const itemVals = itemIds.map(id => {
          const a = answers.get(id);
          if (!a) return "";
          if (labels) return rankIds.has(id) ? (a.value_num ?? a.value_text) : (a.value_text ?? a.value_num);
          return a.value_num ?? a.value_text;
        });
        chunk += row([...metaVals, ...itemVals]);
      }
      out.write(chunk);
    }
    out.end();
  });

  /* -- page dwell times --------------------------------------------------- */
  app.get("/api/export/page_times.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const cols = ["participant_id", "short_code", "condition", "seg_order", "page_key",
                  "visit", "page_index", "dwell_ms", "entered_at", "left_at"];
    const out = beginCsv(reply, "page_times");
    out.write(BOM + row(cols));
    for await (const batch of scanParticipants(where, params)) {
      const { rows } = await pool.query(
        `SELECT t.*, p.short_code, p.condition, p.seg_order
           FROM page_times t JOIN participants p ON p.id = t.participant_id
          WHERE t.participant_id = ANY($1::uuid[])
          ORDER BY t.participant_id, t.page_index, t.visit`, [batch.map(p => p.id)]
      );
      let chunk = "";
      for (const r of rows) chunk += row(cols.map(c => r[c]));
      out.write(chunk);
    }
    out.end();
  });

  /* -- video gate telemetry ----------------------------------------------- */
  app.get("/api/export/video_events.csv", async (req, reply) => {
    const { where, params } = filters(req.query);
    const cols = ["participant_id", "short_code", "condition", "segment", "seg_position",
                  "video_id", "event", "detail", "position_s", "watch_s", "at"];
    const out = beginCsv(reply, "video_events");
    out.write(BOM + row(cols));
    for await (const batch of scanParticipants(where, params)) {
      const { rows } = await pool.query(
        `SELECT v.*, p.short_code, p.condition
           FROM video_events v JOIN participants p ON p.id = v.participant_id
          WHERE v.participant_id = ANY($1::uuid[])
          ORDER BY v.participant_id, v.id`, [batch.map(p => p.id)]
      );
      let chunk = "";
      for (const r of rows) chunk += row(cols.map(c => r[c]));
      out.write(chunk);
    }
    out.end();
  });

  /* -- codebook: the instrument itself, so the CSVs are self-documenting ---
     Anything that varies between participants is reported as varying rather
     than frozen at whatever the first cell happened to use: a segment's
     position depends on the randomised order, and the number of ranking rows
     depends on the control condition (there is no human row under AI-only
     control, and no AI row under human-only control). */
  app.get("/api/export/codebook.csv", async (_req, reply) => {
    const cols = ["item_id", "block", "item_type", "segment", "seg_position",
                  "required", "group", "value_coding", "stem"];
    const seen = new Map();
    for (const cond of CONDITION_KEYS) {
      for (const ord of ORDER_KEYS) {
        for (const it of runtimeItems(cond, ord, true)) {
          const prev = seen.get(it.id);
          if (prev) {
            if (prev.seg_position !== it.segPosition) prev.seg_position = "varies with order";
            if (it.type === "rank" && prev.maxRank !== it.maxRank) prev.maxRank = "n";
            continue;
          }
          seen.set(it.id, {
            item: it,
            /* Segment items sit on a page whose number depends on the order,
               so the block is named by content, not by position. */
            block: it.segment ? `segment (${it.segment})` : it.pageKey,
            seg_position: it.segPosition,
            maxRank: it.maxRank
          });
        }
      }
    }

    let out = BOM + row(cols);
    for (const e of seen.values()) {
      const it = e.item;
      const coding =
        it.type === "likert7" ? "1=Strongly disagree ... 7=Strongly agree"
      : it.type === "mc"      ? it.options.map((o, i) => `${i}=${o}`).join(" | ")
      : it.type === "rank"    ? (e.maxRank === "n"
            ? `1..n where n is the number of rows shown (3 or 4, by condition), 1 = greatest; row = ${it.actorKey} (${it.actor})`
            : `1..${e.maxRank}, 1 = greatest; row = ${it.actorKey} (${it.actor})`)
      : it.type === "number"  ? `numeric${it.min != null ? `, ${it.min}-${it.max}` : ""}`
      /* A select stores the option key, not its position. Short lists are
         written out; the country list is 255 rows, so it is named rather than
         inlined into one CSV cell. */
      : it.type === "select"  ? (it.options.length <= 20
            ? it.options.map(o => `${o.value}=${o.label}`).join(" | ")
            : `${it.options.length} options, stored as the option key — ` +
              `ISO 3166-1 alpha-2 for country, e.g. ` +
              it.options.slice(0, 2).map(o => `${o.value}=${o.label}`).join(", "))
      : "free text";
      out += row([it.id, e.block, it.type, it.segment, e.seg_position,
                  it.required, it.group ?? "", coding, it.stem]);
    }
    asCsv(reply, "codebook");
    reply.send(out);
    return reply;
  });

  /* -- the wording actually served ---------------------------------------
     What participants were given, not what is being drafted in /preview and
     not what the repository says today. The paper has to be able to quote the
     sentence that was on the screen. */
  app.get("/api/export/instrument_overrides.csv", async (_req, reply) => {
    const cols = ["path", "value", "instrument_version"];
    const v = currentVersion();
    let out = BOM + row(cols);
    for (const [path, value] of overrideEntries()) out += row([path, value, v]);
    asCsv(reply, "instrument_overrides");
    reply.send(out);
    return reply;
  });

  /* -- and when each wording started being served -------------------------
     One row per publish. With participants.instrument_ver, this is what lets
     an analysis say which questionnaire a given response was answered under,
     and a limitations section say exactly when the wording moved. */
  app.get("/api/export/instrument_publications.csv", async (_req, reply) => {
    const cols = ["id", "at", "instrument_version", "overridden_paths",
                  "participants_at_the_time", "published_by", "note"];
    let out = BOM + row(cols);
    for (const p of await publicationHistory(1000)) {
      out += row([p.id, p.at, p.instrument_ver, p.paths, p.participants,
                  p.published_by, p.note ?? ""]);
    }
    asCsv(reply, "instrument_publications");
    reply.send(out);
    return reply;
  });

  /* -- everything, as one JSON document ----------------------------------- */
  app.get("/api/export/all.json", async (req, reply) => {
    const { where, params } = filters(req.query);
    const out = beginJson(reply, "study1");
    out.write('{"exportedAt":' + JSON.stringify(new Date().toISOString()) + ',"participants":[');
    let first = true;
    for await (const batch of scanParticipants(where, params)) {
      const ids = batch.map(p => p.id);
      const [{ rows: answers }, { rows: times }, { rows: vids }] = await Promise.all([
        pool.query(`SELECT * FROM responses    WHERE participant_id = ANY($1::uuid[])`, [ids]),
        pool.query(`SELECT * FROM page_times   WHERE participant_id = ANY($1::uuid[])`, [ids]),
        pool.query(`SELECT * FROM video_events WHERE participant_id = ANY($1::uuid[])`, [ids])
      ]);
      const group = (rowsIn) => {
        const m = new Map(ids.map(id => [id, []]));
        for (const r of rowsIn) m.get(r.participant_id)?.push(r);
        return m;
      };
      const A = group(answers), T = group(times), V = group(vids);
      for (const p of batch) {
        const { token, ...safe } = p;   // never export the bearer secret
        out.write((first ? "" : ",") + JSON.stringify({
          ...safe, responses: A.get(p.id), pageTimes: T.get(p.id), videoEvents: V.get(p.id)
        }));
        first = false;
      }
    }
    out.write("]}");
    out.end();
  });
}
