/* Offline checks on the Study 2 instrument: every condition × order builds,
   item ids are unique within a plan, the page count is right, each clip page
   carries only its check, the validation block has the nine items in order,
   every check has a key and every key stays off the public plan, and the
   wide-export header covers every id. */

const m = await import(new URL("../shared/s2-instrument.js", import.meta.url));
const die = msg => { console.error(msg); process.exit(1); };

const PAGES = 8;   // intro · disclosure · 3 clips · validation · background · finish
const VALIDATION = ["V_OPEN", "V_CTRL_REC", "V_CTRL_P", "V_CTRL_AI", "V_FINAL",
                    "V_PROF_REC", "V_LIM_MOB", "V_LIM_COG", "BEL1"];
const BACKGROUND = ["BG_age", "BG_gender", "BG_freq_ai", "BG_freq_disability", "BG_orihime_knowledge"];

/* The right answer per arm, restated here independently of the instrument so
   a slip in either place is caught by the other. */
const KEY = {
  A:   { V_CTRL_REC: 2, V_FINAL: 1, V_PROF_REC: 3 },
  H1:  { V_CTRL_REC: 0, V_FINAL: 0, V_PROF_REC: 2 },
  HA1: { V_CTRL_REC: 1, V_FINAL: 0, V_PROF_REC: 2 },
  H2:  { V_CTRL_REC: 0, V_FINAL: 0, V_PROF_REC: 1 },
  H3:  { V_CTRL_REC: 0, V_FINAL: 0, V_PROF_REC: 0 }
};

if (m.S2_CONDITION_KEYS.join(",") !== Object.keys(KEY).join(",")) die(`conditions are ${m.S2_CONDITION_KEYS}`);
if (m.s2AllCells().length !== 30) die(`${m.s2AllCells().length} cells, expected 30`);

const all = new Set(m.s2AllItemIds());
for (const cond of m.S2_CONDITION_KEYS) {
  for (const o of m.S2_ORDER_KEYS) {
    const tag = `${cond}|${o}`;
    const plan = m.buildS2Plan(cond, o);
    if (plan.pages.length !== PAGES) die(`${tag}: expected ${PAGES} pages, got ${plan.pages.length}`);

    const items = m.s2PlanItems(plan);
    const ids = items.map(i => i.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) die(`duplicate item ids in ${tag}: ${[...new Set(dupes)].join(", ")}`);
    for (const id of ids) if (!all.has(id)) die(`${tag}: ${id} missing from s2AllItemIds()`);
    if (items.length !== 20) die(`${tag}: ${items.length} items, expected 20`);

    for (const it of items) {
      if (it.type === "likert7" && it.options?.length !== 7) die(`${tag}: ${it.id} likert7 with ${it.options?.length} options`);
    }

    /* The disclosure page carries the condition's own text and nothing else's. */
    const disc = plan.pages.find(p => p.kind === "disclosure");
    if (!disc) die(`${tag}: no disclosure page`);
    if (disc.disclosure.arrangement !== plan.ctrl) die(`${tag}: diagram is ${disc.disclosure.arrangement}`);
    if ((plan.profile === 2 || plan.profile === 3) !== !!disc.disclosure.profile) die(`${tag}: profile line mismatch`);
    if (cond === "A" && disc.disclosure.personaHead !== "About the system") die(`${tag}: AI arm has the human persona`);

    /* Clip pages: recap present, only the two checks as items. */
    const clips = plan.pages.filter(p => p.kind === "segment");
    if (clips.length !== 3) die(`${tag}: expected 3 clip pages`);
    clips.forEach((c, i) => {
      if (!c.recap?.control) die(`${tag} ${c.key}: no condition recap`);
      const codes = c.items.map(it => it.id.slice(it.id.indexOf("_") + 1));
      const want = i === 1 ? ["AT1"] : i === 2 ? ["AV1"] : [];
      if (codes.join(",") !== want.join(",")) die(`${tag} ${c.key}: items are ${codes.join(",")}`);
      if (!c.video?.id || !c.video?.duration) die(`${tag} ${c.key}: no clip`);
    });

    /* The validation block, in order; the background block, in order. */
    const val = items.filter(i => i.pageKey === "validation").map(i => i.id);
    if (val.join(",") !== VALIDATION.join(",")) die(`${tag}: validation items are ${val.join(",")}`);
    const bg = items.filter(i => i.pageKey === "background").map(i => i.id);
    if (bg.join(",") !== BACKGROUND.join(",")) die(`${tag}: background items are ${bg.join(",")}`);
    const text = items.filter(i => i.type === "text").map(i => i.id);
    if (text.join(",") !== "V_OPEN") die(`${tag}: free-text items are ${text.join(",")}`);

    /* Every key, per arm, and none of them public. */
    for (const [id, want] of Object.entries(KEY[cond])) {
      const it = items.find(i => i.id === id);
      if (it?.expected !== want) die(`${tag}: ${id} expected ${it?.expected}, key says ${want}`);
    }
    for (const g of ["attention", "comprehension"]) {
      const c = items.filter(i => i.group === g);
      if (c.length !== 1 || !Number.isInteger(c[0].expected)) die(`${tag}: ${g} check missing or unkeyed`);
    }
    const pub = JSON.stringify(m.publicS2Plan(plan));
    if (pub.includes('"expected"')) die(`${tag}: an answer key reached the public plan`);
    if (pub.includes(`"condition"`)) die(`${tag}: the condition label reached the public plan`);
    for (const other of m.S2_CONDITION_KEYS) {
      if (other === cond) continue;
      /* Another arm's control text must not be in this arm's plan. */
      const otherCtrl = m.S2_CONDITIONS[other].ctrl;
      if (otherCtrl !== plan.ctrl && pub.includes(m.buildS2Plan(other, o).pages[1].disclosure.control)) {
        die(`${tag}: carries ${other}'s control text`);
      }
    }
  }
}

if (m.S2_DEBRIEF.some(par => par.includes(m.S2_DEBRIEF_PLACEHOLDER))) {
  console.log("WARNING: the debrief still carries its placeholder. Fill in how each clip was");
  console.log("         actually controlled, or remove the sentence to match Study 1's approved");
  console.log("         debrief, before recruitment opens.");
}
console.log(`s2 plan ok: ${m.S2_CONDITION_KEYS.length} conditions × ${m.S2_ORDER_KEYS.length} orders, ${PAGES} pages, ${all.size} stored items`);
