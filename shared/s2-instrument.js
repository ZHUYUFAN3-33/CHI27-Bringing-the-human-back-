/* =============================================================================
   Study 2 — "Who is controlling OriHime?"  ·  instrument definition
   -----------------------------------------------------------------------------
   A perception study on a fresh sample. Nobody is told how OriHime is
   controlled: page one says only that there are three ways it can be, and each
   of the three clips is followed by the same three questions, each one rated
   and then followed by how confident the participant is in that answer —
   whether the interaction felt genuine, who they think is controlling the
   robot, and whether a person involved is thought to have a disability.

   There is no free text anywhere. The instructed-response check on the middle
   clip is therefore the only quality evidence the questionnaire itself
   produces; the playback telemetry is the other.

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
  SCALE, FREQ, GENDER, ATTENTION_CHECK_VALUE
} from "./instrument.js";

/* Study 1's per-clip comprehension bank, reused rather than restated: a recut
   clip changes the question in one place. Each entry is { options, correct }. */
const AV1_BANK = Object.fromEntries(
  ["REL", "ADV", "COL"].map(k => [k, SEGMENTS[k].av1])
);

export const S2_VERSION = "s2-v5";

/* The seven-point agreement scale and the frequency options are Study 1's,
   imported rather than restated: the two studies only compare if an answer of
   6 means the same thing in both. */
export const S2_SCALE = SCALE;

/* The confidence scale. Seven points to match the agreement items, but named
   for confidence throughout rather than anchored only at the ends, so a stored
   value_text says what it means without a codebook lookup. */
export const S2_CONFIDENCE = [
  "Not at all confident", "Slightly confident", "Somewhat confident",
  "Moderately confident", "Quite confident", "Very confident", "Completely confident"
];

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

/* Page one introduces OriHime and says nothing about how it can be controlled.
   The earlier draft taught exactly three control arrangements and then showed
   exactly three clips, and restated all three above every control question —
   an arrangement that invites a one-of-each matching strategy and makes
   "spontaneous inference" the wrong name for what comes out. The categories
   now appear once, as the options of the question that asks for them. */
