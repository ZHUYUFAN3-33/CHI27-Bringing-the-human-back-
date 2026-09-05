# Fable handoff — Study 1 paper pipeline

Updated: 2026-09-05 (Asia/Tokyo)

## Continue from here

Work in this repository on branch `study1-analysis`. The committed starting
point is `86886a4` (`Adopt one unified storyline and start the paper pipeline
(Phase 0 config, Phase 2 outline)`). Do not restart the pipeline or discard the
untracked Phase 1 files.

Phase 1 literature verification and its reconciliation with the Phase 2 outline
were completed on 2026-09-05. The user then resolved the five outline decisions:
use the first title, keep the pending baseline's placement conditional on its
results, make Design Implications a Discussion subsection, keep the exploratory
AI-attitude moderation out of the
abstract, and leave author/CRediT/funding/ethics fields as placeholders. The
repository remains at the combined Phase 1 / Phase 2 approval checkpoint only
because the user still needs to approve the result-contingent baseline
integration rule. Do not enter Phase 3 or draft the manuscript before that
explicit approval.

## Canonical state

- Confirmed configuration:
  `analysis/study1-20260902/paper/pipeline/phase0_config/paper_configuration_record.md`
- Material Passport:
  `analysis/study1-20260902/paper/pipeline/material_passport.md`
- Phase 1 literature report (verified; currently untracked, preserve it):
  `analysis/study1-20260902/paper/pipeline/phase1_literature/literature_search_report.md`
- Phase 1 bibliography (verified; currently untracked, preserve it):
  `analysis/study1-20260902/paper/pipeline/phase1_literature/references.bib`
- Phase 1 record-level verification audit (currently untracked, preserve it):
  `analysis/study1-20260902/paper/pipeline/phase1_literature/verification_audit.md`
- Phase 2 outline with concrete citation anchor map, awaiting user approval:
  `analysis/study1-20260902/paper/pipeline/phase2_outline/paper_outline.md`
- Result-contingent no-disclosure-baseline integration plan, awaiting user
  approval:
  `analysis/study1-20260902/paper/pipeline/phase2_outline/no_disclosure_baseline_integration.md`
- Statistical claims must trace to:
  `analysis/study1-20260902/paper/numbers_sheet.md`,
  `analysis/study1-20260902/paper/tables.md`, and the committed analysis outputs.

The older file
`analysis/study1-20260902/paper/pipeline/paper_configuration_record.md` says
"awaiting confirmation" and is superseded by the confirmed Phase 0 record
above. Do not use it as the authority. Reconcile or archive it only after the
user approves that housekeeping change.

## Research constraints

- The manuscript must make its motivation legible to a reader with no project
  context before presenting the experimental conditions. Preserve the argument
  chain in `paper/stories/story_unified.md`: avatar-mediated work creates access
  and identity opportunities; AI makes the human contribution ambiguous; that
  ambiguity matters for evaluation, responsibility and credit, and disability
  self-disclosure; prior research studies these pieces separately; the present
  identical-behaviour experiment connects them. Structure each Related Work
  subsection as **what is known → what remains missing → why the gap matters**,
  and scope the integrated novelty claim to the documented 83-record corpus.
- One CHI 2027 paper combines four fully named strands under the unified frame
  recorded in Phase 0: disclosed control source and evaluation; responsibility
  and credit under AI involvement; disability disclosure and judgment; and the
  exploratory moderation by prior AI attitudes. Use semantic names in PI-facing
  or manuscript-facing text rather than internal letter codes.
- Study 1 results are complete and independently cross-checked. Do not rerun or
  change analyses unless a concrete discrepancy is found.
- The branch `study2`, item prefix `S2_`, and phrase `Study 2` are internal
  traceability labels. Public manuscript prose must call it the **independent
  no-disclosure baseline** (or simply **no-disclosure baseline**).
- The pending baseline is a fresh-cohort perception baseline, not a second
  causal experiment, replication, robustness test, or mediation study. Its data
  have not been collected. Never imply otherwise and do not merge the `study2`
  branch without explicit user direction.
- Do not reserve a standalone numbered main-text section for the baseline. Full
  methods/results go to the supplement. Main-text placement is conditional on
  the observed estimates under the rule in
  `phase2_outline/no_disclosure_baseline_integration.md`: at most a 250–400-word
  Results subsection when the findings materially change interpretation;
  otherwise use one to three interpretive sentences, or Limitations only.
- The locked title is *Bringing the Human Back? How Disclosing Who Controls an
  Avatar Robot Shapes Judgments of Genuineness, Warmth and Responsibility*.
  Design Implications is Discussion subsection 5.6, the exploratory AI-attitude
  moderation stays out of the abstract, and author/CRediT/funding/ethics
  metadata remain placeholders.
- Lead the disability-disclosure story positively but keep it bounded:
  disability disclosure and favourable evaluation coexisted without a
  detectable evaluative or attributional penalty under the tested conditions.
  This is encouraging evidence for designing more inclusive avatar-mediated
  work. It does not establish that stigma is absent, disclosure never matters,
  or workplaces are already inclusive. Use the approved wording in
  `paper/stories/story_unified.md` and `paper/stories/story_for_pi_review.md`.
- Citation verification is strict: verify each reference by DOI or publisher
  page, surface uncertainty, and never invent bibliographic support.
- The included set currently has 35 unique BibTeX keys and 35 unique DOIs. The
  2026-09-05 audit corrected Karinshak et al. 2023 to Article 116, 29 pages and
  added confirmed page/article metadata to six ACM records. Do not undo those
  corrections.
- Novelty and absence claims are deliberately qualified to the documented
  83-record search corpus. Preserve that scope in any later prose.
- Do not upload unpublished material to another model or service, enable
  cross-model review, or launch optional bibliographic API clients without the
  user's explicit consent.

## ARS-Codex compatibility

Codex has the global `academic-research-suite` skill installed at
`~/.codex/skills/academic-research-suite` (adapter 0.1.28, upstream ARS 3.21.1).
In a new Codex conversation, use `$academic-research-suite` and enter the
academic pipeline at the current checkpoint. Do not use
`resume_from_passport=<hash>`: this repository does not yet contain a valid ARS
boundary hash.

If the current agent cannot load that Codex skill, this handoff is the runtime-
independent continuation contract: follow the canonical files and constraints
above directly.

## Suggested continuation prompt

> Continue the academic paper pipeline from `FABLE_HANDOFF.md` in this existing
> worktree. Phase 1 verification is complete and the Phase 2 outline reflects
> the user's five decisions. Resume at the remaining approval checkpoint for
> `no_disclosure_baseline_integration.md`. Keep “Study 2” internal, do not merge
> the `study2` branch, and do not enter Phase 3 or draft the manuscript until the
> user explicitly approves the result-contingent integration rule.
