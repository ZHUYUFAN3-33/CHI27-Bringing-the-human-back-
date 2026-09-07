# Study 2 — analysis plan and decision memo

Instrument `s2-v9`. Written 2026-09-05, rewritten the same day when the team
chose the manipulation-validation design over the no-disclosure one; the
validation wording was sharpened on 2026-09-06 (`s2-v7`: every recognition
item has one right answer per arm and every distractor is unambiguously
wrong; Study 1's robot-contact item joined the background block; ids, keys
and outcomes unchanged). `s2-v8` (2026-09-06) moved `BEL1` to the top of
the background page and disabled the back button there, so "did you believe"
is seen only after the recognition items have been submitted and cannot be
followed by a revision of them. `s2-v9` (2026-09-06) simplified the two
limitation stems ("to what extent did the operator appear limited in …") and
dropped their examples: an example is our reading of the label, and the
participant's own reading is what the items measure. Nothing has been collected. This document is the thing to freeze before recruitment
opens; the instrument in `shared/s2-instrument.js` and the item list in
[STUDY2_ITEMS.md](STUDY2_ITEMS.md) are written to match it.

---

## 1. What this study is, and the exact claim

**A manipulation validation study.** A fresh sample sees exactly what Study 1's
participants saw — one of five condition descriptions, then the same three
clips — and is then asked not how it evaluates OriHime but **what it took the
description to say**.

It exists to separate two readings of Study 1's disability null that Study 1
cannot separate, because its recall checks were removed before launch:

- **A.** Participants understood the operator profile, and it made no
  material difference to their evaluations.
- **B.** Participants barely encoded the profile, so of course it made none.

