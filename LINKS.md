# Study 1 — every link

Deployed at **https://study1-survey.fly.dev** · instrument **v6** · region `nrt` (Tokyo).

Anything under *Researcher* needs the admin token. It is **not written down in
this repository** — see [Where the token lives](#where-the-token-lives). In the
URLs below, replace `<TOKEN>` with it.

---

## Participant

| | |
|---|---|
| **Live study** — this is the link CloudResearch gets | https://study1-survey.fly.dev/ |
| **Pilot** — the real study, flagged as test data, keeps its row out of every export and returns its allocation slot | https://study1-survey.fly.dev/?test=1 |

CloudResearch Connect appends its own identifiers; `participantId`,
`assignmentId` and `projectId` are read from the query string and stored as
`external_pid`, `external_session` and `external_study`. Prolific's
`PROLIFIC_PID` / `STUDY_ID` / `SESSION_ID` and MTurk's `workerId` /
`assignmentId` / `hitId` are recognised too, so a pilot on another panel needs
no code change.

## Researcher

### Dashboard

```
https://study1-survey.fly.dev/admin?token=<TOKEN>
```

Allocation across the 42 cells (7 conditions × 6 segment orders), drop-off by
page, recent participants, and the export panel. `Recount assigned` re-derives
every counter from the participants table — run it after piloting and before
recruitment opens.

### Questionnaire preview — and where the wording is edited

```
https://study1-survey.fly.dev/preview?token=<TOKEN>
```

Runs the participant application against a cell you choose. Same renderer, same
plan, same wording as the live study — it reads the instrument rather than
carrying a copy of it, so it cannot drift. Nothing is recorded: no participant
row, no allocation slot, no answers. Every page is reachable, answers are not
compulsory, and the clips never gate a page.

The cell is in the URL, so a particular condition can be linked to directly:

```
https://study1-survey.fly.dev/preview?token=<TOKEN>&condition=HA2&order=O3&optional=0
```

| parameter | values | meaning |
|---|---|---|
| `condition` | `H1` `H2` `H3` `HA1` `HA2` `HA3` `A` | control source × operator profile |
| `order` | `O1`…`O6` | the six permutations: REL·ADV·COL, ADV·COL·REL, COL·REL·ADV, REL·COL·ADV, ADV·REL·COL, COL·ADV·REL |
| `optional` | `1` `0` | the NARS + SCM attitude block |
| `stage` | `draft` `live` | the wording being worked on, or the wording participants are being served |

#### Changing the wording

This needs no code, no deploy and no terminal. **Open the link above, press
*Edit the text*, click the sentence you want to change, change it, press
*Save*.** Saving puts it in the draft, which only this page can see. When the
draft reads the way you want, press **Publish to participants**. That is the
whole procedure.

| | |
|---|---|
| **Save** | writes the draft. Participants are unaffected, so edit as freely and as often as you like |
| **Publish to participants** | replaces the live questionnaire with the draft. Every machine is serving it within five seconds |
| **Discard the draft** | throws away everything unpublished and goes back to what participants are seeing |
| **Restore the wording in code** | the per-field undo: back to the sentence in `shared/instrument.js` |
| **All text…** | every string in every cell, searchable — for the text that is not on the page in front of you |
| **History…** | every publication and every draft edit, with the old value and the new one |
| **What participants see** | renders the live wording instead of the draft, for comparing before you publish |

A strip under the control bar always says which of the two states you are in —
*"3 unpublished changes"* or *"Everything is published"* — and the band across
the top says whether you are editing the live study or a local copy. **A local
server has its own database: nothing edited or published there reaches the
people taking the study.** Use the fly.dev link for that.

Only *text* can be changed. Item ids, types, option counts, the answer keys and
the design stay in `shared/instrument.js`; a path that does not already exist
cannot be written, so no edit can add an item, remove one, or change what a
column means. The information page — the consent document — is editable too.

While no real participant exists, publishing is free. Once one exists, it asks
for a new instrument version, offers the next one (`v6` → `v6b`) and stamps it
on everyone from that point. Without it the data would carry two questionnaires
with nothing to separate them. Changing wording mid-collection is a decision,
not a typo fix.

Two things worth knowing:

- **Someone already part-way through keeps the wording they started with** until
  they reload. New participants get the new text immediately.
- `/api/export/instrument_overrides.csv` lists the wording currently being
  served and `/api/export/instrument_publications.csv` lists when each version
  started being served, so a paper can report what was on the screen and when.

### Design mockup

```
https://study1-survey.fly.dev/mockup?token=<TOKEN>
```

The original annotated design document. It carries its own copy of the wording
and **will drift from the instrument** — keep it for the rationale in the ochre
annotation boxes, not as a description of what participants see. Use `/preview`
for that.

---

## Data export

Every path takes `?token=<TOKEN>`, for example:

```
https://study1-survey.fly.dev/api/export/wide.csv?token=<TOKEN>
```

| path | one row per |
|---|---|
| `/api/export/participants.csv` | participant — cell, status, timings, quality flags |
| `/api/export/responses.csv` | answer (long format) |
| `/api/export/wide.csv` | participant, one column per item |
| `/api/export/page_times.csv` | page visit |
| `/api/export/video_events.csv` | player event — play, pause, ended, gate_open, error, fallback |
| `/api/export/codebook.csv` | item — type, coding, stem |
| `/api/export/instrument_overrides.csv` | overridden string — the wording being served, not the wording in the repository |
| `/api/export/instrument_publications.csv` | publication — when each instrument version started being served |
| `/api/export/all.json` | everything, nested |

By default the exports exclude test rows and anyone still `in_progress`.

| parameter | effect |
|---|---|
| `include_test=1` | keep rows flagged as test data |
| `status=in_progress` | in-progress participants instead of finished ones |
| `usable_only=1` | completed, attention check passed, both manipulation checks passed |
| `since=2026-09-01` | started on or after a date |
| `labels=1` | wide.csv writes answer labels instead of numbers |

All of them at once, into timestamped files:

```bash
ADMIN_TOKEN=<TOKEN> APP=study1-survey ./scripts/export.sh
```

### Video telemetry worth knowing about

A player that will not run in the participant's browser (ad blocker, network
restriction, YouTube error 153) no longer traps them. They are offered the clip
on YouTube, and the confirmation unlocks only after the clip has had time to
play. Those rows are identifiable:

