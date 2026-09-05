# Study 1 survey application — agent entry point

This repository is the survey application only: the Study 1 questionnaire, the
independent no-disclosure baseline instrument under `/s2`, the database, the raw
exports, and the Fly.io deployment.

## The analysis and the paper are not here

The Study 1 statistical analysis and the CHI 2027 manuscript live in a
**separate repository** at `../chi27-paper` (split out of this one on
2026-09-05, with the original `analysis/` history preserved). Read `AGENTS.md`
there before touching the paper pipeline. Do not recreate an `analysis/`
directory for Study 1 here, and do not copy manuscript files into this
repository — it is what gets built into the deploy image.

The one exception is `analysis/study2/precision.py`, the design-stage precision
calculation for the baseline instrument, which belongs with the instrument.

## Branches

`main` is the only active branch.

- `study1-analysis` is kept frozen as the pre-split backup. Do not commit to it
  and do not create a worktree for it; its contents are in `../chi27-paper`.
- The `study2` branch was fast-forwarded into `main` on 2026-09-05 after Study 1
  finished collecting. Tag `study2-final` and `origin/study2` mark that
  instrument as it stood before the merge.

## Data

Raw exports live in `exports/` and are gitignored. `exports/20260902T104106Z` is
the Study 1 export the analysis pipeline reads; a copy of it sits in
`../chi27-paper/exports/` so that repository runs standalone.
