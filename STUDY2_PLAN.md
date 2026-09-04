# Study 2 — analysis plan and decision memo

Instrument `s2-v4`. Written 2026-09-05, answering the design review in
[STUDY2_HANDOFF_FOR_FABLE.md](STUDY2_HANDOFF_FOR_FABLE.md). Nothing has been
collected. This document is the thing that must be frozen before recruitment
opens; the instrument in `shared/s2-instrument.js` is written to match it.

---

## 1. Track and the exact claim

**Track A.** Study 2 is a **supplementary no-disclosure perception study**. It
is not a replication of Study 1's causal effect and is never to be called one.

It has no randomised control-source manipulation, so it cannot identify the
effect of a disclosure on anything. What it can do is say what the clips
themselves imply when nobody is told the answer, which is what makes Study 1's
results readable: a disclosure that agrees with the default impression and a
disclosure that fights it are different interventions, and Study 1 alone cannot
tell which of the two it ran.

The sentence the paper is allowed to write:

> In a fresh sample shown the same three clips with no description of how
> OriHime was controlled, *x* % inferred that a human was involved and *y* %
> inferred that a person involved had a disability. Study 1's disclosures
> therefore [agreed with / cut against / filled a blank in] the impression the
> clips give on their own.

The sentence the paper is **not** allowed to write: anything of the form "the
human-versus-AI effect replicates", or "disability disclosure has no effect",
on the strength of Study 2. A robustness test of either is Track B in the
review — a fresh sample randomised across framing arms — and is not this study.

**A consequence to state in the limitations.** Study 1 and Study 2 are separate
cohorts. Every comparison between them is a cohort comparison, not a
within-experiment contrast, however similar the samples look on the background
items.

---

## 2. What was dropped, and what that costs

`s2-v3` removed the open description. **S2-Q4 — which cues viewers judge on —
is therefore no longer answerable and comes out of the plan.** It is not
reported as unrun; it is not in the plan at all. If the cue question matters
later it needs its own study with free text, or a coding pass over a
qualitative follow-up.

`AU1` is kept but demoted. It shares "program" semantics with the `WHO` options
("An AI system, with no human operator" / "like the execution of a program"),
and its association with `WHO` is observational in both directions: someone may
infer an AI because the interaction felt programmatic, or call it programmatic
because they have just decided it is an AI. **The `AU1`–`WHO` association is
reported as an association, never as an effect, a mediation, or a replication
of Study 1's C1.**

---

## 3. Questions, in order of precedence

### Primary

**P1. Without being told, who do viewers infer is controlling OriHime?**

Estimands, per clip, over all usable participants:

| quantity | definition |
|---|---|
| `P(human involved)` | `WHO` ∈ {human only, human with AI} |
| `P(AI only)` | `WHO` = AI with no human |
| `P(can't tell)` | `WHO` = can't tell |

Reported as proportions with Wilson 95 % intervals, plus the full four-category
distribution with per-category intervals clearly labelled as such.

**There is no test against a uniform distribution.** Equal probability over four
written options is not a hypothesis anybody holds, and rejecting it would mean
nothing.

### Secondary, prespecified

**S1. Do viewers infer a disability, and against what?** The full `WHO × DIS`
table over everyone is the primary reporting form. The conditional estimate —
P(disability | a person was inferred) — is reported second, with its
denominator stated, because that denominator is itself an outcome and varies by
clip (see §6).

**S2. Does the inference vary by clip?** Binary and multinomial GEE with
participant clusters, clip and presentation position as fixed effects.

**S3. Is one person's judgement consistent across the three clips?** The
observed distribution of three-clip patterns, and a model of the second and
third answers from the first, adjusting for clip and order. Not compared
against an independent-uniform baseline, which no one believes.

**S4. Is inferred controller associated with felt genuineness?**
`AU1 ~ WHO + clip + position + (1 | participant)`. An association. See §2.

**S5. Does prior attitude to AI predict inferring an AI?** GAAIS positive
subscale as a participant-level predictor in the S2 model. Exploratory.

### Descriptive only

Confidence (`AU1_CONF`, `WHO_CONF`, `DIS_CONF`), prior OriHime familiarity, and
the background items. See §5 and §7.

---

## 4. Model and unit of analysis

**The participant is the independent unit.** Each supplies three correlated
clip observations; the three rows are never analysed as three people. Every
model carries a participant random intercept, or participant-clustered GEE with
robust standard errors where a random intercept does not converge.

Clip and presentation position enter every model as fixed effects. Order is
inspected, not modelled as six independent replications — with 300 participants
each order cell holds about fifty people.

**Stimulus generalisation.** Three fixed clips of different content and
different duration (REL 70 s, ADV 105 s, COL 115 s). Results generalise to
these clips, not to OriHime interaction in general. A stronger claim needs more
clips sampled from the stimulus population and a stimulus random effect.

**Multiplicity.** The primary family is the three `WHO` estimands × three
clips. Precision is the deliverable there, so intervals are reported without
correction and no primary claim rests on a p-value. Where S2 replaces one
multinomial model with several binary ones, the correction family is those
binary tests within one question, Holm-corrected, stated in the results table.

**Missing data.** Every item is required, so a completed record is complete by
construction; `complete_pass` records that. Screen-outs and abandonments are
reported in the flow diagram and never imputed.

---

## 5. Confidence

Confidence separates a held judgement from a guess, which is what makes "the
default is weak here" sayable at all. It is **not** used to weight anything in
a primary estimate: weighting requires arbitrary scoring choices, and the
primary proportions are unweighted.

