/* =============================================================================
   Study 2 — manipulation validation  ·  instrument definition
   -----------------------------------------------------------------------------
   A fresh sample sees exactly what Study 1's participants saw — one of five
   condition descriptions, then the same three clips — and is then asked not how
   it evaluates OriHime but what it took the description to say. That separates
   "understood the manipulation, and it made no difference" from "never encoded
   it, so of course it made none", which Study 1 cannot do: its recall checks
   were removed before launch, and belief (BEL1) alone cannot tell a wrong
   memory from a disbelieved one.

   Eight pages: intro (information, about OriHime, consent) · the condition
   description (Study 1's page, verbatim) · three clips, each with the condition
   recap above the player and no questions but the two checks · the validation
   block, once, after all three clips, at the point Study 1 asked BEL1 · the
   background block · finish.

   Two things are randomised: the condition (five of Study 1's seven) and the
   clip order (the same six permutations), balanced over 5 × 6 = 30 cells.

   s2-v7 sharpened the validation wording so that every recognition item has
   exactly one right answer per arm and every distractor is unambiguously
   wrong: the final-decision item mirrors the HA text's own words and its
   "shared" option now says "neither had the last word"; the open question
   asks what the description said, not what the videos showed; the two control
   scales are introduced as separate (they need not add up); the limitation
   items ask what the participant understood, and tell arm A what to choose.
   It also added Study 1's robot-contact item to the background block.

   Same rules as shared/instrument.js: item ids are the contract with the
   database and are frozen once collection starts; the browser renders the plan
   the server sends it; the server validates every answer against this file;
   no answer key reaches the browser.
   ========================================================================== */

import {
  SEGMENTS, ORDERS, ORDER_KEYS, DURATION, GATE_FRACTION,
  SCALE, FREQ, GENDER, ATTENTION_CHECK_VALUE,
  CONDITIONS, INTRO_TEXT, CONTROL_TEXT, PERSONA_HUMAN, PERSONA_AI, PROFILE_STATEMENT
} from "./instrument.js";

export const S2_VERSION = "s2-v7";

/* Study 1's per-clip comprehension bank, reused rather than restated: a recut
   clip changes the question in one place. Each entry is { options, correct }. */
const AV1_BANK = Object.fromEntries(["REL", "ADV", "COL"].map(k => [k, SEGMENTS[k].av1]));

/* ------------------------------------------------------------ the design */

/* Five of Study 1's seven cells. HA2 and HA3 are not run: Study 1 found H and
   HA equivalent on every outcome, so the operator profile is validated under H
   alone, and the Control × Profile interaction is an assumption stated in the
   plan rather than a test. `ctrl` and `profile` come from Study 1's table so
   the two studies can never disagree about what a condition is. */
export const S2_CONDITION_KEYS = ["A", "H1", "HA1", "H2", "H3"];
export const S2_CONDITIONS = Object.fromEntries(S2_CONDITION_KEYS.map(k => [k, CONDITIONS[k]]));

export const S2_ORDERS = ORDERS;
export const S2_ORDER_KEYS = ORDER_KEYS;
export const S2_GATE_FRACTION = GATE_FRACTION;
export const S2_SEGMENT_KEYS = ["REL", "ADV", "COL"];
export const S2_CLIPS = Object.fromEntries(
  S2_SEGMENT_KEYS.map(s => [s, { yt: SEGMENTS[s].yt, duration: DURATION[s] }])
);

/* ---------------------------------------------------------------- scales */

/* Study 1's seven-point agreement scale, for AT1 and BEL1. */
export const S2_SCALE = SCALE;

/* "How much of what OriHime said and did was controlled by …". Every point is
   named so a stored value_text reads on its own. Two unipolar scales — one for
   a person, one for an AI system — rather than one bipolar human↔AI scale: a
   participant who took the description to mean shared control can score both
   high, and that is exactly the HA reading the study has to be able to see. */
export const S2_AMOUNT = [
  "None of it", "Very little", "Some", "About half", "Most", "Almost all", "All of it"
];

/* "How limited did you understand the operator to be in …". */
export const S2_EXTENT = [
  "Not at all", "Very little", "A little", "Somewhat", "Quite a lot", "Very much", "Extremely"
];

