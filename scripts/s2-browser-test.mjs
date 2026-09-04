/* Drives the real Study 2 page in Chromium, through /s2/preview: it renders
   every page for a chosen clip order, opens no video gate and records nothing,
   so the whole instrument can be walked without a participant row.
 *
 * What it is for. The v2 instrument brought four item types the Study 2 client
 * had never rendered — seven-point items, the matrix block that groups them, a
 * heading and a number box. A matrix block has no id of its own, so any walk
 * over a page's items that forgets to descend into its rows gets the unanswered
 * count wrong in one of two directions: the block itself counted as a missing
 * item, and the Next button never lights; or its rows never counted, and Next
 * lights while the page is still blank. Preview does not disable Next, but it
 * prints that count, which is missingOn() read straight off the page.
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

await page.goto(`${BASE}/s2/preview?token=${TOKEN}&order=O2`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.__previewGoto && document.querySelector("h2.qtitle"),
  null, { timeout: 20000 });

/* ---- every item type reaches the page ---------------------------------- */

const shape = [];
for (let i = 0; i < 6; i++) {
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
    notes: document.querySelectorAll(".note").length
  })));
}
shape.forEach((s, i) => console.log(
  `page ${i} · ${s.title}\n         ${s.tables} likert table(s), ${s.rows} row(s) · ` +
  `${s.areas} text box(es) · ${s.numbers} number · ${s.headings} heading · ${s.notes} note`));

const clips = [shape[1], shape[2], shape[3]];
/* Two tables on a clip page: the evaluation block, and the lone confidence
   item rendered as a one-row table. */
check("each clip page carries the evaluation block and the confidence item",
  clips.every(s => s.tables === 2));
check("the attention check rides the middle clip and only the middle clip",
  clips[0].rows === 3 && clips[1].rows === 4 && clips[2].rows === 3,
  clips.map(s => s.rows).join("/"));
check("each clip page carries the description and the two optional follow-ups",
  clips.every(s => s.areas === 3));
check("the reminder of the three control methods is on every clip page",
  clips.every(s => s.notes === 1));
check("every seven-point table is a stem column plus seven points",
  shape.every(s => s.cols % 8 === 0));
check("the background page carries the five GAAIS rows, the age box and the seam",
  shape[4].rows === 5 && shape[4].numbers === 1 && shape[4].headings === 1);

/* ---- the unanswered count sees through the matrix blocks ---------------- */

for (const [idx, label, want] of [[1, "clip 1", 6], [2, "clip 2", 7], [4, "background", 10]]) {
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
    check(`${label}: a description under the floor still counts as unanswered`,
      await missing(page) === 1, `saw ${await missing(page)}`);
    await ta.fill("The robot talks with a woman at a desk and seems to follow what she says.");
    await page.waitForTimeout(150);
  }
  check(`${label}: nothing outstanding once every required item is answered`,
    await missing(page) === 0, `saw ${await missing(page)}`);
}

check("no script errors on any page", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();
console.log(bad ? `\n${bad} check(s) failed` : "\nall checks passed");
process.exit(bad ? 1 : 0);
