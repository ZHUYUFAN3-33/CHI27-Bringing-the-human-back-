# Argument Blueprint — Phase 3 (argument_builder)

> Built 2026-09-05 after the PI approved the Phase 2 outline and the outcome-contingent baseline integration rule. Inputs: `../phase2_outline/paper_outline.md` (section plan, citation anchor map, evidence map), `../phase1_literature/literature_search_report.md` (35 verified sources), `../../numbers_sheet.md`, `../../tables.md`, `../../stories/story_unified.md`. Every statistic below traces to the numbers sheet or Tables 1–8; every citation key resolves in `references.bib`.

## Central Thesis
This paper argues that, when observers judge an avatar robot at work, the description of who controls it matters through human presence rather than operator profile: removing the human from the description lowered perceived genuineness and warmth, whereas adding AI assistance or disclosing the operator's disability left evaluations unchanged within pre-stated bounds. Yet describing AI as involved redistributed responsibility and credit away from the operator even where evaluations did not move, so avatar-work systems must keep the human visible and credited when AI assists. Evidence: a randomised identical-behaviour experiment (N = 300, n = 272 analysed; seven descriptions × three clips) analysed with pre-specified mixed models, equivalence tests, Bayes factors and ranking models.

## Sub-Arguments

#### Sub-Argument 0 (framing): The three questions belong in one experiment because prior work studies them separately
- **Evidence**: operator-side avatar-work studies document access, fulfilment and identity negotiation but not perceiver-side judgment (`takeuchi2020avatar`, n = 10 pilot; `hatada2024redefining`, n = 7 longitudinal; `zhang2022telepresence`, 42-study review).
- **Evidence**: AI-disclosure effects are established mainly in text, voice and chat (`luo2019machines` field RCT; `jakesch2019aimc`; `ishowooloko2019transparency`); the closest robot study did not randomise disclosure or fix behaviour (`baba2020teleoperated`).
- **Evidence**: attribution research shows automation redistributes blame or credit but rarely both, and never across operator, AI, provider and interlocutor in assisted avatar work (`elish2019moral`; `hohenstein2020crumple`; `kim2006blame`; `epstein2020credit`; `awad2020drivers`; `furlough2021blame`).
- **Evidence**: disability research documents warmth–competence stereotypes and disclosure-strategy effects without holding competent mediated performance fixed (`fiske2002model`; `rohmer2018implicit`; `lyons2017disclosing`; `scior2011public`; `pettigrew2006meta`).
- **Reasoning**: a single disclosure sentence simultaneously fixes control source, implies accountability and can reveal identity; only a design that holds behaviour constant while varying the sentence can separate the three consequences.
- **Counter-argument**: "This is three studies stapled together."
- **Rebuttal (reframe)**: the manipulation is one sentence read once; the three outcomes are its three consequences for the same observer. Scope the novelty claim to the documented 83-record corpus.

