#!/usr/bin/env bash
# Pull every export to ./exports/. Works from anywhere — it is plain HTTPS,
# so no tunnel and no database client are needed.
#
#   ADMIN_TOKEN=... APP=study1-survey ./scripts/export.sh
set -euo pipefail

APP="${APP:-study1-survey}"
BASE="${BASE:-https://$APP.fly.dev}"
: "${ADMIN_TOKEN:?set ADMIN_TOKEN}"

OUT="exports/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT"

for f in wide responses participants page_times video_events codebook instrument_overrides instrument_publications; do
  echo "==> $f.csv"
  curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" \
       "$BASE/api/export/$f.csv" -o "$OUT/$f.csv"
done

echo "==> all.json"
curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" \
     "$BASE/api/export/all.json" -o "$OUT/all.json"

echo
echo "saved to $OUT"
wc -l "$OUT"/*.csv
