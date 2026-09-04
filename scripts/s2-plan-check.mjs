/* Offline checks on the Study 2 instrument: every order builds, item ids are
   unique within a plan, the page count is right, every clip carries the same
   items in the same order, the attention check rides the middle clip and only
   the middle clip, the wide-export header covers every id, and no answer key
   reaches the browser. */

const m = await import(new URL("../shared/s2-instrument.js", import.meta.url));
const die = msg => { console.error(msg); process.exit(1); };

const PAGES = 6;                       // intro · 3 clips · background · finish
/* The order items are asked in on a clip page: three rated questions, each
   followed by its own confidence item. AT1 is appended on the middle clip
   only, so that page is checked separately. */
const CLIP_CODES = ["AU1", "AU1_CONF", "WHO", "WHO_CONF", "DIS", "DIS_CONF"];

const all = new Set(m.s2AllItemIds());
for (const o of m.S2_ORDER_KEYS) {
  const plan = m.buildS2Plan(o);
  if (plan.pages.length !== PAGES) die(`${o}: expected ${PAGES} pages, got ${plan.pages.length}`);

  const items = m.s2PlanItems(plan);
  const ids = items.map(i => i.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) die(`duplicate item ids in ${o}: ${[...new Set(dupes)].join(", ")}`);
  for (const id of ids) if (!all.has(id)) die(`${o}: ${id} missing from s2AllItemIds()`);

  /* Every seven-point item must carry exactly seven labels: the export codes
     them 1..7 against this array, and a short one would silently store null. */
  for (const it of items) {
    if (it.type === "likert7" && it.options?.length !== 7) {
      die(`${o}: ${it.id} is likert7 with ${it.options?.length} options`);
    }
  }

  const clips = plan.pages.filter(p => p.kind === "segment");
  if (clips.length !== 3) die(`${o}: expected 3 clip pages`);
  clips.forEach((c, i) => {
    const flat = [];
    for (const it of c.items) {
      if (it.type === "note" || it.type === "heading") continue;
      if (it.type === "matrix") { flat.push(...it.rows); continue; }
      flat.push(it);
    }
    const codes = flat.map(it => it.id.slice(it.id.indexOf("_") + 1));
    /* The middle clip carries the instructed-response check, the last one the
       video-comprehension check; the first carries neither. */
    const want = i === 1 ? [...CLIP_CODES, "AT1"]
               : i === 2 ? [...CLIP_CODES, "AV1"]
               : CLIP_CODES;
    if (codes.join(",") !== want.join(",")) die(`${o} ${c.key}: items are ${codes.join(",")}`);
    if (!c.video?.id || !c.video?.duration) die(`${o} ${c.key}: no clip`);
  });

  /* Every question on a clip page is followed by a confidence item: three
     questions, three confidence scores, on every clip. */
  const conf = items.filter(i => i.group === "confidence");
  if (conf.length !== 9) die(`${o}: ${conf.length} confidence items, expected 9`);

  /* s2-v3 asks for no free text at all, which is why the attention check is
     the only quality evidence the instrument itself produces. */
  const text = items.filter(i => i.type === "text");
  if (text.length) die(`${o}: unexpected free-text items: ${text.map(i => i.id).join(", ")}`);

  const checks = items.filter(i => i.group === "attention");
  if (checks.length !== 1) die(`${o}: ${checks.length} attention checks, expected 1`);
  if (!Number.isInteger(checks[0].expected)) die(`${o}: attention check has no answer key`);

  const comp = items.filter(i => i.group === "comprehension");
  if (comp.length !== 1) die(`${o}: ${comp.length} comprehension checks, expected 1`);
  if (!Number.isInteger(comp[0].expected)) die(`${o}: comprehension check has no answer key`);
  if (comp[0].segPosition !== 3) die(`${o}: comprehension check is on clip ${comp[0].segPosition}, expected 3`);

  /* Prior familiarity with OriHime is asked of everyone, at the end. */
  const fam = items.filter(i => i.group === "familiarity");
  if (fam.length !== 2) die(`${o}: ${fam.length} familiarity items, expected 2`);

  const pub = m.publicS2Plan(plan);
  if (JSON.stringify(pub).includes('"expected"')) die(`${o}: an answer key reached the public plan`);
  if (pub.scale?.length !== 7) die(`${o}: the public plan carries no seven-point scale`);
}
/* Not a failure — the study is meant to be walked and previewed long before
   the debrief is finalised — but it must never reach recruitment like this. */
if (m.S2_DEBRIEF.some(par => par.includes(m.S2_DEBRIEF_PLACEHOLDER))) {
  console.log("WARNING: the debrief still carries its placeholder. Only the PI can say how each");
  console.log("         clip was actually controlled; fill S2_DEBRIEF in and have the page");
  console.log("         approved with the ethics materials before recruitment opens.");
}

console.log(`s2 plan ok: ${m.S2_ORDER_KEYS.length} orders, ${PAGES} pages, ${all.size} stored items`);
