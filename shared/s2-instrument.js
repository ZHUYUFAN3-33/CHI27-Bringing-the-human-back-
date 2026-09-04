/* =============================================================================
   Study 2 — "Who is controlling OriHime?"  ·  instrument definition
   -----------------------------------------------------------------------------
   A perception study on a fresh sample. Nobody is told how OriHime is
   controlled: page one says only that there are three ways it can be, and each
   of the three clips is followed by the same questions — an open description,
   two evaluation items carried over verbatim from Study 1, who the participant
   thinks is controlling the robot and how confident they are in that, and
   whether a person involved is thought to have a disability.

   Six pages: intro (information, about OriHime, consent) · three clips · a
   closing question with the background block · finish. The only thing
   randomised is the order of the clips, balanced across the same six
   permutations Study 1 uses.

   Same rules as shared/instrument.js: item ids are the contract with the
   database and are frozen once collection starts; the browser renders the plan
   the server sends it; the server validates every answer against this file.
   ========================================================================== */

import {
  SEGMENTS, ORDERS, ORDER_KEYS, DURATION, GATE_FRACTION,
  SCALE, FREQ, GENDER, GAAIS, ATTENTION_CHECK_VALUE
} from "./instrument.js";

export const S2_VERSION = "s2-v2";

/* The seven-point agreement scale, the frequency options and the GAAIS items
   are Study 1's, imported rather than restated: the two studies only compare
   if an answer of 6 means the same thing in both. */
export const S2_SCALE = SCALE;

/* The confidence scale. Seven points to match the agreement items, but named
   for confidence throughout rather than anchored only at the ends, so a stored
   value_text says what it means without a codebook lookup. */
export const S2_CONFIDENCE = [
  "Not at all confident", "Slightly confident", "Somewhat confident",
  "Moderately confident", "Quite confident", "Very confident", "Completely confident"
];

/* The five positive-subscale GAAIS items, asked at the end. Study 1 found
   attitude to AI moderating the AI-only penalty; here it is a candidate
   predictor of the tendency to infer an AI. Ids keep the original scale's
   numbering, so GAAIS_07 is item 7 in both studies. */
export const S2_GAAIS = GAAIS.filter(g => g.sub === "pos");

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
        "You will watch **three short video clips** of a person talking with a robot called OriHime, and answer a few questions about each clip. At the end there are some short questions about you.\n\n" +
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
    /* Thirty characters, not ten: ten lets “it was fine” through, and the open
       description is the only material the cue coding has to work with. */
    minLength: 30,
    maxLength: 2000
  },

  /* The two evaluation items are Study 1’s, word for word and on the same
     seven-point scale, so “do people who spontaneously read the controller as
     an AI also find the interaction less genuine” can be set beside Study 1’s
     C1 effect. Asked before the three control methods are restated, so the
     option list cannot steer them. */
  AU1: { stem: "This interaction felt genuine, rather than like the execution of a program." },
  OH2: { stem: "In this interaction, OriHime was useful for this task." },
  BLOCK_LEAD: "Please answer the following about the interaction you have just watched.",

  /* Instructed-response check, on the middle clip only, exactly where Study 1
     puts it. Its answer key never leaves the server. */
  AT1: { stem: "To show that you are reading carefully, please select “Disagree” for this item." },

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
  },

  /* Confidence is asked immediately after the judgement and before the reason:
     writing out a justification is known to inflate how sure people say they
     are, so the reason comes second. It separates a held impression from a
     shrug, which is what the “weak default” rule in the analysis plan needs. */
  CONF: { stem: "How confident are you in that judgement?" },

  /* Optional, and deliberately so: a required “why” turns into noise from the
     people who have no reason to give. */
  WHY: {
    stem: "What made you think so?",
    maxLength: 500
  },

  /* Only meaningful after “Yes” on DIS, but shown to everyone: the client has
     no conditional-display logic, and an optional box that most people leave
     empty costs less than the branching would. The wording carries the
     condition so it reads correctly to the people it does not apply to. */
  DIS_KIND: {
    stem: "If you answered “Yes” above, what kind of disability do you have in mind?",
    maxLength: 500
  }
};

/* Asked once at the end. Whether people think the three clips were controlled
   the same way is what tells a stable personal prior apart from a per-clip
   inference, which is the S2-Q5 reading. */
export const S2_CLOSING = {
  SAME: {
    stem: "Thinking about all three videos: do you think OriHime was controlled the same way in all of them?",
    options: [
      "Yes, the same way in all three",
      "No, different ways in different videos",
      "I can’t tell"
    ]
  }
};

/* The background block. Asked last, where it cannot colour the judgements, and
   kept to the four items that bear on this study plus the GAAIS positives.
   Ids match Study 1’s so the two samples can be described in the same terms. */
