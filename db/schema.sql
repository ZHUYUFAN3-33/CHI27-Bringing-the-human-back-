-- =============================================================================
-- Study 1 — "Bringing the Human Back?"  ·  data collection schema
-- Postgres 14+.  Idempotent: safe to run on every boot.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- participants — one row per person who opens the survey link
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token            TEXT UNIQUE NOT NULL,            -- bearer secret held by the browser
  short_code       TEXT UNIQUE NOT NULL,            -- shown to the participant on completion

  -- assigned design cell (server-side, balanced; never chosen by the client)
  condition        TEXT NOT NULL,                   -- H1 H2 H3 HA1 HA2 HA3 A
  ctrl             TEXT NOT NULL,                   -- H | HA | A
  profile          SMALLINT,                        -- 1 none · 2 intellectual · 3 mobility · NULL under AI-only
  seg_order        TEXT NOT NULL,                   -- O1 O2 O3
  optional_block   BOOLEAN NOT NULL,
  cell             TEXT NOT NULL,                   -- condition|seg_order
  instrument_ver   TEXT NOT NULL,

  -- lifecycle
  status           TEXT NOT NULL DEFAULT 'in_progress',   -- in_progress | completed | screened_out
  screen_out_reason TEXT,
  page_key         TEXT,                            -- last page reached, for resume
  page_index       INTEGER NOT NULL DEFAULT 0,

  -- provenance
  source           TEXT NOT NULL DEFAULT 'direct',  -- prolific | mturk | sona | direct | pilot
  external_pid     TEXT,
  external_study   TEXT,
  external_session TEXT,
  is_test          BOOLEAN NOT NULL DEFAULT FALSE,

  -- environment (diagnostics only; no raw IP is ever stored)
  user_agent       TEXT,
  screen_w         INTEGER,
  screen_h         INTEGER,
  timezone         TEXT,
  ui_language      TEXT,
  ip_hash          TEXT,                            -- salted SHA-256, for duplicate detection only

  -- timing
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  first_answer_at  TIMESTAMPTZ,
  last_answer_at   TIMESTAMPTZ,
  answered_count   INTEGER NOT NULL DEFAULT 0,

  -- derived quality flags, written on completion
  attention_pass   BOOLEAN,
  check_c1_pass    BOOLEAN,
  check_c2_pass    BOOLEAN
);

CREATE INDEX IF NOT EXISTS participants_status_idx    ON participants (status);
CREATE INDEX IF NOT EXISTS participants_cell_idx      ON participants (cell);
CREATE INDEX IF NOT EXISTS participants_started_idx   ON participants (started_at DESC);
CREATE INDEX IF NOT EXISTS participants_ext_pid_idx   ON participants (external_pid) WHERE external_pid IS NOT NULL;
CREATE INDEX IF NOT EXISTS participants_lastseen_idx  ON participants (last_seen_at DESC);

-- -----------------------------------------------------------------------------
-- responses — one row per item, upserted so a revisit overwrites cleanly
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS responses (
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  item_id        TEXT NOT NULL,                     -- stable id from shared/instrument.js
  page_key       TEXT NOT NULL,
  item_type      TEXT NOT NULL,                     -- likert7 | mc | rank | number | text
  segment        TEXT,                              -- REL | ADV | COL
  seg_position   SMALLINT,                          -- 1..3
  value_num      DOUBLE PRECISION,                  -- Likert point, option index, rank, or number
  value_text     TEXT,                              -- option label or free text
  answered_at    TIMESTAMPTZ,
  latency_ms     INTEGER,                           -- page entry -> this answer
  revisions      INTEGER NOT NULL DEFAULT 0,        -- times the answer was changed
  PRIMARY KEY (participant_id, item_id)
);

CREATE INDEX IF NOT EXISTS responses_item_idx ON responses (item_id);

-- -----------------------------------------------------------------------------
-- page_times — dwell per page visit; a revisit gets its own row
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_times (
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  page_key       TEXT NOT NULL,
  visit          SMALLINT NOT NULL DEFAULT 1,
  page_index     SMALLINT,
  entered_at     TIMESTAMPTZ,
  left_at        TIMESTAMPTZ,
  dwell_ms       INTEGER,
  PRIMARY KEY (participant_id, page_key, visit)
);

