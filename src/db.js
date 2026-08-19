import pg from "pg";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { allCells } from "../shared/instrument.js";

/* Postgres never returns JS Date objects we care about here; keep timestamps as
   ISO strings so CSV export and JSON responses agree. 1114 = timestamp,
   1184 = timestamptz. */
pg.types.setTypeParser(1114, v => (v === null ? null : new Date(v + "Z").toISOString()));
pg.types.setTypeParser(1184, v => (v === null ? null : new Date(v).toISOString()));
/* int8 (BIGSERIAL, COUNT(*)) arrives as a string by default. */
pg.types.setTypeParser(20, v => (v === null ? null : Number(v)));

function sslFor(url) {
  if (!url) return false;
  if (/sslmode=disable/i.test(url)) return false;
  try {
    const host = new URL(url).hostname;
    /* Fly's private network (.internal / .flycast) is already encrypted at the
       WireGuard layer and presents no public certificate. */
    if (/\.(internal|flycast)$/.test(host) || host === "localhost" || host === "127.0.0.1") return false;
  } catch { /* fall through to require ssl */ }
  return { rejectUnauthorized: false };
}

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: config.pgPoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
  /* Fly Managed Postgres hands out a PgBouncer (transaction pooling) URL.
     Nothing below uses named prepared statements, LISTEN/NOTIFY, or session
     state, so transaction pooling is safe. */
  statement_timeout: config.pgStatementTimeoutMs,
  ssl: sslFor(config.databaseUrl),
  application_name: "study1-survey"
});

pool.on("error", err => {
  /* An idle client dying is normal after a Postgres failover; the pool
     replaces it. Log, never crash the process. */
  console.error("[pg] idle client error:", err.message);
});

export const q = (text, params) => pool.query(text, params);

export async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

/** Apply the schema and make sure every design cell has an allocation row. */
export async function migrate(log = console) {
  const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
  log.info?.("schema applied");

  const cells = allCells();
  await pool.query(
    `INSERT INTO allocation (cell, condition, seg_order)
     SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
     ON CONFLICT (cell) DO NOTHING`,
    [cells.map(c => c.cell), cells.map(c => c.condition), cells.map(c => c.seg_order)]
  );
  log.info?.(`allocation table ready (${cells.length} cells)`);
}

export async function healthy() {
  const { rows } = await pool.query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}
