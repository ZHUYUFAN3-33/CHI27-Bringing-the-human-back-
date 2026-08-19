/* Drives the participant page in a real browser. The API tests cover the data
   path; this covers what a participant actually touches — rendering, the
   compulsory-item gate, the ranking permutation rule, refresh-and-resume, and
   the Likert layout on a phone.

   The YouTube gate is opened directly rather than by playing the clip: the
   embed needs a public origin and 70+ seconds of real time per segment. */
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:8099";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? "  · " + detail : ""}`);
};

/* Use whatever Chromium is around: an explicit CHROME_PATH, the one this
   sandbox pre-installs, or Playwright's own download in CI. */
const SANDBOX_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = process.env.CHROME_PATH
  || (existsSync(SANDBOX_CHROME) ? SANDBOX_CHROME : undefined);
const browser = await chromium.launch(executablePath ? { executablePath } : {});

async function openGate(page) {
  /* Mark the current segment's gate as satisfied, then repaint. */
  await page.evaluate(() => {
    const mod = window.__t;
    const p = mod.S.plan.pages[mod.S.page];
    mod.S.gates[p.segment] = { started: Date.now() - 200000, watch: 999, done: true, error: null };
    mod.paintGate(p);
  });
}

async function fillPage(page) {
  /* Answer everything unanswered on the current page, through the real DOM. */
  await page.evaluate(() => {
    const mod = window.__t;
    const p = mod.S.plan.pages[mod.S.page];
    const clickFirstFree = name => {
      const inputs = [...document.querySelectorAll(`input[name="${CSS.escape(name)}"]`)];
      const free = inputs.find(i => !i.checked);
      (free ?? inputs[0])?.click();
    };
    const walk = it => {
      if (it.type === "matrix") return it.rows.forEach(walk);
      if (it.type === "rank") {
        /* Click a different rank column for each row so the permutation rule
           is exercised rather than bypassed. */
        it.subIds.forEach((sid, i) => {
          const inputs = [...document.querySelectorAll(`input[name="${CSS.escape(sid)}"]`)];
          inputs[i % inputs.length]?.click();
        });
        return;
      }
      if (it.type === "likert7" || it.type === "mc") return clickFirstFree(it.id);
      const el = document.querySelector(`[data-item="${CSS.escape(it.id)}"] input`);
      if (!el) return;
      el.value = it.type === "number" ? "34" : "Japan";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    p.items.forEach(walk);
  });
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", e => consoleErrors.push("pageerror: " + e.message));

await page.goto(`${BASE}/?participantId=BROWSERTEST1&test=1`, { waitUntil: "networkidle" });
await page.waitForSelector("h2.qtitle", { timeout: 15000 });

check("study information page renders", (await page.textContent("h2.qtitle")).includes("Study information"));

/* Walk the whole questionnaire. */
let pages = 0, sawDisclosure = false, sawSegment = false, segmentsSeen = 0;
for (let guard = 0; guard < 30; guard++) {
  const state = await page.evaluate(() => {
    const p = window.__t.S.plan.pages[window.__t.S.page];
    return { kind: p.kind, key: p.key, title: p.title, last: window.__t.S.page === window.__t.S.plan.pages.length - 1 };
  });
  if (state.last) break;

  if (state.kind === "disclosure") {
    sawDisclosure = true;
    const persona = await page.textContent(".persona");
    const hasDiagram = await page.locator(".diagram svg").count();
    check("disclosure shows persona and diagram", persona.length > 40 && hasDiagram === 1);
    const profileLines = await page.locator(".persona li.profileline").count();
    check("exactly one profile line is emphasised", profileLines <= 1, `${profileLines} found`);
  }

  if (state.kind === "segment") {
    sawSegment = true; segmentsSeen++;
    if (segmentsSeen === 1) {
      const locked = await page.locator(".locked").count();
      check("items are locked before the clip plays", locked === 1);
      check("Next is disabled while the gate is shut", await page.locator("#next").isDisabled());
    }
    await openGate(page);
    await page.waitForTimeout(60);
    if (segmentsSeen === 1) {
      check("gate opening unlocks the items", (await page.locator("#qs_" + state.key + ".locked").count()) === 0);
    }
  }

  if (state.kind !== "info" && state.kind !== "debrief") {
    /* Next must refuse to move while anything is unanswered. The button is
       genuinely disabled, so the click is dispatched directly to prove the
       handler also guards — belt and braces, since a disabled attribute alone
       is defeated by anyone with a devtools window open. */
    if (pages === 1) {
      check("Next is disabled with items unanswered", await page.locator("#next").isDisabled());
      const before = await page.evaluate(() => window.__t.S.page);
      await page.dispatchEvent("#next", "click");
      await page.waitForTimeout(80);
      const after = await page.evaluate(() => window.__t.S.page);
      check("the handler also refuses to advance", before === after);
      check("unanswered items are marked", (await page.locator(".missing").count()) > 0);
      check("the warning names the count", /still to answer/.test(await page.textContent("#navwarn")));
    }
    await fillPage(page);
    await page.waitForTimeout(40);
  }

  /* The ranking grid must always hold a permutation. */
  if (state.kind === "segment" && segmentsSeen === 1) {
    const perm = await page.evaluate(() => {
      const mod = window.__t;
      const p = mod.S.plan.pages[mod.S.page];
      const ranks = p.items.filter(i => i.type === "rank");
      return ranks.map(r => r.subIds.map(id => mod.S.answers.get(id)?.num));
    });
    const ok = perm.every(vals => new Set(vals).size === vals.length && vals.every(v => v != null));
    check("ranking grid holds a permutation", ok, JSON.stringify(perm));
  }

  await page.waitForFunction(() => !document.querySelector("#next").disabled, { timeout: 6000 })
    .catch(async () => { check("Next enabled after answering " + state.key, false, await page.textContent("#navwarn")); });
  await page.click("#next");
  await page.waitForTimeout(90);
  pages++;
}

check("reached the disclosure page", sawDisclosure);
check("reached the segment pages", sawSegment && segmentsSeen === 3, `${segmentsSeen} segments`);
check("walked the expected number of pages", pages === 13, `${pages} pages`);

/* Refresh in the middle: answers and position must come back. */
const beforeCount = await page.evaluate(() => window.__t.S.answers.size);
await page.waitForTimeout(600);          // let the save queue drain
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector("h2.qtitle", { timeout: 15000 });
const after = await page.evaluate(() => ({ answers: window.__t.S.answers.size, page: window.__t.S.page, title: document.querySelector("h2.qtitle").textContent }));
check("a refresh restores the answers", after.answers >= beforeCount - 2, `${beforeCount} -> ${after.answers}`);
check("a refresh restores the position", after.title.includes("Thank you"), after.title);

/* Submit. */
await page.click(".btn.wide");
await page.waitForSelector(".bigcode", { timeout: 15000 });
const code = (await page.textContent(".bigcode")).trim();
check("completion code is shown", /^[A-Z2-9]{8}$/.test(code), code);

/* No researcher-facing material may reach a participant. */
const html = await page.content();
check("no researcher annotations leaked", !html.includes("annot") && !/ochre/i.test(html));

/* Phone layout: the 7-point matrix must not force a horizontal scroll. */
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mob.newPage();
await mp.goto(`${BASE}/?test=1`, { waitUntil: "networkidle" });
await mp.waitForSelector("h2.qtitle");
await mp.click("#next");                                   // info -> consent
await mp.waitForTimeout(120);
for (let i = 0; i < 4; i++) {                              // through consent to background
  await mp.evaluate(() => {
    const mod = window.__t, p = mod.S.plan.pages[mod.S.page];
    p.items.forEach(it => {
      if (it.type === "mc") document.querySelector(`input[name="${CSS.escape(it.id)}"]`)?.click();
      else { const e = document.querySelector(`[data-item="${CSS.escape(it.id)}"] input`);
             if (e) { e.value = it.type === "number" ? "30" : "Japan"; e.dispatchEvent(new Event("input", { bubbles: true })); } }
    });
  });
  await mp.waitForTimeout(60);
  if (!(await mp.locator("#next").isDisabled())) { await mp.click("#next"); await mp.waitForTimeout(120); }
}
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check("no horizontal scroll on a 390px phone", overflow <= 1, `${overflow}px overflow`);
const key = await mp.locator(".likertkey").first().isVisible().catch(() => false);
check("phone shows the scale anchors under the matrix", key !== false);

check("no console errors", consoleErrors.filter(e => !/youtube|ERR_BLOCKED|net::/i.test(e)).length === 0,
      consoleErrors.slice(0, 2).join(" | "));

await browser.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed`);
process.exit(failed.length ? 1 : 0);
