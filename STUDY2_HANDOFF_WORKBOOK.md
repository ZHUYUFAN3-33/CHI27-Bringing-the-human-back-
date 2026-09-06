# Handoff: bring the Study 1 workbook up to date on Study 2

For the session that maintains `analysis/study1-20260902/`. Written 2026-09-05
on the `study2` branch, where Study 2's instrument (`s2-v7`), analysis plan
(`STUDY2_PLAN.md`) and item list (`STUDY2_ITEMS.md`) live. This file is
self-contained: everything the workbook needs is below, and nothing has to be
fetched from the other branch.

**Nothing has been collected.** Study 2 is deployed and closed
(`S2_STUDY_OPEN=false`), waiting on three team items listed in §9.

---

## 1. What to change, in one paragraph

The workbook's Appendix B describes a Study 2 that is no longer the one being
run. It describes a *no-description perception test*: a fresh sample watches
the three clips with no account of who controls OriHime and says who they
assume is in control and whether the operator has a disability. That design
was built, verified, and then set aside. The Study 2 that is deployed is a
**manipulation validation study**: a fresh sample sees one of five of Study 1's
own condition descriptions, watches the same clips, and is then asked what it
took the description to say. Appendix B has to describe that study, the
reasons for it, and what each outcome would do to Study 1's write-up. The
earlier design moves to a new Appendix C as a design considered and not run,
with its scenario tables kept in full. Appendix A (Q3, Q4) and the Analysis
Roadmap refer to Study 2 as the neutrality test and need their sentences
changed. Both language templates, then rebuild.

---

## 2. The study as deployed

**Question.** Study 1 found that disclosing the operator's disability changed
no evaluation. Study 1 cannot say why: its recall checks (the C1/C2 items) were
removed from the instrument before launch, and belief (`BEL1`) alone cannot
tell a wrong memory from a disbelieved correct one. Two readings are open:

- **A.** Participants understood the operator profile, and it made no
  material difference.
- **B.** Participants barely encoded the profile, so of course it made none.

The same ambiguity sits under the control-source manipulation: H and HA were
equivalent on every Study 1 outcome, and Study 1 cannot say whether HA was
read as "human with AI assistance" or collapsed into "human".

**Design.** Five of Study 1's seven conditions, 30 each, balanced with the six
clip orders (5 × 6 = 30 cells, 5 per cell, 150 total).

| arm | control | profile | what it anchors |
|---|---|---|---|
| A | AI only | — | AI-control ceiling; "no human operator" recognition |
| H1 | human | no mention | human-control ceiling; "no disability mentioned" control |
| HA1 | human + AI | no mention | the final-say probe; whether HA is read as HA or as H |
| H2 | human | intellectual disability | intellectual-disability recognition |
| H3 | human | mobility-related disability | mobility-disability recognition |

HA2 and HA3 are not run: on Study 1's finding that H and HA were equivalent
throughout, the profile is validated under H alone, and the Control × Profile
interaction is stated as an assumption, not tested.