Belief (Study 1's `BEL1`) cannot do this alone: a low belief score is
consistent with a wrong memory and with a disbelieved correct one, and those
are different findings. The same logic applies to the control-source
manipulation, where Study 1 found H and HA equivalent on every outcome and
cannot say whether HA was read as HA or collapsed into H.

The sentence the paper is allowed to write, if the recognition rates come in
high:

> Participants recognised which description they had been given — *x* % in
> the intellectual-disability condition, *y* % in the mobility condition —
> and in the description-recognising sample the evaluations still did not
> differ. Disclosure changed what participants knew about the operator, but
> not how they evaluated the operator or the interaction.

What it is **not**: a replication of Study 1's effects, a test of whether the
clips are neutral on their own (the no-disclosure design, now future work), or
a test of whether the disability descriptions are believed *against* the clips.
It measures recognition of what was said, not judgement of what was seen.

---

## 2. Design

Five of Study 1's seven conditions, 30 each, balanced with the six clip orders
(5 × 6 = 30 cells, 5 per cell, 150 total). The description pages, the recap
above each clip and the debrief are Study 1's text verbatim.

| arm | control | profile | anchors |
|---|---|---|---|
| A | AI only | — | AI-control ceiling; "no human operator" recognition |
| H1 | human | no mention | human-control ceiling; "no disability mentioned" control |
| HA1 | human + AI | no mention | the final-say probe; whether HA is read as HA or as H |
| H2 | human | intellectual disability | intellectual-disability recognition |
| H3 | human | mobility-related disability | mobility-disability recognition |

**Assumption stated, not tested:** disability recognition does not depend on
control source. HA2 and HA3 are not run; the profile is validated under H
alone, on the strength of Study 1's finding that H and HA were equivalent on
every outcome. The Control × Profile interaction is out of reach at this
budget and is listed as a limitation.

Everything is asked **once, after all three clips**, at the point Study 1
asked `BEL1`, so both studies measure memory of the description over the same
delay. Nothing is asked per clip except the two quality checks.

---

## 3. Outcomes

All scored on the server against per-arm keys the browser never receives.

### Primary — recognition (three binary outcomes)

| outcome | item | correct by arm |
|---|---|---|
| `profile_recognised` | `V_PROF_REC` | A → no human operator · H1, HA1 → no disability mentioned · H2 → intellectual · H3 → mobility |
| `ctrl_recognised` | `V_CTRL_REC` | A → AI, no human · H1, H2, H3 → human, no AI · HA1 → human with AI assistance |
| `final_recognised` | `V_FINAL` | A → an AI system · all others → a person |

Reported per arm as a proportion with a Wilson 95 % interval. **The H2 rate
for `profile_recognised` is the number that decides how Study 1's disability
null is written** (§1). The HA1 rate for `final_recognised` is the number that
decides whether "H = HA" in Study 1 means equivalence or collapse.

### Secondary — graded recognition (five seven-point items)

Means with 95 % intervals per arm, and the between-arm contrasts below.

| item | predicted pattern |
|---|---|
| `V_CTRL_P` person control | H1 ≈ H2 ≈ H3 > HA1 > A |
| `V_CTRL_AI` AI control | A > HA1 > H1 ≈ H2 ≈ H3 |
| `V_LIM_MOB` mobility limitation | H3 > H1 ≈ H2 ≈ HA1 |
| `V_LIM_COG` cognitive limitation | H2 > H1 ≈ H3 ≈ HA1 |
| `BEL1` believed | descriptive; compared with Study 1's per-condition means |

The two control scales are unipolar on purpose: a participant who took HA to
mean shared control can score both high, which is exactly the HA reading the
study has to be able to see.

### Recognition × belief

`V_PROF_REC` correct with `BEL1` ≤ 3 is "understood but not believed";
`V_PROF_REC` wrong is "not encoded". The cross-tabulation per arm is reported.
Study 1's H2 had 26 % at `BEL1` ≤ 3 with no way to tell these apart.

### Open reconstruction

`V_OPEN`, coded blind by two coders for: human operator · AI assistance · AI
alone · mobility/physical disability · intellectual/cognitive disability ·
disability without type · uncertainty or misunderstanding. Agreement on 20 %
double-coded; the rest single-coded and checked. Reported as per-arm code
rates beside the closed items, as a convergent check on them.

---

## 4. Success criteria, fixed in advance

The manipulation is called **validated** for a factor when every prediction
for that factor in §3 holds in direction and the primary recognition rate in
the relevant arm has a Wilson lower bound above 50 %. At *n* = 30 that bound
clears 50 % when the observed rate is 70 % or higher (21 of 30).

If the profile is recognised in H2 and H3 but not in H1/HA1 (people
"remember" a disability that was never mentioned), that is reported as it is:
it says the control cells were not read as unmarked, which bears on Study 1's
C3 contrast.

If recognition is low, the study reports reading B for that factor and Study
1's corresponding null is written as uninterpretable rather than as an
equivalence.

---

## 5. Unit, model, multiplicity, missing data

The participant is the unit; every outcome here is one per participant, so
there is no repeated-measures structure to model. Between-arm contrasts on the
seven-point items are Welch *t* tests with Hedges' *g* and 95 % intervals;
the recognition proportions are compared descriptively with their intervals.

**Multiplicity.** Three primary recognition outcomes, each read in one
prespecified arm; no correction, the intervals are the result. The secondary
contrasts are one family per factor (control: two contrasts; profile: two),
Holm-corrected within family.

**Missing data.** Every item is required; `complete_pass` records that a
record is complete. Screen-outs and abandonments go in the flow diagram and
are not imputed.

---

## 6. Exclusions, fixed in advance

| check | where | flag | use |
|---|---|---|---|
| instructed response | clip shown 2nd | `attention_pass` | exclusion from the analysis sample |
| video comprehension | clip shown 3rd, after its judgements | `comprehension_pass` | exclusion from the analysis sample |

The analysis sample (`?usable_only=1`) is completed, every item answered, both
checks passed. All completers are reported as a sensitivity sample.
**A wrong recognition is an outcome, never an exclusion.** Prior OriHime
knowledge (`BG_orihime_knowledge`) is never an exclusion; it is one
prespecified stratified description of the recognition rates, splitting on
its top rung.

---

## 7. Sample size

Recognition outcomes have large effects: correct against chance is roughly
85 % against 20–33 %, and the between-arm differences on the graded items are
expected at *d* > 1. That is why 30 per arm is enough.

| per arm | a recognition rate of .80: Wilson half-width | 80 % power for *d* = 0.8 | for *d* = 1.0 |
|---:|---:|---:|---:|
| 25 | ±15 pp | yes | yes |
| 30 | ±14 pp | yes | yes |
| 44 | ±11 pp | *d* = 0.6 also | yes |

`python3 analysis/study2/precision.py` regenerates the tables.

**Target 150 recruited completers, 30 per arm**, set through the per-cell
targets on the dashboard (5 per cell). Recruitment stops at the target or the
platform quota, never on a result.

---

## 8. Still needs the team

1. **The debrief.** Study 1's approved text is used verbatim, with nothing
   added. It does not say what actually controlled the clips; disclosing
   that would be a new paragraph in `S2_DEBRIEF` and new text for ethics.
   `scripts/s2-plan-check.mjs` fails on any placeholder text in the debrief.
2. **`AV1`.** Reuses Study 1's bank, which the Study 1 README flags as
   written from the shooting script. Every option against the final audio.
3. **Ethics.** The description pages, recap and debrief are Study 1's
   approved text. The validation block (page 6) and the open reconstruction
   are new and need approval.
4. **Item 2 beside item 5.** `V_CTRL_REC` and `V_FINAL` both probe control;
   the plan keeps both (one categorical recognition, one final-say probe).

---

## 9. Future work, recorded

The no-disclosure study — what the clips imply on their own, with no
description — is not run at this budget. Its 28-item instrument is on this
branch at commit `fa26ba5` (`s2-v5`) and can be restored if a reviewer asks
whether the clips carry a signal of their own.
