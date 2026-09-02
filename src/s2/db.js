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
    `INSERT INTO s2_allocation (cell, seg_order)
     SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT (cell) DO NOTHING`,
    [cells.map(c => c.cell), cells.map(c => c.seg_order)]
  );
  log.info?.(`s2 schema applied (${cells.length} cells)`);
}
