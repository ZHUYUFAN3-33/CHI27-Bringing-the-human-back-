/* Study 2 — dashboard API. Behind requireAdmin (registered in ./index.js). */

import { q } from "../db.js";
import { config } from "../config.js";
import {
  s2AllocationSnapshot, reconcileS2Allocation, setS2CellTarget, setS2AllTargets, setS2CellEnabled
} from "./allocation.js";
import {
  buildS2Plan, publicS2Plan, s2PlanItems, S2_ORDER_KEYS, S2_ORDERS, S2_SEGMENT_KEYS, S2_VERSION,
  S2_CONDITION_KEYS, S2_CONDITIONS, S2_ITEMS, S2_AMOUNT, S2_EXTENT, S2_SCALE
} from "../../shared/s2-instrument.js";

export default async function s2AdminRoutes(app) {

  /* The plan for any condition and clip order, without a participant row or
     a slot. The design block names the condition — this is the researcher's
     view, behind the admin token; the participant's plan never carries it. */
  app.get("/api/s2/admin/preview-plan", async (req, reply) => {
    const cond = String(req.query.cond ?? S2_CONDITION_KEYS[0]);
    const order = String(req.query.order ?? S2_ORDER_KEYS[0]);
    if (!S2_CONDITION_KEYS.includes(cond)) return reply.code(400).send({ error: "unknown_condition", allowed: S2_CONDITION_KEYS });
    if (!S2_ORDER_KEYS.includes(order)) return reply.code(400).send({ error: "unknown_order", allowed: S2_ORDER_KEYS });
    const plan = buildS2Plan(cond, order);
    return {
      design: { condition: cond, ctrl: plan.ctrl, profile: plan.profile, order, segOrder: plan.segOrder,
                instrumentVersion: S2_VERSION, itemCount: s2PlanItems(plan).length },
      plan: publicS2Plan(plan)
    };
  });

  app.get("/api/s2/admin/design", async () => ({
    conditions: S2_CONDITION_KEYS.map(key => ({ key, ...S2_CONDITIONS[key] })),
    orders: S2_ORDER_KEYS.map(key => ({ key, segments: S2_ORDERS[key] })),
    segments: S2_SEGMENT_KEYS,
    items: {
      CTRL_REC: S2_ITEMS.CTRL_REC, FINAL: S2_ITEMS.FINAL, PROF_REC: S2_ITEMS.PROF_REC,
      CTRL_P: { stem: S2_ITEMS.CTRL_P.stem, options: S2_AMOUNT },
      CTRL_AI: { stem: S2_ITEMS.CTRL_AI.stem, options: S2_AMOUNT },
      LIM_MOB: { stem: S2_ITEMS.LIM_MOB.stem, options: S2_EXTENT },
      LIM_COG: { stem: S2_ITEMS.LIM_COG.stem, options: S2_EXTENT },
      BEL1: { stem: S2_ITEMS.BEL1.stem, options: S2_SCALE }
    },
    instrumentVersion: S2_VERSION
  }));

  app.get("/api/s2/admin/summary", async () => {
    const [totals, cells, recent, live] = await Promise.all([
      q(`SELECT
           COUNT(*)                                                     AS total,
           COUNT(*) FILTER (WHERE status = 'completed')                 AS completed,
           COUNT(*) FILTER (WHERE status = 'in_progress')               AS in_progress,
           COUNT(*) FILTER (WHERE status = 'screened_out')              AS screened_out,
           COUNT(*) FILTER (WHERE status = 'completed'
                              AND COALESCE(complete_pass, TRUE)
                              AND COALESCE(attention_pass, TRUE)
                              AND COALESCE(comprehension_pass, TRUE))   AS usable,
           COUNT(*) FILTER (WHERE status = 'completed'
                              AND attention_pass IS FALSE)              AS attention_fail,
           COUNT(*) FILTER (WHERE status = 'completed'
                              AND comprehension_pass IS FALSE)          AS comprehension_fail,
           COUNT(*) FILTER (WHERE status = 'completed' AND ctrl_recognised)    AS ctrl_recognised,
           COUNT(*) FILTER (WHERE status = 'completed' AND profile_recognised) AS profile_recognised,
           COUNT(*) FILTER (WHERE status = 'completed' AND final_recognised)   AS final_recognised,
           ROUND(percentile_cont(0.5) WITHIN GROUP (
             ORDER BY EXTRACT(EPOCH FROM (last_answer_at - first_answer_at))
           ) FILTER (WHERE status = 'completed'))                       AS median_seconds
         FROM s2_participants WHERE NOT is_test`),
      s2AllocationSnapshot(),
      q(`SELECT id, short_code, condition, seg_order, status, source, external_pid, answered_count,
                complete_pass, attention_pass, comprehension_pass,
                ctrl_recognised, final_recognised, profile_recognised, started_at, completed_at, last_seen_at
           FROM s2_participants WHERE NOT is_test
          ORDER BY started_at DESC LIMIT 40`),
      q(`SELECT COUNT(*) AS n FROM s2_participants
          WHERE status = 'in_progress' AND NOT is_test AND last_seen_at > now() - interval '5 minutes'`)
    ]);
    return {
      instrumentVersion: S2_VERSION,
      studyOpen: config.s2StudyOpen,
      recruitment: config.recruitment,
      excludeStudy1: config.s2ExcludeStudy1,
      totals: totals.rows[0],
      activeNow: live.rows[0].n,
      cells,
      recent: recent.rows
    };
  });

  app.get("/api/s2/admin/dropoff", async () => {
    const { rows } = await q(
      `SELECT page_key,
              MIN(page_index)                    AS page_index,
              COUNT(DISTINCT participant_id)     AS reached,
              ROUND(AVG(dwell_ms) / 1000.0, 1)   AS mean_dwell_s,
              ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY dwell_ms))::numeric / 1000.0, 1) AS median_dwell_s
         FROM s2_page_times t
        WHERE participant_id IN (SELECT id FROM s2_participants WHERE NOT is_test)
        GROUP BY page_key
        ORDER BY page_index NULLS LAST`
    );
    return { pages: rows };
  });

  /* The study's headline numbers: how the two forced-choice items were
     answered, per clip and per position, among completed participants. */
  /* The validation outcomes by arm: recognition rates, and mean and median of
     each seven-point item. This is the table the study exists to produce, and
     the predicted pattern for each row is in STUDY2_PLAN.md. */
  app.get("/api/s2/admin/tally", async () => {
    const [recognition, scales, options] = await Promise.all([
      q(`SELECT condition,
                COUNT(*)::int AS n,
                COUNT(*) FILTER (WHERE ctrl_recognised)::int    AS ctrl,
                COUNT(*) FILTER (WHERE final_recognised)::int   AS final,
                COUNT(*) FILTER (WHERE profile_recognised)::int AS profile,
                COUNT(*) FILTER (WHERE attention_pass)::int     AS attention,
                COUNT(*) FILTER (WHERE comprehension_pass)::int AS comprehension
           FROM s2_participants WHERE NOT is_test AND status = 'completed'
          GROUP BY 1 ORDER BY 1`),
      q(`SELECT p.condition, r.item_id, COUNT(*)::int AS n,
                ROUND(AVG(r.value_num)::numeric, 2)::float8 AS mean,
                ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY r.value_num)::numeric, 1)::float8 AS median
           FROM s2_responses r JOIN s2_participants p ON p.id = r.participant_id
          WHERE NOT p.is_test AND p.status = 'completed' AND r.item_type = 'likert7'
            AND r.item_id IN ('V_CTRL_P', 'V_CTRL_AI', 'V_LIM_MOB', 'V_LIM_COG', 'BEL1')
          GROUP BY 1, 2 ORDER BY 1, 2`),
      q(`SELECT p.condition, r.item_id, r.value_num::int AS option, COUNT(*)::int AS n
           FROM s2_responses r JOIN s2_participants p ON p.id = r.participant_id
          WHERE NOT p.is_test AND p.status = 'completed'
            AND r.item_id IN ('V_CTRL_REC', 'V_FINAL', 'V_PROF_REC')
          GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`)
    ]);
    return { recognition: recognition.rows, scales: scales.rows, options: options.rows };
  });

  app.post("/api/s2/admin/allocation/reconcile", async () => ({ cells: await reconcileS2Allocation() }));

  app.post("/api/s2/admin/allocation/target", async (req, reply) => {
    const { cell, target, all } = req.body ?? {};
    const t = Number(target);
    if (!Number.isInteger(t) || t < 0) return reply.code(400).send({ error: "target must be a non-negative integer" });
    if (all) return { updated: await setS2AllTargets(t) };
    if (!cell) return reply.code(400).send({ error: "cell or all is required" });
    const out = await setS2CellTarget(String(cell), t);
    return out ?? reply.code(404).send({ error: "unknown cell" });
  });

  app.post("/api/s2/admin/allocation/enabled", async (req, reply) => {
    const { cell, enabled } = req.body ?? {};
    if (!cell) return reply.code(400).send({ error: "cell is required" });
    const out = await setS2CellEnabled(String(cell), !!enabled);
    return out ?? reply.code(404).send({ error: "unknown cell" });
  });

  app.post("/api/s2/admin/mark-test", async (req, reply) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const isTest = req.body?.isTest !== false;
    if (!ids.length) return reply.code(400).send({ error: "ids is required" });
    const { rows } = await q(
      `UPDATE s2_participants SET is_test = $2 WHERE id = ANY($1::uuid[]) RETURNING id, is_test`,
      [ids, isTest]
    );
    return { updated: rows.length };
  });

  app.post("/api/s2/admin/purge-test-rows", async (req, reply) => {
    const { rows: [{ n }] } = await q(`SELECT COUNT(*)::int AS n FROM s2_participants WHERE is_test`);
    if (Number(req.body?.confirm) !== n) {
      return reply.code(409).send({
        error: "confirm_mismatch", testRows: n,
        message: `Send confirm: ${n} — the number of rows flagged as test data that would be deleted.`
      });
    }
    const { rowCount } = await q(`DELETE FROM s2_participants WHERE is_test`);
    await q(
      `UPDATE s2_allocation a
          SET completed = (SELECT COUNT(*) FROM s2_participants p
                            WHERE p.seg_order = a.cell AND p.status = 'completed' AND NOT p.is_test)`
    );
    const cells = await reconcileS2Allocation();
    req.log.warn({ deleted: rowCount }, "s2 test rows purged");
    return { deleted: rowCount, cells };
  });
}