export const S2_ABOUT = {
  head: "About OriHime",
  intro: "OriHime is a robot that communicates through speech, head movements, and gestures. In the clips you will see, OriHime is talking with a person in an office.",
  /* Said before the clips and again beside the control question: three clips
     is not a hint that three different arrangements are on show. */
  after:
    "**We will not tell you how OriHime is controlled in the clips you are about to see.** " +
    "The videos may use the same control arrangement or different arrangements, and the number of videos does not correspond to any number of control methods.\n\n" +
    "There are no right or wrong answers: we are interested in your own impression of what you see and hear. " +
    "**Please answer from the videos themselves — please do not look OriHime up while taking part.**"
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
        "Results are reported in aggregate, and the responses may be shared as an anonymous dataset alongside a published paper. This study asks only multiple-choice and rating questions, so there is nothing you write in your own words for us to quote."
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
/* The debrief has to say what was withheld, what the truth actually was, why it
   was withheld, and how this study relates to Study 1. The old one said only
   the first of those, which is a partial debrief rather than a debrief.

   THE SECOND PARAGRAPH IS A PLACEHOLDER. Only the PI knows how each clip was
   actually produced, and nobody can be debriefed with a guess. Replace
   S2_DEBRIEF_PLACEHOLDER with the true arrangement, have the whole page
   approved with the ethics materials, and clear it off the pre-recruitment
   checklist in LINKS.md. scripts/s2-plan-check.mjs prints a warning while the
   marker is still here. */
export const S2_DEBRIEF_PLACEHOLDER = "[TO BE COMPLETED BY THE RESEARCH TEAM]";

export const S2_DEBRIEF = [
  "**What we did not tell you.** We did not say how OriHime was controlled in the videos you watched. We withheld it on purpose: the study asks what impression the interaction itself gives, and knowing the answer in advance would have replaced that impression with a fact. Every participant saw the same three videos, in a random order, and answered the same questions.",

  `**How OriHime was actually controlled.** ${S2_DEBRIEF_PLACEHOLDER}`,

  "**Why this study exists.** It accompanies an earlier study in which people were told how OriHime was controlled before they watched the same videos. Comparing what people are told with what people assume when they are told nothing is what lets us say whether a description agreed with, or worked against, the impression the videos already give. Your answers are the second half of that comparison.",

  "**Your data.** Your answers have been recorded against the participant number your recruitment platform gave us, and no name. If you would like them removed, send us the completion code shown on this page. Thank you for taking part."
];

/* Sits directly above the control question, after the genuineness rating, so
   the answer options cannot colour that rating. It no longer restates the
   three arrangements — that repetition was the matching cue — and carries the
   anti-matching sentence instead. */
export const S2_REMINDER =
  "We have not said how OriHime is controlled in this video. It may be the same arrangement as in the other videos, or a different one.";

/* Item wording. The option order of WHO follows the order the three methods
   are introduced on page one. */
export const S2_ITEMS = {
  /* The impression item. It replaces the open description the first draft
     asked for: three questions per clip, each one a rating that a confidence
     score can sensibly follow, was the brief. The wording is Study 1's, word
     for word and on the same seven-point scale, so "do people who
     spontaneously read the controller as an AI also find the interaction less
     genuine" can be set beside Study 1's C1 effect. */
  AU1: { stem: "This interaction felt genuine, rather than like the execution of a program." },

  /* The options are the control categories, and this is the only place they
     appear: page one no longer teaches them. Each corresponds to one of Study
     1's three control conditions (H, HA, A) in the same terms Study 1 framed
     them, which is what lets the two studies be set side by side — but the
     correspondence is documented in the analysis plan, not shown to anyone. */
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

  /* One confidence item after each of the three, worded for what it follows —
     a rating is not a judgement, and an item that says "that judgement" under
     an agreement scale reads as a mistake. Confidence separates a held
     impression from a shrug, which is what the "weak default is treated as
     near neutral" rule in the analysis plan needs to be decidable at all. */
  CONF_AU1: { stem: "How confident are you in that rating?" },
  CONF_WHO: { stem: "How confident are you in that judgement?" },
  CONF_DIS: { stem: "How confident are you in that judgement?" },

  /* Instructed-response check, on the middle clip only, the position Study 1
     gives it. It evidences that the page was read. Its answer key never leaves
     the server. */
  AT1: { stem: "To show that you are reading carefully, please select “Disagree” for this item." },

  /* Video comprehension, on the clip shown LAST and after that clip's three
     judgements. Playback duration says a video played, not that anyone
     watched it, and in a study whose whole subject is what people infer from
     watching, that distinction is the difference between a usable sample and
     an assumed one.
     Placed last so that learning the study checks comprehension cannot change
     how the earlier clips were watched; asked after the judgements so it
     cannot direct attention to the detail it asks about.
     The options and the key are Study 1's AV1 bank for whichever clip landed
     in that position, read from shared/instrument.js so there is one source of
     truth. THEY ARE WRITTEN FROM THE SHOOTING SCRIPT, NOT FROM THE CUT: every
     option has to be checked against the final audio before recruitment opens,
     exactly as Study 1's known limitations already say. */
  AV1: { stem: "Which of the following happened in the video you just watched?" }
};

/* Asked at the very end, after every judgement. OriHime is publicly associated
   with remote participation by people who are hospitalised or have physical
   disabilities, so a participant who already knows the product may answer the
   disability question from what they knew before rather than from the clip.
   These two items make that visible. They are for prespecified stratified
   description and sensitivity analysis — never a post-hoc exclusion chosen
   after the fact. */
export const S2_FAMILIARITY = {
  /* One ordinal item rather than the earlier two. Two items could come back
     as "never heard of it" beside "knew how it is controlled", which is not an
     answer to anything; the ordinal form cannot contradict itself, and the only
     distinction the analysis needs — knew something about how it is used or
     who operates it, or did not — is its top rung. */
  stem: "Before today, how much did you know about OriHime?",
  options: [
    "I had never heard of it",
    "I had heard of it, but did not know how it is used or who operates it",
    "I knew something about how it is used or who operates it"
  ]
};

/* The background block. Asked last, where it cannot colour the judgements, and
   kept to what bears on this study: age and gender, which the Participants
   paragraph is written from; the two frequency items, which are the cohort
   comparison with Study 1 on the two dimensions most likely to move the two
   core answers; and prior knowledge of OriHime. Ids match Study 1's so the two
   samples can be described in the same terms. */
export const S2_BACKGROUND = {
  heading: "Background",
  lead: "These last few questions are about you. They are asked after the videos so they cannot affect your answers.",
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

/* Renders a seam and stores nothing. */
const heading = (eyebrow, title, text) =>
  ({ type: "heading", eyebrow, title, text });

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

    /* Three questions, each one a rating with its own confidence item.
       AU1 comes before the three control methods are restated, so the option
       list cannot colour a judgement of how genuine the interaction felt;
       WHO and DIS come after it. Each confidence item sits immediately under
       the answer it is about — asked later, it measures a memory of the
       judgement rather than the judgement. */
    const items = [
      likert(q("AU1"), S2_ITEMS.AU1.stem, meta),
      confidence(q("AU1_CONF"), S2_ITEMS.CONF_AU1.stem, { ...meta, group: "confidence" }),
      note(S2_REMINDER),
      mc(q("WHO"), S2_ITEMS.WHO.stem, S2_ITEMS.WHO.options, { ...meta, group: "who" }),
      confidence(q("WHO_CONF"), S2_ITEMS.CONF_WHO.stem, { ...meta, group: "confidence" }),
      mc(q("DIS"), S2_ITEMS.DIS.stem, S2_ITEMS.DIS.options, { ...meta, group: "disability" }),
      confidence(q("DIS_CONF"), S2_ITEMS.CONF_DIS.stem, { ...meta, group: "confidence" })
    ];

    /* The attention check rides the middle clip, whichever content that is —
       the same position Study 1 gives it. It goes last on the page rather than
       hidden in a block of agreement rows, because after the cut there is no
       such block left on a clip page. `expected` is stripped before the plan
       reaches the browser. */
    if (i === 1) {
      items.push(likert(q("AT1"), S2_ITEMS.AT1.stem,
        { ...meta, group: "attention", expected: ATTENTION_CHECK_VALUE }));
    }

    /* Video comprehension on the clip shown last, after its judgements. The
       position is fixed in advance rather than sampled, so every participant
       is checked on one clip and each clip is checked equally often across the
       six orders. Its key is stripped with AT1's. */
    if (i === 2) {
      items.push(mc(q("AV1"), S2_ITEMS.AV1.stem, AV1_BANK[seg].options,
        { ...meta, group: "comprehension", expected: AV1_BANK[seg].correct }));
    }

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

  /* -- 5 · background --------------------------------------------------------
     Everything here is asked after the last clip, so nothing on this page can
     reach back and colour a judgement. Five items, all clicks. */
  pages.push({
    key: "background",
    kind: "page",
    eyebrow: "Last page",
    title: "A few last questions",
    items: [
      heading("Background", S2_BACKGROUND.heading, S2_BACKGROUND.lead),
      number("BG_age", S2_BACKGROUND.age, { min: 18, max: 120 }),
      mc("BG_gender", S2_BACKGROUND.gender, GENDER),
      mc("BG_freq_ai", S2_BACKGROUND.freqAi, FREQ),
      mc("BG_freq_disability", S2_BACKGROUND.freqDisability, FREQ),
      mc("BG_orihime_knowledge", S2_FAMILIARITY.stem, S2_FAMILIARITY.options, { group: "familiarity" })
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
    AU1: 0, AU1_CONF: 1,
    WHO: 2, WHO_CONF: 3,
    DIS: 4, DIS_CONF: 5,
    AT1: 6, AV1: 7
  };
  /* Split on the FIRST underscore only: REL_WHO_CONF is segment REL, code
     WHO_CONF, and must not collapse onto REL_WHO. */
  const rank = id => {
    if (/^E\d/.test(id)) return [0, 0, id];
    const cut = id.indexOf("_");
    const seg = cut < 0 ? id : id.slice(0, cut);
    const code = cut < 0 ? "" : id.slice(cut + 1);
    if (seg in segRank) return [1, segRank[seg] * 100 + (codeRank[code] ?? 99), id];
    /* Asked order, not alphabetical: a reader opening wide.csv should meet the
       background columns in the order the page put them. */
    if (seg === "BG") {
      const bgRank = { age: 0, gender: 1, freq_ai: 2, freq_disability: 3, orihime_knowledge: 4 };
      return [3, bgRank[code] ?? 9, id];
    }
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
