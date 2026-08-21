import { q } from "../db.js";
import { config } from "../config.js";
import {
  allocationSnapshot, reconcileAllocation, setCellTarget, setAllTargets, setCellEnabled
} from "../allocation.js";
import {
  CONDITION_KEYS, ORDER_KEYS, CONDITIONS, ORDERS, buildPlan, publicPlan, planItems
} from "../../shared/instrument.js";
import {
  runtimePlan, draftPlan, draftMap, draftDiff, currentVersion, editableFields,
  editableFieldsForPlan, isEditable, setOverride, loadOverrides, overrideHistory,
  publicationHistory, nonTestParticipants, overrideCount, publishDraft, discardDraft,
  syncState
} from "../instrument-runtime.js";

/* The next version label to offer when publishing mid-collection. Typing one
   from scratch is the step where someone reuses the current version by mistake
   and loses the ability to tell the two wordings apart, so the suffix is
   proposed and the researcher only has to agree with it: v6 · v6b · v6c. */
function suggestVersion(current) {
  const m = /^(.*)([b-y])$/.exec(current);
  if (m) return m[1] + String.fromCharCode(m[2].charCodeAt(0) + 1);
  return current + "b";
}

export default async function adminRoutes(app) {

  /* The plan for any chosen cell, without a participant row, an allocation slot
     or a token. /preview renders this with the participant runtime, so the team
     reviews the questionnaire itself rather than a second copy of the wording.
     Answer keys ride along because this endpoint is behind the admin token —
     they are what publicPlan strips before a participant ever sees a page.

     `stage=draft` (the default) renders the wording being worked on;
     `stage=live` renders what participants are being served right now, so the
     two can be compared before anything is published. The editable fields of
     this one cell come back with it, because the page that renders a
     questionnaire is also the page that edits it and a second round trip to
     find out which sentence is which would be a waste. */
  app.get("/api/admin/preview-plan", async (req, reply) => {
    const condition = String(req.query.condition ?? CONDITION_KEYS[0]);
    const order     = String(req.query.order ?? ORDER_KEYS[0]);
    const optional  = !/^(0|false|no)$/i.test(String(req.query.optional ?? "1"));
    const stage     = String(req.query.stage ?? "draft") === "live" ? "live" : "draft";

    if (!CONDITION_KEYS.includes(condition)) {
      return reply.code(400).send({ error: "unknown_condition", allowed: CONDITION_KEYS });
    }
    if (!ORDER_KEYS.includes(order)) {
      return reply.code(400).send({ error: "unknown_order", allowed: ORDER_KEYS });
    }

    const plan = stage === "live"
      ? runtimePlan(condition, order, optional)
      : await draftPlan(condition, order, optional);

    const [values, pending, participants] = await Promise.all([
      draftMap(), draftDiff(), nonTestParticipants()
    ]);

    return {
      design: {
        condition, order, optional, stage,
        ctrl: plan.ctrl, profile: plan.profile, segOrder: plan.segOrder,
        instrumentVersion: currentVersion(),
        itemCount: planItems(plan).length
      },
      /* Draft values regardless of stage: the editor always edits the draft,
         even while the live wording is the thing on screen. */
      fields: editableFieldsForPlan(buildPlan(condition, order, optional), values),
      publish: {
        participants,
        pending: pending.length,
        instrumentVersion: currentVersion(),
        suggestedVersion: suggestVersion(currentVersion())
      },
      /* Every id, with the answer keys the participant build never receives. */
      keys: planItems(plan)
        .filter(it => it.group || it.expected != null)
        .map(it => ({ id: it.id, group: it.group ?? null, expected: it.expected ?? null })),
      plan: publicPlan(plan)
    };
  });

  /* Headline numbers for the dashboard. One round trip, all aggregates. */
  app.get("/api/admin/summary", async () => {
    const [totals, cells, recent, funnel, live] = await Promise.all([
      q(`SELECT
           COUNT(*)                                                        AS total,
           COUNT(*) FILTER (WHERE status = 'completed')                    AS completed,
           COUNT(*) FILTER (WHERE status = 'in_progress')                  AS in_progress,
           COUNT(*) FILTER (WHERE status = 'screened_out')                 AS screened_out,
           COUNT(*) FILTER (WHERE status = 'completed'
                              AND COALESCE(attention_pass, TRUE)
                              AND COALESCE(check_c1_pass, FALSE)
                              AND COALESCE(check_c2_pass, FALSE))          AS usable,
           COUNT(*) FILTER (WHERE status = 'completed' AND attention_pass IS FALSE)  AS failed_attention,
           COUNT(*) FILTER (WHERE status = 'completed' AND check_c1_pass IS FALSE)   AS failed_c1,
           COUNT(*) FILTER (WHERE status = 'completed' AND check_c2_pass IS FALSE)   AS failed_c2,
           ROUND(percentile_cont(0.5) WITHIN GROUP (
             ORDER BY EXTRACT(EPOCH FROM (last_answer_at - first_answer_at))
           ) FILTER (WHERE status = 'completed'))                          AS median_seconds
         FROM participants WHERE NOT is_test`),
      allocationSnapshot(),
      q(`SELECT id, short_code, condition, seg_order, status, source, external_pid,
                answered_count, started_at, completed_at, last_seen_at,
                attention_pass, check_c1_pass, check_c2_pass
           FROM participants WHERE NOT is_test
          ORDER BY started_at DESC LIMIT 40`),
      q(`SELECT page_key, COUNT(*) AS reached
           FROM page_times WHERE participant_id IN (SELECT id FROM participants WHERE NOT is_test)
          GROUP BY page_key ORDER BY reached DESC`),
      q(`SELECT COUNT(*) AS n FROM participants
          WHERE status = 'in_progress' AND NOT is_test AND last_seen_at > now() - interval '5 minutes'`)
    ]);

    return {
      instrumentVersion: currentVersion(),
      studyOpen: config.studyOpen,
      optionalBlock: config.optionalBlock,
      recruitment: config.recruitment,
      totals: totals.rows[0],
      activeNow: live.rows[0].n,
      cells,
      funnel: funnel.rows,
      recent: recent.rows
    };
  });

  /* Drop-off by page: where participants stop, in questionnaire order. */
  app.get("/api/admin/dropoff", async () => {
    const { rows } = await q(
      `SELECT page_key,
              MIN(page_index)                          AS page_index,
              COUNT(DISTINCT participant_id)           AS reached,
              ROUND(AVG(dwell_ms) / 1000.0, 1)         AS mean_dwell_s,
              ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY dwell_ms))::numeric / 1000.0, 1) AS median_dwell_s
         FROM page_times t
        WHERE participant_id IN (SELECT id FROM participants WHERE NOT is_test)
        GROUP BY page_key
        ORDER BY page_index NULLS LAST`
    );
    return { pages: rows };
  });

  /* Per-item completeness — the fastest way to spot an item nobody can answer. */
  app.get("/api/admin/items", async () => {
    const { rows } = await q(
      `SELECT r.item_id, r.item_type, r.segment,
              COUNT(*)                                   AS n,
              ROUND(AVG(r.value_num)::numeric, 2)        AS mean,
              ROUND(STDDEV_SAMP(r.value_num)::numeric,2) AS sd,
              SUM(r.revisions)                           AS revisions,
              ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY r.latency_ms)) AS median_latency_ms
         FROM responses r
         JOIN participants p ON p.id = r.participant_id
        WHERE NOT p.is_test AND p.status = 'completed'
        GROUP BY r.item_id, r.item_type, r.segment
        ORDER BY r.item_id`
    );
    return { items: rows };
  });

  /* Allocation controls ---------------------------------------------------- */

  app.post("/api/admin/allocation/reconcile", async () => ({ cells: await reconcileAllocation() }));

  app.post("/api/admin/allocation/target", async (req, reply) => {
    const { cell, target, all } = req.body ?? {};
    const t = Number(target);
    if (!Number.isInteger(t) || t < 0) return reply.code(400).send({ error: "target must be a non-negative integer" });
    if (all) return { updated: await setAllTargets(t) };
    if (!cell) return reply.code(400).send({ error: "cell or all is required" });
    const out = await setCellTarget(String(cell), t);
    return out ?? reply.code(404).send({ error: "unknown cell" });
  });

  app.post("/api/admin/allocation/enabled", async (req, reply) => {
    const { cell, enabled } = req.body ?? {};
    if (!cell) return reply.code(400).send({ error: "cell is required" });
    const out = await setCellEnabled(String(cell), !!enabled);
    return out ?? reply.code(404).send({ error: "unknown cell" });
  });

  /* -- the wording editor -------------------------------------------------
     Every field the instrument defines as text, with what the code says and
     what the draft currently holds. The list is derived from real plans, so a
     path that does not exist cannot be offered and cannot be written.

     This is the cross-cell list, for searching. /preview gets the fields of the
     cell on screen from preview-plan instead. */
  app.get("/api/admin/instrument", async () => {
    const [values, pending, participants] = await Promise.all([
      draftMap(), draftDiff(), nonTestParticipants()
    ]);
    return {
      instrumentVersion: currentVersion(),
      published: overrideCount(),
      draft: values.size,
      pending: pending.length,
      participants,
      suggestedVersion: suggestVersion(currentVersion()),
      fields: editableFields(values)
    };
  });

  /* What is waiting to go out, path by path, so a publish is never blind. */
  app.get("/api/admin/instrument/pending", async () => {
    const [changes, participants] = await Promise.all([draftDiff(), nonTestParticipants()]);
    return {
      changes,
      participants,
      instrumentVersion: currentVersion(),
      suggestedVersion: suggestVersion(currentVersion())
    };
  });

  app.get("/api/admin/instrument/history", async (req) => {
    const limit = Math.min(500, Number(req.query.limit) || 200);
    const [log, publications] = await Promise.all([overrideHistory(limit), publicationHistory(limit)]);
    return { log, publications };
  });

  /* Is the machine answering this request serving the newest publication?
     `pollMs` is the ceiling on how long any other machine can still be behind,
     which is the honest answer to "is my change live yet". */
  app.get("/api/admin/instrument/status", async () => syncState());

  /* Saving writes the draft and nothing else. No version prompt, no warning,
     no consequence: the researcher is still deciding, and a half-finished
     sentence must not be on a participant's screen while they decide. The act
     that changes the questionnaire is publish, below, and that is where the
     guard belongs. */
  app.post("/api/admin/instrument", async (req, reply) => {
    const path  = String(req.body?.path ?? "");
    const raw   = req.body?.value;
    const value = raw == null ? null : String(raw);

    if (!path) return reply.code(400).send({ error: "path is required" });
    if (!isEditable(path)) {
      return reply.code(400).send({
        error: "not_editable",
        message: "Only text that already exists in the instrument can be edited. " +
                 "Item ids, types, option counts and the design are fixed in code."
      });
    }
    if (value != null && value.trim() === "") {
      return reply.code(400).send({ error: "empty", message: "Use revert to restore the wording in code." });
    }
    if (value != null && value.length > 4000) {
      return reply.code(400).send({ error: "too_long", message: "4000 characters is the ceiling." });
    }

    const participants = await nonTestParticipants();
    const before = await setOverride(path, value, { version: currentVersion(), participants });
    const pending = await draftDiff();

    req.log.info({ path, before, after: value }, "instrument draft edited");
    return { ok: true, path, value, previous: before, pending: pending.length };
  });

  /* -- publishing ----------------------------------------------------------
     The draft becomes the questionnaire. Refused once real participants exist
     unless the caller both acknowledges it and supplies a new instrument
     version: wording that changes underneath a running study is not a small
     thing, and without a version bump the data carries two questionnaires with
     nothing to tell them apart.

     The version is stamped on every participant from here on, so it is
     recorded against the publication rather than against any one edit. */
  app.post("/api/admin/instrument/publish", async (req, reply) => {
    const participants = await nonTestParticipants();
    const pending = await draftDiff();

    if (!pending.length && req.body?.force !== true) {
      return reply.code(400).send({
        error: "nothing_to_publish",
        message: "The draft and the live questionnaire are already the same."
      });
    }

    let version = currentVersion();
    if (participants > 0) {
      const newVersion = String(req.body?.newVersion ?? "").trim();
      if (req.body?.acknowledge !== true || !newVersion) {
        return reply.code(409).send({
          error: "collection_in_progress",
          participants,
          pending: pending.length,
          instrumentVersion: version,
          suggestedVersion: suggestVersion(version),
          message: `${participants} real participants have already answered under ` +
                   `${version}. To publish anyway, send acknowledge:true and a ` +
                   `newVersion, which is stamped on every participant from now on so the ` +
                   `two wordings can be separated at analysis.`
        });
      }
      if (newVersion === version) {
        return reply.code(400).send({ error: "same_version", message: "newVersion must differ from the current one." });
      }
      version = newVersion;
    }

    const publication = await publishDraft({
      version,
      participants,
      note: req.body?.note ? String(req.body.note).slice(0, 500) : null
    });
    /* This machine now. Every other machine within config.instrumentPollMs,
       which is what the status endpoint reports. */
    await loadOverrides(req.log);

    req.log.warn({ publication, changed: pending.length, participants }, "instrument published");
    return { ok: true, publication, changed: pending.length, sync: await syncState() };
  });

  /* Throw the draft away and start again from what participants are seeing. */
  app.post("/api/admin/instrument/discard", async (req) => {
    const pending = await draftDiff();
    const restored = await discardDraft();
    req.log.warn({ discarded: pending.length }, "instrument draft discarded");
    return { ok: true, discarded: pending.length, paths: restored };
  });

  /* Mark rows as test data so they drop out of every export and every count.
     Nothing is ever deleted from here: destructive changes belong in psql,
     over the tunnel, where they leave a trace in your own shell history. */
  app.post("/api/admin/mark-test", async (req, reply) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const isTest = req.body?.isTest !== false;
    if (!ids.length) return reply.code(400).send({ error: "ids is required" });
    const { rows } = await q(
      `UPDATE participants SET is_test = $2 WHERE id = ANY($1::uuid[]) RETURNING id, is_test`,
      [ids, isTest]
    );
    return { updated: rows.length };
  });

  /* The design as the instrument defines it. The preview's control bar builds
     itself from this rather than listing the cells again in its own markup —
     a hardcoded list is how the preview ended up still offering three segment
     orders after the design moved to six. */
  app.get("/api/admin/design", async () => ({
    conditions: CONDITION_KEYS.map(key => ({
      key, ctrl: CONDITIONS[key].ctrl, profile: CONDITIONS[key].profile
    })),
    orders: ORDER_KEYS.map(key => ({ key, segments: ORDERS[key] })),
    cells: CONDITION_KEYS.length * ORDER_KEYS.length,
    instrumentVersion: currentVersion()
  }));
}
