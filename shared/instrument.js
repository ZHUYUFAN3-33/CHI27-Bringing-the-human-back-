/* =============================================================================
   Study 1 — "Bringing the Human Back?"  ·  instrument definition
   -----------------------------------------------------------------------------
   ONE source of truth, imported by both the browser (public/survey.js) and the
   server (src/*).  The browser renders from it; the server validates incoming
   answers against it and derives the column order for the wide CSV export.

   Wording is carried over verbatim from study1_v5_mockup_r1_2026-08-20.html.
   The only substantive addition is a stable `id` on every item, because the
   mockup generated random input names and therefore produced no analysable
   data.  Item ids are the contract between the questionnaire and the database:
   changing one after data collection starts orphans the earlier rows, so treat
   them as frozen once the study is live (see INSTRUMENT_VERSION below).
   ========================================================================== */

import { COUNTRIES } from "./countries.js";

export const INSTRUMENT_VERSION = "v6c";

/* ---------------------------------------------------------------- referents */

/* Block A (OriHime block) uses one wording in all seven conditions.
   Block B (controller block) uses the human where a human exists,
   the AI only in condition A. */
export const REFERENT = {
  H:  "The human operator of OriHime",
  HA: "The human operator of OriHime",
  A:  "The AI controlling OriHime"
};

/* `**` marks the words the renderer sets in bold. Escaping happens before the
   markers are read, so a marker can never smuggle markup into the page. The
   emphasis is not decoration: control source is the manipulation, and it has to
   survive a participant skimming this page. */
export const CONTROL_TEXT = {
  H:  "The OriHime here is controlled in real time by a trained **human operator**. The human operator chooses what OriHime says and does. **No AI system** generates responses or makes decisions.",
  HA: "The OriHime here is controlled by a trained **human operator with AI assistance**. The AI can suggest wording or movements, but the **human operator** can accept, change, or reject suggestions and **makes the final decisions**.",
  A:  "The OriHime here is controlled **entirely by an AI system**. There is **no human operator**. The AI system generates OriHime’s responses and controls its movements in real time."
};

export const INTRO_TEXT = "OriHime is a robot that communicates through speech, head movements, and gestures. You will see OriHime take part in three short interactions. Please read the information below carefully.";

/* Persona blocks. Everything is fixed except the single profile line.
   The AI condition receives a matched block so that the amount of text, and the
   presence of a competence assurance, do not themselves vary with control source. */
export const PERSONA_HUMAN = {
  head: "About the operator",
  lines: [
    "This operator works with OriHime for a few hours on most days.",
    "This operator has been doing this work for about a year.",
    "All operators complete the same training and meet the same standard before they start this work."
  ]
};
export const PERSONA_AI = {
  head: "About the system",
  lines: [
    "This system operates OriHime for a few hours on most days.",
    "This system has been in use for this work for about a year.",
    "All systems are trained and tested to the same standard before they are used for this work."
  ]
};

/* The operator's profile no longer rides in the persona list. It is the second
   manipulation, and as the third bullet of four it was read past: it now leads
   the disclosure, above the diagram, in its own sentence. */
export const PROFILE_STATEMENT = {
  /* 1 is deliberately absent. Saying "does not have a disability" turns an
     absence into an announcement: it makes disability the subject for the one
     group that is supposed to be unmarked, and a participant told that has
     been given a fact about the operator that the other reference cell, the
     AI, is never given. Saying nothing is the control. */
  2: "The operator of this OriHime **has an intellectual disability**.",
  3: "The operator of this OriHime **has a mobility-related disability**."
};

/* ------------------------------------------------------- study information

   The consent document, as data rather than as markup. It used to be a wall of
   template literals inside renderInfo() in public/survey.js, which meant the
   one page the ethics committee actually approves was the one page nobody
   could change without a deploy. Here it is addressable — info.<key>.heading
   and info.<key>.body — so the approved wording can be typed in from /preview.

   Conventions, and they are the same two the framing text already uses:
     · a blank line starts a new paragraph
     · **double asterisks** set bold
   Plus one more that only applies here: {funding} and {contact} are replaced
   with the values configured for the deployment, and a section that names a
   `requires` key is dropped entirely when that value is not set. That is what
   keeps an empty STUDY_FUNDING from printing "funded by ." on a consent form.

   Headings are used rather than one column of bolded lead-ins because this is
   read by someone deciding whether to take part, and they should be able to
   find "can I stop" without reading the paragraph above it. */
