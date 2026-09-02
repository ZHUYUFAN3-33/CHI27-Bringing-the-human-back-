/* Simulated Study 2 participants, straight against the API.

   node scripts/s2-simulate.mjs --n 50 --conc 10 [--base http://127.0.0.1:8099] [--real]

   Rows are flagged as test data unless --real is given, so a run against the
   deployed study stays out of every export and gives its slots back. About one
   in twenty screens out on the consent page, as a real sample does. */

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) =>
  a.startsWith("--") ? [a.slice(2), arr[i + 1]?.startsWith("--") || arr[i + 1] == null ? "1" : arr[i + 1]] : []
).filter(x => x.length));
const N = Number(args.n ?? 20);
const CONC = Number(args.conc ?? 5);
const BASE = args.base ?? "http://127.0.0.1:8099";
const REAL = args.real === "1";

const SENTENCES = [
  "A small white robot on a desk talks with a woman about her week; it nods and gestures and seems to follow what she says.",
  "Looks like a remote presence robot. Someone is speaking through it, the replies are natural and a bit slow.",
  "The robot gives advice about workload; it feels scripted but responsive, like a chatbot with a body.",
  "Two people having an ordinary conversation, except one of them is a little robot with moving arms.",
  "The robot helps with a document and a printer. The voice sounds human to me, maybe a person typing.",
  "It seems friendly and attentive. Hard to say if a person is behind it or a program."
];
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];

async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {})
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) { const e = new Error(json?.message || `HTTP ${res.status}`); e.status = res.status; e.payload = json; throw e; }
  return json;
}

const stats = { started: 0, completed: 0, screened: 0, errors: 0, orders: {} };

async function one(i) {
  const params = { participantId: `S2SIM${String(i).padStart(5, "0")}`, assignmentId: `A${i}`, projectId: "SIM" };
  if (!REAL) params.test = "1";
  const s = await post("/api/s2/session/start", { params, screenW: 1440, screenH: 900, timezone: "Asia/Tokyo", language: "en-GB" });
  const token = s.token;
  stats.started++;
  const pages = s.plan.pages;
  const order = pages.filter(p => p.kind === "segment").map(p => p.segment).join("");
  stats.orders[order] = (stats.orders[order] ?? 0) + 1;

  const now = () => new Date().toISOString();
  const pageBody = (p, idx, next, answers, videoEvents = []) => ({
    answers, videoEvents,
    page: { key: p.key, index: idx, visit: 1, enteredAt: now(), leftAt: now(), dwellMs: 3000 + rnd(20000) },
    nextPageKey: next?.key ?? p.key, nextPageIndex: next ? pages.indexOf(next) : idx
  });

  /* intro */
  const intro = pages[0];
  const screen = Math.random() < 0.05;
  const ans = intro.items.map(it => ({ id: it.id, num: 0, at: now(), latencyMs: 2000, revisions: 0 }));
  if (screen) ans[rnd(3)].num = 1;
  await post("/api/s2/save", pageBody(intro, 0, screen ? null : pages[1], ans), token);
  if (screen) {
    const trip = intro.items.find((it, k) => ans[k].num === 1);
    await post("/api/s2/screen-out", { reason: trip.screenOutReason }, token);
    stats.screened++;
    return;
  }

  for (let idx = 1; idx <= 3; idx++) {
    const p = pages[idx];
    const dur = p.video.duration;
    const vids = [
      { segment: p.segment, segPosition: p.segPosition, videoId: p.video.id, event: "play", positionS: 0, at: now() },
      { segment: p.segment, segPosition: p.segPosition, videoId: p.video.id, event: "gate_open", watchS: dur + 1, at: now() },
      { segment: p.segment, segPosition: p.segPosition, videoId: p.video.id, event: "ended", positionS: dur, watchS: dur + 1, at: now() }
    ];
    const answers = p.items.filter(it => it.type !== "note").map(it => it.type === "text"
      ? { id: it.id, num: null, text: pick(SENTENCES), at: now(), latencyMs: 20000 + rnd(40000), revisions: 0 }
      : { id: it.id, num: rnd(it.options.length), at: now(), latencyMs: 3000 + rnd(9000), revisions: rnd(2) });
    await post("/api/s2/save", pageBody(p, idx, pages[idx + 1], answers, vids), token);
  }

  const done = await post("/api/s2/complete", { finishedAt: now() }, token);
  if (done.missing?.length) throw new Error(`complete reported missing: ${done.missing.join(",")}`);
  stats.completed++;
}

let next = 0;
async function worker() {
  while (next < N) {
    const i = next++;
    try { await one(i); }
    catch (err) { stats.errors++; console.error(`#${i}: ${err.message}`, err.payload ?? ""); }
  }
}
await Promise.all(Array.from({ length: Math.min(CONC, N) }, worker));
console.log(JSON.stringify(stats, null, 2));
if (stats.errors) process.exit(1);
