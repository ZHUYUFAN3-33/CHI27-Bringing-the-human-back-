/* Drives the real Study 2 page in Chromium, through /s2/preview: it renders
   every page for a chosen clip order, opens no video gate and records nothing,
   so the whole instrument can be walked without a participant row.
 *
 * What it is for. Every page kind renders what it promises — the disclosure
 * page with its diagram and persona box, the recap above each clip, the
 * validation block — the unanswered count is right on every page that has
 * answers, and each arm's disclosure page carries its own description and no
 * other arm's. Preview does not disable Next, but it prints the unanswered
 * count, which is missingOn() read straight off the page.
 *
 *   npm install --no-save playwright && npx playwright install chromium
 *   node scripts/s2-browser-test.mjs http://127.0.0.1:8080 $ADMIN_TOKEN
 */
import { existsSync } from "node:fs";
import { chromium } from "playwright";

/* Same resolution order as scripts/browser-test.mjs: an explicit CHROME_PATH,
   then the sandbox pre-install, then whatever Playwright downloaded itself. */
const SANDBOX_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = process.env.CHROME_PATH
  || (existsSync(SANDBOX_CHROME) ? SANDBOX_CHROME : undefined);

const BASE = process.argv[2] ?? "http://127.0.0.1:8080";
const TOKEN = process.argv[3] ?? process.env.ADMIN_TOKEN;
if (!TOKEN) { console.error("usage: node scripts/s2-browser-test.mjs <base-url> <admin-token>"); process.exit(2); }

