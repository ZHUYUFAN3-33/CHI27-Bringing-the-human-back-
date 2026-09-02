import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";

import { config, assertProductionConfig } from "./config.js";
import { pool, q, migrate, healthy } from "./db.js";
import { watchAllocation } from "./allocation.js";
import sessionRoutes, { clientIp } from "./routes/session.js";
import saveRoutes from "./routes/save.js";
import adminRoutes from "./routes/admin.js";
import exportRoutes from "./routes/export.js";
import {
  loadOverrides, watchOverrides, ensureInitialPublication,
  currentVersion, overrideCount, currentGeneration
} from "./instrument-runtime.js";
import s2Routes from "./s2/index.js";
import { migrateS2 } from "./s2/db.js";
import { watchS2Allocation } from "./s2/allocation.js";
import { S2_VERSION } from "../shared/s2-instrument.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(here, "..");

const app = Fastify({
  logger: {
    level: config.logLevel,
    redact: ["req.headers.authorization", "req.headers.cookie"]
  },
  trustProxy: config.trustProxy,
  bodyLimit: 1_000_000,          // a page of answers is ~10 KB; 1 MB is generous
  disableRequestLogging: true,   // one line per request below instead of two
  requestIdHeader: "fly-request-id"
});

assertProductionConfig(app.log);

/* ------------------------------------------------------------------ plugins */

await app.register(fastifyCompress, { global: true, threshold: 1024, encodings: ["br", "gzip"] });
await app.register(fastifyCookie);

/* Rate limiting.

   Keyed on the participant's own token wherever there is one, and only on the
   IP address for the handful of requests made before a session exists. This
   matters more than it looks: a university lab, a corporate network or a
   carrier-grade NAT puts many genuine participants behind a single address,
   and an IP-keyed limit would throttle a whole room the moment one person
   clicked quickly. Per-token, each participant gets their own budget however
   they reach us, and the limit still stops a script hammering one session.

   A page turn is one request and the keepalive is one a minute, so a real
   participant uses well under twenty requests a minute. */
await app.register(fastifyRateLimit, {
  global: true,
  max: config.rateLimitMax,
  timeWindow: config.rateLimitWindowMs,
  keyGenerator: req => {
    const auth = String(req.headers.authorization || "");
    if (auth.startsWith("Bearer ")) return "t:" + auth.slice(7, 60);
    return "ip:" + (clientIp(req) ?? "unknown");
  },
  /* A burst of starts from one address is what a lab session looks like, so
     that endpoint gets its own, larger IP-keyed budget rather than the
     per-participant one. */
  skipOnError: true,
  onExceeding: req => req.log.warn({ url: req.url, ip: clientIp(req) }, "rate limit approaching"),
  onExceeded:  req => req.log.warn({ url: req.url, ip: clientIp(req) }, "rate limit exceeded")
});

/* ------------------------------------------------------- request logging */

app.addHook("onResponse", (req, reply, done) => {
  if (req.url === "/healthz" || req.url === "/api/session/ping") return done();
  req.log.info({
    method: req.method,
    url: req.url,
    status: reply.statusCode,
    ms: Math.round(reply.elapsedTime)
  }, "req");
  done();
});

/* ------------------------------------------------ participant authentication */

const PROTECTED_PREFIXES = ["/api/save", "/api/complete", "/api/screen-out", "/api/session/resume", "/api/session/ping"];

app.addHook("preHandler", async (req, reply) => {
  if (!PROTECTED_PREFIXES.some(p => req.url.startsWith(p))) return;
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : String(req.body?.token || "").trim();
  if (!token) return reply.code(401).send({ error: "missing_token" });
  const { rows } = await q(`SELECT * FROM participants WHERE token = $1`, [token]);
  if (!rows.length) return reply.code(401).send({ error: "unknown_token" });
  req.participant = rows[0];
});

/* ---------------------------------------------------- researcher authentication */

const ADMIN_COOKIE = "study1_admin";