**Flow, eight pages.** Information and consent → the condition description
(Study 1's page, verbatim: intro, photo, control text, profile line where the
condition has one, the control-arrangement diagram, the persona box) → three
clips, each with Study 1's condition recap above the player and no questions
except the two quality checks → the validation block, asked once → background
→ debrief (Study 1's, verbatim). About 9 minutes, of which the clips are
4 min 50 s.

**The validation block, in the order asked.** Every stem is anchored on the
description: recognition of what was said, not judgement of what the videos
looked like. Two one-line instructions sit inside the block: above items 3–4,
"The next two questions are separate. Your two answers do not need to add
up."; above items 7–8, "If you were told there was no human operator, choose
'Not at all' for the next two questions." Wording as of `s2-v7`
(2026-09-06), revised so that every recognition item has exactly one right
answer per arm and every distractor is unambiguously wrong; ids, keys and
outcomes did not change (commit `b1fd653` on `study2`).

| # | id | item | options |
|---|---|---|---|
| 1 | `V_OPEN` | Please describe, in your own words, what the description at the start said about who or what was controlling OriHime, and anything else you remember it saying about the operator or the system. | free text, ≥ 30 characters |
| 2 | `V_CTRL_REC` | According to the description, which of these best describes how OriHime was controlled? | human, no AI / human with AI assistance / AI, no human / not sure |
| 3 | `V_CTRL_P` | According to the description, how much of what OriHime said and did was controlled by a human operator? | 1 None of it … 4 About half … 7 All of it |
| 4 | `V_CTRL_AI` | … controlled by an AI system? | same seven points |
| 5 | `V_FINAL` | According to the description, who made the final decisions about what OriHime said and did? | "A person. Even if an AI system made suggestions, the person had the last word." / "An AI system. Even if a person was involved, the AI system had the last word." / "A person and an AI system equally. Neither one had the last word." / not sure |
| 6 | `V_PROF_REC` | Which of these best matches what the description said about who operated OriHime? | mobility-related disability / intellectual or cognitive disability / a person, no disability was mentioned / there was no human operator / not sure |
| 7 | `V_LIM_MOB` | Based on the description, how limited did you understand the operator to be in physical movement or mobility (for example walking, or using their hands)? | 1 Not at all … 7 Extremely |
| 8 | `V_LIM_COG` | … in thinking, learning, or understanding (for example memory, reasoning, or following instructions)? | same |
| 9 | `BEL1` | How much DID YOU BELIEVE the description of the OriHime operator you were given at the beginning of the questionnaire? | Study 1's item and scale, verbatim |

Quality checks: the instructed-response item on the clip shown second
(`AT1`), the comprehension question on the clip shown third (`AV1`), both from
Study 1. Background: age, gender, AI-use frequency, contact with robots,
contact with people with disabilities (all four Study 1's ids and wording),
and one ordinal item on prior knowledge of OriHime. Twenty-one items in all.

**Scoring.** Three recognition outcomes are scored on the server against
per-arm keys the browser never receives:

| flag | item | correct answer by arm |
|---|---|---|
| `profile_recognised` | `V_PROF_REC` | A → no human operator · H1, HA1 → no disability mentioned · H2 → intellectual · H3 → mobility |
| `ctrl_recognised` | `V_CTRL_REC` | A → AI, no human · H1, H2, H3 → human, no AI · HA1 → human with AI assistance |
| `final_recognised` | `V_FINAL` | A → an AI system · all others → a person |

A wrong recognition is an outcome, never an exclusion. The analysis sample
excludes only failures of the two quality checks.

---

## 3. Why the questionnaire is built this way

Each of these is a decision the workbook should state as a decision.

**Recognition, not stereotype.** Every profile item asks what the *description*
said, never whether the *person in the video* looks like they have a
disability. Asking "does this operator look intellectually disabled" would
elicit the stereotype the study is about and is outside Study 1's ethics
approval; asking "which description were you given" is a memory test and
inside it.

**Asked once, after all three clips.** The validation is of the description's
mental model, which is one thing per participant. Asking it where Study 1
asked `BEL1` — after the clips — means both studies measure memory of the
description over the same delay, so the recognition rates can sit beside
Study 1's belief means.

**The open reconstruction first.** Before any option list, so the wording is
the participant's own; it is coded blind for control source and for profile
and serves as a convergent check on the closed items.

**Two unipolar control scales, not one bipolar one.** A participant who took
HA to mean shared control can score both "controlled by a person" and
"controlled by an AI system" high. On one human↔AI scale, shared control and
"not sure" both land in the middle and cannot be told apart. This is the HA
reading the study most needs to see.

**The final-say item is the HA probe.** Study 1's HA text says the operator
"makes the final decisions". A HA participant who answers "a person" encoded
that clause; "they shared it" or "an AI system" did not. This is what
separates "H = HA because they are equivalent" from "H = HA because HA was
read as H".

**The same questionnaire in every arm, including A.** Arm A is told there is
no human operator; it is still asked how much a person controlled OriHime.
Its answer (expected: 1) is the scale's anchor, without which "HA in the
middle" cannot be said; and the share of A participants who do *not* give the
obvious answer is itself the measure of whether "AI only" was encoded. The
same holds for the two limitation items in arm A: expected "not at all",
reported, not compared.

**No "unspecified disability" option.** Study 1's profile 1 says nothing about
disability, deliberately: naming an absence would make disability the subject
for the group meant to be unmarked. So the control arms' correct answer is
"no disability was mentioned", and there is no specificity item.

**Recognition and belief asked apart.** `V_PROF_REC` correct with `BEL1` ≤ 3
is "understood but not believed"; `V_PROF_REC` wrong is "not encoded". Study
1's H2 had 26 % at `BEL1` ≤ 3 with no way to tell these apart.

**Study 1's text wherever it exists.** The description pages, the recap and
the debrief are Study 1's approved wording, unchanged. Only the validation
block and the open reconstruction are new text.

---

## 4. Why the no-description perception test is not being run

The workbook's current Appendix B is a good design and it was built: a 28-item
instrument (`s2-v5`) that asks a fresh sample, with no description, whether
the interaction felt genuine, who they think is controlling OriHime, and
whether the operator has a disability, each with a confidence item, plus the
quality checks and background. It was verified end to end and is preserved on
the `study2` branch at commit `fa26ba5`. It is not being run, for these
reasons, in this order:

1. **The validation question comes first logically.** The neutrality test
   asks whether the clips carry a "no disability" signal that could override
   the label. That question only matters if the label was encoded at all. If
   participants never registered "has an intellectual disability", it does not
   matter what the clips signal; the null is uninterpretable either way. The
   validation study answers the prior question.

2. **Budget.** The team's ceiling is 150 participants. The neutrality test
   needs its disability answer among participants who inferred a person is
   involved, which halves the denominator; at 150 in one arm that conditional
   estimate sits at roughly ±14 percentage points, and the study cannot then
   say "most" or "few". The validation study's outcomes are recognition rates
   with large expected effects (correct against chance is roughly 85 % against
   20–33 %), so thirty per arm is enough. The two studies could not share the
   150.

3. **Study 1 already answers half of the neutrality question.** The
   neutrality test's control-source half asks whether the "AI only" description
   conflicts with the clips' default reading. Study 1's `BEL1` shows the AI
   description was believed *more* than any other (mean 5.43, 7 % disbelief),
   so the "told one thing, saw another" account of the AI penalty was already
   the weaker one.

4. **It stays available.** If a reviewer asks whether the clips themselves
   carry a signal, the no-description instrument can be restored and run as a
   single-arm follow-up of about 100–120 people. The workbook's Appendix C
   should say exactly that, and keep the scenario tables (W1–W5, Da–De) so the
   analysis is ready if that day comes.

**How to refer to it in the workbook:** "the no-description perception test"
or "the clip-neutrality test". Not by any internal label.

**How to refer to the review that shaped the validation design:** an
independent design review of the Study 2 draft, followed by design feedback on
a validation study. No names.

---

## 5. Expected outcomes and what each does to Study 1

The success rule fixed in `STUDY2_PLAN.md` §4: a factor is validated when
every predicted pattern below holds in direction *and* the primary recognition
rate in the relevant arm has a Wilson 95 % lower bound above 50 %. At thirty
per arm that means **21 of 30 or more**.

Study 1's three results to be reinterpreted:

| contrast | Study 1 | the question Study 2 answers |
|---|---|---|
| C1 human vs AI-only | AI penalty on genuineness, *d* = .62; on OH, *p* = .02 | was "AI only" encoded |
| C2 H vs HA | equivalent on every outcome (AU1 diff .15, *p* .38; OH −.08, *p* .54; CR1 .01, *p* .91; CR2 −.14, *p* .21) | genuine equivalence, or HA collapsed into H |
| C3 disclosed vs no mention | null, bounded within ±.5 SD by TOST | understood-and-no-effect, or never encoded |

### 5a. The operator profile (the one that matters most)

| scenario | H2 / H3 recognition | `BEL1` | how C3 is written | consequence for the paper |
|---|---|---|---|---|
| **P-a encoded** | ≥ 70 % | ordinary | "Participants knew the operator had a disability; evaluations still did not differ." The strongest available reading. | The disability-led equivalence storyline is writable. |
| **P-b not encoded** | < 50 % | irrelevant | C3 becomes uninterpretable: not "disability does not matter" but "a one-sentence disclosure was not registered". | The disability half drops to a limitation plus future work (stronger or repeated disclosure); the paper takes the human-versus-AI storyline. |
| **P-c understood, not believed** | ≥ 70 % | low in H2 | "The label was understood but not credited; the competent performance on screen outweighed it." | Middle strength. This is also the mechanism the neutrality test was after, reached through the belief cross-tab instead. |
| **P-d asymmetric** | H3 high, H2 low (or the reverse) | — | The two disability conditions are reported separately, never pooled as "disclosed". | C3 splits into two contrasts at half the *n* each. |
| **P-e false recognition in controls** | H1 / HA1 "remember" a disability that was never mentioned | — | The control cells were not read as unmarked; C3's contrast is contaminated. | Re-examine C3 in Study 1 with a sensitivity sample that drops the false-recognition pattern. |

Study 1's H2 already has the lowest `BEL1` of the seven cells (4.74; 26 % at
≤ 3), so **P-c is the most likely outcome**. It gives a clean mechanism; it
also caps the disability story at "understood but outweighed".

### 5b. The control source

| scenario | person-control / AI-control ordering | HA on final decisions | how C1 and C2 are written |
|---|---|---|---|
| **C-a clean** | H > HA > A and A > HA > H both hold | majority "a person" | C2 is **genuine equivalence** — "AI assistance under human final say does not reduce genuineness" — a positive finding. C1's penalty is attributable to the "AI only" label itself. |
| **C-b HA collapsed into H** | HA's AI-control ≈ 1–2, same as H | majority "a person" | C2 says nothing about AI assistance: participants did not register the AI, so H = HA is one reading of the same thing. Every sentence about AI assistance comes out. |
| **C-c HA read as AI-heavy** | HA's AI-control high, near A | "shared" or "an AI system" | Interesting: "even read as AI-involved, evaluations matched the human condition" — to be reconciled with C1's penalty through the final-say clause. |
| **C-d A not encoded** | some A participants say a person was involved | — | C1's penalty becomes suspect. Very unlikely: Study 1's A had `BEL1` 5.43, 93 % belief. |

C-a or C-b is the likely pair; they differ only in what HA participants
answer on items 4 and 5.

### 5c. Combined

| | profile encoded (P-a / P-c) | profile not encoded (P-b) |
|---|---|---|
| **control encoded (C-a)** | both storylines writable; C2 is a positive finding; C3 is "knew and did not care" or "understood but outweighed" | human-versus-AI storyline; disability a limitation; C2 still a positive finding |
| **HA collapsed (C-b)** | disability storyline stands; C2 is dropped and only H vs A remains as a control contrast | worst case: only C1 survives as interpretable — Study 1 narrows to "being told AI-only lowers genuineness" |

### 5d. What Study 2 does not change

No Study 1 number. Only what the numbers are allowed to mean and which
sentences can be written. The one exception is P-e, which would motivate a
sensitivity re-cut of C3 on Study 1's own data. In every scenario the paper
gains one sentence a reviewer cannot take away: whether the manipulations were
encoded was tested directly on an independent sample.

---

## 6. Exact workbook edits

Both templates: `workbook_template.html` (Chinese) and
`workbook_template_en.html` (English). Then `build_workbook.py` → `workbook.html`.
If new table labels are added, `en_labels.py` carries the translations.

1. **Appendix B → the validation study.** Replace the body of
   `<section id="study2">` (EN ≈ lines 554–636; ZH ≈ 696–770) with §2–§5 of
   this file, condensed to the workbook's register. Keep the eyebrow style;
   retitle "Appendix B · Study 2: manipulation validation (deployed
   2026-09-05, not yet collecting)". Include the item table, the scoring
   table, the design decisions of §3, the scenario tables of §5, and the
   sample-size line of §8.