| event | meaning |
|---|---|
| `error` | the embedded player failed; `detail` carries the YouTube error code |
| `fallback_open` | the participant opened the clip on YouTube |
| `fallback_confirm` | they confirmed watching it; `watch_s` is the elapsed time |
| `gate_open` with `detail = fallback` | the gate opened that way rather than by playback |

A fallback watch cannot be verified the way an embedded play can. Decide before
analysis whether to keep those participants, and say which way in the paper.

---

## Operations

| | |
|---|---|
| Health check (no token) | https://study1-survey.fly.dev/healthz |
| Fly monitoring | https://fly.io/apps/study1-survey/monitoring |
| Fly Postgres | https://fly.io/apps/study1-survey-pg |
| Repository | https://github.com/ZHUYUFAN3-33/CHI27-Bringing-the-human-back- |
| CI | https://github.com/ZHUYUFAN3-33/CHI27-Bringing-the-human-back-/actions |

```bash
fly logs -a study1-survey                  # live log
./scripts/deploy.sh                        # deploy; safe to re-run
fly secrets set -a study1-survey STUDY_OPEN=false   # refuse new starts
fly secrets set -a study1-survey STUDY_OPEN=true    # resume
```

Anyone already in progress can always finish, whatever `STUDY_OPEN` says.

### Checking a deploy

The browser test walks the whole questionnaire in a real browser and can be
pointed at the deployed study. It runs with `?test=1`, so its row is flagged as
test data, stays out of every export, and returns its allocation slot. About a
minute, and worth doing after any change to the instrument:

```bash
npm install --no-save playwright && npx playwright install chromium
node scripts/browser-test.mjs https://study1-survey.fly.dev
```

The same job exists in CI at `.github/workflows/test.yml`, but it is manual —
`Actions → Test → Run workflow`. It was on every push until the runner's
`playwright install --with-deps` step started taking five minutes on a good day
and hanging on a bad one, which produced failure e-mail with no signal in it.

### What is running

| | |
|---|---|
| app | 2 × `shared-cpu-1x` 1 GB, `nrt` |
| database | 1 × `shared-cpu-1x` 1 GB + 3 GB volume, `nrt` — unmanaged Fly Postgres |

Roughly $18/month. Fly's *Managed* Postgres starts at $38/month on its own and
is deliberately not used here; `scripts/deploy.sh` will not create one unless
asked with `CREATE_DB=1`.

---

## Stimulus clips

| segment | link | runs |
|---|---|---|
| REL — relational | https://youtu.be/FM4xHwqv03M | 1:10 |
| ADV — advisory | https://youtu.be/MkcK6cGjjwM | 1:45 |
| COL — collaborative | https://youtu.be/hPlQYCCJ4do | 1:55 |

All three must be **Unlisted** — not Private — with embedding allowed, or the
gate never opens. The clips differ in length by a factor of 1.64, so clip
duration is confounded with task type in any comparison across segments and
belongs in the limitations.

---

## Where the token lives

`.pg-credentials.txt` in the working copy, which is gitignored and `chmod 600`.
It holds the admin token and the Postgres superuser password.

The token is not committed here on purpose. Git history is permanent and this
repository has been public, so a token written into a commit stays readable in
that commit even after the repository is made private and even if the line is
deleted later. If you want it recorded somewhere durable, put it in a password
manager rather than in the tree.

Lost it? Nothing depends on the old value:

```bash
fly secrets set -a study1-survey ADMIN_TOKEN="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | cut -c1-40)"
```

That also revokes every link above, which is the right move if a `?token=` URL
has been pasted anywhere shared.

---

## Before recruitment opens

- [ ] **Check AV1 against the finished clips.** The options are written per segment from the v1.4 shooting script, which flags segments R and A as not yet diffed against the v1.2 master. One option per segment must be true of the audio as cut, and the other three must not be.
- [ ] **The study information page is generic.** Replace it with the IRB-approved text. It no longer lives in code: open `/preview`, press *Edit the text*, click the paragraphs on page 1, then publish. Blank line for a new paragraph, `**double asterisks**` for bold, `{funding}` and `{contact}` for the configured values.
- [ ] **Confirm the three clips are Unlisted and embeddable.**
- [x] ~~Clear the pre-recruitment rows.~~ Done: the nine `v5-r2` rows were deleted and the counters are back to zero. Only test rows remain, and they neither export nor hold a slot.
- [ ] **Leave the per-cell targets at 0.** The sample is 300, which is 7 per cell across the 42 cells and ~43 per condition. Balance does not come from the targets — the randomiser always takes the least-filled cell — and a target counts *starts*, not completes, so a cap of 7 (294 slots) would close the study before 300 completes land. Let the CloudResearch quota be the stop. Expect 36 cells at 7 and 6 at 8 when it closes.
- [ ] **Decide the fallback policy** — whether a `fallback_confirm` watch counts as usable data.
