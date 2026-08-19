# Deploying to Fly.io

## The short version

```bash
brew install flyctl          # or: curl -L https://fly.io/install.sh | sh
fly auth login

npm install
./scripts/preflight.sh       # checks everything that can be checked offline
./scripts/deploy.sh          # creates the app, the database, the secrets, deploys
```

`deploy.sh` prints your participant link and your admin token at the end. **Save
the admin token** — Fly only shows a digest afterwards.

It is safe to re-run: every step checks before it acts, so a second run just
redeploys and leaves the database and secrets alone.

To use a different name or region:

```bash
APP=bringing-human-back REGION=iad ./scripts/deploy.sh
```

Regions: `nrt` Tokyo, `iad` US east, `lhr` London, `fra` Frankfurt. Put it near
your participants.

---

## Deploying from GitHub instead

If you would rather not install flyctl, `.github/workflows/fly-deploy.yml`
deploys on every push to `main`, after running the test suite.

```bash
fly tokens create deploy -a study1-survey     # run once, from anywhere with flyctl
```

Then add the token to the repository under **Settings → Secrets and variables →
Actions → New repository secret**, named `FLY_API_TOKEN`. After that, pushing to
`main` deploys. You still need `deploy.sh` (or the manual steps below) once, to
create the app and the database — CI only deploys to something that exists.

---

## The long version, step by step

Do this if you want to understand or vary what `deploy.sh` does.

### 1 · Create the app

Edit `app` and `primary_region` in `fly.toml` first.

```bash
fly apps create study1-survey
```

### 2 · Create and attach Managed Postgres

```bash
fly mpg create --name study1-survey-db --region nrt
fly mpg list                                   # copy the cluster id
fly mpg attach <cluster-id> -a study1-survey
```

`attach` sets `DATABASE_URL` on the app as a secret. It hands out the **pooled**
connection string, which goes through PgBouncer in transaction-pooling mode —
nothing in this app uses named prepared statements, `LISTEN/NOTIFY`, or session
state, so that is safe.

The schema is applied automatically the first time the app boots.

### 3 · Set the secrets

```bash
fly secrets set -a study1-survey \
  ADMIN_TOKEN="$(openssl rand -base64 32)" \
  IP_SALT="$(openssl rand -hex 24)" \
  STUDY_OPEN=true \
  RECRUITMENT=cloudresearch \
  OPTIONAL_BLOCK=on \
  CONTACT_EMAIL="you@university.edu"
```

**Write the `ADMIN_TOKEN` down now.** Fly only ever shows you a digest
afterwards. If you lose it, set a new one — nothing depends on the old value.

`IP_SALT` must be set once and then left alone: rotating it makes the stored
hashes uncomparable, which is the only thing they are for.

### 4 · Deploy

```bash
fly deploy -a study1-survey
fly scale count 2 -a study1-survey     # two machines: redundancy + zero-downtime deploys
```

Check it:

```bash
curl https://study1-survey.fly.dev/healthz
# {"ok":true,"instrument":"v5-r2","open":true}
```

---

## If something goes wrong

| symptom | what to do |
|---|---|
| `fly deploy` builds but the machine keeps restarting | `fly logs -a study1-survey`. A config guard refuses to start in production without `ADMIN_TOKEN` and `IP_SALT`, and says which is missing. |
| `/healthz` returns 503 | The database is unreachable. `fly mpg status <cluster-id>`, and check `DATABASE_URL` is set: `fly secrets list -a study1-survey`. |
| `/admin` returns 401 with the right token | The token has a `+` or `/` in it and the URL ate it. Use the `Authorization: Bearer` header, or set a token with no URL-special characters. |
| The video never loads for participants | The clips must be **Unlisted**, not Private, and embedding must be allowed. Check one directly: `https://youtu.be/FM4xHwqv03M`. |
| Docker build fails on `npm ci` | `package-lock.json` is out of step with `package.json`. Run `npm install` and commit the lockfile. |

---

## Reaching the database from your own machine

Managed Postgres is not exposed to the public internet. `flyctl` opens an
encrypted tunnel instead, and once it is up the cluster behaves like a local
server for any client you like.

```bash
fly mpg proxy <cluster-id> --port 5432     # leave this running
```

Then, in another terminal or in a GUI client:

| | |
|---|---|
| host | `localhost` |
| port | `5432` |
| database / user / password | from `fly mpg status <cluster-id>` |
| SSL | not needed — the tunnel is already encrypted |

```bash
psql "postgres://USER:PASS@localhost:5432/DBNAME"
fly mpg connect <cluster-id>               # or let flyctl open psql for you
```

