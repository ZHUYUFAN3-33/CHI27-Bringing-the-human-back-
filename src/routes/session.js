import crypto from "node:crypto";
import { q } from "../db.js";
import { config } from "../config.js";
import { assignCell, releaseCell, StudyFullError, hasCapacity } from "../allocation.js";
import { runtimePlan, runtimePublic, currentVersion } from "../instrument-runtime.js";

/* ---------------------------------------------------------------- helpers */

const b64url = buf => buf.toString("base64url");
const newToken = () => b64url(crypto.randomBytes(32));

/* Short, unambiguous completion code: no 0/O/1/I/L. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newShortCode() {
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

export function hashIp(ip) {
  if (!ip || !config.ipSalt) return null;
  return crypto.createHash("sha256").update(config.ipSalt).update(String(ip)).digest("hex").slice(0, 32);
}

export function clientIp(req) {
  /* Fly puts the real client address in Fly-Client-IP; x-forwarded-for is
     appended to by the edge and can be spoofed by the client, so it is only a
     fallback for local runs. */
  return req.headers["fly-client-ip"]
      || String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
      || req.ip
      || null;
}

/* Recruitment-platform identifiers. CloudResearch Connect appends
   participantId (and optionally assignmentId / projectId); the Prolific and
   MTurk names are accepted too so the same build can serve a pilot on another
   panel without a redeploy. */
const PID_KEYS     = ["participantId", "PROLIFIC_PID", "prolific_pid", "workerId", "worker_id", "pid"];
const STUDY_KEYS   = ["projectId", "project_id", "STUDY_ID", "study_id", "hitId", "hit_id"];
const SESSION_KEYS = ["assignmentId", "assignment_id", "SESSION_ID", "session_id"];

/* Matched without regard to case: the platform documents `participantId`, and
   a link that reaches us as `participantid` — retyped, or lower-cased by
   something on the way — must still identify the person it names. */
const firstOf = (obj, keys) => {
  const lower = new Map(Object.entries(obj ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower.get(k.toLowerCase());
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 128);
  }
  return null;
};

/* The three platform identifiers, null for each the query string did not carry. */
const externalIds = params => ({
  pid:     firstOf(params, PID_KEYS),
  study:   firstOf(params, STUDY_KEYS),
  session: firstOf(params, SESSION_KEYS)
});

/* Fill in an identifier the row is still missing. Blanks only: the identifier
   a row was opened with is the one the platform pays against, and a later
   visit carrying a different value must not overwrite it. $2..$4 are the
   values from externalIds(); $1 is whatever the statement selects the row by. */
const BACKFILL_SQL = `
  external_pid     = COALESCE(external_pid,     $2),
  external_study   = COALESCE(external_study,   $3),
  external_session = COALESCE(external_session, $4)`;

/** Everything the browser needs to render, and nothing it should not know.
    The plan is built here and shipped whole: the client is a renderer, so it
    never receives the other six cells' framing text or the answer keys. */
function sessionView(p) {
  const plan = runtimePlan(p.condition, p.seg_order, p.optional_block);
  return {
    participantId: p.id,
    shortCode: p.short_code,
    status: p.status,
    pageKey: p.page_key,
    pageIndex: p.page_index,
    plan: runtimePublic(p.condition, p.seg_order, p.optional_block),
    completion: {
      code: config.completionCode || p.short_code,
      redirectUrl: config.completionRedirectUrl || null,
      platform: config.recruitment
    }
  };
}

/* ---------------------------------------------------------------- routes */