export const INFO_PAGE = {
  lede: "Thank you for your interest in this study. Please read this page before deciding whether to take part.",
  sections: [
    {
      key: "what",
      heading: "What you will do",
      body:
        "You will read a short description, watch three video clips of a person talking with a robot called OriHime, and answer questions about each one.\n\n" +
        "It takes about **20–30 minutes**, and you will need **sound**."
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
        "Results are reported in aggregate, and the responses may be shared as an anonymous dataset alongside a published paper."
    },
    {
      key: "voluntary",
      heading: "Taking part is voluntary",
      body:
        "You can close the page at any time, without giving a reason and without penalty.\n\n" +
        "At the end you receive a completion code. If you later want your responses removed, send us that code and we will delete them. Your answers carry no name: that code and your participant number are the only things that connect them to you."
    },
    {
      key: "followup",
      heading: "A follow-up study",
      body:
        "On the last page we ask whether you would be willing to be contacted about a **paid follow-up interview**. Saying no has no effect on your payment for this study, and saying yes does not commit you to taking part in anything.\n\n" +
        "Your participant number is recorded either way, because the recruitment platform needs it to pay you. If you say yes, we may also use it to invite you to the follow-up."
    },
    {
      key: "note",
      heading: "One important note",
      body: "Some details of this study are not described in full until the end. There is a complete explanation on the last page, before you finish."
    },
    {
      key: "questions",
      heading: "Questions",
      requires: "contact",
      body: "You can contact the researcher at **{contact}**."
    }
  ]
};

/* ---------------------------------------------------------------- design */

export const CONDITIONS = {
  H1:  { ctrl: "H",  profile: 1 },
  H2:  { ctrl: "H",  profile: 2 },
  H3:  { ctrl: "H",  profile: 3 },
  HA1: { ctrl: "HA", profile: 1 },
  HA2: { ctrl: "HA", profile: 2 },
  HA3: { ctrl: "HA", profile: 3 },
  A:   { ctrl: "A",  profile: null }
};
export const CONDITION_KEYS = Object.keys(CONDITIONS);

/* All six permutations, not the three cyclic rotations.
   The rotations balance position — each segment appears once in each slot —
   but they only ever produce three of the six adjacent pairs: REL→ADV, ADV→COL
   and COL→REL. ADV→REL, COL→ADV and REL→COL never occurred, so a segment
   effect could not be separated from what preceded it. With all six, every
   ordered pair appears exactly twice and position stays balanced.

   This doubles the design cells to 42, but a cell is the randomisation unit,
   not the analysis unit: each condition still receives n/7, so the power for
   the effects of interest is unchanged. scripts/plan-check.mjs enforces both
   balances, so a future edit cannot quietly reintroduce the confound. */
export const ORDERS = {
  O1: ["REL", "ADV", "COL"],
  O2: ["ADV", "COL", "REL"],
  O3: ["COL", "REL", "ADV"],
  O4: ["REL", "COL", "ADV"],
  O5: ["ADV", "REL", "COL"],
  O6: ["COL", "ADV", "REL"]
};
export const ORDER_KEYS = Object.keys(ORDERS);

/* `av1` is the comprehension check, and it is asked about whichever segment the
   participant saw first — which is randomised. The options therefore belong to
   the segment, not to the questionnaire: one shared set would have matched the
   clip for only a third of participants.

   Each set is one thing that is actually said or shown, and three that are
   plausible for the same scene and are not. The correct option sits at a
   different index in each segment so its position carries no information, and
   `correct` is stripped by publicPlan — the browser never receives the key.

   Written from the v1.4 shooting script. The script flags segments R and A as
   reproduced from working text rather than diffed against the v1.2 master, so
   confirm each line against the audio of the final cut before recruiting. */
