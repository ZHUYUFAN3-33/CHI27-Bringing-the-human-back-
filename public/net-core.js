/* ---------------------------------------------------------------------------
   Transport, as a factory.

   A participant on hotel wifi will drop packets in the middle of the study.
   Nothing here blocks the questionnaire on the network: every save goes into a
   durable queue in localStorage first, and a background flusher drains it with
   exponential backoff. If the browser is closed mid-study and reopened, the
   queue is still there and drains on the next load.

   The only place the network is allowed to block the participant is the final
   submit, and even then only for a bounded number of attempts.

   One instance per study. The queue and the token are keyed per study so that
   a browser which has taken both never delivers one study's saves under the
   other's session; /net.js builds Study 1's instance, /s2/survey.js builds
   Study 2's. Both share every line below.
--------------------------------------------------------------------------- */

export function createNet({ queueKey, tokenKey }) {
  /* The token this tab is working under. Read from storage once and then held
     here: storage is shared by every tab on the origin, and a participant who
     opens the link twice gets two sessions racing to write it. Reading storage
     on every request let the second tab's token silently take over the first
     tab's saves, so answers given under one condition's framing landed on the
     other row. A tab now keeps the session it started with. */
  let heldToken = null;

  const store = {
    get token() {
      if (heldToken) return heldToken;
      try { heldToken = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey) || null; }
      catch { heldToken = null; }
      return heldToken;
    },
    set token(v) {
      heldToken = v;
      /* Written to both: localStorage survives a tab close, sessionStorage keeps
         working when a privacy setting blocks persistent storage. */
      try { localStorage.setItem(tokenKey, v); } catch { /* private mode */ }
      try { sessionStorage.setItem(tokenKey, v); } catch { /* ignore */ }
    },
    clearToken() {
      heldToken = null;
      try { localStorage.removeItem(tokenKey); } catch { /* ignore */ }
      try { sessionStorage.removeItem(tokenKey); } catch { /* ignore */ }
    }
  };

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(queueKey) || "[]"); }
    catch { return []; }
  }
  function writeQueue(items) {
    try { localStorage.setItem(queueKey, JSON.stringify(items.slice(-60))); }
    catch { /* quota or private mode: the in-memory queue still works */ }
  }

  let queue = readQueue();
  let flushing = false;
  let backoff = 0;
  const listeners = new Set();

  function onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function emit(state, detail) { listeners.forEach(fn => fn(state, detail)); }
  function pendingCount() { return queue.length; }

  /** Queue a page save. Returns immediately; delivery is the flusher's problem.
      The job remembers the session it was produced under, so a save still queued
      when the page reloads into a different session is delivered to the row it
      belongs to, not to whichever token is current by then. */
  function enqueue(path, body) {
    queue.push({ id: crypto.randomUUID(), path, body, tries: 0, token: store.token });
    writeQueue(queue);
    flush();
  }

  /** Drop whatever is queued. Called when a brand-new session starts: anything
      left over belongs to a token this browser no longer holds. It cannot be
      delivered, and left in place it would sit at the head of the queue
      returning 401 forever, holding every later page behind it. */
  function clearQueue() {
    queue = [];
    writeQueue(queue);
  }

  async function post(path, body, { timeoutMs = 15000, token = store.token } = {}) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
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

  async function flush() {
    if (flushing || !queue.length || !store.token) return;
    flushing = true;
    try {
      while (queue.length) {
        const job = queue[0];
        try {
          await post(job.path, job.body, { token: job.token || store.token });
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
  function beaconFlush() {
    if (!queue.length || !navigator.sendBeacon || !store.token) return;
    for (const job of queue.slice(0, 6)) {
      try {
        const blob = new Blob([JSON.stringify({ ...job.body, token: job.token || store.token })], { type: "application/json" });
        navigator.sendBeacon(job.path, blob);
      } catch { /* nothing more we can do at unload */ }
    }
  }

  addEventListener("online", () => { backoff = 0; flush(); });
  addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") flush(); });
  addEventListener("pagehide", beaconFlush);
  addEventListener("beforeunload", beaconFlush);
  setInterval(flush, 20_000);

  return { store, post, enqueue, flush, clearQueue, onStatus, pendingCount, beaconFlush };
}
