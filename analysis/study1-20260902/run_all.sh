#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PY=/opt/anaconda3/bin/python
$PY prep.py
$PY quality.py > quality_report.txt
$PY descriptives.py > descriptives_report.txt
$PY figures_descriptive.py
$PY inferential_primary.py > results_round1.txt
$PY figures_round1.py
$PY exploration_phase14.py > results_phase14.txt
$PY figures_phase14.py
$PY paper_numbers.py > /dev/null
$PY figures_paper.py
$PY build_workbook.py
echo "done"
