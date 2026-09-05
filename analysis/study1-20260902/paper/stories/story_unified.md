# Unified storyline — Bringing the Human Back?

> Status: **adopted 2026-09-05** as the single frame for the CHI 2027 manuscript. It carries the four candidate storylines (A presence-not-profile, B who-gets-the-credit, C disclosure-does-not-change-judgment, D in-the-eye-of-the-sceptic) as sections of one paper rather than as competing headlines. Structure proposed by the PI; ordering and framing rules below are the analyst's adjustments, marked ▲.

## One-line thesis
When observers judge a teleoperated avatar robot at work, what changes their judgment is whether a human is described as present in the loop — not who that human is, and not whether AI assists — yet as soon as AI is described as involved, responsibility and credit begin to migrate from the operator to the AI.

## Title candidates
1. Bringing the Human Back? How Disclosing Who Controls an Avatar Robot Shapes Judgments of Genuineness, Warmth and Responsibility
2. Who Is Behind the Robot? Control Disclosure, Operator Disability and Attribution in Avatar Work
3. Presence, Not Profile: Disclosed Control Source and Operator Disability in Judgments of a Teleoperated Avatar Robot

## Section frame (PI structure, with adjustments ▲)

### 1 Introduction
- **1.1 Big background.** Remote operation and telepresence let people work in places their bodies cannot reach. OriHime (OryLab, Tokyo) turns this into employment: operators with severe physical disabilities serve customers and join meetings through the robot (Avatar Robot Café DAWN ver.β; "avatar work"). Japan's labour shortage, its disability-employment quota system and the Moonshot cybernetic-avatar programme make this the leading real deployment. AI assistance is now entering the same loop (speech support, shared autonomy, generated responses), so the people who meet an avatar robot often cannot tell — and are usually *told*, in a sentence — who or what is behind it.
- **1.2 Why these questions.** Coworkers and customers judge the interaction from a description plus what they see. Three things a description can disclose are (A) the control source, (B) implicitly, who deserves credit or blame for what the robot does, and (C) something about the operator, such as a disability. We do not know whether any of these change how an *identical* interaction is judged.
  - RQ-A Does the disclosed control source (human / human with AI / AI only) change how the interaction and the controller are judged?
  - RQ-B When AI is disclosed as involved, who is held responsible and who is credited?
  - RQ-C Does disclosing that the operator has a disability change those judgments and attributions?
  - RQ-D (exploratory) For whom does the AI-only description matter?
- **1.3 Contributions.** (1) An experiment with behaviour held constant that isolates the effect of disclosure; (2) evidence that human presence, not AI assistance or operator profile, drives genuineness and warmth; (3) evidence that attribution shifts to AI even where perception does not; (4) a bounded null for disability disclosure with equivalence bounds, Bayes factors and a moderator search; (5) Study 2, a no-disclosure study of the same clips that shows what the disclosures were working against.
- ▲ RQs and contributions close the Introduction, before Related Work (CHI convention); the literature then answers "what is known" for each RQ.

### 2 Related work
2.1 Avatar robots and avatar work (OriHime, telepresence at work, Japan). 2.2 Disclosing automation: mind perception, Wizard-of-Oz, bot-disclosure and algorithm-aversion effects. 2.3 Responsibility and credit in human–AI teams (moral crumple zone; blame to robots; credit for AI-assisted work). 2.4 Disability disclosure, stigma and the stereotype content model; contact effects. 2.5 Gap statement tying 2.1–2.4 to RQ-A/B/C.

### 3 Study 1 — Method
Between-subjects 3 × 2 + 1 (H/HA × no-mention/intellectual/mobility; A single cell), three within-subject clips (REL 70 s, ADV 105 s, COL 115 s) in six orders; N = 300, primary n = 272 (attention + video checks); measures OH1–3 composite, AU1, CR1, CR2, CR3, BEL1, responsibility and credit rankings, GAAIS, NARS, SCM, contact; pre-specified LMM with participant random intercept, contrasts C1–C4 (+C5 pooled), Holm within families, TOST bounds set at design MDE (±.35 SD for OH, ±.50 otherwise), participant-unit BIC Bayes factors, cluster bootstrap for heteroscedastic A cell. State plainly: pre-specified before inference, not preregistered.

### 4 Study 1 — Results (▲ order A → B → C → D)
- **4.1 Checks.** Attention/video exclusions; BEL1 credibility equal across conditions (p .451); CR3 shows the human-vs-AI description was read (H > HA d .40); disclosure page dwell +5.5 s.
- **4.2 RQ-A control source.** Omnibus condition effect on AU1 (LRT p .004), CR1 marginal, OH and CR2 not. C1 human vs AI: AU1 d .62 in every specification, CR1 d .52, OH via OH2 usefulness; C2 H vs HA equivalent within ±.35/±.50 SD (TOST). Pairwise pattern rule: 10 of 84 primary pairs uncorrected p < .05 (≈4 expected), every one a human cell above A, 0 of 60 among human cells; Holm survivors AU1 H1/H3/HA1 > A and CR3. A cell has 1.3–1.5× larger SDs; bootstrap agrees.
- **4.3 RQ-B attribution.** Ranked-#1 GEE: AI involvement lowers the odds that the operator is ranked first for responsibility and credit (OR .47/.42; common-anchor .59/.61); Plackett–Luce worths; in HA the operator is ranked first for blame more often than for credit (+4.8 pts, p .024) — the asymmetry runs against the human.
- **4.4 RQ-C disability disclosure.** C3 disclosed vs no mention: all four primary DVs n.s. (p ≥ .11), point estimates small and slightly negative (d ≈ −.24 at most), TOST excludes |d| ≥ .50, BF01 3–12 on participant units; C4 intellectual = mobility; C5 pooled same; no moderator among clip, contact, stereotype content, position (D1–D8 sweep); attribution unchanged (OR .80–.89); uptake evidence (dwell) shows the sentence was read.
- **4.5 Exploratory.** E1: the AI-only penalty is concentrated among participants with less positive AI attitudes (interaction p .019 OH, .003 CR2; simple slopes); OH2 usefulness carries the OH difference; REL-clip CR2 hint; bookkeeping: 113 exploratory tests, 37 at p < .05, none promoted.

