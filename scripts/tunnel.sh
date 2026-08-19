#!/usr/bin/env bash
# Open a local tunnel to the Managed Postgres cluster so any desktop client —
# psql, TablePlus, DBeaver, R's DBI, Python's psycopg — can reach it as if it
# were running on your own machine. Leave this running in its own terminal.
set -euo pipefail

CLUSTER="${MPG_CLUSTER:-}"
PORT="${MPG_PORT:-5432}"

if [[ -z "$CLUSTER" ]]; then
  echo "Which cluster? Pick an id from below, then re-run:"
  echo
  echo "    MPG_CLUSTER=<cluster-id> ./scripts/tunnel.sh"
  echo
  fly mpg list
  exit 1
fi

echo "==> tunnelling $CLUSTER to localhost:$PORT"
echo "    connection string for your client:"
echo
fly mpg status "$CLUSTER" 2>/dev/null | sed -n 's/^ *Database *: */    database: /p' || true
echo "    host localhost · port $PORT · sslmode disable"
echo
echo "    psql: fly mpg connect $CLUSTER"
echo
exec fly mpg proxy "$CLUSTER" --port "$PORT"
