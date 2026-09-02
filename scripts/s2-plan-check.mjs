/* Offline checks on the Study 2 instrument: every order builds, item ids are
   unique within a plan, the plan is five pages, every clip carries the same
   three items, and the wide-export header covers every id. */

const m = await import(new URL("../shared/s2-instrument.js", import.meta.url));
const die = msg => { console.error(msg); process.exit(1); };

const all = new Set(m.s2AllItemIds());
for (const o of m.S2_ORDER_KEYS) {
  const plan = m.buildS2Plan(o);
  if (plan.pages.length !== 5) die(`${o}: expected 5 pages, got ${plan.pages.length}`);
  const items = m.s2PlanItems(plan);
  const ids = items.map(i => i.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) die(`duplicate item ids in ${o}: ${[...new Set(dupes)].join(", ")}`);
  for (const id of ids) if (!all.has(id)) die(`${o}: ${id} missing from s2AllItemIds()`);
  const clips = plan.pages.filter(p => p.kind === "segment");
  if (clips.length !== 3) die(`${o}: expected 3 clip pages`);
  for (const c of clips) {
    const codes = c.items.filter(i => i.type !== "note").map(i => i.id.split("_")[1]).join(",");
    if (codes !== "IMP,WHO,DIS") die(`${o} ${c.key}: items are ${codes}`);
    if (!c.video?.id || !c.video?.duration) die(`${o} ${c.key}: no clip`);
  }
  const pub = m.publicS2Plan(plan);
  if (JSON.stringify(pub).includes('"expected"')) die(`${o}: an answer key reached the public plan`);
}
console.log(`s2 plan ok: ${m.S2_ORDER_KEYS.length} orders, 5 pages, ${all.size} stored items`);
