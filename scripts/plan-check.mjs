/* Offline checks on the instrument itself.
   Real invariants rather than a magic item count: the old preflight asserted
   "at least 90 items", which failed the moment four items were retired and said
   nothing about whether the design was sound.

   1 · every cell builds
   2 · item ids are unique within a plan — ids are the key the database upserts
       on, so a collision silently overwrites an answer
   3 · the segment orders are a full counterbalance: each segment appears in
       each position equally often, and every adjacent pair equally often.
       The three cyclic rotations pass the first and fail the second. */

const { buildPlan, planItems, CONDITION_KEYS, ORDER_KEYS, ORDERS } =
  await import(new URL("../shared/instrument.js", import.meta.url));

const die = msg => { console.error(msg); process.exit(1); };

for (const c of CONDITION_KEYS) {
  for (const o of ORDER_KEYS) {
    for (const optional of [true, false]) {
      const items = planItems(buildPlan(c, o, optional));
      if (!items.length) die(`empty plan: ${c}|${o} optional=${optional}`);
      const ids = items.map(i => i.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dupes.length) die(`duplicate item ids in ${c}|${o}: ${[...new Set(dupes)].join(", ")}`);
    }
  }
}

const segs = [...new Set(Object.values(ORDERS).flat())];
const slots = Object.fromEntries(segs.map(s => [s, segs.map(() => 0)]));
const pairs = {};
for (const a of segs) for (const b of segs) if (a !== b) pairs[`${a}>${b}`] = 0;

for (const order of Object.values(ORDERS)) {
  order.forEach((s, i) => slots[s][i]++);
  for (let i = 0; i < order.length - 1; i++) pairs[`${order[i]}>${order[i + 1]}`]++;
}

for (const s of segs) {
  if (new Set(slots[s]).size !== 1) die(`${s} is not position-balanced: ${slots[s].join("/")}`);
}
const counts = new Set(Object.values(pairs));
if (counts.size !== 1) {
  const missing = Object.entries(pairs).filter(([, n]) => n === 0).map(([k]) => k);
  die(`adjacent pairs are not balanced${missing.length ? `; never occurring: ${missing.join(", ")}` : ""}`);
}

console.log(`ok · ${CONDITION_KEYS.length} conditions x ${ORDER_KEYS.length} orders, ` +
            `ids unique, position and adjacency balanced`);
