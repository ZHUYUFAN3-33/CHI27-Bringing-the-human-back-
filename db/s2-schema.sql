-- =============================================================================
-- Study 2 — "Who is controlling OriHime?"  ·  data collection schema
-- Postgres 14+.  Idempotent: safe to run on every boot.
--
-- Its own tables, prefixed s2_, in the same database as Study 1. Nothing here
-- references a Study 1 table, so either study can be exported, purged or
-- dropped without touching the other. The one cross-study read — refusing a
-- platform participant who already took Study 1 — is a SELECT in the session
-- route, not a constraint.
-- =============================================================================

CREATE TABLE IF NOT EXISTS s2_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token            TEXT UNIQUE NOT NULL,
  short_code       TEXT UNIQUE NOT NULL,

  seg_order        TEXT NOT NULL,                   -- O1..O6, the only randomised factor
  instrument_ver   TEXT NOT NULL,

  status           TEXT NOT NULL DEFAULT 'in_progress',   -- in_progress | completed | screened_out
  screen_out_reason TEXT,
  page_key         TEXT,
  page_index       INTEGER NOT NULL DEFAULT 0,

  source           TEXT NOT NULL DEFAULT 'direct',
  external_pid     TEXT,
  external_study   TEXT,
  external_session TEXT,
  is_test          BOOLEAN NOT NULL DEFAULT FALSE,

  user_agent       TEXT,
  screen_w         INTEGER,
  screen_h         INTEGER,
  timezone         TEXT,
  ui_language      TEXT,
  ip_hash          TEXT,

  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  first_answer_at  TIMESTAMPTZ,
  last_answer_at   TIMESTAMPTZ,
  answered_count   INTEGER NOT NULL DEFAULT 0,

  -- derived on completion
  complete_pass    BOOLEAN,                         -- every required item present at submit
  text_chars       INTEGER NOT NULL DEFAULT 0       -- characters typed across the three descriptions
);

CREATE INDEX IF NOT EXISTS s2_participants_status_idx   ON s2_participants (status);
CREATE INDEX IF NOT EXISTS s2_participants_order_idx    ON s2_participants (seg_order);
CREATE INDEX IF NOT EXISTS s2_participants_started_idx  ON s2_participants (started_at DESC);
CREATE INDEX IF NOT EXISTS s2_participants_ext_pid_idx  ON s2_participants (external_pid) WHERE external_pid IS NOT NULL;
CREATE INDEX IF NOT EXISTS s2_participants_lastseen_idx ON s2_participants (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS s2_responses (
  participant_id UUID NOT NULL REFERENCES s2_participants(id) ON DELETE CASCADE,
  item_id        TEXT NOT NULL,
  page_key       TEXT NOT NULL,
  item_type      TEXT NOT NULL,                     -- mc | text
  segment        TEXT,                              -- REL | ADV | COL
  seg_position   SMALLINT,                          -- 1..3
  value_num      DOUBLE PRECISION,                  -- option index
  value_text     TEXT,                              -- option label or free text
  answered_at    TIMESTAMPTZ,
  latency_ms     INTEGER,
  revisions      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (participant_id, item_id)
);

CREATE INDEX IF NOT EXISTS s2_responses_item_idx ON s2_responses (item_id);

CREATE TABLE IF NOT EXISTS s2_page_times (
  participant_id UUID NOT NULL REFERENCES s2_participants(id) ON DELETE CASCADE,
  page_key       TEXT NOT NULL,
  visit          SMALLINT NOT NULL DEFAULT 1,
  page_index     SMALLINT,
  entered_at     TIMESTAMPTZ,
  left_at        TIMESTAMPTZ,
  dwell_ms       INTEGER,
  PRIMARY KEY (participant_id, page_key, visit)
);

CREATE TABLE IF NOT EXISTS s2_video_events (
  id             BIGSERIAL PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES s2_participants(id) ON DELETE CASCADE,
  segment        TEXT NOT NULL,
  seg_position   SMALLINT,
  video_id       TEXT,
  event          TEXT NOT NULL,
  detail         TEXT,
  position_s     DOUBLE PRECISION,
  watch_s        DOUBLE PRECISION,
  at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS s2_video_events_pid_idx ON s2_video_events (participant_id);

CREATE TABLE IF NOT EXISTS s2_submissions (
  participant_id UUID PRIMARY KEY REFERENCES s2_participants(id) ON DELETE CASCADE,
  payload        JSONB NOT NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per clip order. Same balanced pick as Study 1, six cells instead of 42.
CREATE TABLE IF NOT EXISTS s2_allocation (
  cell       TEXT PRIMARY KEY,
  seg_order  TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  target     INTEGER NOT NULL DEFAULT 0,
  assigned   INTEGER NOT NULL DEFAULT 0,
  completed  INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE VIEW s2_v_cell_progress AS
SELECT a.cell,
       a.seg_order,
       a.enabled,
       a.target,
       a.assigned,
       COUNT(p.id) FILTER (WHERE p.status = 'completed'    AND NOT p.is_test) AS completed,
       COUNT(p.id) FILTER (WHERE p.status = 'in_progress'  AND NOT p.is_test) AS in_progress,
       COUNT(p.id) FILTER (WHERE p.status = 'screened_out' AND NOT p.is_test) AS screened_out,
       COUNT(p.id) FILTER (WHERE p.status = 'completed'    AND NOT p.is_test
                             AND COALESCE(p.complete_pass, TRUE))               AS usable
FROM s2_allocation a
LEFT JOIN s2_participants p ON p.seg_order = a.cell
GROUP BY a.cell, a.seg_order, a.enabled, a.target, a.assigned
ORDER BY a.cell;

CREATE OR REPLACE VIEW s2_v_responses_long AS
SELECT p.id AS participant_id, p.short_code, p.seg_order, p.status, p.source, p.is_test,
       r.item_id, r.page_key, r.item_type, r.segment, r.seg_position,
       r.value_num, r.value_text, r.latency_ms, r.revisions, r.answered_at
FROM s2_participants p
JOIN s2_responses r ON r.participant_id = p.id;