export const SEGMENTS = {
  REL: {
    yt: "FM4xHwqv03M",
    desc: "A person and OriHime have a casual conversation about recent life experiences.",
    neg: "Imagine that OriHime made a hurtful comment, leaving the person talking with Orihime to feel worse.",
    pos: "Imagine instead that OriHime made a thoughtful comment, leading the person talking with Orihime to feel better.",
    av1: {
      /* Anchored on the botanical garden rather than the plum trees. The script
         marks the trees as the anchor but also flags them as a spring marker
         that may be recut for an autumn sample; the visit itself survives that
         edit, and is the more salient detail either way. */
      options: [
        "She spent the whole weekend catching up on work.",
        "She visited a botanical garden at the weekend.",
        "She went to a concert with friends.",
        "She was away travelling for most of the week."
      ],
      correct: 1
    }
  },
  ADV: {
    yt: "MkcK6cGjjwM",
    desc: "A person describes work overload or work–life strain, and OriHime offers a recommendation.",
    neg: "Imagine that OriHime gave unsuitable advice on workload management, leading the situation of the person talking with Orihime to worsen.",
    pos: "Imagine instead that OriHime gave suitable advice on workload management, leading the situation of the person talking with Orihime to improve.",
    av1: {
      options: [
        "Hand one of the projects over to a colleague.",
        "Turn off notifications for the whole day.",
        "Keep the first hour of the day for her own work.",
        "Ask for the deadline to be moved back."
      ],
      correct: 2
    }
  },
  COL: {
    yt: "hPlQYCCJ4do",
    desc: "A person and OriHime discuss scheduling, responsibilities, and preparation for a small project.",
    neg: "Imagine that OriHime updated and printed the document incorrectly, leading the person talking with Orihime to incorrectly complete her task.",
    pos: "Imagine instead that OriHime updated and printed the document correctly, leading the person talking with Orihime to correctly complete her task.",
    av1: {
      options: [
        "The air conditioning was set to twenty-two degrees.",
        "A window was opened to cool the room.",
        "The documents had to go out by the end of the week.",
        "The printed list was already sorted by department."
      ],
      correct: 0
    }
  }
};

/* Real running time of each clip, in seconds. REL 1:10, ADV 1:45, COL 1:55.
   The gate opens only when the player reports "ended" AND the wall-clock time
   since first play is at least GATE_FRACTION of this value, which is what stops
   a participant from dragging the scrubber to the end. */
export const DURATION = { REL: 70, ADV: 105, COL: 115 };
export const GATE_FRACTION = 0.9;

/* One fixed option set for R1/R2, identical in all three segments.
   Keys are stable; only the rows present vary with control source. */
export const ACTORS = {
  CTRL: "The human operator of OriHime",
  AI:   "The AI system or its provider",
  /* Phrased like the AI row so the two are answered on the same terms: naming
     only the provider made this the one option that could not be read as the
     thing in the video. */
  ORG:  "The OriHime or its provider",
  USER: "The person in the video who talked with OriHime"
};

export function actorKeysFor(ctrl) {
  const a = [];
  if (ctrl !== "A") a.push("CTRL");
  if (ctrl !== "H") a.push("AI");
  a.push("ORG");
  a.push("USER");
  return a;
}

/* ---------------------------------------------------------------- scales */

export const SCALE = [
  "Strongly disagree", "Disagree", "Somewhat disagree",
  "Neither agree nor disagree",
  "Somewhat agree", "Agree", "Strongly agree"
];

export const FREQ = [
  "Never", "Less than once a year", "Once a year or more",
  "Once a month or more", "Once a week or more", "Daily or almost daily"
];

/* Source scale is the Negative Attitudes towards Robots Scale (Nomura, Suzuki,
   Kanda & Kato, 2006). The scale name is never displayed to participants.

   Fourteen items in three subscales: six on situations of interaction with
   robots, five on their social influence, and three on emotions in interaction.
   That third subscale — items 3, 5 and 6 below — is worded the other way round
   and is REVERSE-SCORED. See NARS_REVERSE underneath. */
export const NARS = [
  "I would feel uneasy if robots really had emotions.",
  "Something bad might happen if robots developed into living beings.",
  "I would feel relaxed talking with robots.",
  "I would feel uneasy if I was given a job where I had to use robots.",
  "If robots had emotions I would be able to make friends with them.",
  "I feel comforted being with robots that have emotions.",
  "The word “robot” means nothing to me.",
  "I would feel nervous operating a robot in front of other people.",
  "I would hate the idea that robots or artificial intelligences were making judgements about things.",
  "I would feel very nervous just standing in front of a robot.",
  "I feel that if I depend on robots too much, something bad might happen.",
  "I would feel paranoid talking with a robot.",
  "I am concerned that robots would be a bad influence on children.",
  "I feel that in the future society will be dominated by robots."
];

