/* =============================================================================
   The instrument as it is actually served.

   shared/instrument.js remains the source of truth for structure — item ids,
   types, option counts, the design, the answer keys. This module lays a thin
   sheet of *text* over it, edited from /editor and stored in the database, and
   every route that builds a plan goes through here so the questionnaire, the
   validation, the codebook and the preview cannot disagree about wording.

   What can be overridden is decided here, not by the caller: a path must
   already exist in the built plan, and only a string is ever replaced. An edit
   therefore cannot add an item, remove one, change a type, or change how many
   options something has — the shape of the data is fixed by the code.
   ========================================================================== */

import { q } from "./db.js";
import {
  buildPlan, planItems, planIndex, publicPlan,
  INSTRUMENT_VERSION, CONDITION_KEYS, ORDER_KEYS
} from "../shared/instrument.js";

/* Cached because it is read on every session start and every save. Small
   (dozens of rows), and invalidated by the editor on write. */
let overrides = new Map();
let versionOverride = null;
let loadedAt = null;

const VERSION_PATH = "meta.instrument_version";

export async function loadOverrides(log) {
  try {
    const { rows } = await q(`SELECT path, value FROM instrument_overrides`);
    const next = new Map(rows.map(r => [r.path, r.value]));
    versionOverride = next.get(VERSION_PATH) ?? null;
    next.delete(VERSION_PATH);
    overrides = next;
    loadedAt = new Date().toISOString();
    log?.info?.({ overrides: overrides.size, version: currentVersion() }, "instrument overrides loaded");
  } catch (err) {
    /* A missing table on first boot is not a reason to refuse to serve the
       study: fall back to the instrument exactly as written in code. */
    log?.warn?.({ err: err.message }, "instrument overrides unavailable, serving the code instrument");
    overrides = new Map();
    versionOverride = null;
  }
  return overrides;
}

export function currentVersion() { return versionOverride || INSTRUMENT_VERSION; }
export function overrideCount() { return overrides.size; }
export function overridesLoadedAt() { return loadedAt; }
export function overrideEntries() { return [...overrides.entries()]; }

/* --------------------------------------------------------------- applying */

function walkItems(items, fn) {
  for (const it of items) {
    if (it.type === "matrix") { walkItems(it.rows, fn); continue; }
    fn(it);
  }
}

/** Replace text in a freshly built plan. buildPlan returns new objects every
    call, so this mutates nothing that is shared between participants. */
export function applyOverrides(plan, ov = overrides) {
  if (!ov.size) return plan;
  const g = p => ov.get(p);
  const who = plan.ctrl === "A" ? "ai" : "human";

  for (const page of plan.pages) {
    const title = g(`page.${page.key}.title`);
    if (title != null) page.title = title;
    const intro = g(`page.${page.key}.intro`);
    if (intro != null) page.intro = intro;

    if (page.disclosure) {
      const d = page.disclosure;
      const di = g("text.intro");                     if (di != null) d.intro = di;
      const dc = g(`text.control.${plan.ctrl}`);      if (dc != null) d.control = dc;
      if (d.profile != null) {
        const dp = g(`text.profile.${plan.profile}`); if (dp != null) d.profile = dp;
      }
      const dh = g(`text.personaHead.${who}`);        if (dh != null) d.personaHead = dh;
      d.personaLines.forEach((line, n) => {
        const v = g(`text.persona.${who}.${n}`);      if (v != null) line.text = v;
      });
    }

    if (page.segment) {
      const sd = g(`segment.${page.segment}.desc`);   if (sd != null) page.desc = sd;
    }

    walkItems(page.items, it => {
      if (it.stem != null) {
        const v = g(`item.${it.id}.stem`);            if (v != null) it.stem = v;
      }
      if (it.scenario != null) {
        const v = g(`item.${it.id}.scenario`);        if (v != null) it.scenario = v;
      }
      if (Array.isArray(it.options)) {
        it.options = it.options.map((o, n) => {
          const v = g(`item.${it.id}.option.${n}`);
          if (v == null) return o;
          return typeof o === "string" ? v : { ...o, label: v };
        });
      }
    });
  }
  return plan;
}

