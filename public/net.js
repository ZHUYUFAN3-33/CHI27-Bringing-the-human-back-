/* ---------------------------------------------------------------------------
   Transport.

   A participant on hotel wifi will drop packets in the middle of the study.
   Nothing here blocks the questionnaire on the network: every save goes into a
   durable queue in localStorage first, and a background flusher drains it with
   exponential backoff. If the browser is closed mid-study and reopened, the
   queue is still there and drains on the next load.

   The only place the network is allowed to block the participant is the final
   submit, and even then only for a bounded number of attempts.
--------------------------------------------------------------------------- */

const QUEUE_KEY = "study1.queue.v1";
const TOKEN_KEY = "study1.token.v1";

export const store = {
  get token() {
    try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null; }
    catch { return null; }
  },
  set token(v) {
    /* Written to both: localStorage survives a tab close, sessionStorage keeps
       working when a privacy setting blocks persistent storage. */
    try { localStorage.setItem(TOKEN_KEY, v); } catch { /* private mode */ }
    try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* ignore */ }
  },
  clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  }
};

function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
}
function writeQueue(items) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-60))); }
  catch { /* quota or private mode: the in-memory queue still works */ }
}

let queue = readQueue();
let flushing = false;
let backoff = 0;
const listeners = new Set();

export function onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(state, detail) { listeners.forEach(fn => fn(state, detail)); }

export function pendingCount() { return queue.length; }

/** Queue a page save. Returns immediately; delivery is the flusher's problem. */
export function enqueue(path, body) {
  queue.push({ id: crypto.randomUUID(), path, body, tries: 0 });
  writeQueue(queue);
  flush();
}

async function post(path, body, { timeoutMs = 15000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(store.token ? { authorization: `Bearer ${store.token}` } : {})
      },
      body: JSON.stringify(body ?? {}),
      signal: ctl.signal,
      keepalive: false
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON error page */ }
    if (!res.ok) {
      const err = new Error(json?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export { post };

export async function flush() {
  if (flushing || !queue.length || !store.token) return;
  flushing = true;
  try {
    while (queue.length) {
      const job = queue[0];
      try {
        await post(job.path, job.body);
        queue.shift();
        writeQueue(queue);
        backoff = 0;
        emit(queue.length ? "syncing" : "ok", { pending: queue.length });
      } catch (err) {
        job.tries++;
        /* 4xx other than 408/429 means the server will never accept this
           payload. Retrying forever would wedge the queue behind one bad job
           and lose every later page, so drop it and keep the study moving. */
        const fatal = err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429;
        if (fatal && err.status !== 401) {
          console.warn("save rejected, dropping job", job.path, err.message);
          queue.shift();
          writeQueue(queue);
          continue;
        }
        writeQueue(queue);
        backoff = Math.min(30_000, backoff ? backoff * 2 : 1_000);
        emit(job.tries >= 3 ? "offline" : "syncing", { pending: queue.length, error: err.message });
        setTimeout(flush, backoff + Math.random() * 400);
        return;
      }
    }
  } finally {
    flushing = false;
  }
}

/* Last-ditch delivery when the tab is going away. sendBeacon survives unload
   where fetch does not, but it cannot set an Authorization header, so the token
   travels in the body — the same secret, over the same TLS connection. */
export function beaconFlush() {
  if (!queue.length || !navigator.sendBeacon || !store.token) return;
  for (const job of queue.slice(0, 6)) {
    try {
      const blob = new Blob([JSON.stringify({ ...job.body, token: store.token })], { type: "application/json" });
      navigator.sendBeacon(job.path, blob);
    } catch { /* nothing more we can do at unload */ }
  }
}

addEventListener("online", () => { backoff = 0; flush(); });
addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") flush(); });
addEventListener("pagehide", beaconFlush);
addEventListener("beforeunload", beaconFlush);
setInterval(flush, 20_000);