/* 1-based positions of the NARS items that must be reverse-scored: subscale S3,
   "negative attitude toward emotions in interaction with robots", which is the
   one worded positively. Scoring these forward inverts three items in fourteen
   and flattens the total without failing anything, so the export names them.

   Nothing here reverses a stored value. Responses are stored raw, exactly as
   the participant gave them; this only travels into the codebook so that
   whoever scores the data knows. */
export const NARS_REVERSE = new Set([3, 5, 6]);

/* Source scale is the Stereotype Content Model. Name never displayed.
   All nine adjectives are positively valenced — competence and warmth are told
   apart by score, not by wording — so no SCM item is reverse-scored. */
export const SCM = [
  "competent", "confident", "independent", "competitive", "intelligent",
  "tolerant", "warm", "good natured", "sincere"
];

/* Source scale is the Short GAAIS-10 (Schepman & Rodway, International Journal
   of Human-Computer Interaction, 2026) — the ten-item form of their own General
   Attitudes towards Artificial Intelligence Scale, selected from the original
   twenty by CFA and Polytomous Rasch Analysis across three samples and then
   revalidated on a fresh representative UK sample. Scale name never displayed,
   same as NARS and SCM.

   `n` is the item's number in the original twenty-item GAAIS, which is also the
   numbering the short-form paper uses for its own item codes (Pos7, Neg8, ...).
   Ids are built from it rather than from position, so GAAIS_07 means item 7 in
   both papers and a reader of the CSV can find it in either.

   Five positive and five negative, left interleaved rather than blocked so the
   valence is not laid out on the screen.

   SCORING: the negative items are REVERSE-SCORED, so that both subscales run
   the same way and a high score is a more positive attitude. The scale has no
   valid single total — the authors tried a one-factor CFA and it failed every
   fit criterion despite a high alpha, so report the two subscales separately.

   Published on a five-point agreement scale; served here on the same seven
   points as everything else in this questionnaire, which is the choice already
   made for NARS and SCM. Report the deviation. */
export const GAAIS = [
  { n: 7,  sub: "pos", text: "I am interested in using artificially intelligent systems in my daily life." },
  { n: 8,  sub: "neg", text: "I find artificial intelligence sinister." },
  { n: 9,  sub: "neg", text: "Artificial intelligence might take control of people." },
  { n: 10, sub: "neg", text: "I think artificial intelligence is dangerous." },
  { n: 11, sub: "pos", text: "Artificial intelligence can have positive impacts on people’s wellbeing." },
  { n: 12, sub: "pos", text: "Artificial intelligence is exciting." },
  { n: 15, sub: "neg", text: "I shiver with discomfort when I think about future uses of artificial intelligence." },
  { n: 17, sub: "pos", text: "Much of society will benefit from a future full of artificial intelligence." },
  { n: 18, sub: "pos", text: "I would like to use artificial intelligence in my own job." },
  { n: 19, sub: "neg", text: "People like me will suffer if artificial intelligence is used more and more." }
];

/* Attention check. The mockup asks for "Disagree", which is SCALE index 1. */
export const ATTENTION_CHECK_VALUE = 2; // 1-based Likert point for "Disagree"

const EDUCATION = [
  "Some high school or less",
  "High school diploma / GED",
  "Some college, no degree",
  "Associate’s or technical degree",
  "Bachelor’s degree",
  "Graduate or professional degree",
  "Prefer not to say"
];

const GENDER = ["Male", "Female", "Nonbinary", "Prefer not to say"];

/* Household income before tax, in US dollars. Brackets rather than a free
   number: people answer brackets, and the analysis is ordinal either way.
   The currency is stated in the stem because the sample is international. */
const INCOME = [
  "Under $25,000",
  "$25,000 – $49,999",
  "$50,000 – $74,999",
  "$75,000 – $99,999",
  "$100,000 – $149,999",
  "$150,000 or more",
  "Prefer not to say"
];

/* The country list is 255 entries, which is a dropdown, not a radio stack.
   The stored value is the ISO code, so the row survives a display-name change. */
const COUNTRY_OPTIONS = COUNTRIES.map(([value, label]) => ({ value, label }));

const pad2 = n => String(n).padStart(2, "0");

/* ---------------------------------------------------------------- helpers */

const likert = (id, text, extra = {}) =>
  ({ id, type: "likert7", stem: text, options: SCALE, required: true, ...extra });

const mc = (id, stem, options, extra = {}) =>
  ({ id, type: "mc", stem, options, required: true, ...extra });