#### Sub-Argument 1: Describing the controller as AI-only lowers perceived genuineness and warmth; every human-present description avoids this cost
- **Evidence**: genuineness (AU1) human-present vs AI-only Δ = 0.81 [0.35, 1.27], d = .62, p < .001, Holm .002 (Table 2, Figure 2); warmth (CR1) d = .52 (Δ .51/.50 for H/HA vs A, p .006/.007); overall OriHime evaluation via usefulness (OH2 Δ .38, p .036; OH d .35, p .048); competence (CR2) n.s.
- **Evidence**: robustness across eight specifications (all completers, without straightliners, covariate-adjusted, Welch p .017, Mann–Whitney p .023, cluster bootstrap p .011, ordinal OR 2.23 [1.17, 4.23]; Table 3); the AI-only cell has 1.3–1.5× larger SDs (Levene p ≤ .014), so the bootstrap and Welch results carry the claim.
- **Evidence**: pattern rule — of 84 primary pairwise comparisons, the 10 with uncorrected p < .05 all place a human-present cell above AI-only; 0 of 60 comparisons among human-present cells reach p < .05; Holm survivors AU1 H1/H3/HA1 > A (Figure 1; Supp. S1). Clip does not moderate (LRT p ≥ .13; Figure 3).
- **Evidence (literature)**: consistent with mind-perception and bot-disclosure findings (`gray2007dimensions`; `luo2019machines`; `dietvorst2015algorithm`) and with unrecognised teleoperation being rated better (`baba2020teleoperated`).
- **Reasoning**: identical footage rules out behavioural differences; the manipulation check (CR3 H > HA d .40) and dwell data show the sentences were processed; the effect is specific to the absence of a human, not to the presence of AI (see SA2).
- **Counter-argument**: "The genuineness item echoes the manipulation wording ('rather than like the execution of a program')."
- **Rebuttal (concede and limit)**: warmth, usefulness and attribution move in the same direction with unrelated wording; competence does not move, which a demand effect would not predict. Report CR3 as manipulation evidence, not as an outcome.
- **Counter-argument**: "AI-only is one cell of 36."
- **Rebuttal (acknowledge as limitation + refute in part)**: state MDE d = .50 for this contrast; the observed d = .62 exceeds it; six independent human cells each exceed A; heteroscedasticity handled by bootstrap.

#### Sub-Argument 2: Adding AI assistance to a human operator costs nothing perceptible, and who the operator is changes nothing detectable
- **Evidence**: human-only vs human-with-AI: OH d −.08, AU1 d .12, CR1 d .02, CR2 d −.17, all n.s.; TOST equivalent within ±.35 SD (OH) and ±.50 SD (others) (Table 4).
- **Evidence**: operator-profile main effects within human cells n.s. on every outcome (LRT p ≥ .12); control source × profile interactions n.s. (p ≥ .18).
- **Reasoning**: equivalence tests bound the effect rather than merely failing to reject; bounds equal the design MDE and are stated as such, not as smallest effects of interest (`lakens2017equivalence`).
- **Counter-argument**: "Equivalence at ±.50 SD is a wide bound."
- **Rebuttal (acknowledge as limitation)**: say so; the OH bound is tighter (±.35); point estimates near zero and BF01 favour the null; smaller effects remain possible.

#### Sub-Argument 3: Describing AI as involved redistributes responsibility and credit away from the operator, even though evaluations did not change
- **Evidence**: operator ranked first for responsibility/credit in 72 %/71 % of clips under human-only vs 55 %/51 % under human-with-AI (GEE OR .47 [.31, .73] / .42 [.27, .64]; Table 5); common-anchor measure 72.3 → 60.7 % and 71.2 → 60.2 % (OR .59 [.36, .93], p .022; OR .61, p .032; Table 7).
- **Evidence**: Plackett–Luce worths operator .68 [.62, .75] → .45 [.38, .53]; AI .28 [.25, .32]; provider .19 → .18; interlocutor .13 → .09 (Table 6, Figure 4). Under AI-only control the AI's standing relative to provider and interlocutor is similar to human-with-AI (OR 1.24/1.60, n.s.), so the large raw OR reflects the missing human, not a re-evaluation of the AI.
- **Evidence**: blame–credit asymmetry under human-with-AI: operator first for responsibility more often than for credit, +4.8 points, Wilcoxon p .024; not under human-only (+1.1, p .536) or AI-only.
- **Evidence (literature)**: moral crumple zone (`elish2019moral`); crumple-zone effects in AI-mediated chat (`hohenstein2020crumple`); autonomy and blame (`kim2006blame`; `furlough2021blame`; `awad2020drivers`); credit for AI-assisted work (`epstein2020credit`).
- **Reasoning**: SA2 shows judgments of the interaction were unchanged by AI assistance; SA3 shows recognition of the human's contribution fell anyway; the two processes dissociate, which is the paper's central novelty.
- **Counter-argument**: "The drop is mechanical — the human-with-AI list has four actors."
- **Rebuttal (refute with the common-anchor analysis)**: anchored on the two actors offered in every condition the reallocation persists (OR .59/.61), smaller but real; report both.
- **Counter-argument**: "Rankings of hypothetical outcomes are not real accountability decisions."
- **Rebuttal (acknowledge as limitation)**: hypothetical vignette outcomes are standard in this literature; direction is consistent across two measures and the PL worths.

