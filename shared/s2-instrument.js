/* =============================================================================
   Study 2 — "Who is controlling OriHime?"  ·  instrument definition
   -----------------------------------------------------------------------------
   A perception study on a fresh sample. Nobody is told how OriHime is
   controlled: page one says only that there are three ways it can be, and each
   of the three clips is followed by the same three questions — an open
   description, who the participant thinks is controlling the robot, and
   whether a person involved is thought to have a disability.

   Five pages: intro (information, about OriHime, consent) · three clips ·
   finish. The only thing randomised is the order of the clips, balanced across
   the same six permutations Study 1 uses.

   Same rules as shared/instrument.js: item ids are the contract with the
   database and are frozen once collection starts; the browser renders the plan
   the server sends it; the server validates every answer against this file.
   ========================================================================== */

import { SEGMENTS, ORDERS, ORDER_KEYS, DURATION, GATE_FRACTION } from "./instrument.js";

export const S2_VERSION = "s2-v1";

/* The clips, the orders and the gate rule are the same materials as Study 1,
   so they are read from there rather than copied: a new cut of a clip changes
   the id in one place. */
export const S2_ORDERS = ORDERS;
export const S2_ORDER_KEYS = ORDER_KEYS;
export const S2_GATE_FRACTION = GATE_FRACTION;
export const S2_SEGMENT_KEYS = ["REL", "ADV", "COL"];
export const S2_CLIPS = Object.fromEntries(
  S2_SEGMENT_KEYS.map(s => [s, { yt: SEGMENTS[s].yt, duration: DURATION[s] }])
);

/* ---------------------------------------------------------------- wording */

/* The three ways OriHime can be controlled, as described on page one. Written
   to match the framing text of Study 1's three control conditions, so the two
   studies describe the same arrangements in the same terms. Which of them
   applies to a clip is never said. */
export const S2_CONTROL_METHODS = [
  {
    key: "H",
    label: "A human operator",
    text: "A trained person controls OriHime in real time and chooses what it says and does. No AI system is involved."
  },
  {
    key: "HA",
    label: "A human operator with AI assistance",
    text: "An AI system can suggest wording or movements, but a trained person accepts, changes or rejects the suggestions and makes the final decisions."
  },
  {
    key: "A",
    label: "An AI system",
    text: "There is no human operator. The AI system generates OriHime’s responses and controls its movements in real time."
  }
];

export const S2_ABOUT = {
  head: "About OriHime",
  intro: "OriHime is a robot that communicates through speech, head movements, and gestures. In the clips you will see, OriHime is talking with a person in an office.",
  methodsLead: "OriHime can be controlled in one of **three ways**:",
  /* Accurate as written: nothing here claims that the clips differ, only that
     the control arrangement is not disclosed. */
  after: "**We will not tell you how OriHime is controlled in the clips you are about to see.** There are no right or wrong answers: we are interested in your own impression of what you see and hear."
};

/* The information sheet. Same headed-section shape as Study 1's INFO_PAGE, so
   the same renderer conventions apply: a blank line starts a paragraph,
   **double asterisks** set bold, {contact} is filled from the deployment. */
export const S2_INFO = {
  lede: "Thank you for your interest in this study. Please read this page before deciding whether to take part.",
  sections: [
    {
      key: "what",
      heading: "What you will do",
      body:
        "You will watch **three short video clips** of a person talking with a robot called OriHime, and answer three questions about each clip.\n\n" +
        "It takes about **10–15 minutes**, and you will need **sound**."
    },
    {
      key: "who",
      heading: "Who is running this study",
      body: "This research is carried out at the **Keio University Graduate School of Media Design**."
    },
    {
      key: "data",
      heading: "Your data",
      body:
        "We record your answers, how long each page took, and whether each clip played through, together with the participant number your recruitment platform gives us. **We do not record your name, and we do not store your IP address.**\n\n" +
        "Responses are held on a secured server during collection and kept on access-controlled Keio University storage afterwards, reachable only by the authorised researchers. They are retained until **31 August 2036**, then deleted or irreversibly anonymised.\n\n" +
        "Results are reported in aggregate, and the responses may be shared as an anonymous dataset alongside a published paper. Your written descriptions may be quoted in publications; they carry no name."
    },
    {
      key: "voluntary",
      heading: "Taking part is voluntary",
      body:
        "You can close the page at any time, without giving a reason and without penalty.\n\n" +
        "At the end you receive a completion code. If you later want your responses removed, send us that code and we will delete them."
    },
    {
      key: "questions",
      heading: "Questions",
      requires: "contact",
      body: "You can contact the researcher at **{contact}**."
    }
  ]
};

