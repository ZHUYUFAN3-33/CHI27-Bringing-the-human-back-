/* ---------------------------------------------------------------------------
   Study 1 — participant runtime.

   This file renders a plan it is handed by the server and records what the
   participant does with it. It contains no design logic: the condition, the
   segment order and the framing text all arrive over the wire, already
   resolved for this one participant.
--------------------------------------------------------------------------- */

import { store, post, enqueue, flush, clearQueue, onStatus, pendingCount } from "/net.js";

/* ------------------------------------------------------------------ state */

const S = {
  plan: null,
  completion: null,
  page: 0,
  answers: new Map(),     // itemId -> {num, text, at, latencyMs, revisions}
  gates: {},              // segment -> {started, watch, done, error}
  pageEnteredAt: null,
  visits: new Map(),      // pageKey -> visit number
  done: false,
  preview: false,         // researcher view: renders, never records
  design: null,           // preview only: which cell is on screen
  keys: null              // preview only: the answer keys publicPlan strips
};

const $  = sel => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* **bold** and ***bold italic*** for the framing text and for the few
   stems that lean on a word. Escaping runs first, so the only markup that
   can ever reach the page is the <strong> put there on the next line — a stem
   containing a literal <b> is still shown as text. */
const md = s => esc(s)
  .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

/* Where a sentence came from, so /preview can offer to edit the one that was
   clicked. A no-op for participants: they get the same DOM they always did,
   and the researcher view is the only thing that ever reads these. Marking the
   node here rather than matching text in the preview is the difference between
   knowing which sentence this is and guessing — two items can share wording.

   `tag` returns the node so it can wrap an append in place. */
const tag = (node, path) => {
  if (S.preview && node?.dataset) node.dataset.path = path;
  return node;
};

/* The information page carries the consent document, which is written as plain
   text so that the person who has to keep it matching the ethics approval can
   edit it. A blank line starts a paragraph, **double asterisks** set bold, and
   {funding} / {contact} carry whatever this deployment is configured with.
   Substitution happens before md(), so md() escapes the substituted value too:
   a funder name is text, never markup. */
const fillTokens = s => String(s ?? "").replace(/\{(funding|contact)\}/g, (_m, key) =>
  (key === "funding" ? window.__STUDY_FUNDING__ : window.__STUDY_CONTACT__) ?? "");