### 5 Study 2 — Default impressions of the same clips
- **Purpose.** Study 1 alone cannot say whether each disclosure agreed with, cut against, or filled a blank in what the clips imply on their own. Study 2 (Track A, instrument s2-v4, fresh sample, ~300 usable) shows the same three clips with no description of control and asks who viewers think is controlling OriHime (WHO), whether a person involved has a disability (DIS), felt genuineness (AU1), each with confidence; prior OriHime familiarity at the end.
- **Pre-specified interpretation rules** (written before data): control — W1 majority "human involved" (Study 1's A description cut against the default: penalty is a *violation* effect), W2 majority "AI only" (H/HA descriptions *restored* the human: "bringing the human back" literally), W3 split/"can't tell" (descriptions filled a blank); disability — Da majority "no disability" (no-mention control ≈ no-disability; C3 compares an explicit label with an implicit absence), Db majority "yes" (no-mention already carried disability; C3 null weakens to "explicit vs implicit"), Dc majority "can't tell" (cleanest reading of the null).
- **Results.** `[PLACEHOLDER — data not collected as of 2026-09-05; never to be drafted from assumptions]`.
- ▲ Study 2 is a supplement, not a replication; every Study 1–Study 2 comparison is a cohort comparison. It gets its own short section before the Discussion, as the PI proposed.

### 6 Discussion
- 6.1 Presence, not profile: what the human label buys (genuineness, warmth) and what AI assistance does not cost.
- 6.2 Accountability migrates before perception does: HA looked like H but was credited like A.
- 6.3 What the disability null does and does not license (see framing rules below).
- 6.4 Who pays the AI-only penalty: the sceptic (exploratory, needs replication).
- 6.5 Reading Study 1 through Study 2: which of W1–W3 / Da–Dc obtained and what it changes.

### 7 Design implications
1. Disclosure wording that keeps the human visible ("operated by a team member, with AI assistance", never "AI-powered") preserves genuineness without hiding AI.
2. Credit protocols for assisted work: make the operator's contribution legible (operator identity on the robot, contribution logs, credit lines) because observers spontaneously re-assign credit to the AI.
3. Disability disclosure as the operator's choice: no observed cost, no observed benefit; systems should not require it and should not prevent it.
4. Audience-aware disclosure for AI-sceptical publics (tentative; exploratory basis).
5. Methodological: HRI papers should report bounded nulls (equivalence bounds, Bayes factors) rather than "no effect".

### 8 Limitations, 9 Conclusion, mandatory statements
Single-sentence manipulations; A cell n = 36; clips fixed and not neutral; hypothetical responsibility/credit outcomes; US-centred sample judging a Japanese deployment; BEL1 post-treatment; not preregistered; Study 2 separate cohort. Data availability, ethics (Keio University Graduate School of Media Design; consent; retention to 2036-08-31), CRediT, COI, funding, AI-use disclosure.

## Framing rules for RQ-C (the "is the null good news?" question)
The PI asked whether the non-significant disability result can be presented as a good thing ("more inclusive?"). Rules the manuscript follows:
1. **Allowed:** "Disclosing the operator's disability produced no detectable cost in how the interaction was judged or in who was credited; effects of half a standard deviation or larger are excluded." This is positive-leaning and defensible.
2. **Allowed with the boundary stated:** "A one-line disclosure did not override what participants saw; judgments followed the observed interaction, not the label" — but only if Study 2 returns Da or Dc. Under Db the sentence becomes "explicit disclosure added nothing to an impression the clips already gave".
3. **Not allowed:** "The workplace is more inclusive", "disclosure has no effect", "there is no stigma". Inclusion is an outcome for operators; we measured third-party judgments of one competent interaction. A null is not proof of absence: effects to about d = −.24 remain compatible with the data, and the equal-training sentence may have neutralised the competence stereotype.
4. **Recommended wording:** "no observable cost of disclosure in this setting" + the three boundary conditions (textual disclosure, competent behaviour, equal-training assurance) + Study 2's default-impression result.

## Evidence tags used in the Results
`[pre-specified]` C1–C4, TOST, attribution GEE, checks · `[pre-specified, added after cross-review]` bootstrap, participant-unit BF, common anchor · `[exploratory]` E1–E8, D1–D8, REL hint, pairwise beyond Holm survivors.

## Defensibility
High for RQ-A and RQ-B (robust across specifications, survive correction); medium for RQ-C as a bounded null, conditional on Study 2 not returning Db; low for RQ-D, presented only as exploratory.

## Reviewer risks and answers
- "A is one small cell." → n = 36, larger variance; bootstrap and Welch agree; MDE .50 stated; pattern rule (10/84, all vs A, 0/60 within humans).
- "Genuineness item echoes the manipulation." → CR1 warmth, OH2 usefulness and attribution show the same direction with different wording; CR3 given as manipulation evidence, not outcome.
- "Null from a weak manipulation." → uptake (dwell), bounds, BF, contrast case (the AI-only sentence *did* work), Study 2.
- "Not preregistered." → analysis plan fixed before inference; exploratory tests counted and labelled.
- "Hypothetical outcomes for attribution." → acknowledged; direction consistent across two measures and PL worths.
