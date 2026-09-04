/* ---------------------------------------------------------------------------
   Study 2 — participant runtime.

   Renders the five-page plan the server sends and records what the participant
   does with it. Same conventions as Study 1's public/survey.js — the plan
   arrives resolved for this one participant, every save goes through a durable
   queue, the clip gates the questions under it — with one difference in shape:
   the last clip's Next is the submit, and page five is reached only once the
   completion has been recorded.
--------------------------------------------------------------------------- */

import { createNet } from "/net-core.js";

const API = "/api/s2";
const net = createNet({ queueKey: "s2.queue.v1", tokenKey: "s2.token.v1" });
const { store, post, enqueue, flush, clearQueue, onStatus, pendingCount } = net;

/* ------------------------------------------------------------------ state */

const S = {
  plan: null,
  completion: null,
  page: 0,
  answers: new Map(),     // itemId -> {num, text, at, latencyMs, revisions}
  gates: {},              // segment -> {started, watch, done, error}
  pageEnteredAt: null,
  visits: new Map(),
  done: false,
  preview: false,
  design: null
};

const $  = sel => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = s => esc(s)
  .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const fillTokens = s => String(s ?? "").replace(/\{(funding|contact)\}/g, (_m, key) =>
  (key === "funding" ? window.__STUDY_FUNDING__ : window.__STUDY_CONTACT__) ?? "");
const paragraphs = s => fillTokens(s).split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);

const pageEl = $("#page"), navEl = $("#nav"), barEl = $("#bar");
const backBtn = $("#back"), nextBtn = $("#next"), warnEl = $("#navwarn"), posEl = $("#poslabel");
const saveBar = $("#savebar");

onStatus((state, detail) => {
  if (state === "ok" || (state === "syncing" && detail.pending <= 1)) {
    saveBar.className = "savebar";
    return;
  }
  saveBar.className = "savebar show" + (state === "offline" ? " bad" : "");
  saveBar.textContent = state === "offline"
    ? "You appear to be offline. Your answers are saved on this device and will be sent automatically — please keep this tab open."
    : `Saving your answers… (${detail.pending} pending)`;
});

/* ---------------------------------------------------------------- boot */

async function boot() {
  if (window.__PREVIEW__) return bootPreview();

  const params = Object.fromEntries(new URLSearchParams(location.search));
  let session;
  try {
    if (store.token) {
      session = await post(`${API}/session/resume`, { params }).catch(() => null);
    }
    if (!session) {
      session = await post(`${API}/session/start`, {
        token: store.token || null,
        params,
        screenW: screen?.width ?? null,
        screenH: screen?.height ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
        language: navigator.language ?? null
      });
      if (!session.resumed) clearQueue();
      store.token = session.token;
      if (session.resumed) session = await post(`${API}/session/resume`, { params }).catch(() => session);
    }
  } catch (err) {
    const code = err.payload?.error;
    if (code === "study_closed" || code === "study_full") {
      return terminal("This study is closed", err.payload.message + " Thank you for your interest.");
    }
    if (code === "took_part_before") {
      return terminal("Thank you for your interest",
        err.payload.message + " Please return the study on the platform so your place is not used up.");
    }
    return terminal("We could not start the study",
      "There was a problem reaching our server. Please check your connection and reload this page. " +
      "If it keeps happening, please close the study without submitting so your place is not used up.");
  }

  S.plan = session.plan;
  S.completion = session.completion;

  if (session.status === "screened_out") {
    return terminal("Thank you", "You are not eligible for this study. You may now close this page.");
  }

  for (const [id, v] of Object.entries(session.answers ?? {})) {
    S.answers.set(id, { num: v.num, text: v.text, restored: true, revisions: 0 });
  }
  for (const [seg, g] of Object.entries(session.gates ?? {})) {
    S.gates[seg] = { started: null, watch: Number(g.watch_s ?? 0), done: !!g.done, error: null };
  }

  const last = S.plan.pages.length - 1;
  if (session.status === "completed") {
    /* Reloading the finish page shows the same code again; nothing restarts. */
    S.done = true;
    S.page = last;
    navEl.hidden = false;
    render();
    return;
  }

  const idx = S.plan.pages.findIndex(p => p.key === session.pageKey);
  S.page = idx >= 0 ? idx : Math.min(session.pageIndex ?? 0, last);
  /* The finish page belongs to a completed participant; anyone else lands on
     their last clip. */
  if (S.page >= last) S.page = last - 1;

  navEl.hidden = false;
  render();
  flush();
  setInterval(() => { if (!S.done) post(`${API}/session/ping`, {}).catch(() => {}); }, 60_000);
}