/* Shown on the last page, after the answers are in. It explains the one thing
   that was withheld and nothing more. */
export const S2_DEBRIEF = [
  "In this study we did not say how OriHime was controlled in each clip, because we wanted to learn what impression the interaction itself gives. Every participant saw the same three clips, in a random order.",
  "Your answers have been recorded. Thank you for taking part."
];

/* Restated directly above the control question, and not earlier: the open
   description comes first so that it is not shaped by the list. */
export const S2_REMINDER =
  "OriHime may be controlled by a human operator, by a human operator with AI assistance, or entirely by an AI system. We have not said which applies to this clip.";

/* Item wording. The option order of WHO follows the order the three methods
   are introduced on page one. */
export const S2_ITEMS = {
  IMP: {
    stem: "What does the interaction in this video look like to you? Please describe it in your own words.",
    minLength: 10,
    maxLength: 2000
  },
  WHO: {
    stem: "Who do you think is controlling OriHime in this video?",
    options: [
      "A human operator, with no AI involved",
      "A human operator with AI assistance",
      "An AI system, with no human operator",
      "I can’t tell"
    ]
  },
  DIS: {
    stem: "If a person is involved in controlling OriHime in this video, do you think that person has a disability?",
    options: [
      "Yes",
      "No",
      "I can’t tell",
      "I don’t think a person is involved"
    ]
  }
};

/* ---------------------------------------------------------------- helpers */

const mc = (id, stem, options, extra = {}) =>
  ({ id, type: "mc", stem, options, required: true, ...extra });

/* Free text in a box that grows, not a one-line input: the open description is
   the richest thing this study collects. */
const longText = (id, stem, extra = {}) =>
  ({ id, type: "text", multiline: true, stem, required: true, ...extra });

/* Renders a panel of text and stores nothing. */
const note = text => ({ type: "note", text });

/* ---------------------------------------------------------------- the plan */

/**
 * Build the ordered page plan for one participant.
 * Pure: the same order always gives the same plan.
 * @param {string} order one of S2_ORDER_KEYS
 */
export function buildS2Plan(order) {
  const segOrder = S2_ORDERS[order];
  if (!segOrder) throw new Error(`unknown order: ${order}`);

  const pages = [];

  /* -- 1 · information, about OriHime, consent ------------------------------
     One page. The consent and eligibility items are the same three as Study 1
     and screen out for the same reasons, so the two flow diagrams read alike. */
  pages.push({
    key: "intro",
    kind: "info",
    eyebrow: "Before you begin",
    title: "About this study",
    info: { lede: S2_INFO.lede, sections: S2_INFO.sections.map(s => ({ ...s })) },
    about: {
      head: S2_ABOUT.head,
      intro: S2_ABOUT.intro,
      methodsLead: S2_ABOUT.methodsLead,
      methods: S2_CONTROL_METHODS.map(m => ({ label: m.label, text: m.text })),
      after: S2_ABOUT.after
    },
    consentIntro: "Please confirm all three before continuing.",
    items: [
      mc("E1", "Are you 18 years old or older?", ["Yes", "No"],
        { screenOut: [1], screenOutReason: "under_18" }),
      mc("E2", "I have read the study information and agree to take part.", ["Yes, I agree", "No"],
        { screenOut: [1], screenOutReason: "declined_consent" }),
      mc("E3", "Can you watch a short video with sound on your current device?", ["Yes", "No"],
        { screenOut: [1], screenOutReason: "no_video" })
    ]
  });

  /* -- 2–4 · the clips ----------------------------------------------------- */
  segOrder.forEach((seg, i) => {
    const pos = i + 1;
    const q = code => `${seg}_${code}`;
    const meta = { segment: seg, segPosition: pos };
    pages.push({
      key: `clip_${pos}`,
      kind: "segment",
      eyebrow: `Video ${pos} of 3`,
      title: `Video ${pos}`,
      segment: seg,
      segPosition: pos,
      video: { id: S2_CLIPS[seg].yt, duration: S2_CLIPS[seg].duration },
      items: [
        longText(q("IMP"), S2_ITEMS.IMP.stem,
          { ...meta, minLength: S2_ITEMS.IMP.minLength, maxLength: S2_ITEMS.IMP.maxLength }),
        note(S2_REMINDER),
        mc(q("WHO"), S2_ITEMS.WHO.stem, S2_ITEMS.WHO.options, { ...meta, group: "who" }),
        mc(q("DIS"), S2_ITEMS.DIS.stem, S2_ITEMS.DIS.options, { ...meta, group: "disability" })
      ]
    });
  });

  /* -- 5 · finish -----------------------------------------------------------
     Reached only after the completion call has succeeded; carries the code. */
  pages.push({
    key: "finish",
    kind: "finish",
    eyebrow: "Complete",
    title: "Thank you for taking part",
    debrief: [...S2_DEBRIEF],
    items: []
  });

  return { order, segOrder, pages };
}

