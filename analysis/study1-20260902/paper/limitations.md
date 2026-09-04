# Limitations (draft) and reviewer-facing methodological rationale

> **TRIAL STORYLINE — draft text.** Revised 2026-09-04 after an independent cross-review.

## Limitations

**No direct manipulation check of control source.** The questionnaire did not ask participants to restate who controlled OriHime. Three indirect indicators are available: the three descriptions were believed to the same degree (76% of the analysis sample rated belief ≥ 5 of 7; no condition differences, *p* = .45), participants told that AI assisted the operator rated the operator as less in control (*d* = .40, *p* = .002), and participants in the AI-only condition ranked the AI first for responsibility and credit in 57–60% of clips, against 15–16% when a human was also present. These show that the text was read and believed, not that it produced the intended mental model in every participant.

**Unequal precision across conditions.** The design allocated one cell to AI-only control and six to human control, so contrasts involving the AI-only cell rest on 36 participants against 236. With 80% power the design detects a human-versus-AI difference of about *d* = .50 in the analysis sample, and a disclosure difference of about *d* = .39; smaller differences — for example in competence (*d* = .27) — cannot be excluded. Between-participant variance was also larger in the AI-only cell, which is why the warmth and usefulness effects are reported as suggestive rather than robust.

**Task type is confounded with clip length.** The three clips run 70, 105 and 115 s and differ in content, so clip effects — which were large — are treated as nuisance terms, and the tentative observation that the AI competence penalty was confined to the relational clip is reported only as a hint.

**Single-item measures and ceiling effects.** Genuineness, warmth, competence and operator control were single items with 24–36% of ratings at the scale maximum. Ordinal robustness models agree with the linear models for the main contrast, but the single items limit reliability and the ceiling compresses differences among the human conditions.

**The disclosure was minimal, and the material worked against it.** The operator's disability was stated in one sentence on one page, before any clip, and was never repeated or depicted. Three features of the material would each be expected to weaken a label effect: all participants had just answered nine stereotype items about people with disabilities, so disability was salient in every cell including the no-mention control; the disability sentence was immediately followed by the assurance that all operators complete the same training and meet the same standard, which directly counters a competence stereotype; and the clips then showed fluent, competent performance (73% of competence ratings in the human conditions were 6 or 7). Uptake of the disability sentence specifically was not measured: the disclosure cells spent 5.5 s longer on the page, consistent with reading it, but the belief item asked about the description as a whole and there was no recall check. The null therefore applies to this minimal, textual form of disclosure in this framing and should not be generalised to visible or repeated cues or read as evidence that disability status has no effect. The control condition said nothing about disability rather than stating its absence, by design; the contrast is therefore explicit disclosure versus omission, not disability versus no disability.

**Sample and setting.** Participants were an English-speaking online panel, mostly in the United States, watching pre-recorded clips of one robot in one workplace; the videos were identical across conditions, which is the study's strength for isolating prior attribution but limits ecological validity.

**Analysis plan not preregistered.** The primary sample, outcomes, model and contrasts were fixed before inferential testing but after data collection and a descriptive pass, and were not registered externally, so we call them pre-specified rather than confirmatory. The exploratory analyses are numerous (113 tests); one of them had been seen in an earlier descriptive pass. All exploratory results are reported in full and none is treated as confirmatory.

## Reviewer-facing rationale

**Why a linear mixed model rather than ANOVA on participant means?** Each participant rated three clips; the mixed model uses all 816 ratings while accounting for their dependence through a random intercept (ICC .40–.78), adjusts for clip and position, and allows clip × condition interactions to be tested. Analyses on participant means (Welch *t*, Mann–Whitney) are reported as robustness checks and, for the main contrast, agree in direction and mostly in significance.

**Why report unadjusted pairwise *p* values at all?** The 21 pairwise differences per outcome were computed to display the full pattern of condition differences (all significant differences among the primary outcomes involve the AI-only cell; none separates any two human cells), not to select findings. They are presented with Holm and Benjamini–Hochberg adjustments in the supplement, and inference rests on the three pre-specified contrasts.

**Why equal-weight cell means in the contrasts?** Cells differ in size only through random loss (36–41); equal weighting makes C1–C4 estimate the design's intended comparisons rather than a mixture weighted by drop-out.

**Why is the AI-only condition one cell?** Operator profile is undefined when no operator exists; the design is 3 × 2 plus one reference cell, not 3 × 3. This is why C1 compares six cells against one and why the reference cell has lower precision.

**Why equivalence tests, and why not call the results equivalent?** A non-significant difference does not show similarity. TOST with pre-stated bounds (±0.35 *SD*, the design's smallest detectable effect for C2; ±0.50 *SD*) lets us state within what range the human-versus-human+AI and disclosure effects lie. Because the bounds come from the design's sensitivity rather than from a domain-derived smallest effect of interest, we report them as bounds on the difference and avoid the word equivalent without the bound attached.

**Why report the attribution shift with a common anchor?** The human+AI condition offered one more actor to rank, so the odds of ranking the operator first fall even if beliefs are unchanged. Anchored on the two actors offered everywhere, the operator was still ranked ahead of both less often under human+AI control (OR .59 for responsibility, .61 for credit), so the shift is not only a menu effect, but the raw odds ratios overstate it.

**Is the genuineness effect a demand artefact?** The genuineness item ("felt genuine, rather than like the execution of a program") is worded close to the AI-only description ("controlled entirely by an AI system"), so part of its large effect may reflect consistency with the description rather than perception. The warmth and usefulness effects, whose wording is not tied to the manipulation, and the equal belief ratings across conditions argue against a purely demand-driven account, but the item cannot be treated as independent of the manipulation's wording.

**Why compute Bayes factors on participant means?** Disclosure is a between-participant variable; the 708 clip ratings are not 708 independent pieces of evidence about it. BIC-approximated Bayes factors on the 236 participant means favour the null by 3–12 to one depending on the outcome, moderate rather than strong evidence, and depend on the unit-information prior implicit in the BIC approximation.

**Why not exclude participants who disbelieved the description?** Belief was measured after the clips and after all outcome items; disbelief may itself be a reaction to the condition (a participant told "AI only" who found the interaction genuine may doubt the description). Excluding on a post-treatment variable would condition on an outcome. Belief is used for sensitivity analysis: restricting to believers (*n* = 206) leaves the main contrast unchanged.

**How is heteroscedasticity handled?** Levene's tests indicated larger variance in the AI-only cell. Contrasts involving that cell are re-estimated with Welch's *t*, the Mann–Whitney test and a participant cluster bootstrap, none of which assumes equal variances; the genuineness effect survives all of them, the warmth and usefulness effects survive most.

**Why Plackett–Luce for the rankings?** Conditions offered three or four actors, so mean ranks are not comparable across conditions; the share ranked first (GEE) and Plackett–Luce worths (normalised within condition) are.

**How many tests were run?** 225 pairwise comparisons (supplement), 12 primary contrast tests (Holm within contrast), 6 secondary contrasts per outcome, 45 interaction tests, and 113 exploratory tests, all logged. Expected false positives at α = .05 are stated next to each family.