Its prespecified uses: the distribution of confidence per item and clip, and
one stratified sensitivity analysis of P1 restricted to participants above the
median confidence on `WHO`. If the stratified estimate and the primary estimate
disagree, that is reported as heterogeneity, not as a corrected result.

`AU1_CONF` is the weakest of the three — `AU1` is a subjective rating, not a
factual judgement, so being "confident" in it is a strange thing to ask. It is
kept because the questionnaire asks all three the same way and an asymmetric
design invites its own questions, but nothing rests on it. **If an item has to
be cut for length, this is the one.**

---

## 6. Exclusions, fixed in advance

Two checks, both scored on the server against keys the browser never receives:

| check | where | item |
|---|---|---|
| instructed response | the clip shown **second** | `{SEG}_AT1`, "please select Disagree" |
| video comprehension | the clip shown **third**, after its judgements | `{SEG}_AV1`, one true statement of four |

The comprehension item is on a fixed position rather than a random clip, so
every participant is checked once and each clip is checked equally often across
the six orders. It is asked *after* that clip's judgements so it cannot direct
attention to the detail it asks about, and on the *last* clip so that learning
the study checks comprehension cannot change how the earlier clips were
watched.

**The analysis sample** (`?usable_only=1`) is: completed, every required item
answered, both checks passed. Three samples are reported for every primary
estimate:

1. all completers;
2. the analysis sample;
3. the analysis sample without the comprehension check (attention only).

**Logically inconsistent answers are not excluded.** A participant who says
"an AI system, with no human operator" on `WHO` and then something other than
"I don't think a person is involved" on `DIS` is counted, and the frequency of
that combination is reported. It may mean the items are ambiguous rather than
that the person was careless, and it cannot be told apart after the fact.

**Prior OriHime familiarity is never an exclusion.** `BG_orihime_familiar` and
`BG_orihime_control_knowledge` are for one prespecified stratified description
of P1 and S1. Someone who already knows the product may answer `DIS` from prior
knowledge rather than from the clip, and that is worth seeing — but choosing to
drop them after seeing the results is not analysis.

---

## 7. Sample size and stopping

Run `python3 analysis/study2/precision.py` (standard library only) to
regenerate; `analysis/study2/precision_output.txt` is its output.

**Target: 300 usable participants, about 330 recruited completers**, allowing
8–10 % loss to the two checks.

| usable *n* | worst-case Wilson half-width |
|---:|---:|
| 200 | ±6.9 pp |
| 250 | ±6.2 pp |
| 300 | ±5.6 pp |
| 385 | ±5.0 pp |

The conditional disability denominator is smaller and is the reason §3 reports
the joint table first:

| infer a human | denominator at 300 usable | half-width |
|---:|---:|---:|
| 40 % | 120 | ±8.8 pp |
| 50 % | 150 | ±7.9 pp |
| 75 % | 225 | ±6.5 pp |

**On the word "majority."** Defined as a Wilson 95 % lower bound above 50 %.
That rule reaches 80 % power at about **198** usable participants if the truth
is 60 %, but needs about **777** if the truth is 55 %. So a majority claim is
in reach only if the split is lopsided; at 300 the interval is the result and
the majority rule only decides how it is worded. (The review's independent
figures, ~187 and ~773, agree.)

Clip differences (S2) are powered for a sizeable gap, not a small one: a
ten-point paired difference reaches 78 % power at *n* = 300 when a person's two
answers are mildly correlated and 65 % under independence; fifteen points is
comfortable throughout.

**Stopping rule.** Recruitment stops at the recruited-completer target or when
the platform quota is exhausted, whichever comes first. It never stops on a
result. Allocation targets stay at 0 (uncapped) so that no order cell closes
early; balance is maintained by the least-filled-cell rule, not by quotas.

---

## 8. Still needs the PI

1. **The debrief.** `S2_DEBRIEF` in `shared/s2-instrument.js` carries
   `[TO BE COMPLETED BY THE RESEARCH TEAM]` where it must say how each clip was
   actually controlled. Only the research team knows this, and a debrief cannot
   be written from a guess. `scripts/s2-plan-check.mjs` warns while the marker
   is present.
2. **The comprehension options.** `AV1` reuses Study 1's bank, which the Study 1
   README already flags as written from the shooting script rather than diffed
   against the final cut. Every option must be checked against the audio of the
   clips as they will be shown, or a participant is excluded for failing a
   question about something that never happened.
3. **Ethics.** The consent page, the anti-matching sentence, the familiarity
   items and the rewritten debrief are all new text and need approval before
   deployment.
4. **Whether `AU1_CONF` stays.** See §5.

---

## 9. What changed in the instrument, and why

| change | driving review item |
|---|---|
| Page one no longer teaches three control arrangements, and the per-clip note no longer restates them | the three-methods/three-clips matching cue |
| Page one says the videos may use the same or different arrangements, and asks people not to look OriHime up | same |
| The control categories appear once, as the options of `WHO` | same |
| `{SEG}_AV1` comprehension check on the clip shown third | playback duration is not attention |
| `BG_orihime_familiar`, `BG_orihime_control_knowledge` | prior product knowledge can answer `DIS` instead of the clip |
| Consent no longer says written descriptions may be quoted | `s2-v3` collects no free text |
| Debrief says what was withheld, what was true, why, and how it relates to Study 1 | a partial debrief is not a debrief |
| `lower(external_pid)` on the rejoin and the Study 1 exclusion, plus a partial unique index | a platform id in different casing was a duplicate row and a hole in the exclusion |

Thirty-five items per participant. Six pages.
