#!/usr/bin/env bash
# =============================================================================
# One-command deploy to Fly.io. Safe to re-run: every step checks before acting.
#
#   ./scripts/deploy.sh
#   APP=my-study-name REGION=iad ./scripts/deploy.sh
#
# What it does, in order: create the app, create and attach Managed Postgres,
# generate and set the secrets, deploy, scale to two machines, smoke-test.
# =============================================================================
set -euo pipefail

APP="${APP:-${FLY_APP:-study1-survey}}"
REGION="${REGION:-${FLY_REGION:-nrt}}"
SCALE="${SCALE:-2}"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
step() { printf '\n\033[1;36m==>\033[0m \033[1m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

command -v fly >/dev/null || die "flyctl is not installed — https://fly.io/docs/flyctl/install/"
fly auth whoami >/dev/null 2>&1 || die "not logged in — run: fly auth login"

step "Account"
fly auth whoami

# --- 1 · the app ------------------------------------------------------------
step "App: $APP (region $REGION)"
if fly status -a "$APP" >/dev/null 2>&1; then
  echo "    already exists"
else
  fly apps create "$APP"
fi

# fly.toml must name the same app, or `fly deploy` targets the wrong one.
if ! grep -q "^app *= *[\"']$APP[\"']" fly.toml; then
  warn "fly.toml names a different app; updating it to \"$APP\""
  sed -i.bak -E "s/^app *= *.*/app            = \"$APP\"/" fly.toml && rm -f fly.toml.bak
fi
if ! grep -q "^primary_region *= *[\"']$REGION[\"']" fly.toml; then
  sed -i.bak -E "s/^primary_region *= *.*/primary_region = \"$REGION\"/" fly.toml && rm -f fly.toml.bak
  echo "    fly.toml primary_region set to $REGION"
fi

# --- 2 · Postgres -----------------------------------------------------------
step "Postgres"
# `fly secrets list` prints a table — ` * NAME │ DIGEST │ STATUS ` — so the name
# is never at the start of the line. Anchoring on ^ silently reports every secret
# as missing, which here meant creating a second Postgres cluster on every run.
secret_set() { fly secrets list -a "$APP" 2>/dev/null | grep -qE "^[[:space:]*]*$1[[:space:]]"; }

if secret_set DATABASE_URL; then
  echo "    DATABASE_URL already set — leaving the existing database alone"
else
  CLUSTER="${MPG_CLUSTER:-}"
  if [[ -z "$CLUSTER" ]]; then
    echo "    creating a Managed Postgres cluster (this takes a couple of minutes)"
    fly mpg create --name "${APP}-db" --region "$REGION" || true
    echo
    echo "    Clusters on this account:"
    fly mpg list || true
    echo
    read -r -p "    Paste the cluster id to attach: " CLUSTER
  fi
  [[ -n "$CLUSTER" ]] || die "no cluster id given — re-run with MPG_CLUSTER=<id> ./scripts/deploy.sh"
  fly mpg attach "$CLUSTER" -a "$APP"
fi

# --- 3 · secrets ------------------------------------------------------------
step "Secrets"
have() { secret_set "$1"; }

NEW_TOKEN=""
declare -a PENDING=()

if have ADMIN_TOKEN; then
  echo "    ADMIN_TOKEN already set"
else
  NEW_TOKEN="${ADMIN_TOKEN:-$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | cut -c1-40)}"
  PENDING+=("ADMIN_TOKEN=$NEW_TOKEN")
fi

if have IP_SALT; then
  echo "    IP_SALT already set (never rotate it — old hashes stop comparing)"
else
  PENDING+=("IP_SALT=${IP_SALT:-$(openssl rand -hex 24)}")
fi

for kv in "STUDY_OPEN=${STUDY_OPEN:-true}" \
          "RECRUITMENT=${RECRUITMENT:-cloudresearch}" \
          "OPTIONAL_BLOCK=${OPTIONAL_BLOCK:-on}"; do
  key="${kv%%=*}"
  have "$key" && echo "    $key already set" || PENDING+=("$kv")
done

[[ -n "${CONTACT_EMAIL:-}" ]]           && PENDING+=("CONTACT_EMAIL=$CONTACT_EMAIL")
[[ -n "${COMPLETION_REDIRECT_URL:-}" ]] && PENDING+=("COMPLETION_REDIRECT_URL=$COMPLETION_REDIRECT_URL")

if ((${#PENDING[@]})); then
  fly secrets set -a "$APP" --stage "${PENDING[@]}"
  echo "    set: ${PENDING[*]%%=*}"
fi

# --- 4 · deploy -------------------------------------------------------------
step "Deploy"
fly deploy -a "$APP" --ha=false --strategy rolling

step "Scale to $SCALE machines"
fly scale count "$SCALE" -a "$APP" --yes

# --- 5 · smoke test ---------------------------------------------------------
step "Smoke test"
URL="https://${APP}.fly.dev"
for i in 1 2 3 4 5 6; do
  BODY="$(curl -fsS --max-time 15 "$URL/healthz" 2>/dev/null || true)"
  [[ "$BODY" == *'"ok":true'* ]] && break
  echo "    waiting for the app to answer (${i}/6)…"; sleep 5
done
[[ "${BODY:-}" == *'"ok":true'* ]] \
  && echo "    /healthz  $BODY" \
  || die "the app did not become healthy — check: fly logs -a $APP"

CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$URL/")
echo "    /          HTTP $CODE  (participant page)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$URL/admin")
echo "    /admin     HTTP $CODE  (401 without the token is correct)"

# --- done -------------------------------------------------------------------
step "Done"
bold "  Participant link   $URL/"
bold "  Pilot link         $URL/?test=1          (real study, flagged as test data)"
if [[ -n "$NEW_TOKEN" ]]; then
  echo
  bold "  ADMIN TOKEN        $NEW_TOKEN"
  warn "Save this now — Fly will only show you a digest from here on."
  bold "  Dashboard          $URL/admin?token=$NEW_TOKEN"
else
  bold "  Dashboard          $URL/admin?token=<your ADMIN_TOKEN>"
fi
echo
echo "  Next: set per-cell targets in the dashboard, then paste the participant"
echo "  link into CloudResearch with participant-ID passing switched on."
