/* ---------------------------------------------------------------------------
   Study 1 — participant runtime.

   This file renders a plan it is handed by the server and records what the
   participant does with it. It contains no design logic: the condition, the
   segment order and the framing text all arrive over the wire, already
   resolved for this one participant.
--------------------------------------------------------------------------- */

import { store, post, enqueue, flush, onStatus, pendingCount } from "/net.js";

/* ------------------------------------------------------------------ state */

const S = {
  plan: null,
  completion: null,
  page: 0,
  answers: new Map(),     // itemId -> {num, text, at, latencyMs, revisions}
  gates: {},              // segment -> {started, watch, done, error}
  pageEnteredAt: null,
  visits: new Map(),      // pageKey -> visit number
  done: false
};

const $  = sel => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const pageEl = $("#page"), navEl = $("#nav"), barEl = $("#bar");
const backBtn = $("#back"), nextBtn = $("#next"), warnEl = $("#navwarn"), posEl = $("#poslabel");
const saveBar = $("#savebar");

/* ------------------------------------------------------------ connection UI */

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
  const params = Object.fromEntries(new URLSearchParams(location.search));
  let session;

  try {
    if (store.token) {
      session = await post("/api/session/resume", {}).catch(() => null);
    }
    if (!session) {
      session = await post("/api/session/start", {
        token: store.token || null,
        params,
        screenW: screen?.width ?? null,
        screenH: screen?.height ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
        language: navigator.language ?? null
      });
      store.token = session.token;
    }
  } catch (err) {
    if (err.payload?.error === "study_closed" || err.payload?.error === "study_full") {
      return terminal("This study is closed",
        err.payload.message + " Thank you for your interest.");
    }
    return terminal("We could not start the study",
      "There was a problem reaching our server. Please check your connection and reload this page. " +
      "If it keeps happening, please close the study without submitting so your place is not used up.");
  }

  S.plan = session.plan;
  S.completion = session.completion;

  if (session.status === "completed") {
    return completionPage(S.completion.code, S.completion.redirectUrl, true);
  }
  if (session.status === "screened_out") {
    return terminal("Thank you", "You are not eligible for this study. You may now close this page.");
  }

  /* Restore answers and video gates so a refresh is invisible to the participant. */
  for (const [id, v] of Object.entries(session.answers ?? {})) {
    S.answers.set(id, { num: v.num, text: v.text, restored: true, revisions: 0 });
  }
  for (const [seg, g] of Object.entries(session.gates ?? {})) {
    S.gates[seg] = { started: null, watch: Number(g.watch_s ?? 0), done: !!g.done, error: null };
  }

  const idx = S.plan.pages.findIndex(p => p.key === session.pageKey);
  S.page = idx >= 0 ? idx : Math.min(session.pageIndex ?? 0, S.plan.pages.length - 1);

  navEl.hidden = false;
  render();
  flush();
  setInterval(() => { if (!S.done) post("/api/session/ping", {}).catch(() => {}); }, 60_000);
}

/* ---------------------------------------------------------------- render */

function render() {
  const p = S.plan.pages[S.page];
  S.pageEnteredAt = Date.now();
  S.visits.set(p.key, (S.visits.get(p.key) ?? 0) + 1);

  pageEl.innerHTML = "";
  pageEl.append(el("p", "eyebrow", esc(p.eyebrow ?? "")));
  pageEl.append(el("h2", "qtitle", esc(p.title)));
  if (p.intro) pageEl.append(el("p", "qintro", esc(p.intro)));

  if (p.kind === "info")       renderInfo(p);
  if (p.kind === "disclosure") renderDisclosure(p);
  if (p.kind === "segment")    renderSegment(p);
  if (p.kind === "debrief")    { renderDebrief(p); return; }

  if (p.matrixInstruction) pageEl.append(el("p", "minstr", esc(p.matrixInstruction)));
  p.items.forEach(item => pageEl.append(renderItem(item, p)));

  barEl.style.width = (S.page / (S.plan.pages.length - 1) * 100) + "%";
  posEl.textContent = `Page ${S.page + 1} of ${S.plan.pages.length}`;
  backBtn.disabled = S.page === 0 || !!p.noBack;
  backBtn.style.visibility = p.noBack ? "hidden" : "visible";
  nextBtn.textContent = S.page === S.plan.pages.length - 2 ? "Submit" : "Next";
  nextBtn.hidden = false;
  scrollTo({ top: 0, behavior: "instant" });
  updateNext();
}

