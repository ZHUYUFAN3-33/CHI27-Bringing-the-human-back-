#!/usr/bin/env bash
# Pull every Study 2 export to ./exports/s2-<timestamp>/.
#
#   ADMIN_TOKEN=... APP=study1-survey ./scripts/s2-export.sh
set -euo pipefail

APP="${APP:-study1-survey}"
BASE="${BASE:-https://$APP.fly.dev}"
: "${ADMIN_TOKEN:?set ADMIN_TOKEN}"

OUT="exports/s2-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT"

for f in wide responses participants page_times video_events codebook; do
  echo "==> $f.csv"
  curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/s2/export/$f.csv" -o "$OUT/$f.csv"
done
echo "==> wide_labels.csv"
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/s2/export/wide.csv?labels=1" -o "$OUT/wide_labels.csv"
echo "==> all.json"
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/s2/export/all.json" -o "$OUT/all.json"

echo
echo "saved to $OUT"
wc -l "$OUT"/*.csv