function tokenOk(given) {
  if (!config.adminToken || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(config.adminToken);
  /* timingSafeEqual throws on a length mismatch, so compare digests instead:
     equal-length inputs, constant time, no length oracle. */
  return crypto.timingSafeEqual(
    crypto.createHash("sha256").update(a).digest(),
    crypto.createHash("sha256").update(b).digest()
  );
}

function requireAdmin(req, reply, done) {
  const auth = String(req.headers.authorization || "");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const given = bearer || req.query?.token || req.cookies?.[ADMIN_COOKIE];
  if (!tokenOk(given)) {
    reply.code(401)
      .header("www-authenticate", 'Bearer realm="study1"')
      .send({ error: "unauthorized", message: "Pass the admin token as ?token=… or an Authorization: Bearer header." });
    return;
  }
  /* Set a session cookie so the dashboard's own fetches, and a click through to
     a CSV, work without re-appending the token to every URL. */
  if (req.query?.token && !req.cookies?.[ADMIN_COOKIE]) {
    reply.setCookie(ADMIN_COOKIE, String(req.query.token), {
      path: "/", httpOnly: true, sameSite: "lax", secure: config.nodeEnv === "production"
    });
  }
  done();
}

/* ---------------------------------------------------------------- routes */

/* `overrides` and `generation` are here so that a deploy can be checked rather
   than assumed. If the published wording failed to load, this machine quietly
   serves the questionnaire as written in the repository — which is a real
   change to the instrument and would otherwise be invisible until someone read
   a page. A deploy that drops these to 0 on a study that has published wording
   is a deploy to roll back. */
app.get("/healthz", async (_req, reply) => {
  try {
    await healthy();
    return {
      ok: true,
      instrument: currentVersion(),
      overrides: overrideCount(),
      generation: currentGeneration(),
      open: config.studyOpen,
      s2: { instrument: S2_VERSION, open: config.s2StudyOpen }
    };
  } catch (err) {
    reply.code(503);
    return { ok: false, error: err.message };
  }
});

/* Public configuration the participant page needs before it has a session. */
app.get("/api/config", async () => ({
  studyOpen: config.studyOpen,
  instrumentVersion: currentVersion(),
  recruitment: config.recruitment,
  studyInfoUrl: config.studyInfoUrl || null,
  contact: config.contact || null,
  funding: config.funding || null
}));

await app.register(sessionRoutes);
await app.register(saveRoutes);
await app.register(async scope => {
  scope.addHook("onRequest", requireAdmin);
  await scope.register(adminRoutes);
  await scope.register(exportRoutes);
});

/* Study 2 lives under /s2 and /api/s2 with its own tables, its own dashboard
   and its own exports; see src/s2/. It shares the process, the database, the
   admin token and the rate limiter, and nothing else. */
app.get("/api/s2/config", async () => ({
  studyOpen: config.s2StudyOpen,
  instrumentVersion: S2_VERSION,
  recruitment: config.recruitment,
  contact: config.contact || null,
  funding: config.funding || null
}));
await app.register(s2Routes, { requireAdmin });

/* ------------------------------------------------------------ asset version
   index.html is no-store, but it asked for /survey.js by that bare name, and
   the browser holds those for an hour. So a fix deployed mid-collection did not
   reach anyone who had already loaded the page, and the data would carry two
   different behaviours with nothing to tell them apart.

   The HTML is rewritten once at boot to point at /survey.js?v=<digest of the
   file>. The name changes exactly when the contents change, so a deploy lands
   immediately and an unchanged file still comes from cache. */

const hashOf = files => {
  const h = crypto.createHash("sha256");
  for (const f of files) h.update(fs.readFileSync(path.join(rootDir, "public", f)));
  return h.digest("hex").slice(0, 12);
};
const ASSET_HASH = hashOf(["survey.js", "survey.css", "net.js", "net-core.js"]);
/* Study 2's pages share the stylesheet and the transport core with Study 1
   but carry their own runtime, so they get their own version that moves when
   any of the four moves. */
const S2_ASSET_HASH = hashOf(["s2/survey.js", "s2/s2.css", "survey.css", "net-core.js"]);
const ASSET_HASHES = new Set([ASSET_HASH, S2_ASSET_HASH]);

const ASSETS = {
  study1: { hash: ASSET_HASH,    pattern: /(["'])\/(survey\.js|survey\.css|net\.js)\1/g },
  s2:     { hash: S2_ASSET_HASH, pattern: /(["'])\/(s2\/survey\.js|s2\/s2\.css|survey\.css|net\.js)\1/g }
};

const htmlCache = new Map();
function versionedHtml(dir, file, assets = ASSETS.study1) {
  const key = `${dir}/${file}`;
  if (!htmlCache.has(key)) {
    const src = fs.readFileSync(path.join(rootDir, dir, file), "utf8");
    htmlCache.set(key, src.replace(
      assets.pattern,
      (_m, quote, name) => `${quote}/${name}?v=${assets.hash}${quote}`
    ));
  }
  return htmlCache.get(key);
}
function sendHtml(reply, dir, file, assets) {
  return reply
    .header("content-type", "text/html; charset=utf-8")
    .header("cache-control", "no-store")
    .send(versionedHtml(dir, file, assets));
}

app.log.info({ assets: ASSET_HASH, s2Assets: S2_ASSET_HASH }, "asset version");

/* The researcher dashboard and the original design mockup both sit behind the
   admin token. The mockup is kept verbatim so the team can still compare cells
   side by side; it never touches the database. */
app.get("/admin", { onRequest: requireAdmin }, (_req, reply) => reply.sendFile("admin.html", path.join(rootDir, "private")));

/* /preview runs the participant app itself against a chosen cell, so what the
   team reviews is the questionnaire that will actually be served — and, since
   it is already rendering every sentence, it is also where those sentences are
   edited. Text only, and the guardrails live in the API rather than in this
   page, so they hold whatever the browser does.

   /mockup is the original design document, which carries its own copy of the
   wording and will drift from the instrument — it is kept for the annotations,
   not as a description of what participants see. */
app.get("/preview", { onRequest: requireAdmin }, (_req, reply) => sendHtml(reply, "private", "preview.html"));
app.get("/mockup",  { onRequest: requireAdmin }, (_req, reply) => reply.sendFile("mockup.html", path.join(rootDir, "private")));

/* /editor was a second page listing every editable string by path. It is gone:
   editing the questionnaire while looking at something that is not the
   questionnaire is how wording and layout drift apart, and asking a
   non-programmer to recognise `item.REL_OH1.stem` was never reasonable. */
app.get("/editor", { onRequest: requireAdmin }, (req, reply) =>
  reply.redirect(302, `/preview${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`));

/* The entry page is served from memory so the asset URLs carry the version. */
app.get("/", (_req, reply) => sendHtml(reply, "public", "index.html"));

/* Study 2: participant entry (this is the link CloudResearch gets, with or
   without the trailing slash), its dashboard, and a read-only preview of any
   clip order. */
const sendS2 = (_req, reply) => sendHtml(reply, "public", "s2/index.html", ASSETS.s2);
app.get("/s2",  sendS2);
app.get("/s2/", sendS2);
app.get("/s2/admin",   { onRequest: requireAdmin }, (_req, reply) => reply.sendFile("s2-admin.html", path.join(rootDir, "private")));
app.get("/s2/preview", { onRequest: requireAdmin }, (_req, reply) => sendHtml(reply, "private", "s2-preview.html", ASSETS.s2));

/* Participant app. index.html is served for the survey routes so a refresh
   mid-survey does not 404. */
await app.register(fastifyStatic, {
  root: path.join(rootDir, "public"),
  index: false,                    // "/" is handled above
  maxAge: config.nodeEnv === "production" ? "1h" : 0,
  /* @fastify/static v10 hands this hook the Fastify reply, not the raw
     response, so headers go through reply.header(). */
  setHeaders(reply, filePath) {
    /* A versioned URL can be held as long as the browser likes: a change to the
       file changes the URL. Without ?v= it stays at the shorter default, so a
       direct hit on /survey.js is never frozen for a year. */
    if (/\.(js|css)$/.test(filePath) && ASSET_HASHES.has(reply.request.query?.v)) {
      reply.header("cache-control", "public, max-age=31536000, immutable");
    }
  }
});

app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith("/api/")) return reply.code(404).send({ error: "not_found" });
  if (/^\/s2(\/|\?|$)/.test(req.url)) return sendS2(req, reply);
  return sendHtml(reply, "public", "index.html");
});

app.setErrorHandler((err, req, reply) => {
  req.log.error({ err, url: req.url }, "unhandled");
  const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  reply.code(status).send({
    error: status === 500 ? "internal_error" : err.code || "error",
    message: status === 500 ? "Something went wrong on our side. Your answers are saved." : err.message
  });
});

/* ---------------------------------------------------------------- boot */

let stopWatching = () => {};
let stopRecount  = () => {};
let stopS2Recount = () => {};

try {
  await migrate(app.log);
  await migrateS2(app.log);
  /* An existing deployment already has wording live. Give it a publication row
     before anything reads the published set, or the first boot after this
     shipped would serve the instrument in code to everybody. */
  await ensureInitialPublication(app.log);
  /* Published wording lives in the database; load it before the first
     participant can be served a plan. */
  await loadOverrides(app.log);
  /* And keep watching, because the machine that publishes is not necessarily
     this one. */
  stopWatching = watchOverrides(app.log);
  /* And give back the slots of sessions that opened the link and left, so a
     cell is not starved for the rest of a launch by a handful of clicks that
     never became participants. */
  stopRecount = watchAllocation(app.log);
  stopS2Recount = watchS2Allocation(app.log);
} catch (err) {
  app.log.error({ err }, "migration failed");
  if (config.nodeEnv === "production") process.exit(1);
}

await app.listen({ port: config.port, host: config.host });
app.log.info(`study1 survey listening on ${config.host}:${config.port} · instrument ${currentVersion()} · study 2 ${S2_VERSION}`);

/* Fly sends SIGINT/SIGTERM before replacing a machine. Stop taking new work,
   let in-flight saves finish, then close the pool: a participant's page turn
   must never be lost to a deploy. */
let closing = false;
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    if (closing) return;
    closing = true;
    app.log.info(`${sig} received, draining`);
    stopWatching();
    stopRecount();
    stopS2Recount();
    try { await app.close(); } catch (err) { app.log.error({ err }, "close failed"); }
    try { await pool.end(); } catch { /* already gone */ }
    process.exit(0);
  });
}
