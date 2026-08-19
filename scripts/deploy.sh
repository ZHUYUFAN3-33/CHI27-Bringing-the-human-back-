#!/usr/bin/env bash
# First-time setup and deploy. Safe to re-run: every step is idempotent.
set -euo pipefail

APP="${FLY_APP:-study1-survey}"
REGION="${FLY_REGION:-nrt}"

need() { command -v "$1" >/dev/null || { echo "missing: $1"; exit 1; }; }
need fly

echo "==> app: $APP   region: $REGION"

if ! fly apps list | grep -qw "$APP"; then
  echo "==> creating app"
  fly apps create "$APP"
fi

# --- Postgres -----------------------------------------------------------------
if ! fly secrets list -a "$APP" 2>/dev/null | grep -q DATABASE_URL; then
  echo
  echo "==> No DATABASE_URL yet. Create and attach a Managed Postgres cluster:"
  echo
  echo "      fly mpg create --name ${APP}-db --region $REGION"
  echo "      fly mpg attach <cluster-id> -a $APP"
  echo
  echo "    Then run this script again."
  exit 1
fi

# --- secrets ------------------------------------------------------------------
set_if_missing() {
  local key="$1" val="$2"
  if fly secrets list -a "$APP" | grep -q "^$key"; then
    echo "==> $key already set, leaving it alone"
  else
    echo "==> setting $key"
    fly secrets set -a "$APP" --stage "$key=$val"
  fi
}

ADMIN_TOKEN_VAL="${ADMIN_TOKEN:-$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-40)}"
IP_SALT_VAL="${IP_SALT:-$(openssl rand -hex 24)}"

set_if_missing ADMIN_TOKEN "$ADMIN_TOKEN_VAL"
set_if_missing IP_SALT     "$IP_SALT_VAL"
set_if_missing STUDY_OPEN  "${STUDY_OPEN:-true}"
set_if_missing RECRUITMENT "${RECRUITMENT:-cloudresearch}"
set_if_missing OPTIONAL_BLOCK "${OPTIONAL_BLOCK:-on}"

# --- deploy -------------------------------------------------------------------
echo "==> deploying"
fly deploy -a "$APP" --ha=false --strategy rolling

echo "==> scaling to 2 machines for redundancy"
fly scale count 2 -a "$APP" --yes

echo
echo "==> done"
echo "    participant link : https://$APP.fly.dev/"
echo "    dashboard        : https://$APP.fly.dev/admin?token=<ADMIN_TOKEN>"
echo
echo "    Read the admin token back with:  fly secrets list -a $APP"
echo "    (Fly shows only a digest; if you did not save it, set a new one:"
echo "     fly secrets set -a $APP ADMIN_TOKEN=\$(openssl rand -base64 32))"
