/* Parse-check the JavaScript that lives inside the HTML pages.

   `node --check` only sees .js files, so the several hundred lines of it inside
   private/preview.html were unchecked by anything but a browser — and a
   syntax error in an inline script is silent in a way a syntax error in a
   module is not: the whole block simply never runs, so the page renders, the
   chrome is there, and the only symptom is that nothing works. An unbalanced
   template literal in the field list cost exactly that.

   new Function() compiles without executing, which is the whole point: this
   must not touch the DOM, the network, or the admin token. */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dirs = ["private", "public"];

/* Scripts with a src= are files, and are checked as files elsewhere; a
   type= that is not JavaScript (importmap, application/json) is data. */
const INLINE = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
const NOT_JS = /\btype\s*=\s*["']?(?!module|text\/javascript|application\/javascript)[^"'\s>]+/i;

let checked = 0, failed = 0;

for (const dir of dirs) {
  for (const name of readdirSync(join(root, dir)).filter(f => f.endsWith(".html"))) {
    const src = readFileSync(join(root, dir, name), "utf8");
    let n = 0;
    for (const [, attrs, body] of src.matchAll(INLINE)) {
      n++;
      if (NOT_JS.test(attrs) || !body.trim()) continue;
      checked++;
      try {
        new Function(body);
      } catch (err) {
        failed++;
        /* Point at the line in the file, not at the line in the fragment. */
        const before = src.slice(0, src.indexOf(body)).split("\n").length;
        console.error(`FAIL ${dir}/${name} · inline script ${n} (from line ${before}): ${err.message}`);
      }
    }
  }
}

if (failed) process.exit(1);
console.log(`ok · ${checked} inline scripts parse`);