#### Sub-Argument 4: Disclosing the operator's disability and favourable evaluation coexisted without a detectable evaluative or attributional penalty — encouraging but bounded
- **Evidence**: disclosed vs no mention on the four primary outcomes all n.s. (p ≥ .11), point estimates small and slightly negative (d to −.24); TOST excludes |d| ≥ .50; participant-unit BF01 3–12 (OH 20, CR2 16, CR3 13, PE 9.6, AU1 6.0, CR1 5.5 on the participant-unit recomputation; Table 8); intellectual = mobility (C4); pooled contrast same (C5).
- **Evidence**: no moderator across clip, contact frequency, stereotype content, position (20 tests n.s.); attribution unchanged (OR .89 [.57, 1.40] / .80 [.51, 1.25]); uptake — disclosed participants dwelt 5.5 s longer on the disclosure page (p .023); credibility equal across profiles (BEL1 p .348).
- **Evidence (literature)**: disability stereotypes are warmth-high/competence-low (`fiske2002model`; `rohmer2018implicit`); disclosure strategy affects hiring intentions (`lyons2017disclosing`); intellectual disability attracts distinct attitudes (`scior2011public`); contact reduces prejudice (`pettigrew2006meta`).
- **Reasoning**: the contrast case (SA1) shows the paradigm detects disclosure effects of moderate size, so this null is not a failure of sensitivity; bounds and Bayes factors make it informative; the equal-training sentence and competent footage are boundary conditions that the stereotype literature predicts would suppress a competence penalty.
- **Counter-argument**: "A null from a one-sentence manipulation is uninformative."
- **Rebuttal (concede and limit)**: report the 41 % power at d = −.24 and the bounds; claim only "no observable cost in this setting", never "no effect" or "no stigma".
- **Counter-argument**: "'No mention' already implies no disability, so nothing was manipulated."
- **Rebuttal (acknowledge; conditional)**: the independent no-disclosure baseline will show what the clips imply; under a disability-default result (Db) the claim weakens to "explicit disclosure added no detectable incremental effect" per the frozen integration rule.
- **Counter-argument**: "You are calling a null 'inclusive'."
- **Rebuttal (limit scope)**: the paper says the result is encouraging for designing inclusive avatar-mediated work; it does not say workplaces are inclusive or stigma is absent (rules 1–4 in `story_unified.md`).

#### Sub-Argument 5 (exploratory): The AI-only penalty is concentrated among participants with less positive prior attitudes to AI
- **Evidence**: GAAIS-positive × control-source interaction: OH slopes .50 (AI-only) vs .28 (human-present), p .019; CR2 .38 vs .10, p .003; AU1 and CR1 p .08–.09; at −1 SD the AI-only penalty is 0.44–0.91 scale points (all p ≤ .015), at +1 SD −0.20 to +0.20 (n.s.) (Figure 5). Human-with-AI slope (.30) matches human-only (.26).
- **Reasoning**: attitude-dependence was triggered by the absence of a human, not the presence of AI; consistent with attitude-dependent algorithm aversion (`dietvorst2015algorithm`; `schepman2020gaais`).
- **Counter-argument**: "Post hoc interaction; 113 exploratory tests."
- **Rebuttal (acknowledge as exploratory)**: labelled post hoc, out of the abstract, with the full test count reported; a replication target, not a claim.

