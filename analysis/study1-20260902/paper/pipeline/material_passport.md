# Material Passport — Study 1 (experiments_declared)

| Field | Value |
|---|---|
| Declaration | `experiments_declared` |
| Study | Study 1, “Bringing the Human Back?”, online between-subjects experiment with three within-subject clips |
| Data collection | CloudResearch Connect, 2026-09-02 00:03–02:03 UTC; 316 starts, 300 completes, 1 screened out, 15 abandoned |
| Instrument | `shared/instrument.js` v6e (repository `study1-survey`), 12 pages, 90 stored items per participant (96 in HA) |
| Raw export | `exports/20260902T104106Z/` (git-ignored: `wide.csv`, `responses.csv`, `participants.csv`, `page_times.csv`, `video_events.csv`, `codebook.csv`) |
| Derived data (committed) | `analysis/study1-20260902/participants_clean.csv` (300 × 154), `long_segments.csv` (900 × 48), `ranks_long.csv` (6,168 × 8) |
| Analysis code | `analysis/study1-20260902/*.py`, run with `run_all.sh`; Python 3.12, pandas 2.2, statsmodels 0.14, scipy, matplotlib |
| Result tables | `analysis/study1-20260902/results/*.csv` (primary models, 225 pairwise comparisons, contrasts, interactions, ranks, robustness, bootstrap, variance check, exploratory E1–E8 log with 113 tests, disability sweep D1–D8, common-anchor attribution, Bayes factors) |
| Reports | `quality_report.txt`, `descriptives_report.txt`, `results_round1.txt`, `results_phase14.txt`, `results_disability_sweep.txt` |
| Pre-specification | Primary sample (n = 272), primary outcomes, primary model and contrasts C1–C3 fixed on 2026-09-04 before any inferential statistic was computed; not preregistered; recorded in the workbook's Analysis Roadmap and Log |
| Independent check | `analysis/study1-20260902-cross-review/` re-derived all numbers (max |Δ| 5.6e-17) and its corrections were adopted on 2026-09-04 |
| Provenance chain for every number in the drafts | `paper_numbers.py` → `paper/numbers_sheet.md`, `paper/tables.md`; figures from `figures_paper.py` |
| Known limitations to carry into every draft | no direct manipulation check; one small AI-only cell with larger variance; single-item outcomes with ceiling; clip length confounded with task; minimal disclosure preceded by stereotype items and followed by an equal-training assurance; US online panel; analysis plan not preregistered |