const paragraphs = s => fillTokens(s).split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);

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
  if (window.__PREVIEW__) return bootPreview();

  const params = Object.fromEntries(new URLSearchParams(location.search));
  let session;

  try {
    if (store.token) {
      /* The platform identifiers travel with the resume too. A row that was
         opened without them — the query string stripped by an in-app browser,
         or the link pasted by hand — picks them up the first time the
         participant arrives through the platform proper. */
      session = await post("/api/session/resume", { params }).catch(() => null);
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
      /* A fresh session means any save still queued from before belongs to a
         token this browser no longer holds. It cannot be delivered, and left
         in place it would sit at the head of the queue returning 401 forever,
         holding every later page behind it. */
      if (!session.resumed) clearQueue();
      store.token = session.token;
      /* A start that handed back an existing row — our token was still valid
         on the server, or the platform id matched a row from another device —
         carries the design but not the answers. Fetch them, so a rejoin puts
         the participant back exactly where a refresh would. */
      if (session.resumed) session = await post("/api/session/resume", { params }).catch(() => session);
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

/* ---------------------------------------------------------------- preview
   The researcher view is this same runtime pointed at a chosen cell instead of
   an allocated one. Nothing about the questionnaire is re-implemented here, so
   a change to the instrument shows up in the preview by construction — the old
   preview was a second copy of the wording and could only ever agree with the
   study by hand. Nothing is written: no participant row, no allocation slot. */

async function bootPreview() {
  S.preview = true;
  navEl.hidden = false;
  await previewLoad(window.__PREVIEW__.cell ?? {});
}

async function previewLoad({ condition = "H1", order = "O1", optional = true, stage = "draft" } = {},
                           { keepPage = false } = {}) {
  const qs = new URLSearchParams({ condition, order, optional: optional ? "1" : "0", stage });
  let data;
  try {
    const res = await fetch(`/api/admin/preview-plan?${qs}`, {
      headers: { authorization: `Bearer ${window.__PREVIEW__.token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    return terminal("The preview could not load",
      `${err.message}. Check that the admin token in the address bar is current.`);
  }

  /* Where the reviewer was, so that saving a sentence does not throw them back
     to page one of fourteen every time. */
  const was = keepPage ? S.page : 0;

  S.plan = data.plan;
  S.design = data.design;
  S.keys = new Map(data.keys.map(k => [k.id, k]));
  S.completion = { code: "PREVIEW", redirectUrl: null, platform: "preview" };
  S.answers.clear();
  S.gates = {};
  /* Clips are playable but never gate the page. */
  S.plan.pages.filter(p => p.kind === "segment").forEach(p => {
    S.gates[p.segment] = { started: null, watch: 0, done: true, error: null };
  });
  S.page = Math.min(was, S.plan.pages.length - 1);
  window.__PREVIEW__.onLoaded?.(data);
  render();
}

/* The control bar in preview.html drives the runtime through these. */
window.__previewLoad = previewLoad;
window.__previewGoto = i => { S.page = Math.max(0, Math.min(i, S.plan.pages.length - 1)); render(); };

/* ---------------------------------------------------------------- render */

function render() {
  const p = S.plan.pages[S.page];
  S.pageEnteredAt = Date.now();
  S.visits.set(p.key, (S.visits.get(p.key) ?? 0) + 1);

  pageEl.innerHTML = "";
  pageEl.append(el("p", "eyebrow", esc(p.eyebrow ?? "")));
  pageEl.append(tag(el("h2", "qtitle", esc(p.title)), `page.${p.key}.title`));
  if (p.intro) pageEl.append(tag(el("p", "qintro", esc(p.intro)), `page.${p.key}.intro`));

  if (p.kind === "info")       renderInfo(p);
  if (p.kind === "disclosure") renderDisclosure(p);
  if (p.kind === "segment")    renderSegment(p);
  if (p.kind === "debrief")    { renderDebrief(p); painted(p); return; }

  if (p.matrixInstruction) {
    pageEl.append(tag(el("p", "minstr", esc(p.matrixInstruction)), `page.${p.key}.matrixInstruction`));
  }
  p.items.forEach(item => pageEl.append(renderItem(item, p)));

  barEl.style.width = (S.page / (S.plan.pages.length - 1) * 100) + "%";
  posEl.textContent = `Page ${S.page + 1} of ${S.plan.pages.length}`;
  if (S.preview) window.__PREVIEW__.onPage?.(S.page, S.plan.pages[S.page]);
  backBtn.disabled = S.page === 0 || !!p.noBack;
  backBtn.style.visibility = p.noBack ? "hidden" : "visible";
  nextBtn.textContent = S.page === S.plan.pages.length - 2 ? "Submit" : "Next";
  nextBtn.hidden = false;
  scrollTo({ top: 0, behavior: "instant" });
  updateNext();
  painted(p);
}

/* The page is on screen and every data-path is in place. /preview repaints its
   edit affordances from here rather than guessing when a render finished. */
function painted(page) {
  if (S.preview) window.__PREVIEW__.onRender?.(S.page, page);
}

/* The information page is the consent document. It is set as headed sections
   rather than one column of bolded lead-ins, because it is read by someone
   deciding whether to take part and they should be able to find "can I stop"
   without reading the paragraph above it.

   The text arrives in the plan rather than living here. It is the one page an
   ethics committee actually approves and the one page most likely to need
   changing at short notice, and it used to be a wall of template literals in
   this file — which meant a comma in the retention sentence was a code change
   and a deploy. It is now editable from /preview like everything else.

   A section that names a `requires` key is dropped when that value is not
   configured, so an unset STUDY_FUNDING leaves the funding section out rather
   than printing an empty sentence on a consent form. */
function renderInfo(p) {
  const box = el("div", "disclosure infosheet");
  if (!p.info) { pageEl.append(box); return; }

  if (p.info.lede) {
    box.append(tag(el("p", "lede", md(fillTokens(p.info.lede))), "info.lede"));
  }

  const configured = { funding: window.__STUDY_FUNDING__, contact: window.__STUDY_CONTACT__ };

  p.info.sections.forEach(s => {
    if (s.requires && !configured[s.requires]) return;
    const sec = el("section");
    sec.append(tag(el("h3", null, esc(fillTokens(s.heading))), `info.${s.key}.heading`));
    /* Every paragraph carries the same path: they are one editable block of
       text, split on blank lines only when it reaches the page. */
    paragraphs(s.body).forEach(para =>
      sec.append(tag(el("p", null, md(para)), `info.${s.key}.body`)));
    box.append(sec);
  });

  pageEl.append(box);
}

function renderDisclosure(p) {
  const d = p.disclosure;
  const card = el("div", "disclosure");

  /* Which framing text this is depends on the cell, and publicPlan does not
     tell the browser which cell it is in — deliberately: a participant who
     opens devtools sees the study they are actually taking and not the other
     six. The preview knows, because preview-plan says so, and tag() only ever
     runs there. `who` follows the same rule the runtime uses. */
  const ctrl = S.design?.ctrl;
  const who = ctrl === "A" ? "ai" : "human";

  card.append(tag(el("p", null, esc(d.intro)), "text.intro"));

  /* Same photo, same place, in all seven conditions: it shows what OriHime is
     before the control-source text says who operates it. Sized attributes match
     the file so the text below does not shift when it loads. */
  const fig = el("figure", "photo");
  fig.innerHTML =
    '<img src="/orihime.jpg" width="1600" height="899" alt="OriHime, a small white tabletop robot, on a table beside a seated person">';
  card.append(fig);

  card.append(tag(el("p", null, md(d.control)), `text.control.${ctrl}`));

  /* The profile is the second manipulation and gets its own line here, between
     the control text and the diagram. It used to be the third of four bullets
     inside the persona box, where it read as one more fact about a stranger. */
  if (d.profile) {
    card.append(tag(el("p", "profileline", md(d.profile)), `text.profile.${S.design?.profile}`));
  }

  card.append(diagram(d.arrangement));

  const persona = el("div", "persona");
  persona.append(tag(el("h4", null, esc(d.personaHead)), `text.personaHead.${who}`));
  const ul = el("ul");
  d.personaLines.forEach((line, n) =>
    ul.append(tag(el("li", null, md(line.text)), `text.persona.${who}.${n}`)));
  persona.append(ul);
  card.append(persona);
  pageEl.append(card);
}

/* The two manipulations, restated between each clip and its questions.

   Built from the disclosure page's own strings rather than from a second copy,
   so a wording override published from /preview reaches the reminder too and
   the two can never drift. Only the control text and the profile line come
   across: the photo, the diagram and the persona box would push the player off
   a phone's first screen, and they are not the manipulation.

   The disclosure page is still where the condition is introduced. This is a
   reminder of what was already said, which is why it carries no heading, and
   it sits last so that it is the final thing read before the first answer. */
function conditionRecap() {
  const d = S.plan.pages.find(pg => pg.kind === "disclosure")?.disclosure;
  if (!d) return null;
  const box = el("div", "recap");
  box.append(tag(el("p", null, md(d.control)), `text.control.${S.design?.ctrl}`));
  if (d.profile) {
    box.append(tag(el("p", "recap-profile", md(d.profile)), `text.profile.${S.design?.profile}`));
  }
  return box;
}

function renderSegment(p) {
  /* The IFrame API replaces the element it is handed, and the replacement
     carries width/height attributes that beat aspect-ratio — which pinned the
     player to 360px tall at every screen size, so a phone got a nearly square
     box with the 16:9 clip letterboxed inside it. Handing the API a bare inner
     div keeps the sized wrapper, and .video iframe finally has something to
     match. */
  const shell = el("div", "video");
  shell.id = `ytbox_${p.key}`;
  const mount = el("div");
  mount.id = `yt_${p.key}`;
  shell.append(mount);
  pageEl.append(shell);

  const gate = el("div", "gate");
  gate.id = `gate_${p.key}`;
  gate.innerHTML = `<span class="pip"></span><span id="gatetxt_${p.key}">Please watch the whole interaction. The questions below open when it has finished.</span>`;
  pageEl.append(gate);

  const recap = conditionRecap();
  if (recap) pageEl.append(recap);

  const wrap = el("div", "locked");
  wrap.id = `qs_${p.key}`;
  pageEl.append(wrap);
  queueMicrotask(() => mountPlayer(p));
}

function renderDebrief(p) {
  const box = el("div", "disclosure");
  box.innerHTML = `
    <p>In this study, the description of who or what controlled OriHime, and the description of the operator, were
       experimentally varied between participants, while the videos themselves were identical for everyone.</p>
    <p>The study examines how information about control and operator characteristics shapes judgments.
       It does not test whether any disability group is more or less capable.</p>`;
  pageEl.append(box);

  /* render() returns early for this page, so anything the debrief page carries
     is rendered here or not at all. */
  p.items.forEach(item => pageEl.append(renderItem(item, p)));

  const btn = el("button", "btn wide", "Submit and finish");
  btn.id = "submitbtn";
  btn.type = "button";
  btn.addEventListener("click", () => submit(btn), { once: false });
  pageEl.append(btn);
  const note = el("p", "hint",
    "Your answers are saved as you go. Pressing this button records your completion and gives you your code.");
  note.id = "submitnote";
  pageEl.append(note);

  navEl.hidden = true;
  barEl.style.width = "100%";
  updateNext();
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
    case "heading": return headingBlock(item);
    case "matrix": return matrixBlock(item);
    case "rank":   return rankBlock(item);
    case "likert7":return matrixBlock({ instruction: null, rows: [item] });
    case "mc":     return mcBlock(item);
    case "select": return selectBlock(item);
    case "number":
    case "text":   return textBlock(item);
    default:       return el("div");
  }
}

/* -- Likert matrix ------------------------------------------------------- */

/* The seam where a second section starts inside one page. Same three elements
   a page header uses, so Background opens the way every other section does.
   Untagged on purpose: this is structure, not instrument wording, and /preview
   only knows how to publish paths the instrument actually carries. */
function headingBlock(item) {
  const wrap = el("div", "sectionbreak");
  if (item.eyebrow) wrap.append(el("p", "eyebrow", esc(item.eyebrow)));
  wrap.append(el("h2", "qtitle", esc(item.title)));
  if (item.intro) wrap.append(el("p", "qintro", esc(item.intro)));
  return wrap;
}

function matrixBlock(block) {
  const wrap = el("div", "matrix-q");
  if (block.instruction) {
    /* A lone likert7 is rendered as a one-row matrix and has no block id, so
       there is nothing to address in that case — and no instruction either. */
    const instr = el("p", "minstr", esc(block.instruction));
    wrap.append(block.id ? tag(instr, `item.${block.id}.instruction`) : instr);
  }

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
    /* md(), not esc(): escaping still runs first, so the only markup that can
       reach the cell is the emphasis md() puts there. No stem carried ** until
       the believability item, which needs it. */
    tr.append(tag(el("td", "stemcell", md(row.stem) + '<span class="req">*</span>'),
      `item.${row.id}.stem`));
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
  wrap.append(tag(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")),
    `item.${item.id}.stem`));
  const opts = el("div", "opts");
  item.options.forEach((label, i) => {
    const l = el("label", "opt");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = item.id;
    input.value = i;
    if (S.answers.get(item.id)?.num === i) input.checked = true;
    input.addEventListener("change", () => setAnswer(item.id, { num: i, text: label }, wrap));
    l.append(input, tag(el("span", null, esc(label)), `item.${item.id}.option.${i}`));
    opts.append(l);
  });
  wrap.append(opts);
  return wrap;
}

/* -- dropdown -------------------------------------------------------------
   For option sets too long to stack as radios — the country list is 255 rows.
   The stored value is the option's own key, not its position, so the list can
   be reordered later without changing what an earlier answer means. */

function selectBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.item = item.id;
  wrap.append(tag(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")),
    `item.${item.id}.stem`));

  const sel = document.createElement("select");
  sel.name = item.id;
  sel.setAttribute("aria-label", item.stem);

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = item.placeholder ?? "Select one";
  sel.append(blank);

  item.options.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    sel.append(opt);
  });

  sel.value = S.answers.get(item.id)?.text ?? "";
  sel.addEventListener("change", () => {
    if (!sel.value) { S.answers.delete(item.id); updateNext(); return; }
    setAnswer(item.id, { num: null, text: sel.value }, wrap);
  });

  wrap.append(sel);
  return wrap;
}

/* -- free text / number --------------------------------------------------- */

function textBlock(item) {
  const wrap = el("div", "q");
  wrap.dataset.item = item.id;
  wrap.append(tag(el("p", "stem", esc(item.stem) + (item.required ? '<span class="req">*</span>' : "")),
    `item.${item.id}.stem`));
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
  if (item.scenario) {
    wrap.append(tag(el("div", "scenario", esc(item.scenario)), `item.${item.id}.scenario`));
  }
  wrap.append(tag(el("p", "stem", esc(item.stem) + '<span class="req">*</span>'),
    `item.${item.id}.stem`));

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
  /* The mounted flag lives on the wrapper: the element the API is given does
     not survive the call, so a flag set on it would be lost. */
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
        /* The queue is only drained by a page turn, and this error is exactly
           what stops the participant turning the page. Send it now, or the one
           failure worth knowing about is the one that never reaches us. */
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
          /* Reporting "ended" is not enough on its own: dragging the scrubber to
             the last second would pass. The wall clock since first play must
             also cover most of the clip. */
          const passed = elapsed >= dur * S.plan.gateFraction;
          if (passed && !g.done) { g.done = true; logVideo(page, "gate_open", { watchS: elapsed }); }
          logVideo(page, "ended", { positionS: at, watchS: elapsed });
          /* Ship the evidence now rather than with the next page turn: a
             refresh here would otherwise lose gate_open, and the server would
             make the participant watch the whole clip again. */
          flushVideoQueue();
        }
        paintGate(page);
      }
    }
  });
  paintGate(page);
}

const videoQueue = [];

/* Normally the queue rides along with the next page save. When the gate is shut
   there may never be a next page, so this sends it on its own. */
function flushVideoQueue() {
  if (!videoQueue.length) return;
  enqueue("/api/save", { videoEvents: videoQueue.splice(0, videoQueue.length) });
}

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
    document.getElementById(`fb_${page.key}`)?.remove();
    txt.textContent = g.fallback
      ? "Thank you. Please answer the questions below about the interaction you watched."
      : "Thank you. Please answer the questions below.";
  } else if (g.error != null) {
    gate.classList.add("err");
    qs.classList.add("locked");
    txt.textContent = "The video could not be played here — an ad blocker or a network restriction is " +
                      "the usual cause. You can watch it on YouTube instead. Your answers so far are saved.";
    renderFallback(page);
  } else {
    qs.classList.add("locked");
    txt.textContent = (g.started && g.watch)
      ? "It looks like part of the interaction was skipped. Please play it through before answering."
      : "Please watch the whole interaction. The questions below open when it has finished.";
  }
  updateNext();
}

/* -- fallback when the embedded player will not run ------------------------
   Without this the participant is simply stuck: the gate never opens, Next
   stays disabled, and the only way out is to abandon the study — which reads
   in the data as an ordinary drop-out. The clip is offered on YouTube instead,
   and the confirmation unlocks only after the clip has had time to play, so a
   fallback watch still costs what a real watch costs. It is recorded as its own
   event, so these rows can be excluded from analysis if that is the call. */

function renderFallback(page) {
  const gate = document.getElementById(`gate_${page.key}`);
  if (!gate || document.getElementById(`fb_${page.key}`)) return;

  const g = S.gates[page.segment];
  const need = Math.round(page.video.duration * S.plan.gateFraction);

  const box = el("div", "fallback");
  box.id = `fb_${page.key}`;

  const link = el("a", "fblink", "Open the interaction on YouTube");
  link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(page.video.id)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const note = el("p", "fbnote");
  const btn = el("button", "btn fbbtn", "I have watched the whole interaction");
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
      ? `You can confirm in ${left}s, about as long as the interaction runs.`
      : "When you have watched the whole interaction, confirm below.";
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
    /* Also emitted under the name the resume query counts, or a refresh would
       lock the page again for someone who has already watched the clip. */
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

function requiredIds(page) {
  const ids = [];
  const walk = it => {
    if (it.type === "heading") return;
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
  /* A reviewer is reading the questionnaire, not taking it: the clip is there
     to play if they want it, but it never blocks the page. */
  if (S.preview) return false;
  return page.kind === "segment" && !S.gates[page.segment]?.done;
}

function updateNext() {
  const page = S.plan.pages[S.page];
  const miss = missingOn(page);

  /* The debrief page hides the nav strip and carries its own button, so that
     button is what has to hold the page until the question above it is
     answered — nothing else on this page can. */
  if (page.kind === "debrief") {
    const btn = document.getElementById("submitbtn");
    const note = document.getElementById("submitnote");
    const held = !S.preview && miss.length > 0;
    if (btn) btn.disabled = held;
    if (note && held) note.textContent = "Please answer the question above to finish.";
    else if (note) note.textContent =
      "Your answers are saved as you go. Pressing this button records your completion and gives you your code.";
    return;
  }

  const shut = gateClosed(page);
  nextBtn.disabled = !S.preview && (shut || miss.length > 0);
  warnEl.textContent = S.preview
    ? (miss.length ? `${miss.length} unanswered — not enforced in preview` : "")
    : shut
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
  if (S.preview) return;                 // a reviewer writes nothing to the study
  const ids = new Set(requiredIds(page));
  page.items.forEach(it => {
    if (it.type === "matrix" || it.type === "rank" || it.type === "heading") return;
    ids.add(it.id);
  });

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
  if (S.preview) {
    btn.disabled = true;
    btn.textContent = "Preview — nothing submitted";
    return;
  }
  const page = S.plan.pages[S.page];
  const miss = missingOn(page);
  if (miss.length) { markMissing(miss); updateNext(); return; }

  btn.disabled = true;
  btn.textContent = "Submitting…";

  /* This page has no Next, so nothing else ever saves it. Every page turn goes
     through savePage; the debrief was the one page that did not, and the
     follow-up question it carries — and, before it moved, the belief item —
     reached the database for nobody. The dwell on this page went with it. */
  savePage(page, null);

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
    /* The token is kept on purpose. If the platform redirect fails and the
       participant reloads, resume shows this same completion page with the
       same code; clearing the token here made a reload silently start a
       second session — a new row, a new slot, a new randomised condition. */
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

  /* With a redirect configured the platform records the completion itself, and
     the code is only there for the participant whose redirect does not fire.
     Telling everyone to copy a code they do not need is how a support inbox
     fills up. */
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
    /* The return is the participant's own click, not a timer. The page used to
       send itself to the platform after six seconds, which took the code off
       the screen before anyone could copy it and left a person whose return
       then failed with nothing to come back to. Naming the code as the
       fallback here is what keeps that person from leaving without being paid. */
    pageEl.append(el("p", "hint",
      "Press the button above to return to the study platform, which records your participation. " +
      "If the return does not work, enter the completion code above on the study platform instead — " +
      "your answers are already saved either way."));
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
    : node(LEFT, ROW, "Human operator", "TRAINED PERSON", "human");
  inner += node(RIGHT, ROW, "OriHime", "ROBOT", "robot");
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
  if (cfg.contact) window.__STUDY_CONTACT__ = cfg.contact;
  if (cfg.funding) window.__STUDY_FUNDING__ = cfg.funding;
}).catch(() => {}).finally(boot);