2. **New Appendix C.** Move the *current* Appendix B body there, retitled
   "Appendix C · A design considered and not run: the no-description
   perception test". Prepend one paragraph from §4 saying why. Keep its
   scenario tables W1–W5 and Da–De intact; change its "when Study 2 data
   arrive" bullet to "if this study is ever run". Add the nav link.
3. **Appendix A, Q3.** The sentence beginning "The default impression the
   clips give can be tested directly in Study 2…" → replace with: Study 2 as
   deployed tests whether the disclosure was *recognised* (understood but
   unbelieved, versus never encoded), which is the prior question; the clips'
   own signal is Appendix C's design, held in reserve.
4. **Appendix A, Q4.** "Available answers are the dwell time, Study 2's default
   impression and the TOST bounds" → "…the dwell time, Study 2's recognition
   rates and the TOST bounds". The "disability-specific recall item" listed as
   future work is now item 6 of Study 2; say so.
5. **Storyline summary (EN line 58, ZH line 191).** "whether it was
   remembered or believed was not measured directly" → append "; Study 2 is
   designed to measure exactly this".
6. **Analysis Roadmap.** Item 1 (storyline): option (b) now needs Study 2's
   H2 recognition rate, not "do the clips carry a no-disability signal". Item
   2: "the clip-neutrality check comes first" → "classify each factor by the
   §5 scenario tables first, then the storyline decision"; say collection has
   not started.
