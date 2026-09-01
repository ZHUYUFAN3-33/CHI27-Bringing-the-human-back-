/* Runtime configuration. Everything is an environment variable so that the same
   image runs locally, on a staging app, and in production without a rebuild. */

const bool = (v, dflt = false) => {
  if (v === undefined || v === "") return dflt;
  return /^(1|true|yes|on)$/i.test(String(v));
};
const int = (v, dflt) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : dflt;
};

export const config = {
  port: int(process.env.PORT, 8080),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",

  databaseUrl: process.env.DATABASE_URL || "",
  pgPoolMax: int(process.env.PG_POOL_MAX, 10),
  pgStatementTimeoutMs: int(process.env.PG_STATEMENT_TIMEOUT_MS, 10_000),

  /* Researcher access to /admin and /api/export/*. Required in production. */
  adminToken: process.env.ADMIN_TOKEN || "",

  /* Salt for the one-way IP hash used to spot duplicate submissions.
     Rotating it makes past hashes uncomparable, so set it once and leave it. */
  ipSalt: process.env.IP_SALT || "",

  /* Design switches -------------------------------------------------------- */

  /* Close the study without redeploying: new sessions get a "closed" page,
     participants already in progress can still finish. */
  studyOpen: bool(process.env.STUDY_OPEN, true),

  /* Recruitment ------------------------------------------------------------ */
  /* cloudresearch | prolific | mturk | direct */
  recruitment: (process.env.RECRUITMENT || "cloudresearch").toLowerCase(),

  /* CloudResearch Connect: the Redirect URL from the end of the Create a Study
     wizard. Left empty, the completion page just shows the code. */
  completionRedirectUrl: process.env.COMPLETION_REDIRECT_URL || "",
  /* Completion code shown on the last page. Always shown, even when a redirect
     is configured, so a participant whose redirect fails is not stranded. */
  completionCode: process.env.COMPLETION_CODE || "",

  /* Study information shown before consent. Markdown-lite: blank line = new
     paragraph. Keep the ethics-approved wording here. */
  studyInfoUrl: process.env.STUDY_INFO_URL || "",
  /* Free text, not necessarily an address: a WhatsApp number is a contact
     point too. CONTACT_EMAIL is still read so an existing deployment keeps
     working. */
  contact: process.env.STUDY_CONTACT || process.env.CONTACT_EMAIL || "",
  /* Grant or funder to name on the information page. */
  funding: process.env.STUDY_FUNDING || "",

  /* Ops -------------------------------------------------------------------- */
  rateLimitMax: int(process.env.RATE_LIMIT_MAX, 240),      // per participant token, per window
  /* /api/session/start has no token yet, so it is metered per IP. Raise this
     if participants arrive in a burst from behind one shared address. */
  sessionStartRateMax: int(process.env.SESSION_START_RATE_MAX, 150),
  rateLimitWindowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  trustProxy: bool(process.env.TRUST_PROXY, true),         // Fly always fronts the app
  logLevel: process.env.LOG_LEVEL || "info",

  /* Abandoned sessions are not counted against a cell's target after this
     many minutes without contact, so a cell cannot be starved by drop-outs. */
  staleMinutes: int(process.env.STALE_MINUTES, 90),

  /* How often each machine re-derives the allocation counters from the
     participants table, giving back the slots of sessions that opened the link
     and never answered (see staleMinutes above). 0 disables it and leaves the
     dashboard's Recount button as the only way. */
  allocationReconcileMs: int(process.env.ALLOCATION_RECONCILE_MS, 300_000),

  /* How often each machine checks whether the wording was published somewhere
     else. Two machines run behind the proxy, so without this a publish reaches
     only the machine that handled it and the other keeps serving the old
     questionnaire. One integer per machine per interval; 0 disables it, which
     is only sensible on a single machine. */
  instrumentPollMs: int(process.env.INSTRUMENT_POLL_MS, 5_000)
};

export function assertProductionConfig(log) {
  const problems = [];
  if (!config.databaseUrl) problems.push("DATABASE_URL is not set");
  if (!config.adminToken) problems.push("ADMIN_TOKEN is not set");
  else if (config.adminToken.length < 24) problems.push("ADMIN_TOKEN is shorter than 24 characters");
  if (!config.ipSalt) problems.push("IP_SALT is not set");
  if (problems.length && config.nodeEnv === "production") {
    problems.forEach(p => log.error(`config: ${p}`));
    throw new Error("refusing to start in production with an incomplete configuration");
  }
  problems.forEach(p => log.warn(`config: ${p}`));
}