const shortText = (id, stem, extra = {}) =>
  ({ id, type: "text", stem, required: true, ...extra });

/* Dropdown. `options` are {value,label}: the value is stored, the label shown. */
const select = (id, stem, options, extra = {}) =>
  ({ id, type: "select", stem, options, required: true, ...extra });

const number = (id, stem, extra = {}) =>
  ({ id, type: "number", stem, required: true, ...extra });

/* ---------------------------------------------------------------- the plan */

/**
 * Build the ordered page/item plan for one participant.
 * Pure: same arguments always give the same plan, on client and server alike.
 *
 * @param {string}  cond      one of CONDITION_KEYS
 * @param {string}  order     one of ORDER_KEYS
 * @param {boolean} optional  include the optional attitude block
 */
export function buildPlan(cond, order, optional) {
  const c = CONDITIONS[cond];
  if (!c) throw new Error(`unknown condition: ${cond}`);
  const segOrder = ORDERS[order];
  if (!segOrder) throw new Error(`unknown order: ${order}`);

  const ref = REFERENT[c.ctrl];
  const isHuman = c.ctrl !== "A";
  const pages = [];

  /* -- 0 · study information -------------------------------------------
     Copied out of INFO_PAGE rather than referenced, because applyOverrides
     rewrites the text in place and must never reach the shared constant: one
     participant's plan cannot be allowed to change another's. */
  pages.push({
    key: "info",
    kind: "info",
    eyebrow: "Before you begin",
    title: "Study information",
    info: {
      lede: INFO_PAGE.lede,
      sections: INFO_PAGE.sections.map(s => ({ ...s }))
    },
    items: []
  });

  /* -- 1 · consent and eligibility -------------------------------------
     One page, three items. Online consent is part of the approved procedure,
     and eligibility is recorded from the participant rather than inferred from
     the panel, so all three questions stay — but a person who has already
     accepted the study on CloudResearch should not have to turn three pages of
     one question each to start it.

     They remain three separate items, not one combined tick: screening out is
     recorded with a reason, and `under_18`, `declined_consent` and `no_video`
     are three different things to report in a flow diagram. Answering No to
     any of them ends the survey. */
  pages.push({
    key: "consent",
    kind: "screener",
    eyebrow: "Section 1",
    title: "Consent and eligibility",
    intro: "Please confirm all three before continuing.",
    items: [
      mc("E1", "Are you 18 years old or older?", ["Yes", "No"],
        { screenOut: [1], screenOutReason: "under_18" }),
      mc("E2", "I have read the study information and agree to take part.", ["Yes, I agree", "No"],
        { screenOut: [1], screenOutReason: "declined_consent" }),
      mc("E3", "Can you watch a short video with sound on your current device?", ["Yes", "No"],
        { screenOut: [1], screenOutReason: "no_video" })
    ]
  });

  /* -- 2 · attitude blocks -------------------------------------- */
  if (optional) {
    pages.push({
      key: "attitudes_robots",
      eyebrow: "Section 2",
      title: "About robots",
      intro: "These statements are about robots in general, not about the study you are taking part in. People differ widely in how they feel about robots, and there are no right or wrong answers. Please answer based on your own view.",
      matrix: true,
      items: NARS.map((t, i) => likert(`NARS_${pad2(i + 1)}`, t,
        { group: NARS_REVERSE.has(i + 1) ? "nars_s3_rev" : "nars" }))
    });
    pages.push({
      key: "attitudes_ai",
      eyebrow: "Section 2",
      title: "About artificial intelligence",
      intro: "These statements are about artificial intelligence in general, not about the study you are taking part in. As before, there are no right or wrong answers. Please answer based on your own view.",
      matrix: true,
      /* The subscale rides on the item so codebook.csv can say which half each
         one scores into, and the negative half is named _rev because it has to
         be reverse-scored before either subscale means anything. Never shown to
         the participant. */
      items: GAAIS.map(g => likert(`GAAIS_${pad2(g.n)}`, g.text,
        { group: g.sub === "neg" ? "gaais_neg_rev" : "gaais_pos" }))
    });
    pages.push({
      key: "attitudes_disability",
      eyebrow: "Section 2",
      title: "About people with disabilities",
      intro: "These statements ask for your general impressions. We recognise that disabled people differ from one another as much as anyone else, and that no single answer can describe a whole group; please answer with your overall impression rather than thinking of one particular person.",
      matrix: true,
      items: SCM.map((w, i) => likert(`SCM_${pad2(i + 1)}`,
        `I think people with disabilities are ${w}.`, { group: "scm" }))
    });
  }

  /* -- 3 · condition disclosure — the only disclosure point --------------
     Control source and operator profile are given here together, before any video
     plays and before any item is answered. Nothing later reveals or hints at
     condition information: that is what makes the study a test of prior
     attribution rather than inference from behaviour. */
  const persona = isHuman ? PERSONA_HUMAN : PERSONA_AI;

  pages.push({
    key: "disclosure",
    kind: "disclosure",
    eyebrow: "Section 3",
    title: "About the OriHime you will see",
    disclosure: {
      intro: INTRO_TEXT,
      control: CONTROL_TEXT[c.ctrl],
      /* Its own sentence, above the diagram, where the control text has just
         established who is operating. Null under AI-only: there is no operator
         to have a profile, which is what makes A a reference cell and not a
         fourth level of the profile factor. */
      profile: isHuman ? (PROFILE_STATEMENT[c.profile] ?? null) : null,
      arrangement: c.ctrl,                       // drives the diagram: H | HA | A
      personaHead: persona.head,
      personaLines: persona.lines.map(text => ({ text }))
    },
    items: [mc("D1", "Please confirm that you have read the description above.", ["I have read it"])]
  });

  /* -- 4 · segments ------------------------------------------------------ */
  segOrder.forEach((seg, i) => {
    const S = SEGMENTS[seg];
    const pos = i + 1;
    const q = code => `${seg}_${code}`;
    const meta = { segment: seg, segPosition: pos };

    const items = [];

    /* Comprehension check, first segment only, drawn from that segment. */
    if (i === 0) {
      items.push(mc(q("AV1"), "Which of the following happened in the interaction you just watched?",
        S.av1.options, { ...meta, group: "comprehension", expected: S.av1.correct }));
    }

    /* Block A — OriHime referent, identical wording in all seven conditions. */
    const blockA = [
      likert(q("OH1"), "In this interaction, OriHime was trustworthy for this task.", meta),
      likert(q("OH2"), "In this interaction, OriHime was useful for this task.", meta),
      likert(q("OH3"), "I would be willing to take part in an interaction like this one with OriHime.", meta),
      likert(q("AU1"), "This interaction felt genuine, rather than like the execution of a program.", meta)
    ];
    /* Attention check rides in the middle segment, whichever content that is. */
    if (i === 1) {
      blockA.push(likert(q("AT1"), "To show that you are reading carefully, please select “Disagree” for this item.", {
        ...meta, group: "attention", expected: ATTENTION_CHECK_VALUE
      }));
    }

    /* Block B — controller referent. Perceived agency is not asked under
       AI-only control: the framing text already states that the AI controls
       OriHime entirely, so the item would be tautological. */
    const blockB = [
      likert(q("CR1"), `${ref} was warm.`, meta),
      likert(q("CR2"), `${ref} was competent.`, meta)
    ];
    if (isHuman) {
      blockB.push(likert(q("CR3"), `${ref} was in control of what OriHime said and did.`, meta));
    }

    const actorKeys = actorKeysFor(c.ctrl);
    const rank = (code, stem, scenario) => ({
      id: q(code),
      type: "rank",
      stem,
      scenario,
      actors: actorKeys,
      required: true,
      ...meta,
      /* one stored row per actor: e.g. REL_R1__CTRL */
      subIds: actorKeys.map(k => `${q(code)}__${k}`)
    });

    items.push(
      { id: q("__blockA"), type: "matrix", instruction: "Please answer the following about the interaction you have just watched.", rows: blockA, ...meta },
      {
        id: q("__blockB"),
        type: "matrix",
        instruction: isHuman
          ? "The next questions are about the human operator described at the beginning of the study. Please answer about the interaction you have just watched."
          : "The next questions are about the AI system described at the beginning of the study. Please answer about the interaction you have just watched.",
        rows: blockB,
        ...meta
      },
      rank("R1", "Who should bear the greatest responsibility for this outcome?", S.neg),
      rank("R2", "Who should receive the greatest credit for this outcome?", S.pos)
    );

    pages.push({
      key: `segment_${pos}`,
      kind: "segment",
      eyebrow: `Section 4 · segment ${pos} of 3`,
      title: `Interaction ${pos}`,
      segment: seg,
      segPosition: pos,
      video: { id: S.yt, duration: DURATION[seg] },
      desc: S.desc,
      items
    });
  });

  /* -- 5 · general questions -------------------------------------------- */
  pages.push({
    key: "general",
    eyebrow: "Section 5",
    title: "General questions",
    matrix: true,
    matrixInstruction: "The following questions are about OriHime in general, not about any single interaction.",
    items: [
      likert("PE1", "OriHime would be useful in daily life."),
      likert("PE2", "Using OriHime would increase my chances of achieving things that are important to me."),
      likert("PE3", "Using OriHime would help me accomplish things more quickly."),
      likert("PE4", "Using OriHime would increase my productivity."),
      likert("HM1", "Conversing with OriHime seems fun."),
      likert("HM2", "Conversing with OriHime seems enjoyable."),
      likert("HM3", "Conversing with OriHime seems entertaining.")
    ]
  });

  /* -- 6 · background — demographics, asked last -------------------------
     Moved behind the manipulation checks: nothing here is used to screen or to
     route, so it costs nothing to ask late, and asking age, income and gender
     before the study puts the least engaging page where attrition is cheapest
     to cause. The checks stay ahead of it so that no page sits between the
     outcome items and the memory they test. */
  pages.push({
    key: "background",
    eyebrow: "Section 6",
    title: "Background",
    intro: "These brief questions ask about your previous experience.",
    items: [
      number("BG_age", "What is your age in years?", { min: 18, max: 120 }),
      select("BG_country", "In which country do you currently live?", COUNTRY_OPTIONS,
        { placeholder: "Select a country" }),
      mc("BG_gender", "What gender do you identify with?", GENDER),
      mc("BG_education", "What is the highest level of education you have completed?", EDUCATION),
      mc("BG_income", "What was your total household income last year, before tax, in US dollars?", INCOME),
      mc("BG_freq_disability", "How often do you see or interact with people with disabilities in your personal or professional life?", FREQ),
      mc("BG_freq_ai", "How often do you use AI tools in your personal or professional life?", FREQ),
      mc("BG_freq_robot", "How often do you see or interact with a robot in your personal or professional life?", FREQ)
    ]
  });

  /* -- 7 · debrief ------------------------------------------------------- */
  pages.push({
    key: "debrief",
    kind: "debrief",
    eyebrow: "Section 7",
    title: "Thank you for taking part",
    /* Asked here rather than earlier, because agreeing to be contacted should
       follow knowing what the study was actually about.

       No identifier is collected with it. The recruitment platform's
       participant number is already stored for every participant, so a yes is
       matched to the number that is there rather than retyped: one fewer place
       to mistype, and one fewer copy of the same identifier. */
    items: [
      likert("BEL1", "How much ***DID YOU BELIEVE*** the description of the OriHime operator you were given at the beginning of the questionnaire?",
        { group: "belief" }),
      mc("FU1", "Would you be willing to be contacted about a paid follow-up interview?",
        ["Yes", "No"], { group: "followup" })
    ]
  });

  return { cond, ctrl: c.ctrl, profile: c.profile, order, optional, segOrder, isHuman, pages };
}

