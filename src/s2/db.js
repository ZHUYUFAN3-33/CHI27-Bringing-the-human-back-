/* Study 2 storage: its own schema file and its own allocation seed, applied on
   boot right after Study 1's. Kept out of src/db.js so that the file the live
   study depends on does not grow a second study's concerns. */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";
import { s2AllCells } from "../../shared/s2-instrument.js";

export async function migrateS2(log = console) {
  const schemaPath = fileURLToPath(new URL("../../db/s2-schema.sql", import.meta.url));
  await pool.query(await readFile(schemaPath, "utf8"));
  const cells = s2AllCells();
  await pool.query(
    `INSERT INTO s2_allocation (cell, condition, seg_order)
     SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
     ON CONFLICT (cell) DO NOTHING`,
    [cells.map(c => c.cell), cells.map(c => c.condition), cells.map(c => c.seg_order)]
  );
  /* A deployment that ran an earlier instrument seeded allocation rows for the
     cells it had — s2-v5 had six, one per clip order. They survive the schema
     upgrade with no condition, and the pick, which takes the least-filled
     enabled cell, would take one and then fail to build a plan for it. Close
     them rather than delete them: the pick skips closed cells, the dashboard
     shows them closed, and nothing is destroyed. */
  const { rowCount: closed } = await pool.query(
    `UPDATE s2_allocation SET enabled = FALSE
      WHERE enabled AND cell <> ALL($1::text[])`,
    [cells.map(c => c.cell)]
  );
  log.info?.(`s2 schema applied (${cells.length} cells${closed ? `, ${closed} stale cell(s) closed` : ""})`);
}
