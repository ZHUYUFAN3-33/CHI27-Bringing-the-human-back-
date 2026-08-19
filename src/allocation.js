/* Balanced randomisation across the 21 design cells (7 conditions x 3 orders).
   ---------------------------------------------------------------------------
   Assignment must be a server decision. If the browser picked, a refresh or a
   cleared cache would re-randomise the same person, and the cells would drift
   apart under differential drop-out.

   The pick is a single UPDATE, so it is atomic under concurrency. The inner
   SELECT takes the least-filled enabled cell and locks it; concurrent
   assignments SKIP LOCKED past it to the next-least-filled, which is what
   keeps 700 simultaneous starts spread evenly instead of piling onto one cell.
   Ties are broken randomly so the cell order in the table carries no weight. */

import { q } from "./db.js";
import { CONDITIONS, allCells } from "../shared/instrument.js";
import { config } from "./config.js";

const PICK = `
  UPDATE allocation SET assigned = assigned + 1
  WHERE cell = (
    SELECT cell FROM allocation
    WHERE enabled AND (target = 0 OR assigned < target)
    ORDER BY assigned ASC, random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING cell, condition, seg_order`;

/* Same statement without SKIP LOCKED: used only if every candidate row was
   locked on all attempts, which needs a burst far beyond 700 concurrent starts. */
const PICK_BLOCKING = `
  UPDATE allocation SET assigned = assigned + 1
  WHERE cell = (
    SELECT cell FROM allocation
    WHERE enabled AND (target = 0 OR assigned < target)
    ORDER BY assigned ASC, random()
    LIMIT 1
  )
  RETURNING cell, condition, seg_order`;

export class StudyFullError extends Error {
  constructor() { super("all cells have reached their target"); this.code = "STUDY_FULL"; }
}

/** Reserve one slot and return the design cell for a new participant. */
export async function assignCell() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { rows } = await q(PICK);
    if (rows.length) return decorate(rows[0]);
  }
  const { rows } = await q(PICK_BLOCKING);
  if (rows.length) return decorate(rows[0]);

  /* Nothing came back from the blocking variant either: either every cell is
     disabled or every cell is at target. */
  throw new StudyFullError();
}

/** Give the slot back when a session is abandoned before any answer. */
export async function releaseCell(cell) {
  await q(`UPDATE allocation SET assigned = GREATEST(assigned - 1, 0) WHERE cell = $1`, [cell]);
}

function decorate(row) {
  const cond = CONDITIONS[row.condition];
  return {
    cell: row.cell,
    condition: row.condition,
    ctrl: cond.ctrl,
    profile: cond.profile,
    segOrder: row.seg_order,
    optional: pickOptionalBlock()
  };
}

/* The optional attitude block is a design decision for the whole run, not a
   per-participant manipulation, so it is normally fixed by OPTIONAL_BLOCK.
   "random" exists for a pilot that wants to measure how much the block costs
   in drop-out; the assignment is stored per participant either way. */
function pickOptionalBlock() {
  if (config.optionalBlock === "off") return false;
  if (config.optionalBlock === "random") return Math.random() < 0.5;
  return true;
}

/** Current fill of every cell, for the dashboard. */
export async function allocationSnapshot() {
  const { rows } = await q(`SELECT * FROM v_cell_progress`);
  return rows;
}

/** Re-derive `assigned` from the participants table.
    Run after deleting test rows, or if a crash left a counter ahead of reality.
    Sessions that never answered anything and have gone quiet are not counted,
    so a cell cannot be starved by people who opened the link and left. */
export async function reconcileAllocation() {
  const { rows } = await q(
    `UPDATE allocation a
        SET assigned = COALESCE((
              SELECT COUNT(*) FROM participants p
               WHERE p.cell = a.cell
                 AND NOT p.is_test
                 AND NOT (p.status = 'in_progress'
                          AND p.answered_count = 0
                          AND p.last_seen_at < now() - make_interval(mins => $1))
            ), 0)
      RETURNING a.cell, a.assigned`,
    [config.staleMinutes]
  );
  return rows.sort((x, y) => x.cell.localeCompare(y.cell));
}

/** Set or clear a per-cell recruitment target. target = 0 means uncapped. */
export async function setCellTarget(cell, target) {
  const { rows } = await q(
    `UPDATE allocation SET target = $2 WHERE cell = $1 RETURNING cell, target, assigned, enabled`,
    [cell, target]
  );
  return rows[0] ?? null;
}

/** Apply one target to every cell at once, e.g. 700/21 = 34 per cell. */
export async function setAllTargets(target) {
  const { rows } = await q(
    `UPDATE allocation SET target = $1 RETURNING cell, target`, [target]
  );
  return rows.length;
}

export async function setCellEnabled(cell, enabled) {
  const { rows } = await q(
    `UPDATE allocation SET enabled = $2 WHERE cell = $1 RETURNING cell, enabled`,
    [cell, enabled]
  );
  return rows[0] ?? null;
}

/** True when at least one cell can still take a participant. */
export async function hasCapacity() {
  const { rows } = await q(
    `SELECT 1 FROM allocation WHERE enabled AND (target = 0 OR assigned < target) LIMIT 1`
  );
  return rows.length > 0;
}

export const CELL_KEYS = allCells().map(c => c.cell);
