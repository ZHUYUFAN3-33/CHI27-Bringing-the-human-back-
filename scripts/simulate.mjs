/* End-to-end participant simulator.
   Walks the real API exactly as the browser does: start, answer every page,
   log the video gate, complete. Used for load testing and as a smoke test.

     node scripts/simulate.mjs --n 20 --base http://127.0.0.1:8099
*/
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const BASE = arg("base", "http://127.0.0.1:8099");
const N = Number(arg("n", 5));
const CONC = Number(arg("conc", 10));
const VERBOSE = process.argv.includes("--verbose");

const post = async (path, body, token) => {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
    body: JSON.stringify(body ?? {})
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html error page */ }
  if (!res.ok) { const e = new Error(json?.message || text.slice(0, 200)); e.status = res.status; e.payload = json; throw e; }
  return json;
};

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffled = n => {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* Answer one page the way a compliant participant would. */
function answerPage(page, opts) {
  const out = [];
  const now = () => new Date().toISOString();

  const walk = it => {
    if (it.type === "matrix") return it.rows.forEach(walk);
    if (it.type === "rank") {
      const ranks = shuffled(it.actors.length);
      it.subIds.forEach((sid, i) => out.push({ id: sid, num: ranks[i], at: now(), latencyMs: 900 + i * 40, revisions: 0 }));
      return;
    }
    if (it.type === "likert7") {
      /* The attention check asks for "Disagree" = 2. A share of simulated
         participants fail it, so the dashboard's flags have something to show. */
      const isAttention = /_AT1$/.test(it.id);
      const num = isAttention ? (opts.failAttention ? pick([1, 3, 5, 6]) : 2) : 1 + Math.floor(Math.random() * 7);
      out.push({ id: it.id, num, at: now(), latencyMs: 800, revisions: 0 });
      return;
    }
    if (it.type === "mc") {
      let num;
      if (it.screenOut) num = opts.screenOut ? it.screenOut[0] : 0;
      else if (it.id === "C1") num = opts.failC1 ? 3 : opts.c1;
      else if (it.id === "C2") num = opts.failC2 ? 4 : opts.c2;
      else num = Math.floor(Math.random() * it.options.length);
      out.push({ id: it.id, num, at: now(), latencyMs: 1100, revisions: 0 });
      return;
    }
    if (it.type === "number") out.push({ id: it.id, num: 18 + Math.floor(Math.random() * 50), at: now(), latencyMs: 1500, revisions: 0 });
    if (it.type === "text")   out.push({ id: it.id, text: pick(["Japan", "United States", "Germany", "Brazil"]), at: now(), latencyMs: 1800, revisions: 0 });
  };
  page.items.forEach(walk);
  return out;
}

async function runOne(i) {
  const started = Date.now();
  const params = { participantId: `SIMP${String(i).padStart(5, "0")}`, projectId: "SIMPROJ", assignmentId: `SIMA${i}` };
  /* --real writes rows that count towards the study, for rehearsing the
     dashboard and the export. Everything else is flagged as test data. */
  if (!process.argv.includes("--real")) params.test = "1";
  const s = await post("/api/session/start", { params, screenW: 1440, screenH: 900, timezone: "Asia/Tokyo", language: "en-GB" });
  const token = s.token;
  const plan = s.plan;

  /* The manipulation-check answers a compliant participant gives depend on the
     framing text they actually read, which is the point of the two checks. */
  const disc = plan.pages.find(p => p.kind === "disclosure").disclosure;
  const c1 = { H: 0, HA: 1, A: 2 }[disc.arrangement];
  const profileLine = disc.personaLines.find(l => l.profile)?.text ?? "";
  const c2 = disc.arrangement === "A" ? 3
    : /does not have/.test(profileLine) ? 0
    : /intellectual/.test(profileLine) ? 1 : 2;

  const opts = {
    c1, c2,
    screenOut: Math.random() < 0.06,
    failAttention: Math.random() < 0.08,
    failC1: Math.random() < 0.05,
    failC2: Math.random() < 0.05
  };

  for (let p = 0; p < plan.pages.length - 1; p++) {
    const page = plan.pages[p];
    const answers = answerPage(page, opts);
    const videoEvents = page.kind === "segment" ? [
      { segment: page.segment, segPosition: page.segPosition, videoId: page.video.id, event: "play", positionS: 0, at: new Date().toISOString() },
      { segment: page.segment, segPosition: page.segPosition, videoId: page.video.id, event: "ended", positionS: page.video.duration, watchS: page.video.duration, at: new Date().toISOString() },
      { segment: page.segment, segPosition: page.segPosition, videoId: page.video.id, event: "gate_open", watchS: page.video.duration, at: new Date().toISOString() }
    ] : [];

    await post("/api/save", {
      answers,
      page: { key: page.key, index: p, visit: 1, enteredAt: new Date(Date.now() - 9000).toISOString(), leftAt: new Date().toISOString(), dwellMs: 9000 },
      videoEvents,
      nextPageKey: plan.pages[p + 1].key,
      nextPageIndex: p + 1
    }, token);

    const trip = page.items.find(it => it.screenOut && answers.find(a => a.id === it.id && it.screenOut.includes(a.num)));
    if (trip) {
      await post("/api/screen-out", { reason: trip.screenOutReason }, token);
      return { outcome: "screened_out", ms: Date.now() - started };
    }
  }

  const done = await post("/api/complete", { finishedAt: new Date().toISOString() }, token);
  if (done.missing?.length) return { outcome: "completed_incomplete", missing: done.missing, ms: Date.now() - started };
  return { outcome: "completed", code: done.completionCode, ms: Date.now() - started };
}

/* -------------------------------------------------------------- driver */

const results = [];
let next = 0, errors = 0;
const t0 = Date.now();

async function worker() {
  for (;;) {
    const i = next++;
    if (i >= N) return;
    try { results.push(await runOne(i)); }
    catch (err) { errors++; if (VERBOSE || errors <= 3) console.error(`  run ${i} failed:`, err.status ?? "", err.message); }
  }
}

await Promise.all(Array.from({ length: Math.min(CONC, N) }, worker));

const wall = (Date.now() - t0) / 1000;
const by = results.reduce((m, r) => (m[r.outcome] = (m[r.outcome] ?? 0) + 1, m), {});
const lat = results.map(r => r.ms).sort((a, b) => a - b);
const pct = p => lat.length ? lat[Math.floor(lat.length * p)] : 0;

console.log(`\n${N} runs · concurrency ${CONC} · ${wall.toFixed(1)}s wall · ${(N / wall).toFixed(1)} participants/s`);
console.log("outcomes:", by, errors ? `· errors ${errors}` : "· no errors");
console.log(`per-participant full run: p50 ${pct(0.5)}ms · p95 ${pct(0.95)}ms · max ${lat.at(-1) ?? 0}ms`);
const bad = results.filter(r => r.outcome === "completed_incomplete");
if (bad.length) { console.error("INCOMPLETE:", JSON.stringify(bad[0].missing)); process.exit(1); }
if (errors) process.exit(1);
