# Limitations (draft) and reviewer-facing methodological rationale

> **TRIAL STORYLINE — draft text.**

## Limitations

**No direct manipulation check of control source.** The questionnaire did not ask participants to restate who controlled OriHime. Three indirect indicators are available: the three descriptions were believed to the same degree (76% of the analysis sample rated belief ≥ 5 of 7; no condition differences, *p* = .45), participants told that AI assisted the operator rated the operator as less in control (*d* = .40, *p* = .002), and participants in the AI-only condition ranked the AI first for responsibility and credit in 57–60% of clips, against 15–16% when a human was also present. These show that the text was read and believed, not that it produced the intended mental model in every participant.

**Unequal precision across conditions.** The design allocated one cell to AI-only control and six to human control, so contrasts involving the AI-only cell rest on 36 participants against 236. With 80% power the design detects a human-versus-AI difference of about *d* = .46; smaller differences — for example in competence (*d* = .27) — cannot be excluded. Between-participant variance was also larger in the AI-only cell, which is why the warmth and usefulness effects are reported as suggestive rather than robust.

**Task type is confounded with clip length.** The three clips run 70, 105 and 115 s and differ in content, so clip effects — which were large — are treated as nuisance terms, and the tentative observation that the AI competence penalty was confined to the relational clip is reported only as a hint.

**Single-item measures and ceiling effects.** Genuineness, warmth, competence and operator control were single items with 24–36% of ratings at the scale maximum. Ordinal robustness models agree with the linear models for the main contrast, but the single items limit reliability and the ceiling compresses differences among the human conditions.

**The disclosure was minimal.** The operator's disability was stated in one sentence on one page, before any clip, and was never repeated or depicted; the null effect of disclosure therefore applies to this minimal, textual form of disclosure and should not be generalised to visible or repeated cues. The control condition said nothing about disability rather than stating its absence, by design.

**Sample and setting.** Participants were an English-speaking online panel, mostly in the United States, watching pre-recorded clips of one robot in one workplace; the videos were identical across conditions, which is the study's strength for isolating prior attribution but limits ecological validity.

**Analysis plan not preregistered.** The primary sample, outcomes, model and contrasts were fixed before inferential testing but were not registered externally. The exploratory analyses are numerous (113 tests); one of them had been seen in an earlier descriptive pass. All exploratory results are reported in full and none is treated as confirmatory.

## Reviewer-facing rationale

**Why a linear mixed model rather than ANOVA on participant means?** Each participant rated three clips; the mixed model uses all 816 ratings while accounting for their dependence through a random intercept (ICC .40–.78), adjusts for clip and position, and allows clip × condition interactions to be tested. Analyses on participant means (Welch *t*, Mann–Whitney) are reported as robustness checks and, for the main contrast, agree in direction and mostly in significance.

**Why report unadjusted pairwise *p* values at all?** The 21 pairwise differences per outcome were computed to display the full pattern of condition differences (all significant differences among the primary outcomes involve the AI-only cell; none separates any two human cells), not to select findings. They are presented with Holm and Benjamini–Hochberg adjustments in the supplement, and inference rests on the three pre-specified contrasts.

**Why equal-weight cell means in the contrasts?** Cells differ in size only through random loss (36–41); equal weighting makes C1–C4 estimate the design's intended comparisons rather than a mixture weighted by drop-out.

**Why is the AI-only condition one cell?** Operator profile is undefined when no operator exists; the design is 3 × 2 plus one reference cell, not 3 × 3. This is why C1 compares six cells against one and why the reference cell has lower precision.

**Why equivalence tests?** A non-significant difference does not show similarity. TOST with pre-stated bounds (±0.35 *SD*, the design's smallest detectable effect for C2; ±0.50 *SD*) lets us state within what range the human-versus-human+AI and disclosure effects lie.

**Why not exclude participants who disbelieved the description?** Belief was measured after the clips and after all outcome items; disbelief may itself be a reaction to the condition (a participant told "AI only" who found the interaction genuine may doubt the description). Excluding on a post-treatment variable would condition on an outcome. Belief is used for sensitivity analysis: restricting to believers (*n* = 206) leaves the main contrast unchanged.

**How is heteroscedasticity handled?** Levene's tests indicated larger variance in the AI-only cell. Contrasts involving that cell are re-estimated with Welch's *t*, the Mann–Whitney test and a participant cluster bootstrap, none of which assumes equal variances; the genuineness effect survives all of them, the warmth and usefulness effects survive most.

**Why Plackett–Luce for the rankings?** Conditions offered three or four actors, so mean ranks are not comparable across conditions; the share ranked first (GEE) and Plackett–Luce worths (normalised within condition) are.

**How many tests were run?** 225 pairwise comparisons (supplement), 12 primary contrast tests (Holm within contrast), 6 secondary contrasts per outcome, 45 interaction tests, and 113 exploratory tests, all logged. Expected false positives at α = .05 are stated next to each family.
