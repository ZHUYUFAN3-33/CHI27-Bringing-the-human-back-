import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";

import { config, assertProductionConfig } from "./config.js";
import { pool, q, migrate, healthy } from "./db.js";
import sessionRoutes, { clientIp } from "./routes/session.js";
import saveRoutes from "./routes/save.js";
import adminRoutes from "./routes/admin.js";
import exportRoutes from "./routes/export.js";
import { INSTRUMENT_VERSION } from "../shared/instrument.js";

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

app.get("/healthz", async (_req, reply) => {
  try {
    await healthy();
    return { ok: true, instrument: INSTRUMENT_VERSION, open: config.studyOpen };
  } catch (err) {
    reply.code(503);
    return { ok: false, error: err.message };
  }
});

/* Public configuration the participant page needs before it has a session. */
app.get("/api/config", async () => ({
  studyOpen: config.studyOpen,
  instrumentVersion: INSTRUMENT_VERSION,
  recruitment: config.recruitment,
  studyInfoUrl: config.studyInfoUrl || null,
  contactEmail: config.contactEmail || null
}));

await app.register(sessionRoutes);
await app.register(saveRoutes);
await app.register(async scope => {
  scope.addHook("onRequest", requireAdmin);
  await scope.register(adminRoutes);
  await scope.register(exportRoutes);
});

/* The researcher dashboard and the original design mockup both sit behind the
   admin token. The mockup is kept verbatim so the team can still compare cells
   side by side; it never touches the database. */
app.get("/admin", { onRequest: requireAdmin }, (_req, reply) => reply.sendFile("admin.html", path.join(rootDir, "private")));

/* /preview runs the participant app itself against a chosen cell, so what the
   team reviews is the questionnaire that will actually be served. /mockup is
   the original design document, which carries its own copy of the wording and
   will drift from the instrument — it is kept for the annotations, not as a
   description of what participants see. */
app.get("/preview", { onRequest: requireAdmin }, (_req, reply) => reply.sendFile("preview.html", path.join(rootDir, "private")));
app.get("/mockup",  { onRequest: requireAdmin }, (_req, reply) => reply.sendFile("mockup.html",  path.join(rootDir, "private")));

/* Participant app. index.html is served for the survey routes so a refresh
   mid-survey does not 404. */
await app.register(fastifyStatic, {
  root: path.join(rootDir, "public"),
  index: ["index.html"],
  maxAge: config.nodeEnv === "production" ? "1h" : 0,
  /* @fastify/static v10 hands this hook the Fastify reply, not the raw
     response, so headers go through reply.header(). */
  setHeaders(reply, filePath) {
    /* The entry page must never be cached: a stale index.html served after a
       redeploy would run against a changed API. */
    if (filePath.endsWith("index.html")) reply.header("cache-control", "no-store");
  }
});

app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith("/api/")) return reply.code(404).send({ error: "not_found" });
  return reply.sendFile("index.html");
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

try {
  await migrate(app.log);
} catch (err) {
  app.log.error({ err }, "migration failed");
  if (config.nodeEnv === "production") process.exit(1);
}

await app.listen({ port: config.port, host: config.host });
app.log.info(`study1 survey listening on ${config.host}:${config.port} · instrument ${INSTRUMENT_VERSION}`);

/* Fly sends SIGINT/SIGTERM before replacing a machine. Stop taking new work,
   let in-flight saves finish, then close the pool: a participant's page turn
   must never be lost to a deploy. */
let closing = false;
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    if (closing) return;
    closing = true;
    app.log.info(`${sig} received, draining`);
    try { await app.close(); } catch (err) { app.log.error({ err }, "close failed"); }
    try { await pool.end(); } catch { /* already gone */ }
    process.exit(0);
  });
}