/* The four calls every route should use instead of buildPlan. */
export const runtimePlan  = (cond, order, optional) => applyOverrides(buildPlan(cond, order, optional));
export const runtimeItems = (cond, order, optional) => planItems(runtimePlan(cond, order, optional));
export const runtimeIndex = (cond, order, optional) => planIndex(runtimePlan(cond, order, optional));
export const runtimePublic = (cond, order, optional) => publicPlan(runtimePlan(cond, order, optional));

/* ------------------------------------------------------------- the field list

   Everything the editor is allowed to touch, with the value the code defines
   and the value currently served. Built by walking real plans, so a field can
   only appear here if it genuinely exists — the editor cannot invent a path,
   and a path that stops existing stops being offered.

   Option sets that are really data rather than wording — the 255-entry country
   list — are skipped: editing those one string at a time is not what this is
   for, and the stored value is the ISO code regardless.                       */

const OPTION_LIMIT = 12;

export function editableFields() {
  const seen = new Map();
  const add = (path, label, group, def) => {
    if (seen.has(path)) return;
    seen.set(path, { path, label, group, default: def, value: overrides.get(path) ?? null });
  };

  for (const cond of CONDITION_KEYS) {
    for (const order of ORDER_KEYS) {
      /* The code instrument, deliberately un-overridden: `default` has to be
         what the file says, or reverting would restore the last edit. */
      const plan = buildPlan(cond, order, true);
      const who = plan.ctrl === "A" ? "ai" : "human";

      for (const page of plan.pages) {
        add(`page.${page.key}.title`, `Page title — ${page.key}`, "Pages", page.title);
        if (page.intro != null) {
          add(`page.${page.key}.intro`, `Page intro — ${page.key}`, "Pages", page.intro);
        }

        if (page.disclosure) {
          const d = page.disclosure;
          add("text.intro", "What OriHime is", "Framing", d.intro);
          add(`text.control.${plan.ctrl}`, `Control source — ${plan.ctrl}`, "Framing", d.control);
          if (d.profile != null) {
            add(`text.profile.${plan.profile}`, `Operator profile — ${plan.profile}`, "Framing", d.profile);
          }
          add(`text.personaHead.${who}`, `Persona heading — ${who}`, "Framing", d.personaHead);
          d.personaLines.forEach((line, n) =>
            add(`text.persona.${who}.${n}`, `Persona line ${n + 1} — ${who}`, "Framing", line.text));
        }

        if (page.segment) {
          add(`segment.${page.segment}.desc`, `Clip description — ${page.segment}`, "Segments", page.desc);
        }

        walkItems(page.items, it => {
          if (it.stem != null) add(`item.${it.id}.stem`, it.id, "Items", it.stem);
          if (it.scenario != null) add(`item.${it.id}.scenario`, `${it.id} — scenario`, "Items", it.scenario);
          if (Array.isArray(it.options) && it.options.length <= OPTION_LIMIT) {
            it.options.forEach((o, n) => add(
              `item.${it.id}.option.${n}`,
              `${it.id} — option ${n}`,
              "Items",
              typeof o === "string" ? o : o.label
            ));
          }
        });
      }
    }
  }
  return [...seen.values()];
}

export function isEditable(path) {
  return editableFields().some(f => f.path === path);
}

/* ------------------------------------------------------------------ writing */

export async function nonTestParticipants() {
  const { rows } = await q(`SELECT COUNT(*)::int AS n FROM participants WHERE NOT is_test`);
  return rows[0]?.n ?? 0;
}

/** Save one field. `value === null` reverts to the code default. */
export async function setOverride(path, value, { version, participants }) {
  const before = overrides.get(path) ?? null;
  if (value === null) {
    await q(`DELETE FROM instrument_overrides WHERE path = $1`, [path]);
  } else {
    await q(
      `INSERT INTO instrument_overrides (path, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (path) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [path, value]
    );
  }
  await q(
    `INSERT INTO instrument_override_log (path, old_value, new_value, instrument_ver, participants)
     VALUES ($1,$2,$3,$4,$5)`,
    [path, before, value, version, participants]
  );
  return before;
}

export async function setVersion(version) {
  await q(
    `INSERT INTO instrument_overrides (path, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (path) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [VERSION_PATH, version]
  );
}

export async function overrideHistory(limit = 200) {
  const { rows } = await q(
    `SELECT path, old_value, new_value, instrument_ver, participants, at
       FROM instrument_override_log ORDER BY at DESC LIMIT $1`, [limit]
  );
  return rows;
}
