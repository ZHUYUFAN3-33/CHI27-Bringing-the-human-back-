/* Standalone migration runner: `npm run migrate`. The server also migrates on
   boot, so this is only needed when applying the schema from a laptop. */
import { migrate, pool } from "./db.js";

await migrate(console);
await pool.end();
console.log("done");