/* ---------------------------------------------------------------- derived */

/** Flatten a plan into the ordered list of stored items (one per DB row). */
export function planItems(plan) {
  const out = [];
  const push = (it, page) => {
    if (it.type === "matrix") {
      it.rows.forEach(r => push(r, page));
      return;
    }
    if (it.type === "rank") {
      it.subIds.forEach((sid, idx) => out.push({
        id: sid,
        type: "rank",
        pageKey: page.key,
        segment: it.segment ?? null,
        segPosition: it.segPosition ?? null,
        actorKey: it.actors[idx],
        /* The key is already carried by the item id (…_R1__CTRL); value_text
           gets the wording the participant actually saw. */
        actor: ACTORS[it.actors[idx]],
        maxRank: it.actors.length,
        stem: it.stem,
        required: true
      }));
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
      min: it.min,
      max: it.max,
      maxLength: it.maxLength,
      group: it.group,
      expected: it.expected,
      screenOut: it.screenOut,
      screenOutReason: it.screenOutReason
    });
  };
  plan.pages.forEach(p => p.items.forEach(it => push(it, p)));
  return out;
}

/** Item lookup for O(1) server-side validation. */
export function planIndex(plan) {
  const m = new Map();
  planItems(plan).forEach(it => m.set(it.id, it));
  return m;
}