TablePlus, DBeaver, Postico, DataGrip, R's `DBI`/`RPostgres` and Python's
`psycopg` all connect to `localhost:5432` normally while the tunnel is up.
`./scripts/tunnel.sh` wraps this.

```r
library(DBI)
con <- dbConnect(RPostgres::Postgres(),
                 host = "localhost", port = 5432,
                 dbname = "DBNAME", user = "USER", password = "PASS")
d <- dbGetQuery(con, "SELECT * FROM v_responses_long WHERE NOT is_test")
```

**For most analysis you do not need any of this.** The export endpoints are plain
HTTPS and work from anywhere:

```bash
ADMIN_TOKEN=... APP=study1-survey ./scripts/export.sh
```

---

## CloudResearch Connect

Connect appends its own identifiers to your study link. Give it:

```
https://study1-survey.fly.dev/
```

and enable participant-ID passing. The app reads `participantId`, `assignmentId`
and `projectId` from the query string and stores them on the participant row as
`external_pid`, `external_session` and `external_study` — that is how a Connect
submission is matched to a row in your data. (Prolific's `PROLIFIC_PID` /
`STUDY_ID` / `SESSION_ID` and MTurk's `workerId` / `assignmentId` / `hitId` are
also recognised, so a pilot on another panel needs no code change.)

For completion, use either or both:

- **Redirect** — copy the Redirect URL from the end of Connect's *Create a Study*
  wizard and set it as `COMPLETION_REDIRECT_URL`. Participants are sent back
  automatically, with a button as a fallback.
- **Completion code** — leave `COMPLETION_CODE` unset and each participant gets
  their own unique code, which is also their `short_code` in the database. That
  is more useful than a fixed code: a submitted code identifies exactly one row.
  Set `COMPLETION_CODE` if Connect requires one fixed value.

```bash
fly secrets set -a study1-survey COMPLETION_REDIRECT_URL="https://connect.cloudresearch.com/..."
```

Test the whole path before launching with a link ending in `?test=1`: it runs the
real study but flags the row as test data, keeps it out of every export, and
returns its allocation slot.

---

## Running the study

**Set per-cell targets.** For 700 participants across 21 cells, allowing for the
15 % exclusion rate the power analysis assumes, put a target on each cell in the
dashboard. A cell closes itself once it fills, and the randomiser stops offering
it. When every cell is full, new arrivals get a “study is closed” page instead of
consuming a slot.

**Pause without redeploying:**

```bash
fly secrets set -a study1-survey STUDY_OPEN=false   # new starts are refused
fly secrets set -a study1-survey STUDY_OPEN=true    # resume
```

Anyone already in progress can always finish.

**After piloting**, press *Recount assigned* in the dashboard. Test rows return
their slot at the start, but the button re-derives every counter from the
participants table, which is the safe thing to do before real recruitment opens.

**Watch during collection:** the dashboard's cell table (balance), drop-off table
(where people leave), and the three quality tiles. `fly logs -a study1-survey`
for anything unexpected.

---

## Capacity

700 concurrent participants is a small load here. Each person sends about one
request per page turn — fourteen over the whole study — plus a keepalive once a
minute, so the steady state is on the order of 20 requests a second, each a few
milliseconds of Postgres work. The videos stream from YouTube and never touch
this server.

The load test in `scripts/simulate.mjs` runs 700 complete questionnaires,
120 at a time, in about 15 seconds on a single machine with no errors — roughly
four orders of magnitude more than the real arrival rate.

Two machines is therefore about redundancy and zero-downtime deploys, not
throughput. If you want more headroom anyway, `fly scale count 4` costs little;
raise `PG_POOL_MAX` only if Postgres connections actually run short.

Rate limits are keyed on the participant's own token, not their IP address, so a
university lab or a carrier-grade NAT does not throttle a whole room. Only
`/api/session/start` is IP-keyed, at 150 starts per minute per address; raise
`SESSION_START_RATE_MAX` if you expect a large group to start together from one
network.

---

## Backups

Managed Postgres takes its own snapshots. Before analysis, take your own copy too —
a file you hold is not subject to anyone else's retention policy:

```bash
ADMIN_TOKEN=... APP=study1-survey ./scripts/export.sh   # CSV + JSON, timestamped
pg_dump "postgres://USER:PASS@localhost:5432/DBNAME" -Fc -f study1.dump  # over the tunnel
```

---

## Data protection

- Raw IP addresses are never stored — only a salted SHA-256 prefix, and only to
  spot duplicate submissions.
- The participant bearer token is excluded from `all.json` and from every CSV.
- `/admin`, `/preview` and every export require the admin token; requests without
  it get a 401 before touching the database.
- The token comparison is constant-time over digests, so it leaks neither the
  token nor its length.
- Deleting a participant row cascades to their answers, page times, video events
  and submission.
