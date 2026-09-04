# Study 1 analysis pipeline (2026-09-04)

Reproducible analysis for the Study 1 export of 2026-09-02. The raw export is read from `$STUDY1_EXPORT`, default `../../exports/20260902T104106Z` (git-ignored; the derived participant-level files below are committed, so every step after `prep.py` runs from the repository alone). Run everything with the
Anaconda interpreter on this machine (`/opt/anaconda3/bin/python`; pandas 2.2, statsmodels 0.14, scipy, matplotlib):

```bash
bash run_all.sh
```

| step | script | writes |
|---|---|---|
| 1 | `prep.py` | `participants_clean.csv` (300 completes, scale scores, quality flags), `long_segments.csv` (participant x clip), `ranks_long.csv` |
| 2 | `quality.py` | `quality_report.txt` |
| 3 | `descriptives.py`, `figures_descriptive.py` | `descriptives_report.txt`, `figures/fig1-5` |
| 4 | `inferential_primary.py` | `results/models_primary.csv`, `pairwise_all.csv`, `pairwise_ctrl.csv`, `contrasts.csv`, `interactions.csv`, `simple_effects_clip.csv`, `participant_level_anova.csv`, `ranks_tests.csv`, `robustness.csv`, `bootstrap_contrasts.csv`, `variance_check.csv`; `results_round1.txt` |
| 5 | `figures_round1.py` | `figures/fig6-7` |
| 6 | `exploration_phase14.py` | `results/e1_*.csv` ... `e8_*.csv`, `phase14_test_log.csv`; `results_phase14.txt` |
| 7 | `figures_phase14.py` | `figures/fig8-9` |
| 8 | `paper_numbers.py`, `figures_paper.py` | `paper/numbers_sheet.md`, `paper/tables.md`, `paper/figures/*.png|pdf` |
| 9 | `build_workbook.py` | `workbook.html` (the Chinese analysis workbook; same content as the published Artifact) |

Decisions fixed before any inferential test (2026-09-04): primary sample = completed + attention check + comprehension check
(n = 272); primary outcomes OH composite, AU1, CR1, CR2; primary model `DV ~ condition + clip + position + (1 | participant)`;
primary contrasts C1 human-involved vs AI-only, C2 H vs HA, C3 disability disclosed vs no mention. Everything else is
labelled exploratory / sensitivity / robustness in the outputs. The manuscript drafts in `paper/` follow a **trial storyline**
(marked as such) and are not a decision.

Committed on branch `study1-analysis`. `participants_clean.csv`, `long_segments.csv` and `ranks_long.csv` carry the platform participant numbers, which the study treats as anonymous identifiers.