function renderInfo() {
  const box = el("div", "disclosure");
  box.innerHTML = `
    <p>Thank you for your interest in this study. Please read this page before deciding whether to take part.</p>
    <p><b>What you will do.</b> You will read a short description, watch three video clips of a person talking with an
       avatar robot called OriHime, and answer questions about each one. The study takes about 15–20 minutes.
       You will need sound.</p>
    <p><b>Your data.</b> We record your answers, how long each page took, and whether each clip played through.
       We do not record your name, and we do not store your IP address. Your responses are analysed in aggregate
       and may be shared as an anonymous dataset alongside a published paper.</p>
    <p><b>Taking part is voluntary.</b> You can close the page at any time without giving a reason. Because responses
       are not linked to your identity, we cannot remove your data once it has been submitted.</p>
    <p><b>One important note.</b> Some details of this study are not described in full until the end. There is a full
       explanation on the last page, before you finish.</p>`;
  if (window.__STUDY_CONTACT__) {
    box.innerHTML += `<p><b>Questions?</b> Contact ${esc(window.__STUDY_CONTACT__)}.</p>`;
  }
  pageEl.append(box);
}

function renderDisclosure(p) {
  const d = p.disclosure;
  const card = el("div", "disclosure");
  card.append(el("p", null, esc(d.intro)));

  /* Same photo, same place, in all seven conditions: it shows what OriHime is
     before the control-source text says who operates it. Sized attributes match
     the file so the text below does not shift when it loads. */
  const fig = el("figure", "photo");
  fig.innerHTML =
    '<img src="/orihime.jpg" width="1600" height="899" alt="OriHime, a small white tabletop avatar robot, on a table beside a seated person">';
  card.append(fig);

  card.append(el("p", null, esc(d.control)));

  const persona = el("div", "persona");
  persona.append(el("h4", null, esc(d.personaHead)));
  const ul = el("ul");
  d.personaLines.forEach(line => {
    const li = el("li", line.profile ? "profileline" : null, esc(line.text));
    ul.append(li);
  });
  persona.append(ul);
  card.append(persona);
  pageEl.append(card);
  pageEl.append(diagram(d.arrangement));
}

function renderSegment(p) {
  const shell = el("div", "video");
  shell.id = `yt_${p.key}`;
  pageEl.append(shell);

  const gate = el("div", "gate");
  gate.id = `gate_${p.key}`;
  gate.innerHTML = `<span class="pip"></span><span id="gatetxt_${p.key}">Please watch the whole interaction. The questions below open when it has finished.</span>`;
  pageEl.append(gate);

  if (p.desc) pageEl.append(el("p", "qintro", esc(p.desc)));

  const wrap = el("div", "locked");
  wrap.id = `qs_${p.key}`;
  pageEl.append(wrap);
  queueMicrotask(() => mountPlayer(p));
}

function renderDebrief() {
  const box = el("div", "disclosure");
  box.innerHTML = `
    <p>In this study, the description of who or what controlled OriHime, and the description of the pilot, were
       experimentally varied between participants, while the videos themselves were identical for everyone.</p>
    <p>The study examines how information about control and pilot characteristics shapes judgments.
       It does not test whether any disability group is more or less capable.</p>`;
  pageEl.append(box);

  const btn = el("button", "btn wide", "Submit and finish");
  btn.type = "button";
  btn.addEventListener("click", () => submit(btn), { once: false });
  pageEl.append(btn);
  pageEl.append(el("p", "hint",
    "Your answers are saved as you go. Pressing this button records your completion and gives you your code."));

  navEl.hidden = true;
  barEl.style.width = "100%";
}