export const S2_BACKGROUND = {
  heading: "Background",
  lead: "These last few questions are about you. They are asked after the videos so they cannot affect your answers.",
  gaaisLead: "Finally, how much do you agree with each of these statements about artificial intelligence?",
  age: "What is your age in years?",
  gender: "What gender do you identify with?",
  freqAi: "How often do you use AI tools in your personal or professional life?",
  freqDisability: "How often do you see or interact with people with disabilities in your personal or professional life?"
};

/* ---------------------------------------------------------------- helpers */

const mc = (id, stem, options, extra = {}) =>
  ({ id, type: "mc", stem, options, required: true, ...extra });

/* Seven-point agreement, Study 1's scale. A lone likert7 renders as a one-row
   table; several of them share one table through matrix() below. */
const likert = (id, stem, extra = {}) =>
  ({ id, type: "likert7", stem, options: SCALE, required: true, ...extra });

/* Seven points again, but on its own labels: "strongly agree" is not an answer
   to "how confident are you". Every point is named rather than only the ends,
   so value_text is readable on its own in the export. */
const confidence = (id, stem, extra = {}) =>
  ({ id, type: "likert7", stem, options: S2_CONFIDENCE, required: true, ...extra });

const number = (id, stem, extra = {}) =>
  ({ id, type: "number", stem, required: true, ...extra });

/* One table, several rows, one shared instruction — the shape Study 1 uses for
   its item blocks. The block id is a name, not an answer: it stores nothing. */
const matrix = (id, instruction, rows, extra = {}) =>
  ({ id, type: "matrix", instruction, rows, ...extra });

/* Renders a seam and stores nothing. */
const heading = (eyebrow, title, text) =>
  ({ type: "heading", eyebrow, title, text });

/* Free text in a box that grows, not a one-line input: the open description is
   the richest thing this study collects. */
const longText = (id, stem, extra = {}) =>
  ({ id, type: "text", multiline: true, stem, required: true, ...extra });

/* The optional follow-ups. Not required, and with no minimum: an empty box is
   a legitimate answer and simply never reaches the database. */
const optionalText = (id, stem, extra = {}) =>
  ({ id, type: "text", multiline: true, stem, required: false, ...extra });

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

    /* The evaluation block. It sits between the open description and the
       restatement of the three control methods: after, so the description is
       the participant's own unprompted words; before, so the list of methods
       cannot colour a judgement of how genuine the interaction felt. */
    const evalRows = [
      likert(q("AU1"), S2_ITEMS.AU1.stem, meta),
      likert(q("OH2"), S2_ITEMS.OH2.stem, meta)
    ];
    /* The attention check rides in the middle clip, whichever content that is —
       the same position Study 1 gives it. `expected` is stripped before the
       plan is sent to the browser. */
    if (i === 1) {
      evalRows.push(likert(q("AT1"), S2_ITEMS.AT1.stem,
        { ...meta, group: "attention", expected: ATTENTION_CHECK_VALUE }));
    }

    const items = [
      longText(q("IMP"), S2_ITEMS.IMP.stem,
        { ...meta, minLength: S2_ITEMS.IMP.minLength, maxLength: S2_ITEMS.IMP.maxLength }),
      matrix(q("__eval"), S2_ITEMS.BLOCK_LEAD, evalRows, meta),
      note(S2_REMINDER),
      mc(q("WHO"), S2_ITEMS.WHO.stem, S2_ITEMS.WHO.options, { ...meta, group: "who" }),
      confidence(q("CONF"), S2_ITEMS.CONF.stem, { ...meta, group: "confidence" }),
      optionalText(q("WHY"), S2_ITEMS.WHY.stem, { ...meta, maxLength: S2_ITEMS.WHY.maxLength }),
      mc(q("DIS"), S2_ITEMS.DIS.stem, S2_ITEMS.DIS.options, { ...meta, group: "disability" }),
      optionalText(q("DIS_KIND"), S2_ITEMS.DIS_KIND.stem,
        { ...meta, maxLength: S2_ITEMS.DIS_KIND.maxLength })
    ];

    pages.push({
      key: `clip_${pos}`,
      kind: "segment",
      eyebrow: `Video ${pos} of 3`,
      title: `Video ${pos}`,
      segment: seg,
      segPosition: pos,
      video: { id: S2_CLIPS[seg].yt, duration: S2_CLIPS[seg].duration },
      items: items
    });
  });

  /* -- 5 · closing question and background ---------------------------------
     Everything here is asked after the last clip, so nothing on this page can
     reach back and colour a judgement. The closing question comes first, while
     the three videos are still fresh; the GAAIS block comes last, because it is
     the least engaging and attrition is cheapest at the very end. */
  pages.push({
    key: "background",
    kind: "page",
    eyebrow: "Last page",
    title: "A few last questions",
    items: [
      mc("SAME", S2_CLOSING.SAME.stem, S2_CLOSING.SAME.options, { group: "consistency" }),
      heading("Background", S2_BACKGROUND.heading, S2_BACKGROUND.lead),
      number("BG_age", S2_BACKGROUND.age, { min: 18, max: 120 }),
      mc("BG_gender", S2_BACKGROUND.gender, GENDER),
      mc("BG_freq_ai", S2_BACKGROUND.freqAi, FREQ),
      mc("BG_freq_disability", S2_BACKGROUND.freqDisability, FREQ),
      matrix("__gaais", S2_BACKGROUND.gaaisLead,
        S2_GAAIS.map(g => likert(`GAAIS_${String(g.n).padStart(2, "0")}`, g.text, { group: "gaais" })))
    ]
  });

  /* -- 6 · finish -----------------------------------------------------------
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

/** Flatten a plan into the ordered list of stored items (one per DB row).
    Notes and headings render and store nothing; a matrix is a container, so it
    contributes its rows rather than itself. `expected` travels here — this list
    is the server's, and is what scores the attention check. */
