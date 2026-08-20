# Study 1 — “Bringing the Human Back?” questionnaire

Data collection for the v5 questionnaire: a participant-facing survey, a Postgres
database, a researcher dashboard, and CSV/JSON exports. Built to run on Fly.io
with roughly 700 people taking the study at the same time.

The questionnaire content is carried over unchanged from
`study1_v5_mockup_r1_2026-08-20.html`. What is new is everything around it —
server-side randomisation, storage, resume, quality flags, and export.

---

## What it does

| | |
|---|---|
| **Participant app** | `/` — the questionnaire, no researcher chrome |
| **Design mockup** | `/preview` — the original panelled mockup, unchanged, behind the admin token |
| **Dashboard** | `/admin?token=…` — live cell balance, drop-off, quality flags |
| **Exports** | `/api/export/*.csv`, `/api/export/all.json` — behind the same token |
| **Health** | `/healthz` — used by Fly's checks |

---

## The parts that matter for the study

**Randomisation is a server decision.** A participant is assigned one of the 21
design cells (7 conditions × 3 segment orders) by a single atomic SQL statement
that takes the least-filled open cell, ties broken at random. If the browser
picked, a refresh or a cleared cache would re-randomise the same person and the
cells would drift apart under differential drop-out.

Measured under a burst of 700 starts inside 15 seconds — far harsher than a real
launch — the cells came out at min 30, max 37, mean 33.3, SD 1.62.

**The browser only ever sees its own condition.** The server builds the page plan
and sends that one participant's version: no `CONDITIONS` map, no other cells'
framing text, no other profile lines, no condition label, and no answer keys for
the attention or manipulation checks. A participant with devtools open sees the
study they are actually taking. (Item ids still carry the internal segment codes
`REL`/`ADV`/`COL`, which is why those codes are never *displayed* — the rule the
mockup already set.)

**Every stored label comes from the instrument, not the client.** The browser
sends an item id and a number; the server looks the wording up in
`shared/instrument.js`. A tampered page cannot put text into the database, and
value ranges, option indices and screen-out rules are all re-checked server-side.

**Answers survive a bad connection.** Each page turn goes into a durable queue in
`localStorage` and a background flusher drains it with exponential backoff. Close
the tab and reopen it, and the queue is still there. A refresh mid-study restores
both the answers and the position. Nothing blocks the participant on the network
except the final submit, and that retries.

**Quality flags are derived on the server** at submit time, from what is actually
in the database: the attention check (`AT1`), and the two manipulation checks
(`C1` control source, `C2` pilot profile) scored against the framing text that
participant was actually shown.

---

## Repository layout

```
shared/instrument.js   the questionnaire — items, wording, design, plan builder
                       ONE source of truth, imported by both server and browser
src/
  server.js            Fastify app, auth, static, graceful drain
  config.js            every setting, read from the environment
  db.js                Postgres pool + migrations
  allocation.js        balanced randomisation across the 21 cells
  routes/session.js    start / resume / keepalive
  routes/save.js       page saves, screen-out, submit
  routes/admin.js      dashboard API
  routes/export.js     streaming CSV + JSON exports
public/                the participant app (index.html, survey.js, net.js, survey.css)
private/               admin.html and the original mockup — both token-gated
db/schema.sql          the schema, idempotent, applied on every boot
scripts/               deploy, tunnel, export, simulate, browser-test
```

---

## Data model

| table | one row per | notes |
|---|---|---|
| `participants` | person | assigned cell, status, timings, quality flags, provenance |
| `responses` | answer | upserted on `(participant_id, item_id)`, so a revisit overwrites cleanly |
| `page_times` | page visit | dwell per visit; a revisit gets its own row |
| `video_events` | player event | play / pause / ended / error / gate_open — the compliance evidence |
| `submissions` | completed person | verbatim client payload, kept as a backup |
| `allocation` | design cell | counters, target and open/closed flag |

Two views, `v_responses_long` and `v_cell_progress`, are there for ad-hoc SQL.

**Item ids are the contract between the questionnaire and the data.** Once
collection starts they are frozen: changing one orphans the rows already
collected. `INSTRUMENT_VERSION` in `shared/instrument.js` is stamped on every
participant so a mid-study change is at least visible in the data.

---

## Exports

All behind `Authorization: Bearer $ADMIN_TOKEN` (or `?token=…` in a browser).

| endpoint | shape |
|---|---|
| `wide.csv` | one row per participant, one column per item — open this in R or SPSS |
| `responses.csv` | long format, one row per answer |
| `participants.csv` | one row per participant, no answers |
| `page_times.csv` | dwell per page visit |
| `video_events.csv` | gate telemetry |
| `codebook.csv` | every item id, its type and its value coding |
| `all.json` | everything, nested |

Query parameters: `?include_test=1` to include pilot rows, `?usable_only=1` for
the analysis sample (completed, passed all three checks), `?labels=1` on the wide
file for text answers instead of numeric codes, `?status=`, `?since=`.

Columns in `wide.csv` are derived from the instrument rather than from the data,
so the column set is identical whichever participants happen to be in the file
and two exports a week apart stack without realigning.

```r
# R, straight from the deployed app — no database client needed
d <- read.csv(url("https://YOUR-APP.fly.dev/api/export/wide.csv?token=ADMIN_TOKEN"))
```

---

## Running it locally

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, ADMIN_TOKEN, IP_SALT
npm start                     # http://localhost:8080
```

The schema is applied automatically on boot.

```bash
node scripts/simulate.mjs --n 50 --conc 10    # 50 simulated participants
node scripts/browser-test.mjs                 # drives the real page in Chromium
node scripts/simulate.mjs --n 700 --conc 120  # load test
```

`simulate.mjs` marks its rows as test data, so they stay out of every export and
every count. Add `--real` to rehearse the dashboard with countable rows.

---

## Deploying

```bash
brew install flyctl && fly auth login
./scripts/preflight.sh      # offline checks
./scripts/deploy.sh         # app + database + secrets + deploy + smoke test
```

It prints your participant link and admin token at the end, and is safe to
re-run. **[DEPLOY.md](DEPLOY.md)** covers the step-by-step version, deploying
from GitHub Actions instead, the database tunnel, CloudResearch setup, running
the study, and what to do when something breaks.

**[LINKS.md](LINKS.md)** is the one-page index of the deployed study: the
participant and pilot links, the dashboard, the questionnaire preview and how to
point it at any cell, every export endpoint and its query parameters, the
operational commands, and the checklist that has to be clear before recruitment
opens.

---

## Known limitations

- **`AV1` options are placeholders.** The comprehension check still reads
  `[correct line from spoken dialogue]` / `[distractor 1…3]`. These must be
  written from the real clips before launch. The item is live and stored; only
  the wording is pending.
- **The video gate cannot stop someone who leaves a clip playing on mute.** It
  stops the two cheap defeats — never pressing play, and dragging the scrubber —
  because it requires both an `ended` event and wall-clock time covering 90 % of
  the clip. `AV1` remains the only real compliance evidence, which is why it
  should not be dropped just because the gate exists.
- **Clip durations differ** (REL 70 s, ADV 105 s, COL 115 s, a ratio of 1.64), so
  clip duration is confounded with task type in any RQ3 comparison. This is a
  property of the materials, not of this code, and should be reported as a
  limitation.
- **A client-rendered survey cannot hide its item ids.** Segment codes appear in
  radio `name` attributes. Hiding them entirely would mean server-rendering each
  page, which is a larger change than this build.
- **The study information page is a placeholder.** `renderInfo()` in
  `public/survey.js` holds generic wording; replace it with the ethics-approved
  text before launch.