/* Where a page's items go: the segment pages nest them under the video gate. */
function target(page) {
  return page.kind === "segment" ? document.getElementById(`qs_${page.key}`) : pageEl;
}

function renderItem(item, page) {
  const host = target(page);
  const node = buildItem(item, page);
  if (host !== pageEl) { host.append(node); return document.createComment(""); }
  return node;
}

function buildItem(item, page) {
  switch (item.type) {
    case "matrix": return matrixBlock(item);
    case "rank":   return rankBlock(item);
    case "likert7":return matrixBlock({ instruction: null, rows: [item] });
    case "mc":     return mcBlock(item);
    case "number":
    case "text":   return textBlock(item);
    default:       return el("div");
  }
}

/* -- Likert matrix ------------------------------------------------------- */

function matrixBlock(block) {
  const wrap = el("div", "matrix-q");
  if (block.instruction) wrap.append(el("p", "minstr", esc(block.instruction)));

  const table = el("table", "likert");
  const scale = S.plan.scale;
  table.innerHTML =
    `<thead><tr><th class="stemcol"></th>` +
    scale.map((lab, i) => `<th><span class="n">${i + 1}</span>${esc(lab)}</th>`).join("") +
    `</tr></thead>`;

  const tbody = el("tbody");
  block.rows.forEach(row => {
    const tr = el("tr");
    tr.dataset.item = row.id;
    tr.append(el("td", "stemcell", esc(row.stem) + '<span class="req">*</span>'));
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

  /* On a phone the header row is dropped, so the anchors go underneath. */
  const key = el("div", "likertkey");
  key.innerHTML = `<span>1 · ${esc(scale[0])}</span><span>7 · ${esc(scale[6])}</span>`;
  wrap.append(key);
  return wrap;
}

/* -- multiple choice ----------------------------------------------------- */

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

/* -- free text / number --------------------------------------------------- */

function textBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.item = item.id;
  wrap.append(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")));
  const input = document.createElement("input");
  input.type = item.type === "number" ? "number" : "text";
  if (item.min != null) input.min = item.min;
  if (item.max != null) input.max = item.max;
  if (item.maxLength) input.maxLength = item.maxLength;
  input.inputMode = item.type === "number" ? "numeric" : "text";
  input.autocomplete = "off";
  const cur = S.answers.get(item.id);
  if (cur) input.value = item.type === "number" ? (cur.num ?? "") : (cur.text ?? "");
  input.addEventListener("input", () => {
    const raw = input.value.trim();
    if (!raw) { S.answers.delete(item.id); updateNext(); return; }
    if (item.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) { S.answers.delete(item.id); updateNext(); return; }
      setAnswer(item.id, { num: n, text: null }, wrap);
    } else {
      setAnswer(item.id, { num: null, text: raw }, wrap);
    }
  });
  wrap.append(input);
  return wrap;
}

/* -- ranking -------------------------------------------------------------
   Radio grid, one column per rank. Picking a rank clears it from every other
   row, so the result is always a permutation: an analysable ranking rather
   than a grid of independent ticks. */

function rankBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.rank = item.id;
  if (item.scenario) wrap.append(el("div", "scenario", esc(item.scenario)));
  wrap.append(el("p", "stem", esc(item.stem) + '<span class="req">*</span>'));

  const n = item.actors.length;
  const table = el("table", "rank");
  table.innerHTML = `<thead><tr><th class="actor"></th>` +
    Array.from({ length: n }, (_, i) => `<th>${i === 0 ? "1 (greatest)" : i + 1}</th>`).join("") +
    `</tr></thead>`;
  const tbody = el("tbody");

  item.actors.forEach((actor, ai) => {
    const subId = item.subIds[ai];
    const tr = el("tr");
    tr.dataset.item = subId;
    tr.append(el("td", "actor", esc(actor.label)));
    for (let r = 1; r <= n; r++) {
      const td = el("td");
      const lab = el("label", "hit");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = subId;
      input.value = r;
      input.setAttribute("aria-label", `${actor.label}, rank ${r}`);
      if (S.answers.get(subId)?.num === r) input.checked = true;
      input.addEventListener("change", () => {
        /* Clear this rank wherever else it was used. */
        item.subIds.forEach(other => {
          if (other === subId) return;
          if (S.answers.get(other)?.num === r) {
            S.answers.delete(other);
            wrap.querySelectorAll(`input[name="${CSS.escape(other)}"]`).forEach(i => { i.checked = false; });
          }
        });
        setAnswer(subId, { num: r, text: actor.label }, tr);
        paintRank(wrap, item);
      });
      lab.append(input);
      td.append(lab);
      tr.append(td);
    }
    tbody.append(tr);
  });

  table.append(tbody);
  wrap.append(table);
  wrap.append(el("p", "rankhint", `Give each row a different position, 1 to ${n}.`));
  paintRank(wrap, item);
  return wrap;
}