/* ---------------------------------------------------------------- preview */

async function bootPreview() {
  S.preview = true;
  navEl.hidden = false;
  await previewLoad(window.__PREVIEW__.order ?? "O1");
}

async function previewLoad(order = "O1", { keepPage = false } = {}) {
  let data;
  try {
    const token = window.__PREVIEW__.token;
    const res = await fetch(`${API}/admin/preview-plan?order=${encodeURIComponent(order)}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    return terminal("The preview could not load", `${err.message}. Check that the admin token in the address bar is current.`);
  }
  const was = keepPage ? S.page : 0;
  S.plan = data.plan;
  S.design = data.design;
  S.completion = { code: "PREVIEW", redirectUrl: null, platform: "preview" };
  S.answers.clear();
  S.gates = {};
  S.plan.pages.filter(p => p.kind === "segment").forEach(p => {
    S.gates[p.segment] = { started: null, watch: 0, done: true, error: null };
  });
  S.page = Math.min(was, S.plan.pages.length - 1);
  window.__PREVIEW__.onLoaded?.(data);
  render();
}

window.__previewLoad = previewLoad;
window.__previewGoto = i => { S.page = Math.max(0, Math.min(i, S.plan.pages.length - 1)); render(); };

/* ---------------------------------------------------------------- render */

function render() {
  const p = S.plan.pages[S.page];
  const last = S.plan.pages.length - 1;
  S.pageEnteredAt = Date.now();
  S.visits.set(p.key, (S.visits.get(p.key) ?? 0) + 1);

  pageEl.innerHTML = "";
  pageEl.append(el("p", "eyebrow", esc(p.eyebrow ?? "")));
  pageEl.append(el("h2", "qtitle", esc(p.title)));

  if (p.kind === "info")    renderIntro(p);
  if (p.kind === "segment") renderSegment(p);
  if (p.kind === "finish")  { renderFinish(p); return; }

  p.items.forEach(item => target(p).append(buildItem(item)));

  barEl.style.width = (S.page / last * 100) + "%";
  posEl.textContent = `Page ${S.page + 1} of ${S.plan.pages.length}`;
  if (S.preview) window.__PREVIEW__.onPage?.(S.page, p);
  backBtn.disabled = S.page === 0;
  backBtn.style.visibility = "visible";
  nextBtn.textContent = S.page === last - 1 ? "Submit" : "Next";
  nextBtn.hidden = false;
  navEl.hidden = false;
  scrollTo({ top: 0, behavior: "instant" });
  updateNext();
}

/* Page one: the information sheet, then what OriHime is and the three ways it
   can be controlled, then the three consent items. */
function renderIntro(p) {
  const box = el("div", "disclosure infosheet");
  if (p.info?.lede) box.append(el("p", "lede", md(fillTokens(p.info.lede))));
  const configured = { funding: window.__STUDY_FUNDING__, contact: window.__STUDY_CONTACT__ };
  (p.info?.sections ?? []).forEach(s => {
    if (s.requires && !configured[s.requires]) return;
    const sec = el("section");
    sec.append(el("h3", null, esc(fillTokens(s.heading))));
    paragraphs(s.body).forEach(para => sec.append(el("p", null, md(para))));
    box.append(sec);
  });
  pageEl.append(box);

  const a = p.about;
  if (a) {
    const card = el("div", "disclosure about");
    card.append(el("h3", null, esc(a.head)));
    const fig = el("figure", "photo");
    fig.innerHTML = '<img src="/orihime.jpg" width="1600" height="899" alt="OriHime, a small white tabletop robot, on a table beside a seated person">';
    card.append(fig);
    card.append(el("p", null, md(a.intro)));
    /* No list of control arrangements here any more: naming three of them
       before three clips was a matching cue. a.after carries the sentence that
       says so, over two paragraphs. */
    paragraphs(a.after).forEach(par => card.append(el("p", null, md(par))));
    pageEl.append(card);
  }

  const consent = el("div", "consent");
  consent.id = "consent";
  consent.append(el("p", "eyebrow", "Consent and eligibility"));
  if (p.consentIntro) consent.append(el("p", "qintro", esc(p.consentIntro)));
  pageEl.append(consent);
}

function renderSegment(p) {
  const shell = el("div", "video");
  shell.id = `ytbox_${p.key}`;
  const mount = el("div");
  mount.id = `yt_${p.key}`;
  shell.append(mount);
  pageEl.append(shell);

  const gate = el("div", "gate");
  gate.id = `gate_${p.key}`;
  gate.innerHTML = `<span class="pip"></span><span id="gatetxt_${p.key}">Please watch the whole video. The questions below open when it has finished.</span>`;
  pageEl.append(gate);

  const wrap = el("div", "locked");
  wrap.id = `qs_${p.key}`;
  pageEl.append(wrap);
  queueMicrotask(() => mountPlayer(p));
}

/* Page five. Only ever rendered after /complete has succeeded (or on a reload
   by someone already completed), so the code it shows is a recorded one. */
function renderFinish(p) {
  navEl.hidden = true;
  saveBar.className = "savebar";
  const box = el("div", "disclosure");
  (p.debrief ?? []).forEach(t => box.append(el("p", null, md(t))));
  pageEl.append(box);

  const code = S.completion?.code ?? "";
  const redirectUrl = S.completion?.redirectUrl ?? null;
  const wrap = el("div", "centered");
  wrap.append(el("p", "qintro", redirectUrl ? "Your completion code, in case you need it" : "Your completion code is"));
  wrap.append(el("div", "bigcode", esc(code)));
  wrap.append(el("p", "hint", redirectUrl
    ? "You should not normally need to type this in — the return below records your participation for you."
    : "Copy this code into the study platform to confirm your participation."));
  pageEl.append(wrap);

  if (redirectUrl) {
    const a = el("a");
    a.href = redirectUrl;
    a.className = "btn wide";
    a.style.display = "block";
    a.style.textAlign = "center";
    a.style.textDecoration = "none";
    a.textContent = "Return to the study platform";
    pageEl.append(a);
    pageEl.append(el("p", "hint",
      "Press the button above to return to the study platform, which records your participation. " +
      "If the return does not work, enter the completion code above on the study platform instead — " +
      "your answers are already saved either way."));
  }
  barEl.style.width = "100%";
  posEl.textContent = `Page ${S.page + 1} of ${S.plan.pages.length}`;
  if (S.preview) window.__PREVIEW__.onPage?.(S.page, p);
  scrollTo({ top: 0, behavior: "instant" });
}

/* Where a page's items go: the intro nests them under the consent heading, the
   clips under the gate. */
function target(page) {
  if (page.kind === "segment") return document.getElementById(`qs_${page.key}`);
  if (page.kind === "info")    return document.getElementById("consent");
  return pageEl;
}

function buildItem(item) {
  switch (item.type) {
    case "mc":      return mcBlock(item);
    case "text":    return item.multiline ? textareaBlock(item) : textBlock(item);
    case "number":  return textBlock(item);
    case "matrix":  return matrixBlock(item);
    /* A lone seven-point item is a one-row table, so it inherits the same
       column headers, the same hit targets and the same phone layout. */
    case "likert7": return matrixBlock({ instruction: null, rows: [item] });
    case "heading": return headingBlock(item);
    case "note":    return el("div", "note", md(item.text));
    default:        return el("div");
  }
}

function headingBlock(item) {
  const wrap = el("div", "seam");
  if (item.eyebrow) wrap.append(el("div", "eyebrow", esc(item.eyebrow)));
  if (item.title)   wrap.append(el("h2", null, esc(item.title)));
  if (item.text)    wrap.append(el("p", "lede", md(item.text)));
  return wrap;
}

/* Seven-point items, one table. The column labels come from the item itself
   when it has its own (the confidence item), and otherwise from the agreement
   anchors the server sent once with the plan. Ported from Study 1 so both
   studies present a seven-point item identically — the same table, the same
   1–7 numbering, the same collapse to stacked rows on a phone, all of which
   already have styles in survey.css. */
function matrixBlock(block) {
  const wrap = el("div", "matrix-q");
  if (block.instruction) wrap.append(el("p", "minstr", esc(block.instruction)));

  const scaleFor = row => row.options ?? S.plan.scale;
  const table = el("table", "likert");
  const head = scaleFor(block.rows[0]);
  table.innerHTML =
    `<thead><tr><th class="stemcol"></th>` +
    head.map((lab, i) => `<th><span class="n">${i + 1}</span>${esc(lab)}</th>`).join("") +
    `</tr></thead>`;

  const tbody = el("tbody");
  block.rows.forEach(row => {
    const scale = scaleFor(row);
    const tr = el("tr");
    tr.dataset.item = row.id;
    tr.append(el("td", "stemcell", md(row.stem) + (row.required !== false ? '<span class="req">*</span>' : "")));
    for (let c = 1; c <= 7; c++) {
      const td = el("td");
      td.dataset.n = c;
      const lab = el("label", "hit");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = row.id;
      input.value = c;
      input.setAttribute("aria-label", `${scale[c - 1]} — ${row.stem}`);
      if (S.answers.get(row.id)?.num === c) input.checked = true;
      input.addEventListener("change", () => setAnswer(row.id, { num: c, text: scale[c - 1] }, tr));
      lab.append(input);
      td.append(lab);
      tr.append(td);
    }
    tbody.append(tr);
  });
  table.append(tbody);
  wrap.append(table);

  /* On a phone the header row is dropped, so the two ends go underneath. */
  const key = el("div", "likertkey");
  key.innerHTML = `<span>1 · ${esc(head[0])}</span><span>7 · ${esc(head[6])}</span>`;
  wrap.append(key);
  return wrap;
}

function mcBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.item = item.id;
  wrap.append(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")));
  const opts = el("div", "opts");
  item.options.forEach((label, i) => {
    const l = el("label", "opt");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = item.id;
    input.value = i;
    if (S.answers.get(item.id)?.num === i) input.checked = true;
    input.addEventListener("change", () => setAnswer(item.id, { num: i, text: label }, wrap));
    l.append(input, el("span", null, esc(label)));
    opts.append(l);
  });
  wrap.append(opts);
  return wrap;
}

function textareaBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.item = item.id;
  wrap.append(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")));
  const ta = document.createElement("textarea");
  ta.name = item.id;
  ta.rows = 5;
  if (item.maxLength) ta.maxLength = item.maxLength;
  ta.setAttribute("aria-label", item.stem);
  ta.autocomplete = "off";
  ta.value = S.answers.get(item.id)?.text ?? "";
  const hint = el("p", "charhint");
  const paint = () => {
    const n = ta.value.trim().length;
    const min = item.minLength ?? 1;
    hint.className = "charhint" + (n && n < min ? " short" : "");
    hint.textContent = n < min
      ? (n ? `A little more, please — at least ${min} characters.` : `Please write at least ${min} characters.`)
      : `${n} characters`;
  };
  ta.addEventListener("input", () => {
    const raw = ta.value.replace(/\s+/g, " ").trim();
    if (!raw) S.answers.delete(item.id);
    else setAnswer(item.id, { num: null, text: raw }, wrap);
    paint();
    updateNext();
  });
  wrap.append(ta, hint);
  paint();
  return wrap;
}

function textBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.item = item.id;
  wrap.append(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")));
  const isNum = item.type === "number";
  const input = document.createElement("input");
  input.type = isNum ? "number" : "text";
  if (isNum) {
    input.inputMode = "numeric";
    if (item.min != null) input.min = item.min;
    if (item.max != null) input.max = item.max;
  }
  if (item.maxLength) input.maxLength = item.maxLength;
  input.autocomplete = "off";
  const cur = S.answers.get(item.id);
  if (cur) input.value = isNum ? (cur.num ?? "") : (cur.text ?? "");
  input.addEventListener("input", () => {
    const raw = input.value.trim();
    if (!raw) { S.answers.delete(item.id); updateNext(); return; }
    if (isNum) {
      const n = Number(raw);
      /* Out of range is left on screen rather than stored: the participant can
         still fix a typo, and the server would refuse it anyway. */
      if (!Number.isFinite(n)) { S.answers.delete(item.id); updateNext(); return; }
      setAnswer(item.id, { num: n, text: null }, wrap);
    } else {
      setAnswer(item.id, { num: null, text: raw }, wrap);
    }
  });
  wrap.append(input);
  return wrap;
}

function setAnswer(id, value, node) {
  const prev = S.answers.get(id);
  const changed = prev && !prev.restored && (prev.num !== value.num || prev.text !== value.text);
  S.answers.set(id, {
    num: value.num,
    text: value.text,
    at: new Date().toISOString(),
    latencyMs: S.pageEnteredAt ? Date.now() - S.pageEnteredAt : null,
    /* Free text revises on every keystroke; count a revision only for a
       changed choice. */
    revisions: changed && value.num != null ? (prev.revisions ?? 0) + 1 : (prev?.revisions ?? 0)
  });
  node?.classList?.remove("missing");
  updateNext();
}

/* ---------------------------------------------------------------- video gate
   Identical to Study 1's: the questions open when the player reports "ended"
   and the wall clock since first play covers most of the clip, and a player
   that will not run offers the clip on YouTube instead. */

let YT_READY = false;
let currentPlayer = null;

(function loadYouTube() {
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.async = true;
  document.head.append(s);
})();

window.onYouTubeIframeAPIReady = () => {
  YT_READY = true;
  const p = S.plan?.pages[S.page];
  if (p?.kind === "segment") mountPlayer(p);
};

function mountPlayer(page) {
  if (!YT_READY || !window.YT?.Player) return;
  const host = document.getElementById(`yt_${page.key}`);
  const shell = document.getElementById(`ytbox_${page.key}`);
  if (!host || !shell || shell.dataset.mounted) return;
  shell.dataset.mounted = "1";

  const seg = page.segment;
  const dur = page.video.duration;
  S.gates[seg] ??= { started: null, watch: 0, done: false, error: null };

  try { currentPlayer?.destroy(); } catch { /* previous page's player */ }

  currentPlayer = new YT.Player(host.id, {
    videoId: page.video.id,
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
    events: {
      onError: e => {
        S.gates[seg].error = e.data;
        logVideo(page, "error", { detail: String(e.data) });
        flushVideoQueue();
        paintGate(page);
      },
      onStateChange: e => {
        const g = S.gates[seg];
        const at = currentPlayer?.getCurrentTime?.() ?? null;
        if (e.data === YT.PlayerState.PLAYING) {
          if (g.started === null) g.started = Date.now();
          logVideo(page, "play", { positionS: at });
        }
        if (e.data === YT.PlayerState.PAUSED) logVideo(page, "pause", { positionS: at });
        if (e.data === YT.PlayerState.ENDED) {
          const elapsed = g.started ? (Date.now() - g.started) / 1000 : 0;
          g.watch = Math.max(g.watch, elapsed);
          const passed = elapsed >= dur * S.plan.gateFraction;
          if (passed && !g.done) { g.done = true; logVideo(page, "gate_open", { watchS: elapsed }); }
          logVideo(page, "ended", { positionS: at, watchS: elapsed });
          flushVideoQueue();
        }
        paintGate(page);
      }
    }
  });
  paintGate(page);
}

const videoQueue = [];

function flushVideoQueue() {
  if (!videoQueue.length) return;
  enqueue(`${API}/save`, { videoEvents: videoQueue.splice(0, videoQueue.length) });
}

function logVideo(page, event, extra = {}) {
  videoQueue.push({
    segment: page.segment, segPosition: page.segPosition, videoId: page.video.id,
    event, at: new Date().toISOString(), ...extra
  });
}

function paintGate(page) {
  const gate = document.getElementById(`gate_${page.key}`);
  const txt  = document.getElementById(`gatetxt_${page.key}`);
  const qs   = document.getElementById(`qs_${page.key}`);
  if (!gate || !qs) return;
  const g = S.gates[page.segment] ?? {};

  gate.className = "gate";
  if (g.done) {
    gate.classList.add("open");
    qs.classList.remove("locked");
    document.getElementById(`fb_${page.key}`)?.remove();
    txt.textContent = "Thank you. Please answer the questions below about the video you watched.";
  } else if (g.error != null) {
    gate.classList.add("err");
    qs.classList.add("locked");
    txt.textContent = "The video could not be played here — an ad blocker or a network restriction is " +
                      "the usual cause. You can watch it on YouTube instead. Your answers so far are saved.";
    renderFallback(page);
  } else {
    qs.classList.add("locked");
    txt.textContent = (g.started && g.watch)
      ? "It looks like part of the video was skipped. Please play it through before answering."
      : "Please watch the whole video. The questions below open when it has finished.";
  }
  updateNext();
}

function renderFallback(page) {
  const gate = document.getElementById(`gate_${page.key}`);
  if (!gate || document.getElementById(`fb_${page.key}`)) return;
  const g = S.gates[page.segment];
  const need = Math.round(page.video.duration * S.plan.gateFraction);

  const box = el("div", "fallback");
  box.id = `fb_${page.key}`;
  const link = el("a", "fblink", "Open the video on YouTube");
  link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(page.video.id)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const note = el("p", "fbnote");
  const btn = el("button", "btn fbbtn", "I have watched the whole video");
  btn.type = "button";
  btn.disabled = true;

  const paint = () => {
    if (!g.fallbackStarted) {
      note.textContent = "Open the clip first — this button unlocks once it has had time to play through.";
      btn.disabled = true;
      return;
    }
    const left = Math.max(0, need - Math.round((Date.now() - g.fallbackStarted) / 1000));
    btn.disabled = left > 0;
    note.textContent = left > 0
      ? `You can confirm in ${left}s, about as long as the video runs.`
      : "When you have watched the whole video, confirm below.";
  };
  link.addEventListener("click", () => {
    if (g.fallbackStarted == null) {
      g.fallbackStarted = Date.now();
      logVideo(page, "fallback_open", { detail: `err:${g.error}` });
      flushVideoQueue();
    }
    paint();
  });
  btn.addEventListener("click", () => {
    const watched = g.fallbackStarted ? (Date.now() - g.fallbackStarted) / 1000 : 0;
    g.watch = Math.max(g.watch ?? 0, watched);
    g.done = true;
    g.fallback = true;
    logVideo(page, "fallback_confirm", { watchS: watched, detail: `err:${g.error}` });
    logVideo(page, "gate_open", { watchS: watched, detail: "fallback" });
    flushVideoQueue();
    paintGate(page);
  });
  box.append(link, note, btn);
  gate.after(box);
  paint();
  const tick = setInterval(() => {
    if (g.done || !document.getElementById(`fb_${page.key}`)) return clearInterval(tick);
    paint();
  }, 1000);
}

/* ---------------------------------------------------- required-item checks */

/* A page's stored items, in order. A matrix is a container: it contributes its
   rows and never itself, and notes and headings contribute nothing. Every walk
   over a page's answers goes through here — miss one and a matrix block, which
   has no id of its own, reads as an unanswered required item and the Next
   button never lights. */
function flatItems(page) {
  const out = [];
  for (const it of page.items) {
    if (it.type === "note" || it.type === "heading") continue;
    if (it.type === "matrix") { out.push(...it.rows); continue; }
    out.push(it);
  }
  return out;
}

function requiredItems(page) {
  return flatItems(page).filter(it => it.required !== false);
}

/* A free-text answer under its minimum counts as missing: it is kept on
   screen so the participant can extend it, but it is neither saved nor
   enough to turn the page. */
function answered(it) {
  const a = S.answers.get(it.id);
  if (!a) return false;
  if (it.type === "text" && it.minLength != null) return (a.text ?? "").length >= it.minLength;
  return true;
}

function missingOn(page) {
  return requiredItems(page).filter(it => !answered(it)).map(it => it.id);
}

function gateClosed(page) {
  if (S.preview) return false;
  return page.kind === "segment" && !S.gates[page.segment]?.done;
}

function updateNext() {
  const page = S.plan.pages[S.page];
  if (page.kind === "finish") return;
  const miss = missingOn(page);
  const shut = gateClosed(page);
  nextBtn.disabled = !S.preview && (shut || miss.length > 0);
  warnEl.textContent = S.preview
    ? (miss.length ? `${miss.length} unanswered — not enforced in preview` : "")
    : shut
      ? "Please watch the video first"
      : miss.length
        ? `${miss.length} ${miss.length === 1 ? "item" : "items"} still to answer`
        : "";
}

/* ---------------------------------------------------------------- navigation */

nextBtn.addEventListener("click", async () => {
  const page = S.plan.pages[S.page];
  const miss = missingOn(page);
  if (gateClosed(page) || miss.length) {
    markMissing(miss);
    updateNext();
    return;
  }

  const trip = flatItems(page).find(it => it.screenOut && S.answers.get(it.id)
                                         && it.screenOut.includes(S.answers.get(it.id).num));
  const nextPage = S.plan.pages[S.page + 1];
  savePage(page, trip ? null : nextPage);

  if (trip) {
    post(`${API}/screen-out`, { reason: trip.screenOutReason }).catch(() => {});
    S.done = true;
    return terminal("Thank you for your interest",
      "Unfortunately you are not eligible to take part in this study. You may now close this page. " +
      "Nothing further is needed from you.");
  }

  if (nextPage?.kind === "finish") return submit();

  S.page++;
  render();
});

backBtn.addEventListener("click", () => {
  const page = S.plan.pages[S.page];
  savePage(page, S.plan.pages[S.page - 1]);
  S.page--;
  render();
});

function markMissing(ids) {
  pageEl.querySelectorAll(".missing").forEach(n => n.classList.remove("missing"));
  let first = null;
  ids.forEach(id => {
    const node = pageEl.querySelector(`[data-item="${CSS.escape(id)}"]`);
    if (!node) return;
    node.classList.add("missing");
    first ??= node;
  });
  first?.scrollIntoView({ block: "center", behavior: "smooth" });
}

/* ---------------------------------------------------------------- saving */

function savePage(page, nextPage) {
  if (S.preview) return;
  const answers = [];
  for (const it of flatItems(page)) {
    const a = S.answers.get(it.id);
    if (!a || a.restored) continue;
    if (it.type === "text" && it.minLength != null && (a.text ?? "").length < it.minLength) continue;
    answers.push({ id: it.id, num: a.num, text: a.text, at: a.at, latencyMs: a.latencyMs, revisions: a.revisions });
  }
  const now = Date.now();
  enqueue(`${API}/save`, {
    answers,
    page: {
      key: page.key,
      index: S.page,
      visit: S.visits.get(page.key) ?? 1,
      enteredAt: S.pageEnteredAt ? new Date(S.pageEnteredAt).toISOString() : null,
      leftAt: new Date(now).toISOString(),
      dwellMs: S.pageEnteredAt ? now - S.pageEnteredAt : null
    },
    videoEvents: videoQueue.splice(0, videoQueue.length),
    nextPageKey: nextPage?.key ?? page.key,
    nextPageIndex: nextPage ? S.plan.pages.indexOf(nextPage) : S.page
  });
}

/* The last clip's Next. The page was already saved by the click handler; the
   queue has to land before the completion call, or the server would compute
   the record from an incomplete table. */
async function submit() {
  if (S.preview) { S.page++; render(); return; }

  nextBtn.disabled = true;
  nextBtn.textContent = "Submitting…";
  backBtn.disabled = true;

  await flush();
  for (let i = 0; i < 8 && pendingCount(); i++) {
    await new Promise(r => setTimeout(r, 700 * (i + 1)));
    await flush();
  }

  const retry = msg => {
    nextBtn.disabled = false;
    nextBtn.textContent = "Try again";
    backBtn.disabled = false;
    saveBar.className = "savebar show bad";
    saveBar.textContent = msg;
  };

  if (pendingCount()) {
    return retry("Some answers have not reached us yet. Please check your connection and press the button again.");
  }

  try {
    const res = await post(`${API}/complete`, { finishedAt: new Date().toISOString() });
    S.done = true;
    S.completion = { ...S.completion, code: res.completionCode, redirectUrl: res.redirectUrl };
    /* The token is kept: a reload shows this same page with the same code. */
    S.page++;
    render();
  } catch {
    retry("We could not record your completion. Please press the button again.");
  }
}

/* ---------------------------------------------------------------- endings */

function terminal(title, body) {
  navEl.hidden = true;
  saveBar.className = "savebar";
  pageEl.innerHTML = "";
  pageEl.append(el("h2", "qtitle", esc(title)));
  pageEl.append(el("p", "qintro", esc(body)));
  barEl.style.width = "100%";
}

/* Test hook, as in Study 1. */
window.__t = { S, paintGate, render, updateNext };

/* ---------------------------------------------------------------- go */

fetch(`${API}/config`).then(r => r.json()).then(cfg => {
  if (cfg.contact) window.__STUDY_CONTACT__ = cfg.contact;
  if (cfg.funding) window.__STUDY_FUNDING__ = cfg.funding;
}).catch(() => {}).finally(boot);