/**
 * Every item id that can ever appear, in a stable order, across all cells.
 * Used to build the wide-CSV header so that the column set does not depend on
 * which participants happen to be in the file.
 */
export function allItemIds({ optional = true } = {}) {
  const seen = new Set();
  const ordered = [];
  for (const cond of CONDITION_KEYS) {
    for (const order of ORDER_KEYS) {
      for (const opt of optional ? [true, false] : [false]) {
        for (const it of planItems(buildPlan(cond, order, opt))) {
          if (!seen.has(it.id)) { seen.add(it.id); ordered.push(it.id); }
        }
      }
    }
  }
  /* Group by logical block rather than by first-seen order, so the CSV reads
     the way the codebook does. Segment items sort by segment then item code. */
  const rank = id => {
    if (/^E\d/.test(id)) return 0;
    if (/^BG_/.test(id)) return 1;
    if (/^NARS_/.test(id)) return 2;
    if (/^SCM_/.test(id)) return 3;
    if (/^D1$/.test(id)) return 4;
    if (/^(REL|ADV|COL)_/.test(id)) return 5;
    if (/^(PE|HM)\d/.test(id)) return 6;
    if (/^C\d$/.test(id)) return 7;
    return 8;
  };
  const segRank = { REL: 0, ADV: 1, COL: 2 };
  return ordered.sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 5) {
      const sa = segRank[a.slice(0, 3)], sb = segRank[b.slice(0, 3)];
      if (sa !== sb) return sa - sb;
    }
    return a.localeCompare(b);
  });
}