function paintRank(wrap, item) {
  const filled = item.subIds.filter(id => S.answers.has(id)).length;
  const hint = wrap.querySelector(".rankhint");
  const n = item.actors.length;
  hint.className = "rankhint";
  hint.textContent = filled === n
    ? "Thank you."
    : `Give each row a different position, 1 to ${n}. ${n - filled} still to place.`;
}

/* ---------------------------------------------------------------- answers */

function setAnswer(id, value, node) {
  const prev = S.answers.get(id);
  S.answers.set(id, {
    num: value.num,
    text: value.text,
    at: new Date().toISOString(),
    latencyMs: S.pageEnteredAt ? Date.now() - S.pageEnteredAt : null,
    revisions: (prev && !prev.restored && prev.num !== value.num) ? (prev.revisions ?? 0) + 1 : (prev?.revisions ?? 0)
  });
  node?.classList?.remove("missing");
  updateNext();
}

/* ---------------------------------------------------------------- video gate */

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
  if (!YT_READY || !window.YT?.Player) return;      // retried from onYouTubeIframeAPIReady
  const host = document.getElementById(`yt_${page.key}`);
  if (!host || host.dataset.mounted) return;
  host.dataset.mounted = "1";

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
          /* Reporting "ended" is not enough on its own: dragging the scrubber to
             the last second would pass. The wall clock since first play must
             also cover most of the clip. */
          const passed = elapsed >= dur * S.plan.gateFraction;
          if (passed && !g.done) { g.done = true; logVideo(page, "gate_open", { watchS: elapsed }); }
          logVideo(page, "ended", { positionS: at, watchS: elapsed });
        }
        paintGate(page);
      }
    }
  });
  paintGate(page);
}

