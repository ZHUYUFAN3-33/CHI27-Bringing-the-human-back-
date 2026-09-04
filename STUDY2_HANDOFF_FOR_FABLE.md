# Study 2 design handoff for Fable

Status: design review of `study2` at `097cd5e` (`s2-v3`), 2026-09-05.

This handoff records the decisions and implementation work needed before Study 2 recruits. It is not an instruction to start editing immediately: the first item is a PI decision between two scientifically different studies.

## Bottom line

The current Study 2 is a useful **no-disclosure stimulus-validation / attribution study**, but it is not a causal robustness check or a direct replication of Study 1. It has no randomized control-source manipulation. Its `WHO -> AU1` analysis is observational and directionally ambiguous: participants may infer AI because the interaction felt programmatic, or rate it as programmatic because they inferred AI. The wording of `AU1` ("rather than like the execution of a program") also overlaps semantically with `WHO`.

If the paper's priority is to test whether the Study 1 human-versus-AI effect is robust, use Track B below. If the priority is to diagnose what the unchanged clips imply in the absence of disclosure, keep Track A and describe it accurately.

## Decision required before implementation

### Track A — keep the current no-disclosure study

Name it a **supplementary no-disclosure perception study** or **stimulus-validation study**, not a replication of the causal treatment effect.

It can estimate:

- who viewers infer is controlling OriHime without being told the answer;
- whether viewers infer that a human operator has a disability;
- whether those inferences vary by clip, position, or within-person consistency;
- whether inferred controller and felt genuineness are associated;
- whether prior AI attitude predicts controller inference.

Its role in Study 1 is interpretive. It can show whether the AI-only disclosure aligned with or conflicted with the clips' default reading, and whether the disability-disclosure null occurred against an apparent no-disability signal, an ambiguous signal, or an apparent disability signal. It cannot identify the causal effect of disclosure.

### Track B — recommended if “robustness check” is the real goal

Randomize a fresh sample between three framing arms:

1. no disclosure;
2. human operator;
3. AI-only control.

Keep the six clip orders within each arm (18 allocation cells). Make `AU1` the single primary outcome and the human-versus-AI contrast the single primary confirmatory contrast. The no-disclosure arm supplies the otherwise missing baseline and can retain `WHO`/`DIS` as secondary outcomes. In disclosed arms, any controller question is a manipulation/recall check and must be placed after the outcome.

This design can answer whether the Study 1 causal effect replicates and whether it is better described as a human-framing uplift or an AI-framing penalty. If two comparisons involving the no-disclosure arm are also confirmatory, specify their multiplicity correction before recruitment and use the larger sample target below.

The disability finding is a separate claim. A true robustness test of that null would require a newly randomized disclosed-versus-no-mention contrast, preferably with stronger/repeated or visible disclosure and its own a priori equivalence bound. The current no-disclosure study cannot replicate that causal null.

## Changes required under either track

### P0 — synchronize the instrument and analysis plan

The Study 1 workbook's Appendix B describes an older Study 2. It still refers to `IMP`, `OH2`, open-ended reasons, and S2-Q4 cue coding; all were removed in `s2-v3`. The current branch contains no analysis script or final preregistration corresponding to the live instrument.

Before collection, create a versioned analysis-plan document next to the instrument and update `README.md` and `LINKS.md`. It must state:

- the study's exact label and inferential role;
- one primary question/outcome and clearly labelled secondary questions;
- estimands, coding, exclusions, multiplicity family, and missing-data handling;
- the repeated-measures model and participant as the independent unit;
- how clip, position, order, and prior familiarity enter the model;
- how confidence is used (secondary/sensitivity only);
- the sample-size calculation and stopping rule;
- that S2-Q4/cue coding is no longer possible without free text.

Do not test whether the four `WHO` options differ from a uniform distribution. Uniform choice probabilities have no theoretical meaning here. Prefer interpretable estimands such as:

- `P(human involved)`: human-only plus human-with-AI;
- `P(AI only)`;
- `P(can't tell)`;
- the full four-category distribution with simultaneous or clearly labelled per-category intervals.

Report per-clip proportions and Wilson intervals. Define any “default” classification with mutually exclusive rules. Do not use the old overlapping 40% heuristics as if they were a hypothesis test.

### P0 — remove the three-method / three-clip matching cue

The introduction teaches exactly three control methods before showing exactly three clips, and the reminder repeats all three methods on every clip. This can induce a one-of-each matching strategy and makes “spontaneous/default inference” an inaccurate label.

Preferred implementation for Track A:

- introduce OriHime neutrally without the three detailed method narratives;
- collect `AU1` first;
- show the controller categories only when asking `WHO`;
- add: “The videos may use the same control arrangement or different arrangements; the number of videos does not correspond to the number of control methods.”

If the detailed method descriptions must remain for comprehension, keep the anti-matching sentence and call the outcome a **prompted forced-choice inference**, not an unprompted default.

Also ask participants to answer from the clips rather than searching for OriHime during the study.

### P0 — add prior OriHime familiarity at the end

OriHime is publicly associated with remote participation by people who are hospitalized or have physical disabilities. A participant who already knows the product may answer `DIS` from prior knowledge rather than from the clips. Add end-of-study items such as:

- `BG_orihime_familiar`: “Before today, had you heard of OriHime?” — No / Yes, but only vaguely / Yes, I was familiar with it.
- `BG_orihime_control_knowledge`: “Before today, did you know how OriHime is usually controlled?” — No / Not sure / Yes.

Keep all participants in the primary descriptive analysis. Use familiarity for prespecified stratified description or sensitivity analysis, not a post hoc exclusion chosen after seeing results.

Product context: <https://orylab.com/en/>.

### P0 — improve evidence of video attention

The current instrument has one instructed-response item plus playback telemetry. Playback duration does not establish that a participant attended to the video, which is central to a visual-inference study.

Add one non-leading factual comprehension question after the primary judgements, either on one prespecified position or one randomly selected clip. Keep its answer key server-side. Verify every option against the final audio/video cut. Prespecify whether failure is an exclusion or a sensitivity sample.

If no comprehension item is added, do not describe the usable sample as having passed a video-comprehension check; state exactly that it passed the page-reading check and playback gate.

### P0 — fix information and debrief text

- Remove “Your written descriptions may be quoted in publications”; `s2-v3` collects no free text.
- Confirm that every factual claim about the three control arrangements is true of the production setup. If AI-only or AI-assisted control is hypothetical, say so in the ethics-approved debrief.
- The current debrief says that control was withheld but never reveals the actual arrangement. Replace it with a complete explanation of what was withheld, what actually controlled each clip, why the information was withheld, and how the clips relate to Study 1.
- Confirm all revised text against the approved ethics/consent materials before deployment.

### P1 — do not make confidence-weighted results primary

`WHO_CONF` and `DIS_CONF` can distinguish a held judgement from a guess, but confidence weighting requires arbitrary scoring choices. Primary estimates must use unweighted responses. Confidence may be used for prespecified stratification or sensitivity analyses.

`AU1_CONF` is lower value: `AU1` is a subjective experience rating, not a factual judgement. If questionnaire length is constrained, remove `AU1_CONF` and spend that item on prior familiarity or video comprehension. Bump the instrument version if any item changes.

### P1 — analyze `WHO` and `DIS` jointly

Do not make the only disability analysis conditional on selecting a human `WHO` response. That denominator is itself an outcome, varies by clip, and may be much smaller than the recruited sample.

Primary reporting should include the complete `WHO x DIS` joint distribution. A secondary two-stage analysis may estimate:

1. whether a participant inferred that a human was involved;
2. conditional on a human inference, whether they inferred disability.

Do not automatically exclude logically inconsistent combinations. First report their frequency; they may identify item ambiguity rather than inattentive participants. Define any quality exclusion before collection.

### P1 — preserve within-person and stimulus limits

Each participant supplies three correlated clip observations. Use a participant random intercept or participant-clustered GEE; never analyze the three rows as independent people. Include clip and presentation position, and inspect order without treating six small order cells as six independent replications.

The three fixed clips differ in content and duration. Results generalize to these stimuli, not automatically to OriHime interaction in general. A stronger across-stimulus robustness claim would require more clips sampled from the intended stimulus population and a stimulus random effect.

Cross-study comparisons also remain cohort comparisons unless framing is randomized within the new study.

## Recommended analysis for Track A

1. **Primary:** per-clip `WHO` distribution, `P(human involved)`, `P(AI only)`, and `P(can't tell)`, with Wilson 95% intervals.
2. **Disability signal:** full `WHO x DIS` table; then the prespecified two-stage estimates above.
3. **Clip differences:** multinomial or binary GEE with participant clustering, clip and position fixed effects. If several binary outcomes replace one multinomial model, define the correction family.
4. **Within-person consistency:** observed three-clip patterns and a model of later responses from first-clip response, adjusting for clip/order. Do not compare only with a naive independent-uniform baseline.
5. **Genuineness association:** `AU1 ~ WHO + clip + position + (1 | participant)`, optionally adding prespecified GAAIS and familiarity terms. Label this association, not effect or mediation.
6. **Confidence:** distribution and prespecified stratified sensitivity analysis only.
7. **Quality sensitivity:** all completers, prespecified usable sample, and (if added) comprehension-pass sample.