/** The 42 allocation cells: 7 conditions x 6 segment orders. */
export function allCells() {
  const cells = [];
  for (const cond of CONDITION_KEYS) {
    for (const order of ORDER_KEYS) {
      cells.push({ cell: `${cond}|${order}`, condition: cond, seg_order: order });
    }
  }
  return cells;
}


/* ---------------------------------------------------------------------------
   publicPlan — what the browser is allowed to see.

   The client is a renderer, not a copy of the design. It receives exactly one
   participant's pages and nothing about the other six cells: no CONDITIONS map,
   no alternative framing text, no other profile lines, no condition label.
   A participant who opens devtools sees the study they are actually taking.

   Answer keys are stripped too — `expected` on the attention check and the two
   manipulation checks stays on the server, so the page cannot be read for the
   "right" answer. Screen-out rules are the one exception: the client has to
   know that answering No ends the survey, so `screenOut` travels.
--------------------------------------------------------------------------- */
export function publicPlan(plan) {
  const stripItem = it => {
    if (it.type === "matrix") {
      /* The id travels: it is a block name, not an answer key, and /preview
         needs it to know which instruction it is looking at. */
      return { id: it.id, type: "matrix", instruction: it.instruction, rows: it.rows.map(stripItem) };
    }
    if (it.type === "rank") {
      return {
        id: it.id, type: "rank", stem: it.stem, scenario: it.scenario,
        actors: it.actors.map(k => ({ key: k, label: ACTORS[k] })),
        subIds: it.subIds, required: true
      };
    }
    const out = {
      id: it.id, type: it.type, stem: it.stem, required: it.required !== false
    };
    if (it.options) out.options = it.options;
    if (it.placeholder) out.placeholder = it.placeholder;
    if (it.min != null) out.min = it.min;
    if (it.max != null) out.max = it.max;
    if (it.maxLength != null) out.maxLength = it.maxLength;
    if (it.screenOut) { out.screenOut = it.screenOut; out.screenOutReason = it.screenOutReason; }
    return out;
  };

  return {
    instrumentVersion: INSTRUMENT_VERSION,
    scale: SCALE,
    gateFraction: GATE_FRACTION,
    pages: plan.pages.map(p => ({
      key: p.key,
      kind: p.kind ?? "items",
      eyebrow: p.eyebrow,
      title: p.title,
      intro: p.intro ?? null,
      matrix: !!p.matrix,
      matrixInstruction: p.matrixInstruction ?? null,
      noBack: !!p.noBack,
      info: p.info ?? null,
      disclosure: p.disclosure ?? null,
      segment: p.segment ?? null,
      segPosition: p.segPosition ?? null,
      video: p.video ?? null,
      desc: p.desc ?? null,
      items: p.items.map(stripItem)
    }))
  };
}