## Logical Flow
1. **Introduction** — SA0 in narrative form: avatar work creates access and identity opportunities → AI makes the human contribution ambiguous → a sentence decides visibility, credit and self-presentation → the three questions + exploratory fourth → contributions (scoped to the corpus).
2. **Related Work** — each subsection known → missing → why it matters, feeding SA0; 2.5 states the integrated gap once.
3. **Method** — design that makes the CER chains valid (identical footage, random assignment, pre-specified plan, bounds set before inference, participant as unit).
4. **Results** — 4.1 checks (uptake and credibility, so SA1–SA4 are about processed descriptions) → 4.2 SA1 then SA2 (presence not profile) → 4.3 SA3 (attribution moves although evaluation did not) → 4.4 SA4 (bounded, positive-leaning) → 4.5 SA5 (exploratory) → 4.6 baseline slot only if triggered.
5. **Discussion** — 5.1 SA1+SA2 synthesis; 5.2 SA3 as the dissociation; 5.3 SA4 with its four boundaries; 5.4 SA5; 5.5 conditional; 5.6 design implications each mapped to a sub-argument and its evidence strength.
6. **Limitations** — every rebuttal of type "acknowledge as limitation" appears here verbatim in substance.

## Argument Strength Assessment
| Sub-Argument | Evidence Strength | Logic Validity | Counter-Arg Risk |
|---|---|---|---|
| 0 Integrated gap | Moderate (corpus-scoped) | Valid | Medium ("three studies stapled") |
| 1 AI-only penalty on genuineness/warmth | Strong (d .62, 8 specs, pattern rule) | Valid | Medium (item wording; small A cell) |
| 2 AI assistance and profile are equivalent | Strong for OH bound; Moderate at ±.50 | Qualified (bounds = MDE) | Medium (wide bound) |
| 3 Attribution shifts to AI | Strong (two measures + PL) | Valid | Medium (mechanical list effect; hypothetical outcomes) |
| 4 Disability disclosure without observable penalty | Moderate (bounded null, BF 3–12) | Qualified | High (weak manipulation; "no mention" semantics; baseline pending) |
| 5 Sceptics pay the penalty | Weak (post hoc) | Qualified | High |

## Notes for Draft Writer
- **Naming**: never "Study 1/Study 2" in prose; "the experiment" and "the independent no-disclosure baseline". Never internal codes (H/HA/A, C1–C5, OH/AU1/CR1, W1–W5, Da–De) in running text; use "human-only control", "human control with AI assistance", "AI-only control", "no disability mention", "intellectual-disability disclosure", "mobility-disability disclosure", "perceived genuineness", "controller warmth/competence", "overall evaluation of OriHime". Codes may appear in tables and the supplement.
- **Hedging vocabulary**: pre-specified claims — "lowered", "did not differ within ±0.35 SD", "were equivalent"; exploratory — "was associated with", "in an exploratory analysis", "post hoc"; null — "no detectable", "within the pre-stated bounds", "no observable cost in this setting"; forbidden — "proves", "no effect", "no stigma", "more inclusive workplace", "replicates".
- **Numbers**: use Table/Figure references; d with CI where available; p to three decimals or "< .001"; Holm-adjusted p where a family exists; report the 113/37 exploratory count once.
- **Emphasis**: lead 4.2 with genuineness, lead 4.3 with the dissociation sentence, lead 4.4 with the coexistence sentence then bounds. The Discussion's first paragraph states the thesis in one sentence.
- **Citations**: nearest empirical source per empirical claim; guideline sources (`amershi2019guidelines`; `hancock2020aimc`; `liu2022console`; `karinshak2023persuade`) only in 5.6 and framing; corpus qualifier ("within the 83 records screened") on every novelty/absence claim; no source outside `references.bib`.
- **Baseline slot**: write §4.6 and §5.5 as bracketed placeholders with the trigger rule quoted; do not invent estimates.
- **Writing quality**: vary paragraph length; no throat-clearing openers; avoid "delve", "crucial", "landscape", "tapestry"; no em-dash chains; one idea per sentence in Results.
- **Mandatory statements**: Data availability, Ethics (Keio University Graduate School of Media Design; consent; retention to 2036-08-31), CRediT, COI, Funding, AI-use disclosure — placeholders in square brackets where the PI must supply identifiers.
