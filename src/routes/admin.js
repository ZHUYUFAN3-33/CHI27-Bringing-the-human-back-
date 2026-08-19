import { q } from "../db.js";
import { config } from "../config.js";
import {
  allocationSnapshot, reconcileAllocation, setCellTarget, setAllTargets, setCellEnabled
} from "../allocation.js";
import { CONDITION_KEYS, ORDER_KEYS, INSTRUMENT_VERSION } from "../../shared/instrument.js";

export default async function adminRoutes(app) {

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
      instrumentVersion: INSTRUMENT_VERSION,
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

  app.get("/api/admin/design", async () => ({
    conditions: CONDITION_KEYS,
    orders: ORDER_KEYS,
    instrumentVersion: INSTRUMENT_VERSION
  }));
}