/* ---------------------------------------------------------------- wording */

export const S2_ABOUT = {
  head: "About OriHime",
  intro: "OriHime is a robot that communicates through speech, head movements, and gestures. In the clips you will see, OriHime is talking with a person in an office."
};

export const S2_INFO = {
  lede: "Thank you for your interest in this study. Please read this page before deciding whether to take part.",
  sections: [
    {
      key: "what",
      heading: "What you will do",
      body:
        "You will read a short description of the robot you are about to see, watch **three short video clips** of it talking with a person, and then answer some questions about the description and about yourself.\n\n" +
        "It takes about **10 minutes**, and you will need **sound**."
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
        "Results are reported in aggregate, and the responses may be shared as an anonymous dataset alongside a published paper. Your written answers may be quoted in publications; they carry no name."
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

/* The line every arm sees under its description. */
export const S2_NO_LOOKUP =
  "Please answer from the videos and the description above — please do not look OriHime up while taking part.";

/* The debrief is Study 1's, verbatim: it is the same deception. The one
   sentence Study 1's approved text does not carry — what actually controlled
   the clips — is a placeholder the research team either fills in or removes;
   scripts/s2-plan-check.mjs warns while it is present. */
export const S2_DEBRIEF_PLACEHOLDER = "[TO BE COMPLETED BY THE RESEARCH TEAM]";
export const S2_DEBRIEF = [
  "In this study, the description of who or what controlled OriHime, and the description of the operator, were experimentally varied between participants, while the videos themselves were identical for everyone.",
  "The study examines how information about control and operator characteristics shapes judgments. It does not test whether any disability group is more or less capable.",
  `**How OriHime was actually controlled.** ${S2_DEBRIEF_PLACEHOLDER}`,
  "Your answers have been recorded against the participant number your recruitment platform gave us, and no name. If you would like them removed, send us the completion code shown on this page. Thank you for taking part."
];

/* The validation items. Every stem is anchored on the description: this is
   recognition of what was said, not a judgement of what the videos looked
   like. Where a stem counts or quantifies, "a human operator" is safe for arm
   A (the answer is simply "none of it"); where a stem presupposes one — the
   two limitation items — a note tells arm A to answer "Not at all". */
export const S2_ITEMS = {
  OPEN: {
    stem: "Please describe, in your own words, what the description at the start said about who or what was controlling OriHime, and anything else you remember it saying about the operator or the system.",
    minLength: 30,
    maxLength: 2000
  },
  CTRL_REC: {
    stem: "According to the description, which of these best describes how OriHime was controlled?",
    options: [
      "A human operator, with no AI involved",
      "A human operator with AI assistance",
      "An AI system, with no human operator",
      "I’m not sure"
    ],
    /* option index by control source */
    expected: { H: 0, HA: 1, A: 2 }
  },
  CTRL_P:  { stem: "According to the description, how much of what OriHime said and did was controlled by a human operator?" },
  CTRL_AI: { stem: "According to the description, how much of what OriHime said and did was controlled by an AI system?" },
  FINAL: {
    /* Mirrors the HA text's own words, "makes the final decisions". The third
       option has to be explicit that nobody had the last word: a bare "they
       shared it" is also what a participant who understood HA correctly
       (AI suggests, the person decides) might reach for, and then the HA1
       rate could not be read. */
    stem: "According to the description, who made the final decisions about what OriHime said and did?",
    options: [
      "A person. Even if an AI system made suggestions, the person had the last word.",
      "An AI system. Even if a person was involved, the AI system had the last word.",
      "A person and an AI system equally. Neither one had the last word.",
      "I’m not sure"
    ],
    /* The HA text says the operator "makes the final decisions": a person. */
    expected: { H: 0, HA: 0, A: 1 }
  },
  PROF_REC: {
    stem: "Which of these best matches what the description said about who operated OriHime?",
    options: [
      "A person with a mobility-related disability",
      "A person with an intellectual or cognitive disability",
      "A person — no disability was mentioned",
      "There was no human operator",
      "I’m not sure"
    ],
    /* Study 1's profile 1 says nothing about disability, deliberately; that is
       the control, and "no disability was mentioned" is its right answer. */
    expectedByProfile: { 1: 2, 2: 1, 3: 0 },
    expectedForAI: 3
  },
  /* What the participant took the label to mean, not what the text hinted:
     the construct is the operator model the label produced, which is what
     a stereotype account of Study 1's null would need. */
  LIM_MOB: { stem: "Based on the description, how limited did you understand the operator to be in physical movement or mobility (for example walking, or using their hands)?" },
  LIM_COG: { stem: "Based on the description, how limited did you understand the operator to be in thinking, learning, or understanding (for example memory, reasoning, or following instructions)?" },
  BEL1: {
    /* Study 1's item, word for word, including the emphasis. */
    stem: "How much ***DID YOU BELIEVE*** the description of the OriHime operator you were given at the beginning of the questionnaire?"
  },
  AT1: { stem: "To show that you are reading carefully, please select “Disagree” for this item." },
  AV1: { stem: "Which of the following happened in the video you just watched?" }
};

/* Two instructions inside the validation block. The first keeps the two
   control scales unipolar in the participant's mind: without it, answers get
   forced to add up and the "both high" reading of HA cannot appear. The second
   gives arm A a scored, sensible answer on two items that presuppose an
   operator. Both are shown to every arm; neither names a condition the option
   lists have not already named. */
export const S2_NOTES = {
  agency: "The next two questions are separate. Your two answers do not need to add up.",
  limits: "If you were told there was no human operator, choose “Not at all” for the next two questions."
};

export const S2_BACKGROUND = {
  heading: "Background",
  lead: "These last few questions are about you.",
  age: "What is your age in years?",
  gender: "What gender do you identify with?",
  freqAi: "How often do you use AI tools in your personal or professional life?",
  /* Study 1's item and id, verbatim, so the two studies' columns line up. */
  freqRobot: "How often do you see or interact with a robot in your personal or professional life?",
  freqDisability: "How often do you see or interact with people with disabilities in your personal or professional life?",
  knowledge: {
    stem: "Before today, how much did you know about OriHime?",
    options: [
      "I had never heard of it",
      "I had heard of it, but did not know how it is used or who operates it",
      "I knew something about how it is used or who operates it"
    ]
  }
};

/* ---------------------------------------------------------------- helpers */

const mc = (id, stem, options, extra = {}) =>
  ({ id, type: "mc", stem, options, required: true, ...extra });
const likert = (id, stem, options = SCALE, extra = {}) =>
  ({ id, type: "likert7", stem, options, required: true, ...extra });
const number = (id, stem, extra = {}) =>
  ({ id, type: "number", stem, required: true, ...extra });
const longText = (id, stem, extra = {}) =>
  ({ id, type: "text", multiline: true, stem, required: true, ...extra });
const heading = (eyebrow, title, text) => ({ type: "heading", eyebrow, title, text });
const note = text => ({ type: "note", text });

/* ---------------------------------------------------------------- the plan */

/**
 * Build the ordered page plan for one participant.
 * Pure: the same (condition, order) always gives the same plan.
 * @param {string} condition one of S2_CONDITION_KEYS
 * @param {string} order one of S2_ORDER_KEYS
 */
export function buildS2Plan(condition, order) {
  const c = S2_CONDITIONS[condition];
  if (!c) throw new Error(`unknown condition: ${condition}`);
  const segOrder = S2_ORDERS[order];
  if (!segOrder) throw new Error(`unknown order: ${order}`);
  const isHuman = c.ctrl !== "A";
  const persona = isHuman ? PERSONA_HUMAN : PERSONA_AI;
  const profile = isHuman ? (PROFILE_STATEMENT[c.profile] ?? null) : null;

  const pages = [];

  /* -- 1 · information, about OriHime, consent ------------------------------ */
  pages.push({
    key: "intro",
    kind: "info",
    eyebrow: "Before you begin",
    title: "About this study",
    info: { lede: S2_INFO.lede, sections: S2_INFO.sections.map(s => ({ ...s })) },
    about: { head: S2_ABOUT.head, intro: S2_ABOUT.intro },
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

  /* -- 2 · the condition description ----------------------------------------
     Study 1's disclosure page: same intro, same control text, same persona
     block, same profile line where there is one, same diagram. Its dwell time
     is stored, as it was in Study 1, where it was the evidence the page was
     read. */
  pages.push({
    key: "disclosure",
    kind: "disclosure",
    eyebrow: "Please read carefully",
    title: "About the OriHime you will see",
    disclosure: {
      intro: INTRO_TEXT,
      control: CONTROL_TEXT[c.ctrl],
      profile,
      arrangement: c.ctrl,
      personaHead: persona.head,
      personaLines: persona.lines.map(text => ({ text })),
      after: S2_NO_LOOKUP
    },
    items: [mc("D1", "Please confirm that you have read the description above.", ["I have read it"])]
  });

  /* -- 3–5 · the clips ------------------------------------------------------
     No questions per clip: the validation is of the description's mental
     model, one thing per participant, asked after all three clips at the point
     Study 1 asked BEL1. The recap above each player is Study 1's. */
  segOrder.forEach((seg, i) => {
    const pos = i + 1;
    const q = code => `${seg}_${code}`;
    const meta = { segment: seg, segPosition: pos };
    const items = [];
    if (i === 1) {
      items.push(likert(q("AT1"), S2_ITEMS.AT1.stem, SCALE,
        { ...meta, group: "attention", expected: ATTENTION_CHECK_VALUE }));
    }
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
      recap: { control: CONTROL_TEXT[c.ctrl], profile },
      lead: items.length
        ? "One question about this video, then the next one."
        : "When the video has finished, continue to the next one.",
      items
    });
  });

  /* -- 6 · the validation block ---------------------------------------------
     The open reconstruction first, before any option list, so the wording is
     the participant's own. Then agency, then the operator profile, then
     belief. Recognition and belief are asked apart because a correct
     recognition beside a low belief is a different finding from a wrong one. */
  pages.push({
    key: "validation",
    kind: "page",
    eyebrow: "About the description",
    title: "About the description you were given",
    lead: "The next questions are about the description of OriHime you read at the start, before the videos. Please answer from what you remember of it.",
    items: [
      longText("V_OPEN", S2_ITEMS.OPEN.stem,
        { minLength: S2_ITEMS.OPEN.minLength, maxLength: S2_ITEMS.OPEN.maxLength, group: "open" }),
      heading(null, "Who was in control", null),
      mc("V_CTRL_REC", S2_ITEMS.CTRL_REC.stem, S2_ITEMS.CTRL_REC.options,
        { group: "ctrl_recognition", expected: S2_ITEMS.CTRL_REC.expected[c.ctrl] }),
      note(S2_NOTES.agency),
      likert("V_CTRL_P", S2_ITEMS.CTRL_P.stem, S2_AMOUNT, { group: "agency" }),
      likert("V_CTRL_AI", S2_ITEMS.CTRL_AI.stem, S2_AMOUNT, { group: "agency" }),
      mc("V_FINAL", S2_ITEMS.FINAL.stem, S2_ITEMS.FINAL.options,
        { group: "final_recognition", expected: S2_ITEMS.FINAL.expected[c.ctrl] }),
      heading(null, "The operator", null),
      mc("V_PROF_REC", S2_ITEMS.PROF_REC.stem, S2_ITEMS.PROF_REC.options,
        { group: "profile_recognition",
          expected: isHuman ? S2_ITEMS.PROF_REC.expectedByProfile[c.profile] : S2_ITEMS.PROF_REC.expectedForAI }),
      note(S2_NOTES.limits),
      likert("V_LIM_MOB", S2_ITEMS.LIM_MOB.stem, S2_EXTENT, { group: "profile" }),
      likert("V_LIM_COG", S2_ITEMS.LIM_COG.stem, S2_EXTENT, { group: "profile" }),
      heading(null, "The description as a whole", null),
      likert("BEL1", S2_ITEMS.BEL1.stem, SCALE, { group: "belief" })
    ]
  });

  /* -- 7 · background --------------------------------------------------------- */
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
      mc("BG_freq_robot", S2_BACKGROUND.freqRobot, FREQ),
      mc("BG_freq_disability", S2_BACKGROUND.freqDisability, FREQ),
      mc("BG_orihime_knowledge", S2_BACKGROUND.knowledge.stem, S2_BACKGROUND.knowledge.options,
        { group: "familiarity" })
    ]
  });

  /* -- 8 · finish ------------------------------------------------------------- */
  pages.push({
    key: "finish",
    kind: "finish",
    eyebrow: "Complete",
    title: "Thank you for taking part",
    debrief: [...S2_DEBRIEF],
    items: []
  });

  return { condition, ctrl: c.ctrl, profile: c.profile, isHuman, order, segOrder, pages };
}