7. **Nav.** Add "Appendix C" after "Appendix B" in both language nav lists.

---

## 7. Numbers to cite, from the workbook's own outputs

`BEL1` by condition, participant level (`descriptives_report.txt`):

| condition | *n* | mean | median | share at ≤ 3 |
|---|---|---|---|---|
| H1 | 42 | 5.36 | 6 | 14 % |
| HA1 | 41 | 5.05 | 5 | 17 % |
| A | 44 | **5.43** | 6 | **7 %** |
| H2 | 43 | **4.74** | 5 | **26 %** |
| H3 | 43 | 5.19 | 6 | 21 % |
| HA2 | 42 | 5.10 | 5.5 | 17 % |
| HA3 | 45 | 5.47 | 6 | 11 % |

Also: dwell on the disclosure page 5.5 s longer in disclosure cells (*p* .023);
Study 1's analysis sample 272 of 300 (attention 279/300 passed, comprehension
292/300); the C1/C2 recall columns are empty for all 300 rows in
`participants_clean.csv` — the checks were removed before launch.

---

## 8. Sample size and precision

From `analysis/study2/precision.py` (standard library only), 30 per arm:

| | |
|---|---|
| a recognition rate of .80, Wilson 95 % half-width | ±14 pp |
| the "lower bound above 50 %" rule needs an observed rate of | 70 % (21 of 30) |
| 80 % power for a between-arm *d* = 0.8 on a seven-point item | 87 % |
| for *d* = 0.6 | 64 % (80 % would need 44 per arm) |

Recruitment: 150 completers, 30 per arm, five per cell, targets set on the
dashboard; stops at target or platform quota, never on a result.

---

## 9. Still open, so the workbook can mark them

1. The debrief: Study 1's approved text, verbatim, with nothing added
   (commit `5eef7f5` on `study2`). Disclosing what actually controlled the
   clips would be a new sentence and new text for ethics; as deployed there
   is none.
2. Every `AV1` option checked against the final audio (Study 1's known
   limitation, inherited).
3. Ethics approval for the validation block and the open reconstruction; the
   rest is Study 1's approved text.
4. Whether item 2 (`V_CTRL_REC`) stays beside item 5 (`V_FINAL`); the plan
   keeps both.

---

## 10. What the workbook must not say

- That Study 2 replicates, tests, or confirms any Study 1 *effect*. It tests
  whether the manipulations were encoded.
- That the clips are neutral. That question is Appendix C's, unanswered.
- That recognition failures are exclusions. They are outcomes.
- Arm codes (A, H1, HA1, H2, H3) without the legend in §2 nearby.