export default async function sessionRoutes(app) {

  /* Start a new session, or hand back the existing one if the browser still
     holds a token. Idempotent per token so a double-fired request on a flaky
     connection cannot burn two allocation slots. */
  app.post("/api/session/start", {
    config: {
      /* Metered per IP because there is no token yet. Set high enough that a
         whole lecture theatre behind one address can start together. */
      rateLimit: { max: config.sessionStartRateMax, timeWindow: 60_000 }
    }
  }, async (req, reply) => {
    const body = req.body ?? {};
    const existing = String(body.token || "").trim();

    if (existing) {
      const ext = externalIds(body.params ?? {});
      const { rows } = await q(
        `UPDATE participants SET last_seen_at = now(), ${BACKFILL_SQL}
          WHERE token = $1 RETURNING *`,
        [existing, ext.pid, ext.study, ext.session]
      );
      if (rows.length) return { resumed: true, token: existing, ...sessionView(rows[0]) };
      /* Token no longer valid (database reset, or a forged value): fall through
         and allocate a fresh session rather than failing the participant. */
    }

    if (!config.studyOpen) {
      return reply.code(503).send({ error: "study_closed", message: "This study is not currently accepting responses." });
    }
    if (!(await hasCapacity())) {
      return reply.code(503).send({ error: "study_full", message: "This study has reached the number of responses it needs." });
    }

    const params  = body.params ?? {};
    const isTest  = /^(1|true|yes)$/i.test(String(params.test ?? params.preview ?? ""));
    const ext     = externalIds(params);
    const token   = newToken();

    let cell;
    try {
      cell = await assignCell();
    } catch (err) {
      if (err instanceof StudyFullError) {
        return reply.code(503).send({ error: "study_full", message: "This study has reached the number of responses it needs." });
      }
      throw err;
    }

    const { rows } = await q(
      `INSERT INTO participants (
         token, short_code, condition, ctrl, profile, seg_order, optional_block, cell,
         instrument_ver, source, external_pid, external_study, external_session, is_test,
         user_agent, screen_w, screen_h, timezone, ui_language, ip_hash, page_key, page_index
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [
        token, newShortCode(),
        cell.condition, cell.ctrl, cell.profile, cell.segOrder, cell.optional, cell.cell,
        currentVersion(),
        config.recruitment,
        ext.pid,
        ext.study,
        ext.session,
        isTest,
        String(req.headers["user-agent"] || "").slice(0, 400),
        Number.isFinite(body.screenW) ? Math.trunc(body.screenW) : null,
        Number.isFinite(body.screenH) ? Math.trunc(body.screenH) : null,
        String(body.timezone || "").slice(0, 64) || null,
        String(body.language || "").slice(0, 32) || null,
        hashIp(clientIp(req)),
        "info", 0
      ]
    );

    /* A pilot or preview run is still randomised the same way — so the team
       sees what a real participant sees — but it gives the slot straight back,
       or a day of testing would leave the cells lopsided before recruitment. */
    if (isTest) await releaseCell(cell.cell);

    req.log.info({ cell: cell.cell, test: isTest }, "session started");
    return { resumed: false, token, ...sessionView(rows[0]) };
  });

  /* Resume: returns the design plus every answer already stored, so a refresh
     or a dropped connection puts the participant back exactly where they were. */
  app.post("/api/session/resume", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });

    const { rows: answers } = await q(
      `SELECT item_id, value_num, value_text FROM responses WHERE participant_id = $1`, [p.id]
    );
    const { rows: videos } = await q(
      `SELECT segment, MAX(watch_s) AS watch_s,
              bool_or(event = 'gate_open') AS gate_open
         FROM video_events WHERE participant_id = $1 GROUP BY segment`, [p.id]
    );

    /* A row opened without the platform identifiers — the query string
       stripped by an in-app browser, or the link pasted by hand — takes them
       from the first visit that carries them. Blanks only; see BACKFILL_SQL. */
    const ext = externalIds(req.body?.params ?? {});
    const { rows: upd } = await q(
      `UPDATE participants SET last_seen_at = now(), ${BACKFILL_SQL}
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

  /* Cheap keepalive so last_seen_at stays fresh while a participant reads a
     long page; it is what tells the dashboard who is actually still here. */
  app.post("/api/session/ping", async (req, reply) => {
    const p = req.participant;
    if (!p) return reply.code(401).send({ error: "unknown_token" });
    await q(`UPDATE participants SET last_seen_at = now() WHERE id = $1`, [p.id]);
    return { ok: true };
  });
}

/* Shared by the save/complete routes. */
export { newToken, newShortCode, sessionView };