/* ---------------------------------------------------------------- derived */

/** Flatten a plan into the ordered list of stored items (one per DB row).
    Headings render and store nothing. `expected` travels here — this list is
    the server's, and is what scores every check. */
export function s2PlanItems(plan) {
  const out = [];
  for (const page of plan.pages) {
    for (const it of page.items) {
      if (it.type === "note" || it.type === "heading") continue;
      out.push({
        id: it.id, type: it.type, pageKey: page.key,
        segment: it.segment ?? null, segPosition: it.segPosition ?? null,
        stem: it.stem, options: it.options,
        required: it.required !== false,
        minLength: it.minLength, maxLength: it.maxLength, min: it.min, max: it.max,
        group: it.group, expected: it.expected,
        screenOut: it.screenOut, screenOutReason: it.screenOutReason
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
  for (const cond of S2_CONDITION_KEYS) {
    for (const order of S2_ORDER_KEYS) {
      for (const it of s2PlanItems(buildS2Plan(cond, order))) {
        if (!seen.has(it.id)) { seen.add(it.id); ordered.push(it.id); }
      }
    }
  }
  const segRank = { REL: 0, ADV: 1, COL: 2 };
  const vRank = ["V_OPEN", "V_CTRL_REC", "V_CTRL_P", "V_CTRL_AI", "V_FINAL",
                 "V_PROF_REC", "V_LIM_MOB", "V_LIM_COG", "BEL1"];
  const bgRank = ["BG_age", "BG_gender", "BG_freq_ai", "BG_freq_robot", "BG_freq_disability", "BG_orihime_knowledge"];
  const rank = id => {
    if (/^E\d/.test(id)) return [0, Number(id[1]), id];
    if (id === "D1") return [1, 0, id];
    const cut = id.indexOf("_");
    const seg = cut < 0 ? id : id.slice(0, cut);
    if (seg in segRank) return [2, segRank[seg] * 10 + (id.endsWith("AT1") ? 0 : 1), id];
    if (vRank.includes(id)) return [3, vRank.indexOf(id), id];
    if (bgRank.includes(id)) return [4, bgRank.indexOf(id), id];
    return [5, 0, id];
  };
  return ordered.sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
  });
}

/** The thirty allocation cells: condition × clip order. */
export function s2AllCells() {
  const cells = [];
  for (const cond of S2_CONDITION_KEYS) {
    for (const order of S2_ORDER_KEYS) {
      cells.push({ cell: `${cond}|${order}`, condition: cond, seg_order: order });
    }
  }
  return cells;
}

/* ---------------------------------------------------------------------------
   publicS2Plan — what the browser is sent. An allowlist, not a delete-list: a
   field added to an item in future is withheld by default and has to be named
   here to reach the browser. What is kept back: `expected` on every check, and
   the condition label itself — the participant sees their own description and
   nothing that names it or lists the others.
--------------------------------------------------------------------------- */
export function publicS2Plan(plan) {
  const stripItem = it => {
    if (it.type === "note") return { type: "note", text: it.text };
    if (it.type === "heading") return { type: "heading", eyebrow: it.eyebrow, title: it.title, text: it.text };
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
    scale: [...S2_SCALE],
    pages: plan.pages.map(p => ({
      key: p.key, kind: p.kind, eyebrow: p.eyebrow, title: p.title,
      lead: p.lead ?? null,
      info: p.info ?? null,
      about: p.about ?? null,
      consentIntro: p.consentIntro ?? null,
      disclosure: p.disclosure ?? null,
      recap: p.recap ?? null,
      debrief: p.debrief ?? null,
      segment: p.segment ?? null,
      segPosition: p.segPosition ?? null,
      video: p.video ?? null,
      items: p.items.map(stripItem)
    }))
  };
}