const videoQueue = [];
function logVideo(page, event, extra = {}) {
  videoQueue.push({
    segment: page.segment,
    segPosition: page.segPosition,
    videoId: page.video.id,
    event,
    at: new Date().toISOString(),
    ...extra
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
    txt.textContent = "Thank you. Please answer the questions below.";
  } else if (g.error != null) {
    gate.classList.add("err");
    qs.classList.add("locked");
    txt.textContent = "The video could not be loaded. Please check your connection and reload this page. " +
                      "Your answers so far are saved.";
  } else {
    qs.classList.add("locked");
    txt.textContent = (g.started && g.watch)
      ? "It looks like part of the interaction was skipped. Please play it through before answering."
      : "Please watch the whole interaction. The questions below open when it has finished.";
  }
  updateNext();
}

/* ---------------------------------------------------- required-item checks */

function requiredIds(page) {
  const ids = [];
  const walk = it => {
    if (it.type === "matrix") return it.rows.forEach(walk);
    if (it.type === "rank")   return ids.push(...it.subIds);
    if (it.required !== false) ids.push(it.id);
  };
  page.items.forEach(walk);
  return ids;
}

function missingOn(page) {
  return requiredIds(page).filter(id => !S.answers.has(id));
}

function gateClosed(page) {
  return page.kind === "segment" && !S.gates[page.segment]?.done;
}

function updateNext() {
  const page = S.plan.pages[S.page];
  if (page.kind === "debrief") return;
  const miss = missingOn(page);
  const shut = gateClosed(page);
  nextBtn.disabled = shut || miss.length > 0;
  warnEl.textContent = shut
    ? "Please watch the clip first"
    : miss.length
      ? `${miss.length} ${miss.length === 1 ? "item" : "items"} still to answer`
      : "";
}

/* ---------------------------------------------------------------- navigation */

nextBtn.addEventListener("click", () => {
  const page = S.plan.pages[S.page];
  const miss = missingOn(page);
  if (gateClosed(page) || miss.length) {
    markMissing(miss);
    updateNext();
    return;
  }

  /* Screen-out: E1/E2/E3 answered No. The answer itself is saved first, so the
     record shows why the person left. */
  const trip = page.items.find(it => it.screenOut && S.answers.get(it.id)
                                     && it.screenOut.includes(S.answers.get(it.id).num));
  savePage(page, trip ? null : S.plan.pages[S.page + 1]);

  if (trip) {
    post("/api/screen-out", { reason: trip.screenOutReason }).catch(() => {});
    S.done = true;
    return terminal("Thank you for your interest",
      "Unfortunately you are not eligible to take part in this study. You may now close this page. " +
      "Nothing further is needed from you.");
  }

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
  const ids = new Set(requiredIds(page));
  page.items.forEach(it => { if (it.type !== "matrix" && it.type !== "rank") ids.add(it.id); });

  const answers = [];
  for (const id of ids) {
    const a = S.answers.get(id);
    if (!a || a.restored) continue;      // restored values are already in the database
    answers.push({ id, num: a.num, text: a.text, at: a.at, latencyMs: a.latencyMs, revisions: a.revisions });
  }

  const now = Date.now();
  enqueue("/api/save", {
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

async function submit(btn) {
  btn.disabled = true;
  btn.textContent = "Submitting…";

  /* The queue must land before the completion call, or the server would compute
     the quality flags from an incomplete record. */
  await flush();
  for (let i = 0; i < 8 && pendingCount(); i++) {
    await new Promise(r => setTimeout(r, 700 * (i + 1)));
    await flush();
  }

  if (pendingCount()) {
    btn.disabled = false;
    btn.textContent = "Try again";
    saveBar.className = "savebar show bad";
    saveBar.textContent = "Some answers have not reached us yet. Please check your connection and press the button again.";
    return;
  }

  try {
    const res = await post("/api/complete", { finishedAt: new Date().toISOString() });
    S.done = true;
    store.clearToken();
    completionPage(res.completionCode, res.redirectUrl, false);
  } catch {
    btn.disabled = false;
    btn.textContent = "Try again";
    saveBar.className = "savebar show bad";
    saveBar.textContent = "We could not record your completion. Please press the button again.";
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

function completionPage(code, redirectUrl, alreadyDone) {
  navEl.hidden = true;
  saveBar.className = "savebar";
  pageEl.innerHTML = "";
  pageEl.append(el("p", "eyebrow", "Complete"));
  pageEl.append(el("h2", "qtitle", alreadyDone ? "You have already completed this study" : "Thank you for taking part"));

  const wrap = el("div", "centered");
  wrap.append(el("p", "qintro", "Your completion code is"));
  wrap.append(el("div", "bigcode", esc(code)));
  wrap.append(el("p", "hint", "Copy this code into the study platform to confirm your participation."));
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
      "You will be returned automatically in a few seconds. If nothing happens, use the button above."));
    setTimeout(() => { location.href = redirectUrl; }, 6000);
  }
  barEl.style.width = "100%";
}

/* --------------------------------------------------- control-arrangement diagram
   Same frame, same node size and position in all three arrangements. Only the
   nodes present and the arrows between them differ. The controller profile is
   never carried by the picture — text only. */

function node(x, y, label, sub, kind) {
  const gx = x + 16, gy = y + (kind === "ai" ? 14 : 13);
  let glyph;
  if (kind === "human") {
    glyph = `<circle cx="${gx + 12}" cy="${gy + 9}" r="6.5" fill="none" stroke="#171A1F" stroke-width="1.4"/>
             <path d="M ${gx + 1} ${gy + 29} a 11 11 0 0 1 22 0" fill="none" stroke="#171A1F" stroke-width="1.4"/>`;
  } else if (kind === "ai") {
    glyph = `<rect x="${gx + 2}" y="${gy + 3}" width="20" height="20" rx="4.5" fill="none" stroke="#5C6674" stroke-width="1.4"/>
             <circle cx="${gx + 8}"  cy="${gy + 9}"  r="1.7" fill="#5C6674"/>
             <circle cx="${gx + 16}" cy="${gy + 9}"  r="1.7" fill="#5C6674"/>
             <circle cx="${gx + 8}"  cy="${gy + 17}" r="1.7" fill="#5C6674"/>
             <circle cx="${gx + 16}" cy="${gy + 17}" r="1.7" fill="#5C6674"/>`;
  } else {
    glyph = `<rect x="${gx + 2}" y="${gy + 2}" width="20" height="16" rx="5" fill="none" stroke="#171A1F" stroke-width="1.4"/>
             <circle cx="${gx + 8}"  cy="${gy + 9}" r="1.7" fill="#171A1F"/>
             <circle cx="${gx + 16}" cy="${gy + 9}" r="1.7" fill="#171A1F"/>
             <path d="M ${gx + 12} ${gy + 18} v 6 M ${gx + 5} ${gy + 29} h 14" fill="none" stroke="#171A1F" stroke-width="1.4"/>`;
  }
  return `<g>
    <rect x="${x}" y="${y}" width="176" height="58" rx="5" fill="#FFFFFF"
          stroke="${kind === "ai" ? "#5C6674" : "#171A1F"}" stroke-width="1.4"/>
    ${glyph}
    <text x="${x + 54}" y="${y + 27}" font-size="14.5" fill="#171A1F" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">${label}</text>
    <text x="${x + 54}" y="${y + 43}" font-size="9.5" letter-spacing="1.1" fill="#7A828F" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">${sub}</text>
  </g>`;
}

function diagram(ctrl) {
  const LEFT = 44, ROW = 100, RIGHT = 372, TOP = 12;
  let inner = ctrl === "A"
    ? node(LEFT, ROW, "AI system", "NO HUMAN PILOT", "ai")
    : node(LEFT, ROW, "Human pilot", "TRAINED PERSON", "human");
  inner += node(RIGHT, ROW, "OriHime", "AVATAR ROBOT", "robot");
  inner += `<line x1="228" y1="129" x2="362" y2="129" stroke="#171A1F" stroke-width="1.6" marker-end="url(#arw)"/>
            <text x="295" y="120" text-anchor="middle" font-size="11" fill="#565E6B"
                  font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">controls</text>`;
  if (ctrl === "HA") {
    inner += node(LEFT, TOP, "AI assistance", "SUGGESTS ONLY", "ai");
    inner += `<line x1="132" y1="72" x2="132" y2="94" stroke="#5C6674" stroke-width="1.5"
                    stroke-dasharray="4 3" marker-end="url(#arwd)"/>
              <text x="146" y="88" font-size="11" fill="#565E6B"
                    font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">suggests</text>`;
  }
  const box = el("div", "diagram");
  box.innerHTML = `<svg viewBox="0 0 592 176" role="img" aria-label="Diagram of the control arrangement">
    <defs>
      <marker id="arw" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#171A1F"/></marker>
      <marker id="arwd" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="#5C6674"/></marker>
    </defs>${inner}</svg>`;
  return box;
}

/* Test hook. Exposing the module's own state costs a participant nothing —
   everything here is already theirs — and lets scripts/browser-test.mjs drive
   the real page instead of a mock of it. */
window.__t = { S, paintGate, render, updateNext };

/* ---------------------------------------------------------------- go */

fetch("/api/config").then(r => r.json()).then(cfg => {
  if (cfg.contactEmail) window.__STUDY_CONTACT__ = cfg.contactEmail;
}).catch(() => {}).finally(boot);
