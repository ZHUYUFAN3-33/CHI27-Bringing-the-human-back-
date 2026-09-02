/* Study 2 — one plugin that mounts everything under /api/s2. The participant
   routes get their own bearer-token hook against s2_participants; the admin
   and export routes sit behind the same requireAdmin the Study 1 dashboard
   uses, handed in by server.js. */

import { q } from "../db.js";
import participantRoutes from "./participant.js";
import adminRoutes from "./admin.js";
import exportRoutes from "./export.js";

const PROTECTED = ["/api/s2/save", "/api/s2/complete", "/api/s2/screen-out",
                   "/api/s2/session/resume", "/api/s2/session/ping"];

export default async function s2Routes(app, { requireAdmin }) {
  app.addHook("preHandler", async (req, reply) => {
    if (!PROTECTED.some(p => req.url.startsWith(p))) return;
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : String(req.body?.token || "").trim();
    if (!token) return reply.code(401).send({ error: "missing_token" });
    const { rows } = await q(`SELECT * FROM s2_participants WHERE token = $1`, [token]);
    if (!rows.length) return reply.code(401).send({ error: "unknown_token" });
    req.participant = rows[0];
  });

  await app.register(participantRoutes);
  await app.register(async scope => {
    scope.addHook("onRequest", requireAdmin);
    await scope.register(adminRoutes);
    await scope.register(exportRoutes);
  });
}