-- -----------------------------------------------------------------------------
-- video_events — gate telemetry, the compliance evidence for Section 5
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_events (
  id             BIGSERIAL PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  segment        TEXT NOT NULL,
  seg_position   SMALLINT,
  video_id       TEXT,
  event          TEXT NOT NULL,                     -- play | pause | ended | error | gate_open
  detail         TEXT,
  position_s     DOUBLE PRECISION,                  -- player time at the event
  watch_s        DOUBLE PRECISION,                  -- wall clock since first play
  at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_events_pid_idx ON video_events (participant_id);

-- -----------------------------------------------------------------------------
-- submissions — verbatim client payload, kept as a belt-and-braces backup
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  participant_id UUID PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  payload        JSONB NOT NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- allocation — balanced randomisation counters, one row per design cell
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allocation (
  cell       TEXT PRIMARY KEY,                      -- condition|seg_order
  condition  TEXT NOT NULL,
  seg_order  TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  target     INTEGER NOT NULL DEFAULT 0,            -- 0 = no cap
  assigned   INTEGER NOT NULL DEFAULT 0,
  completed  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS allocation_pick_idx ON allocation (assigned) WHERE enabled;

-- -----------------------------------------------------------------------------
-- Convenience views for analysis
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_responses_long AS
SELECT p.id            AS participant_id,
       p.short_code,
       p.condition,
       p.ctrl,
       p.profile,
       p.seg_order,
       p.optional_block,
       p.status,
       p.source,
       p.is_test,
       r.item_id,
       r.page_key,
       r.item_type,
       r.segment,
       r.seg_position,
       r.value_num,
       r.value_text,
       r.latency_ms,
       r.revisions,
       r.answered_at
FROM participants p
JOIN responses r ON r.participant_id = p.id;

CREATE OR REPLACE VIEW v_cell_progress AS
SELECT a.cell,
       a.condition,
       a.seg_order,
       a.enabled,
       a.target,
       a.assigned,
       COUNT(p.id) FILTER (WHERE p.status = 'completed'   AND NOT p.is_test) AS completed,
       COUNT(p.id) FILTER (WHERE p.status = 'in_progress' AND NOT p.is_test) AS in_progress,
       COUNT(p.id) FILTER (WHERE p.status = 'screened_out' AND NOT p.is_test) AS screened_out,
       COUNT(p.id) FILTER (WHERE p.status = 'completed' AND NOT p.is_test
                             AND p.attention_pass AND p.check_c1_pass AND p.check_c2_pass) AS usable
FROM allocation a
LEFT JOIN participants p ON p.cell = a.cell
GROUP BY a.cell, a.condition, a.seg_order, a.enabled, a.target, a.assigned
ORDER BY a.condition, a.seg_order;

-- -----------------------------------------------------------------------------
-- instrument_overrides — wording edited from /editor, layered over the code
--
-- The instrument in shared/instrument.js stays the source of truth for
-- structure: item ids, types, how many options an item has, and the design.
-- Only text can be overridden, and only for a path that already exists, so an
-- edit can never change the shape of the data.
--
-- `path` is addressed rather than free-form, e.g.
--   item.REL_OH1.stem          item.BG_income.option.3
--   text.control.HA            text.profile.2
--   page.background.intro      segment.COL.desc
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instrument_overrides (
  path        TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every edit, kept forever. Wording is what a questionnaire *is*: if it changed
-- during collection, the analysis has to be able to say when and to what.
CREATE TABLE IF NOT EXISTS instrument_override_log (
  id             BIGSERIAL PRIMARY KEY,
  path           TEXT NOT NULL,
  old_value      TEXT,
  new_value      TEXT,
  instrument_ver TEXT NOT NULL,
  participants   INTEGER NOT NULL DEFAULT 0,   -- non-test rows at the time of the edit
  at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instrument_override_log_at_idx ON instrument_override_log (at DESC);
