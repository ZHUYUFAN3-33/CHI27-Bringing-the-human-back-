# Outcome-Contingent Integration Plan for the No-Disclosure Baseline

Status: proposed at the Phase 2 restructuring checkpoint, 2026-09-05. No data have been collected.

## Naming and inferential role

- `Study 2`, branch `study2`, and item prefix `S2_` are **internal project identifiers only**.
- Preferred manuscript label: **independent no-disclosure baseline**. Acceptable short form: **no-disclosure baseline**.
- Do not call it a replication, robustness check, second experiment, or causal test. It has no randomised disclosure manipulation.
- Its only role is interpretive: estimate what the same clips imply when a fresh cohort receives no control-source or operator-profile description, then use that evidence to qualify how the primary experiment's disclosures should be read.
- Cross-cohort comparisons remain descriptive. They are not within-experiment contrasts or mediation analyses.

## Placement rule

Do not reserve a standalone numbered `Study 2` section before seeing the data. Full methods, exclusions, estimands and results for the baseline always belong in the supplementary material. Main-text placement is selected from the following rule after the frozen analysis is run:

| Baseline result | Main-text placement | Function in the argument |
|---|---|---|
| A clear default materially changes the causal contrast's interpretation (WHO patterns W1, W2 or W3) | A concise **Independent no-disclosure baseline** subsection at the end of Results (about 250–400 words), then interpretation in Discussion §5.1 | Distinguish an AI-label penalty, a human-label bonus, or asymmetric deviation from a human+AI default |
| Default impressions differ meaningfully by clip (W5) | End-of-Results baseline subsection plus a stimulus-boundary paragraph in Discussion; do not claim moderation unless the primary experiment's own interaction supports it | Explain stimulus heterogeneity without retroactively promoting the primary experiment's non-significant interaction |
| The clips produce no clear majority or high uncertainty (W4/no-majority pattern) | Full report in the supplement; 1–3 sentences in Results or Discussion §5.1 | Supports the cleaner reading that descriptions filled an informational blank, but does not become a separate contribution |
| Disability is already commonly inferred (Db) or priors are heterogeneous (Dd/De) | Main-text caveat in Results §4.4 and Discussion §5.3; full joint WHO × DIS table in the supplement | Downgrade the disability claim and prevent an overstatement of what “no mention” meant |
| Estimates are too imprecise or quality checks fail | Supplement/limitations only; no support for the headline argument | Report inconclusiveness rather than forcing a scenario |

If both WHO and DIS results trigger main-text treatment, use one compact evidence subsection rather than two mini-studies.

## Interpretation map fixed before data

The labels below preserve the workbook's scenario analysis, but the underlying estimates and confidence intervals take priority over a forced category.

### Control-source inference (WHO)

| Pattern | Meaning for the primary experiment | Permitted wording |
|---|---|---|
| W1: clear human-only majority | H aligns with the default; HA is partly aligned; A conflicts | The AI-only description lowered genuineness even against a human-leaning reading of the clips. The estimate may combine label content with label–stimulus conflict. |
| W2: clear AI-only majority | A aligns; H and HA conflict | The result is more naturally a human-presence bonus: telling viewers that a person was involved brought the human back into an AI-leaning scene. |
| W3: clear human+AI majority | HA aligns; H and A deviate in opposite directions | Moving toward AI-only carried a cost, whereas removing the AI description did not add a detectable benefit. |
| W4: no clear majority / substantial uncertainty | No description has a privileged match | The disclosure primarily filled an informational blank; this is the cleanest label-based reading, subject to precision. |
| W5: materially different patterns by clip | Alignment varies by stimulus | The role of default impressions is clip-bound. Treat this as a boundary condition; the primary experiment's clip interaction remains non-significant unless new analysis validly changes that fact. |

### Disability inference (DIS)

| Pattern | Meaning for the primary experiment | Permitted wording |
|---|---|---|
| Da: clear “no disability” majority among those inferring a person | No-mention approximates an assumed-no-disability baseline | Explicit disclosure produced no detectable incremental evaluation cost against a no-disability-leaning default, within the pre-stated bounds and materials. |
| Db: clear “disability” majority | Both disclosed and no-mention cells may carry a disability inference | Only “explicit disclosure added no detectable incremental effect” is permitted. Do not claim that disability information itself had no effect. |
| Dc: clear “can't tell” majority / strong uncertainty | The clips provide little disability information | The label supplied information that the clips did not, yet no effect of half a standard deviation or larger was detected. |
| Dd: split or heterogeneous responses | The average contrast spans different priors | Report heterogeneity and avoid a single-default story. |
| De: DIS depends strongly on WHO | Disability inference is entangled with whether a person is inferred | Lead with the joint WHO × DIS distribution; conditional estimates are secondary and their denominator must be stated. |

## Statistical decision discipline

- Report the primary unweighted proportions and Wilson 95% intervals; do not test the written response options against a uniform distribution.
- A “majority” requires the Wilson 95% lower bound to exceed 50%. Otherwise report the distribution as no clear majority; do not revive the older overlapping 40% rule.
- Use confidence only for the prespecified sensitivity/heterogeneity description, never to weight the primary estimates.
- Use participant-clustered repeated-measures models for clip comparisons. Do not treat three clip rows as three people.
- The `AU1`–`WHO` relation is an association, not an effect, mediator, or replication.
- Scenario assignment and manuscript placement occur only after the frozen analysis is complete and are logged; no recruitment or analysis stops on a favourable result.

## Current manuscript architecture

Until results exist, the public-facing outline is:

1. Introduction
2. Related Work
3. Method
4. Results
5. Discussion, including Design Implications as a final subsection
6. Limitations
7. Conclusion

The baseline is a conditional evidence module, not an eighth top-level section and not a promised contribution in the abstract. Internal filenames and branch names remain unchanged for traceability.