let bad = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "  ok  " : "FAIL  "}${name}${extra ? " — " + extra : ""}`);
  if (!ok) bad++;
};

/* Required items still unanswered on the page, as preview reports them. */
const missing = async page => {
  const t = (await page.locator("#navwarn").textContent()) ?? "";
  const m = /^(\d+) unanswered/.exec(t.trim());
  return m ? Number(m[1]) : 0;
};

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();

/* The clips are YouTube embeds. On a machine that cannot reach them the frame
   fails to load, which says nothing about this code, so only errors thrown by
   our own scripts are collected. */
const errors = [];
page.on("pageerror", e => errors.push(e.message));

await page.goto(`${BASE}/s2/preview?token=${TOKEN}&cond=HA1&order=O2`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__previewGoto && document.querySelector("h2.qtitle"),
  null, { timeout: 20000 });

/* ---- every page renders what its kind promises --------------------------- */

const shape = [];
for (let i = 0; i < 8; i++) {
  await page.evaluate(n => window.__previewGoto(n), i);
  await page.waitForTimeout(250);
  shape.push(await page.evaluate(() => ({
    title: document.querySelector("h2.qtitle")?.textContent ?? "",
    tables: document.querySelectorAll("table.likert").length,
    rows: document.querySelectorAll("table.likert tbody tr").length,
    cols: document.querySelectorAll("table.likert thead th").length,
    headings: document.querySelectorAll(".seam").length,
    numbers: document.querySelectorAll('input[type="number"]').length,
    areas: document.querySelectorAll("textarea").length,
    radios: document.querySelectorAll('input[type="radio"]').length,
    disclosure: document.querySelectorAll(".disclosure").length,
    diagram: document.querySelectorAll(".diagram svg").length,
    persona: document.querySelectorAll(".persona li").length,
    recap: document.querySelectorAll(".recap").length,
    notes: document.querySelectorAll(".note").length,
    methods: document.querySelectorAll("ol.methods li").length
  })));
}
shape.forEach((s, i) => console.log(
  `page ${i} · ${s.title}\n         likert ${s.tables}/${s.rows} · radios ${s.radios} · text ${s.areas} · number ${s.numbers} · ` +
  `disclosure ${s.disclosure} · diagram ${s.diagram} · persona ${s.persona} · recap ${s.recap}`));

check("page one names no list of control arrangements", shape[0].methods === 0);
check("the disclosure page carries the condition text, the diagram and the persona box",
  shape[1].disclosure === 1 && shape[1].diagram === 1 && shape[1].persona === 3,
  `${shape[1].disclosure}/${shape[1].diagram}/${shape[1].persona}`);
check("the disclosure page asks only for the read confirmation", shape[1].radios === 1);
const clips = [shape[2], shape[3], shape[4]];
check("every clip page restates the condition above the player", clips.every(s => s.recap === 1));
check("the attention check rides the middle clip and only the middle clip",
  clips.map(s => s.rows).join("/") === "0/1/0", clips.map(s => s.rows).join("/"));
check("the comprehension check rides the last clip and only the last clip",
  clips.map(s => s.radios).join("/") === "0/7/4", clips.map(s => s.radios).join("/"));
check("the validation page carries the open reconstruction, five seven-point items and three choices",
  shape[5].areas === 1 && shape[5].rows === 5 && shape[5].radios === 5 * 7 + 4 + 4 + 5,
  `${shape[5].areas} text, ${shape[5].rows} rows, ${shape[5].radios} radios`);
check("the validation page carries its two instructions and no other page carries any",
  shape.map(s => s.notes).join("") === "00000200", shape.map(s => s.notes).join(""));
check("every seven-point table is a stem column plus seven points", shape.every(s => s.cols % 8 === 0));
check("the background page carries the age box and the seam, and no seven-point rows",
  shape[6].rows === 0 && shape[6].numbers === 1 && shape[6].headings === 1);
check("free text appears once in the whole instrument", shape.reduce((a, s) => a + s.areas, 0) === 1);

/* ---- the unanswered count on every page that has answers ------------------ */

for (const [idx, label, want] of [[1, "disclosure", 1], [3, "clip 2", 1], [4, "clip 3", 1], [5, "validation", 9], [6, "background", 6]]) {
  await page.evaluate(n => window.__previewGoto(n), idx);
  await page.waitForTimeout(250);
  check(`${label}: ${want} required items counted while the page is blank`,
    await missing(page) === want, `saw ${await missing(page)}`);
  await page.evaluate(() => {
    const names = new Set();
    document.querySelectorAll('input[type="radio"]').forEach(r => names.add(r.name));
    for (const n of names) document.querySelector(`input[type="radio"][name="${CSS.escape(n)}"]`)?.click();
    document.querySelectorAll('input[type="number"]').forEach(i => {
      i.value = "34"; i.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  await page.waitForTimeout(200);
  if (await page.locator("textarea").count()) {
    const ta = page.locator("textarea").first();
    await ta.fill("too short");
    await page.waitForTimeout(150);
    check(`${label}: a reconstruction under the 30-character floor still counts as unanswered`,
      await missing(page) === 1, `saw ${await missing(page)}`);
    await ta.fill("A trained person was operating the robot and choosing what it said and did.");
    await page.waitForTimeout(150);
  }
  check(`${label}: nothing outstanding once every required item is answered`,
    await missing(page) === 0, `saw ${await missing(page)}`);
}

/* ---- each arm's disclosure is its own -------------------------------------- */

for (const [cond, needle, absent] of [["A", "entirely by an AI system", "trained human operator"],
                                      ["H1", "No AI system", "disability"],
                                      ["H2", "intellectual disability", "mobility"],
                                      ["H3", "mobility-related disability", "intellectual"]]) {
  await page.evaluate((c) => window.__previewLoad(c, "O1"), cond);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__previewGoto(1));
  await page.waitForTimeout(200);
  const text = await page.evaluate(() => document.querySelector(".disclosure")?.textContent ?? "");
  check(`arm ${cond}: its own description, and not another arm's`,
    text.includes(needle) && !text.includes(absent), `needle ${text.includes(needle)}, absent ${!text.includes(absent)}`);
}

check("no script errors on any page", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();
console.log(bad ? `\n${bad} check(s) failed` : "\nall checks passed");
process.exit(bad ? 1 : 0);
