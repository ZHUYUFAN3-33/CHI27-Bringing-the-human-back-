# Paper Configuration Record — Study 1 storyline pipelines (awaiting confirmation)

> Prepared 2026-09-05 for the `academic-paper` / `academic-pipeline` skills. The skills require the user to confirm this record before Phase 1 (literature) starts, and to confirm each stage checkpoint afterwards. One record is shared by the four storylines; the per-story rows differ only in title, RQ order and Results order (see `../stories/`).

| Field | Value |
|---|---|
| Paper type | Empirical research paper (IMRaD), CHI-style |
| Discipline | Human–computer interaction / human–robot interaction |
| Target venue | ACM CHI 2027 (Papers track) |
| Citation format | ACM Reference Format (numbered); IEEE used as the nearest supported style inside the skill, converted at formatting |
| Output format | Markdown draft + LaTeX (acmart, `sigconf`); DOCX via Pandoc on request |
| Language | English main text; the skill's bilingual abstract (zh + EN) kept as a by-product |
| Word count | 8,000 ± 10% excluding references (typical CHI Papers length) |
| Existing materials | Statistical Methods, Results, Limitations and reviewer-facing rationale drafts (`../methods.md`, `../results.md`, `../limitations.md`), Tables 1–8 (`../tables.md`), numbers sheet, five publication figures (`../figures/`), analysis workbook (`../../workbook.html`), storyline brief for the run (`../stories/story_*.md`) |
| Literature | Needed for Introduction, Related Work and Discussion only; every citation must be verified (DOI or web search); no invented references |
| Co-authors / funding / ethics | To be supplied by the user; Keio University Graduate School of Media Design; CloudResearch Connect participants; consent recorded; data retention to 2036-08-31 |
| Style calibration | None supplied (optional) |
| Citation verification level | Strict (every reference checked) |
| Material Passport | `experiments_declared`: see `material_passport.md` |

## Per-story parameters

| Story | Working title | Leading RQ | Results order | Mode |
|---|---|---|---|---|
| A | Bringing the Human Back? Disclosed Control Changes How an Avatar Robot's Interactions Feel, Its Operator's Profile Does Not | RQ1 → RQ2 → RQ4 | checks → human presence → bounded nulls → attribution → exploratory | full |
| B | Who Gets the Credit? AI Assistance Shifts Responsibility and Credit Away from the Human Behind an Avatar Robot | RQ4 → RQ1 → RQ2 | checks → attribution H/HA → attribution A → asymmetry → disclosure → perception → exploratory | full |
| C | Invisible by Design: Disclosing an Avatar Robot Operator's Disability Does Not Change How the Interaction Is Judged | RQ2 → RQ1 → RQ4 | checks → disclosure bounded null → no moderators → attribution → contrast case → exploratory | full (conditional on Study 2) |
| D | In the Eye of the Sceptic: Prior Attitudes to AI Decide Whether an AI-Controlled Avatar Robot Feels Genuine | E1 → RQ1 → RQ2 → RQ4 | checks → average penalty → attitude moderation → bounded nulls → attribution | outline-only recommended (headline is exploratory) |

## Checkpoints the pipeline will stop at (per story)
1. Confirmation of this record (before literature search).
2. Outline approval (Phase 2 → 3).
3. Stage 2 → 2.5 handoff; Stage 2.5 integrity gate (MANDATORY; blocks on unverifiable citations or data).
4. Stage 3 review decision (MANDATORY).
5. Stage 4 revision → 3′ re-review → 4.5 final integrity (MANDATORY) → 5 formatting.

## Budget note
Each `full` run is a 12-agent, 8-phase pipeline with literature search and up to two review loops; four full runs are roughly four times the cost of one. Recommendation: run A and B through the full pipeline (Stage 2 → 5), C through Stage 2 only until Study 2 data decide its viability, D as `outline-only`.