/* ---------------------------------------------------------------- derived */

/** Flatten a plan into the ordered list of stored items (one per DB row). */
export function s2PlanItems(plan) {
  const out = [];
  for (const page of plan.pages) {
    for (const it of page.items) {
      if (it.type === "note") continue;
      out.push({
        id: it.id,
        type: it.type,
        pageKey: page.key,
        segment: it.segment ?? null,
        segPosition: it.segPosition ?? null,
        stem: it.stem,
        options: it.options,
        required: it.required !== false,
        minLength: it.minLength,
        maxLength: it.maxLength,
        group: it.group,
        screenOut: it.screenOut,
        screenOutReason: it.screenOutReason
      });
    }
  }
  return out;
}

export function s2PlanIndex(plan) {
  const m = new Map();
  s2PlanItems(plan).forEach(it => m.set(it.id, it));
  return m;
}

/** Every item id that can appear, in a stable order, for the wide export. */
export function s2AllItemIds() {
  const seen = new Set();
  const ordered = [];
  for (const order of S2_ORDER_KEYS) {
    for (const it of s2PlanItems(buildS2Plan(order))) {
      if (!seen.has(it.id)) { seen.add(it.id); ordered.push(it.id); }
    }
  }
  const segRank = { REL: 0, ADV: 1, COL: 2 };
  const codeRank = { IMP: 0, WHO: 1, DIS: 2 };
  const rank = id => {
    if (/^E\d/.test(id)) return [0, 0, id];
    const [seg, code] = id.split("_");
    return [1, (segRank[seg] ?? 9) * 10 + (codeRank[code] ?? 9), id];
  };
  return ordered.sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
  });
}

/** The six allocation cells: one per clip order. */
export function s2AllCells() {
  return S2_ORDER_KEYS.map(order => ({ cell: order, seg_order: order }));
}

/* ---------------------------------------------------------------------------
   publicS2Plan — what the browser is sent. Nothing here is secret (there are
   no answer keys in this study), but the shape is fixed here rather than by
   whatever buildS2Plan happens to return, so the client cannot come to depend
   on a server-side field by accident.
--------------------------------------------------------------------------- */
export function publicS2Plan(plan) {
  const stripItem = it => {
    if (it.type === "note") return { type: "note", text: it.text };
    const out = { id: it.id, type: it.type, stem: it.stem, required: it.required !== false };
    if (it.multiline) out.multiline = true;
    if (it.options) out.options = it.options;
    if (it.minLength != null) out.minLength = it.minLength;
    if (it.maxLength != null) out.maxLength = it.maxLength;
    if (it.screenOut) { out.screenOut = it.screenOut; out.screenOutReason = it.screenOutReason; }
    return out;
  };
  return {
    instrumentVersion: S2_VERSION,
    gateFraction: S2_GATE_FRACTION,
    pages: plan.pages.map(p => ({
      key: p.key,
      kind: p.kind,
      eyebrow: p.eyebrow,
      title: p.title,
      info: p.info ?? null,
      about: p.about ?? null,
      consentIntro: p.consentIntro ?? null,
      debrief: p.debrief ?? null,
      segment: p.segment ?? null,
      segPosition: p.segPosition ?? null,
      video: p.video ?? null,
      items: p.items.map(stripItem)
    }))
  };
}
