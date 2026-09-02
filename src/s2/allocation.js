/* Balanced randomisation across the six clip orders. The same atomic pick as
   src/allocation.js — least-filled enabled cell, ties at random, SKIP LOCKED
   under concurrency — against the s2_allocation table. */

import { q } from "../db.js";
import { config } from "../config.js";

const PICK = `
  UPDATE s2_allocation SET assigned = assigned + 1
  WHERE cell = (
    SELECT cell FROM s2_allocation
    WHERE enabled AND (target = 0 OR assigned < target)
    ORDER BY assigned ASC, random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING cell, seg_order`;

const PICK_BLOCKING = PICK.replace("FOR UPDATE SKIP LOCKED", "");

export class S2FullError extends Error {
  constructor() { super("every clip order has reached its target"); this.code = "STUDY_FULL"; }
}

export async function assignS2Cell() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { rows } = await q(PICK);
    if (rows.length) return rows[0];
  }
  const { rows } = await q(PICK_BLOCKING);
  if (rows.length) return rows[0];
  throw new S2FullError();
}

export async function releaseS2Cell(cell) {
  await q(`UPDATE s2_allocation SET assigned = GREATEST(assigned - 1, 0) WHERE cell = $1`, [cell]);
}

export async function s2AllocationSnapshot() {
  const { rows } = await q(`SELECT * FROM s2_v_cell_progress`);
  return rows;
}

export async function s2HasCapacity() {
  const { rows } = await q(
    `SELECT 1 FROM s2_allocation WHERE enabled AND (target = 0 OR assigned < target) LIMIT 1`
  );
  return rows.length > 0;
}

/** Re-derive `assigned` from the participants table; see reconcileAllocation
    in src/allocation.js for why screen-outs and stale zero-answer sessions
    are left out. */
export async function reconcileS2Allocation() {
  const { rows } = await q(
    `UPDATE s2_allocation a
        SET assigned = COALESCE((
              SELECT COUNT(*) FROM s2_participants p
               WHERE p.seg_order = a.cell
                 AND NOT p.is_test
                 AND p.status <> 'screened_out'
                 AND NOT (p.status = 'in_progress'
                          AND p.answered_count = 0
                          AND p.last_seen_at < now() - make_interval(mins => $1))
            ), 0)
      RETURNING a.cell, a.assigned`,
    [config.staleMinutes]
  );
  return rows.sort((x, y) => x.cell.localeCompare(y.cell));
}

export function watchS2Allocation(log, intervalMs = config.allocationReconcileMs) {
  if (!intervalMs) return () => {};
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const before = new Map((await s2AllocationSnapshot()).map(c => [c.cell, Number(c.assigned)]));
      const after = await reconcileS2Allocation();
      const changed = after.filter(c => before.get(c.cell) !== Number(c.assigned));
      if (changed.length) {
        log?.info?.({ changed: changed.map(c => `${c.cell} ${before.get(c.cell)}->${c.assigned}`) },
          "s2 allocation recounted");
      }
    } catch (err) {
      log?.warn?.({ err: err.message }, "s2 allocation recount failed");
    } finally {
      running = false;
    }
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

export async function setS2CellTarget(cell, target) {
  const { rows } = await q(
    `UPDATE s2_allocation SET target = $2 WHERE cell = $1 RETURNING cell, target, assigned, enabled`,
    [cell, target]
  );
  return rows[0] ?? null;
}

export async function setS2AllTargets(target) {
  const { rows } = await q(`UPDATE s2_allocation SET target = $1 RETURNING cell`, [target]);
  return rows.length;
}

export async function setS2CellEnabled(cell, enabled) {
  const { rows } = await q(
    `UPDATE s2_allocation SET enabled = $2 WHERE cell = $1 RETURNING cell, enabled`,
    [cell, enabled]
  );
  return rows[0] ?? null;
}