Avoid interpreting an `AU1` association as a replication of Study 1 C1. The item wording and controller inference share “program” semantics, and causal direction is unidentified.

## Sample size and power

### Track A

For a descriptive proportion near 50%, approximate 95% Wilson interval half-widths are:

| Usable participants | Worst-case half-width |
|---:|---:|
| 200 | +/-6.9 percentage points |
| 250 | +/-6.2 points |
| 300 | +/-5.6 points |
| 385 | +/-5.0 points |

Recommendation: target **300 usable participants**. Recruit approximately **330 completers** to allow roughly 8–10% loss to prespecified quality exclusions. If the budget caps recruitment at 300 completers, expect roughly 270–280 usable participants and about +/-6 percentage-point worst-case precision.

The conditional `DIS` denominator can be much smaller. With 300 usable participants, if only 50% infer a human, the conditional denominator is about 150 and worst-case precision is about +/-7.9 points. The power/precision document must show scenarios for plausible human-inference rates.

For a “majority” decision defined as a two-sided Wilson 95% lower bound above 50%, approximately 187 usable participants give 80% power if the true proportion is 60%; a true proportion of 55% requires roughly 773. There is no universal answer that “250–300 is powered” without a smallest effect or desired precision.

Run an **a priori precision analysis** for proportions and a **simulation-based power analysis** for repeated multinomial/GEE clip comparisons. Inputs must include plausible category prevalence, within-person transition/correlation, exclusions, and multiplicity. If a pilot is used to inform those inputs, plan the blinded/internal-pilot rule in advance and do not stop based on significance.

### Track B

For one prespecified two-sided human-versus-AI comparison on participant-mean `AU1`:

- 100 usable participants per arm gives about 80% power for `d = 0.40` at alpha .05;
- with three arms, that is 300 usable / approximately 330 recruited completers;
- if two confirmatory comparisons require alpha .025, use about 121 usable per arm for `d = 0.40`: 363 usable / approximately 400 recruited;
- 130 usable per arm gives about 80% power for `d = 0.35` at alpha .05.

Do not power only for Study 1's observed `d = .62`; use a conservative effect such as `.35–.40` to limit winner's-curse optimism. Final power should be simulated under the intended mixed model and observed Study 1 ICC/variance heterogeneity, with the assumptions written into the preregistration.

Do not report post hoc observed power after collection; report effect estimates and confidence intervals.

## Implementation notes and acceptance criteria

If the PI authorizes implementation:

1. Confirm that no real Study 2 rows have been collected. If any exist, never silently reinterpret old item ids; retain `s2-v3` as a distinct instrument version.
2. Bump `S2_VERSION` for any instrument change.
3. Update the schema idempotently (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` where needed), exports, codebook, admin summaries, simulator, preview, and browser checks together.
4. Keep comprehension answer keys out of `publicS2Plan`.
5. Keep all six clip permutations balanced. Track B must balance all 18 framing-by-order cells atomically.
6. Update `README.md`, `LINKS.md`, the data dictionary, and the analysis plan so that none refer to removed open-text items or the old sample rationale.
7. Correct stale runtime comments that still call the survey five pages; it currently has six.
8. Check the cross-study participant exclusion query. The code comment says platform ids are matched case-insensitively, but the current SQL uses exact text equality. Make exclusion and same-study rejoin case-insensitive and race-safe before recruitment.
9. Run `npm run check`, the simulator, a clean-schema migration plus second idempotent boot, every export, and the real browser test on desktop and mobile widths.
10. Manually verify final clip comprehension answers, mobile confidence-scale readability, the fallback-video policy, completion redirect, and the full consent/debrief text.
11. Freeze/preregister the final outcome, exclusion, stopping, and analysis plan before opening recruitment.

## Deliverable expected back from Fable

Before code changes, return a short decision memo containing:

- selected track and exact scientific claim;
- final questionnaire outline and item order;
- primary/secondary estimands and model formulas;
- a reproducible power/precision script with assumptions;
- target recruited, completed, and usable sample counts;
- ethics/debrief wording requiring PI approval;
- file-by-file implementation plan and migration risk;
- any point that still requires a PI choice.

Do not implement a hybrid that calls Track A a causal replication. Scientific labeling is part of the acceptance criteria.