export function s2PlanItems(plan) {
  const out = [];
  const push = (it, page) => {
    if (it.type === "note" || it.type === "heading") return;
    if (it.type === "matrix") {
      it.rows.forEach(r => push(r, page));
      return;
    }
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
      min: it.min,
      max: it.max,
      group: it.group,
      expected: it.expected,
      screenOut: it.screenOut,
      screenOutReason: it.screenOutReason
    });
  };
  for (const page of plan.pages) for (const it of page.items) push(it, page);
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
  /* The order the items are asked in, which is the order they should read in
     across a row of wide.csv. AT1 only exists on whichever clip fell in the
     middle, so each participant fills exactly one of the three AT1 columns. */
  const codeRank = {
    IMP: 0, AU1: 1, OH2: 2, AT1: 3,
    WHO: 4, CONF: 5, WHY: 6, DIS: 7, DIS_KIND: 8
  };
  /* Split on the FIRST underscore only: REL_DIS_KIND is segment REL, code
     DIS_KIND, and must not collapse onto REL_DIS. */
  const rank = id => {
    if (/^E\d/.test(id)) return [0, 0, id];
    const cut = id.indexOf("_");
    const seg = cut < 0 ? id : id.slice(0, cut);
    const code = cut < 0 ? "" : id.slice(cut + 1);
    if (seg in segRank) return [1, segRank[seg] * 100 + (codeRank[code] ?? 99), id];
    if (id === "SAME") return [2, 0, id];
    /* Asked order, not alphabetical: a reader opening wide.csv should meet the
       background columns in the order the page put them. */
    if (seg === "BG") {
      const bgRank = { age: 0, gender: 1, freq_ai: 2, freq_disability: 3 };
      return [3, bgRank[code] ?? 9, id];
    }
    if (seg === "GAAIS") return [4, 0, id];
    return [5, 0, id];
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
   publicS2Plan — what the browser is sent. Since v2 there IS something to keep
   back: `expected`, the attention check's answer key. This is an allowlist
   rather than a delete-list, so a field added to an item in future is withheld
   by default and has to be named here to reach the browser — the same rule
   Study 1 follows, and the reason a participant with devtools open sees the
   study they are actually taking.
--------------------------------------------------------------------------- */
export function publicS2Plan(plan) {
  const stripItem = it => {
    if (it.type === "note") return { type: "note", text: it.text };
    if (it.type === "heading") {
      return { type: "heading", eyebrow: it.eyebrow, title: it.title, text: it.text };
    }
    if (it.type === "matrix") {
      /* The block id travels: it names the block, it is not an answer, and
         /preview needs it to say which instruction it is looking at. */
      return { id: it.id, type: "matrix", instruction: it.instruction, rows: it.rows.map(stripItem) };
    }
    const out = { id: it.id, type: it.type, stem: it.stem, required: it.required !== false };
    if (it.multiline) out.multiline = true;
    if (it.options) out.options = it.options;
    if (it.minLength != null) out.minLength = it.minLength;
    if (it.maxLength != null) out.maxLength = it.maxLength;
    if (it.min != null) out.min = it.min;
    if (it.max != null) out.max = it.max;
    if (it.screenOut) { out.screenOut = it.screenOut; out.screenOutReason = it.screenOutReason; }
    return out;
  };
  return {
    instrumentVersion: S2_VERSION,
    gateFraction: S2_GATE_FRACTION,
    /* The seven anchors the likert tables are drawn from. Sent once, not on
       every item. */
    scale: [...S2_SCALE],
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
