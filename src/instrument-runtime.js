/* =============================================================================
   The instrument as it is actually served.

   shared/instrument.js remains the source of truth for structure — item ids,
   types, option counts, the design, the answer keys. This module lays a thin
   sheet of *text* over it, edited from /preview and stored in the database, and
   every route that builds a plan goes through here so the questionnaire, the
   validation, the codebook and the preview cannot disagree about wording.

   What can be overridden is decided here, not by the caller: a path must
   already exist in the built plan, and only a string is ever replaced. An edit
   therefore cannot add an item, remove one, change a type, or change how many
   options something has — the shape of the data is fixed by the code.

   ---------------------------------------------------------------------------
   Draft and published are two different things.

   `instrument_overrides` is the draft: what the researcher is working on, what
   /preview renders, and what nobody taking the study ever sees. Editing it is
   free — no version prompt, no consequence, change your mind as often as you
   like.

   `instrument_published` is what participants are served, replaced wholesale by
   a publish so it is always one coherent set of wording rather than a
   half-finished one. Publishing is the act that changes the questionnaire, so
   publishing is what carries the version guard and the audit row.

   ---------------------------------------------------------------------------
   Every machine has to find out.

   The published set is cached in memory: it is read on every session start and
   every save, and re-reading it per request would be silly. But the app runs
   two machines behind Fly's proxy, so reloading only in the process that
   handled the publish left the other one serving the old questionnaire until
   its next restart — half the participants on wording nobody had approved.

   `instrument_publications.id` is the generation counter. Every machine polls
   that one integer and reloads only when it moves, so a publish anywhere
   reaches everywhere within one interval. Postgres LISTEN/NOTIFY would be the
   obvious mechanism and is deliberately not used: the connection string is a
   PgBouncer transaction-pooling URL, where a LISTEN does not outlive the
   statement that issued it.

   The counter only moves on a publish, so hand-editing `instrument_published`
   over psql will not be picked up. That is the intended trade: surgery in the
   database is an out-of-band act and should be followed by a restart.
   ========================================================================== */

import { q, withTx } from "./db.js";
import { config } from "./config.js";
import {
  buildPlan, planItems, planIndex, publicPlan,
  INSTRUMENT_VERSION, CONDITION_KEYS, ORDER_KEYS
} from "../shared/instrument.js";

/* What participants are served, and the generation it was read at. */
let published = new Map();
let publishedVersion = null;
let generation = 0;
let loadedAt = null;

/* An advisory-lock key, so two machines booting together cannot both decide
   they are the one that has to seed the first publication. */
const SEED_LOCK = 872_301_144;

/* Rows whose path starts `meta.` are bookkeeping, not questionnaire text. One
   exists in deployments that predate this file: `meta.instrument_version` held
   the version bump, which now lives on the publication row instead. It is
   filtered out rather than deleted — reading past a row costs nothing, and
   deleting someone's history to tidy up a namespace is not a trade worth
   making. */
const CONTENT_ONLY = `path NOT LIKE 'meta.%'`;

/* ------------------------------------------------------------------ loading */

async function readGeneration() {
  const { rows } = await q(`SELECT COALESCE(MAX(id), 0)::int AS gen FROM instrument_publications`);
  return rows[0]?.gen ?? 0;
}

/** Read the published wording into memory. Safe to call at any time. */
export async function loadOverrides(log) {
  try {
    /* One statement, and therefore one snapshot. The generation, the version
       and the rows have to agree with each other: read separately, a publish
       landing between two of them leaves this machine serving one wording
       under another wording's version label until the next poll corrects it,
       and a participant who started inside that window would be stamped with a
       version they were never shown. publishDraft commits all three parts
       together, so a single statement sees all of it or none of it. */
    const { rows } = await q(
      `SELECT p.id                  AS gen,
              p.instrument_ver      AS ver,
              (SELECT json_agg(json_build_array(path, value))
                 FROM instrument_published WHERE ${CONTENT_ONLY}) AS entries
         FROM instrument_publications p
        ORDER BY p.id DESC LIMIT 1`
    );
    const row = rows[0];
    const entries = Array.isArray(row?.entries) ? row.entries : [];
    published = new Map(entries);
    publishedVersion = row?.ver ?? null;
    generation = row?.gen ?? 0;
    loadedAt = new Date().toISOString();
    log?.info?.({ published: published.size, generation, version: currentVersion() },
      "published instrument loaded");
  } catch (err) {
    /* Falling back to the wording in code is only ever right before anything
       has been loaded — a missing table on a first boot is not a reason to
       refuse to serve the study. Once this machine is serving approved
       wording, a blip on a poll must leave it exactly where it is: replacing
       a published questionnaire with the one in the repository because a
       connection dropped for a second would be a silent, participant-visible
       change of the instrument. Stale is recoverable; wrong is not. */
    if (loadedAt) {
      log?.warn?.({ err: err.message, generation },
        "instrument reload failed, keeping the wording already loaded");
      return published;
    }
    log?.warn?.({ err: err.message }, "published instrument unavailable, serving the code instrument");
    published = new Map();
    publishedVersion = null;
  }
  return published;
}

/** Poll the generation counter so a publish on another machine lands here too. */
export function watchOverrides(log, intervalMs = config.instrumentPollMs) {
  if (!intervalMs) {
    log?.info?.("instrument polling disabled");
    return () => {};
  }
  /* setInterval does not wait for an async callback, so a slow database would
     otherwise stack reloads on top of each other. */
  let checking = false;
  const timer = setInterval(async () => {
    if (checking) return;
    checking = true;
    try {
      const gen = await readGeneration();
      if (gen === generation) return;
      log?.info?.({ from: generation, to: gen }, "instrument published elsewhere, reloading");
      await loadOverrides(log);
    } catch (err) {
      /* A blip here means this machine keeps serving the wording it already
         has, which is the safe failure: never an empty questionnaire. */
      log?.warn?.({ err: err.message }, "instrument generation check failed");
    } finally {
      checking = false;
    }
  }, intervalMs);
  timer.unref?.();                       // never hold the process open
  log?.info?.({ intervalMs }, "watching for published instrument changes");
  return () => clearInterval(timer);
}

/**
 * Give an existing deployment its first publication row.
 *
 * Without this, shipping the draft/publish split would empty the published set
 * on the first boot and every participant would quietly drop back to the
 * wording in code. Runs once: after it, the publications table is never empty.
 */
export async function ensureInitialPublication(log) {
  const seeded = await withTx(async client => {
    /* Cast explicitly: an untyped parameter leaves Postgres to choose between
       the bigint and the (int, int) forms of this function. Released at
       commit, which is what makes it safe under transaction pooling. */
    await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [SEED_LOCK]);
    const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM instrument_publications`);
    if (rows[0].n > 0) return false;

    await client.query(
      `INSERT INTO instrument_published (path, value)
       SELECT path, value FROM instrument_overrides WHERE ${CONTENT_ONLY}
       ON CONFLICT (path) DO NOTHING`
    );
    const { rows: verRows } = await client.query(
      `SELECT value FROM instrument_overrides WHERE path = 'meta.instrument_version'`
    );
    await client.query(
      `INSERT INTO instrument_publications (instrument_ver, paths, note)
       VALUES ($1, (SELECT COUNT(*) FROM instrument_published), $2)`,
      [verRows[0]?.value || INSTRUMENT_VERSION,
       "initial — the wording that was already live when publishing was introduced"]
    );
    return true;
  });
  if (seeded) log?.warn?.("seeded the first instrument publication from the existing overrides");
  return seeded;
}

export function currentVersion() { return publishedVersion || INSTRUMENT_VERSION; }
export function overrideCount()  { return published.size; }
export function overridesLoadedAt() { return loadedAt; }
export function overrideEntries()   { return [...published.entries()]; }
export function currentGeneration() { return generation; }

/** What /api/admin/instrument/status reports: is this machine up to date? */
export async function syncState() {
  let dbGeneration = null;
  try { dbGeneration = await readGeneration(); } catch { /* reported as unknown */ }
  return {
    machine: process.env.FLY_MACHINE_ID || process.env.HOSTNAME || "local",
    region: process.env.FLY_REGION || null,
    generation,
    dbGeneration,
    inSync: dbGeneration != null && dbGeneration === generation,
    loadedAt,
    publishedPaths: published.size,
    instrumentVersion: currentVersion(),
    pollMs: config.instrumentPollMs
  };
}

/* --------------------------------------------------------------- applying */

function walkItems(items, fn) {
  for (const it of items) {
    if (it.type === "matrix") { walkItems(it.rows, fn); continue; }
    fn(it);
  }
}

/** Replace text in a freshly built plan. buildPlan returns new objects every
    call, so this mutates nothing that is shared between participants. */
export function applyOverrides(plan, ov = published) {
  if (!ov.size) return plan;
  const g = p => ov.get(p);
  const who = plan.ctrl === "A" ? "ai" : "human";

  for (const page of plan.pages) {
    const title = g(`page.${page.key}.title`);
    if (title != null) page.title = title;
    const intro = g(`page.${page.key}.intro`);
    if (intro != null) page.intro = intro;

    if (page.info) {
      const lede = g("info.lede");
      if (lede != null) page.info.lede = lede;
      page.info.sections.forEach(s => {
        const h = g(`info.${s.key}.heading`); if (h != null) s.heading = h;
        const b = g(`info.${s.key}.body`);    if (b != null) s.body = b;
      });
    }

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

    if (page.matrixInstruction != null) {
      const mi = g(`page.${page.key}.matrixInstruction`);
      if (mi != null) page.matrixInstruction = mi;
    }
    /* Matrices only ever sit at the top level; their rows are the items. */
    for (const it of page.items) {
      if (it.type === "matrix" && it.instruction != null) {
        const v = g(`item.${it.id}.instruction`);      if (v != null) it.instruction = v;
      }
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
   and the value currently in force. Built by walking real plans, so a field can
   only appear here if it genuinely exists — the editor cannot invent a path,
   and a path that stops existing stops being offered.

   Option sets that are really data rather than wording — the 255-entry country
   list — are skipped: editing those one string at a time is not what this is
   for, and the stored value is the ISO code regardless.                       */

const OPTION_LIMIT = 12;

/**
 * The editable fields of one cell.
 * @param plan   an un-overridden plan: `default` has to be what the file says,
 *               or reverting would restore the last edit rather than the code.
 * @param values path -> current value, for whichever set is being edited.
 */
export function editableFieldsForPlan(plan, values = new Map()) {
  const out = [];
  const seen = new Set();
  const add = (path, label, group, def) => {
    if (seen.has(path)) return;
    seen.add(path);
    out.push({ path, label, group, default: def, value: values.get(path) ?? null });
  };
  const who = plan.ctrl === "A" ? "ai" : "human";

  for (const page of plan.pages) {
    add(`page.${page.key}.title`, `Page title — ${page.key}`, "Pages", page.title);
    if (page.intro != null) {
      add(`page.${page.key}.intro`, `Page intro — ${page.key}`, "Pages", page.intro);
    }

    if (page.info) {
      add("info.lede", "Opening paragraph", "Information page", page.info.lede);
      page.info.sections.forEach(s => {
        add(`info.${s.key}.heading`, `${s.heading} — heading`, "Information page", s.heading);
        add(`info.${s.key}.body`,    `${s.heading} — text`,    "Information page", s.body);
      });
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

    if (page.matrixInstruction != null) {
      add(`page.${page.key}.matrixInstruction`, `Instruction — ${page.key}`, "Pages", page.matrixInstruction);
    }
    for (const it of page.items) {
      if (it.type === "matrix" && it.instruction != null) {
        add(`item.${it.id}.instruction`, `${it.id} — instruction`, "Items", it.instruction);
      }
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
  return out;
}

/** Every editable field across every cell. */
export function editableFields(values = new Map()) {
  const seen = new Map();
  for (const cond of CONDITION_KEYS) {
    for (const order of ORDER_KEYS) {
      for (const f of editableFieldsForPlan(buildPlan(cond, order, true), values)) {
        if (!seen.has(f.path)) seen.set(f.path, f);
      }
    }
  }
  return [...seen.values()];
}

/* Which paths exist is a property of the code, not of the database, so the set
   is built once. It used to be rebuilt — all 42 plans — on every save. */
let editablePaths = null;
export function isEditable(path) {
  editablePaths ??= new Set(editableFields().map(f => f.path));
  return editablePaths.has(path);
}

/* ------------------------------------------------------------------ the draft */

export async function draftMap() {
  const { rows } = await q(`SELECT path, value FROM instrument_overrides WHERE ${CONTENT_ONLY}`);
  return new Map(rows.map(r => [r.path, r.value]));
}

/** A plan as the draft would render it — what /preview shows by default. */
export async function draftPlan(cond, order, optional) {
  return applyOverrides(buildPlan(cond, order, optional), await draftMap());
}

/** Paths where the draft and the published set disagree. */
export async function draftDiff() {
  const { rows } = await q(
    `SELECT COALESCE(d.path, p.path)     AS path,
            p.value                      AS published,
            d.value                      AS draft
       FROM (SELECT path, value FROM instrument_overrides WHERE ${CONTENT_ONLY}) d
       FULL OUTER JOIN instrument_published p ON p.path = d.path
      WHERE d.value IS DISTINCT FROM p.value
      ORDER BY 1`
  );
  return rows;
}

export async function nonTestParticipants() {
  const { rows } = await q(`SELECT COUNT(*)::int AS n FROM participants WHERE NOT is_test`);
  return rows[0]?.n ?? 0;
}

/** Save one field into the draft. `value === null` reverts to the code text. */
export async function setOverride(path, value, { version, participants }) {
  const { rows: prev } = await q(`SELECT value FROM instrument_overrides WHERE path = $1`, [path]);
  const before = prev[0]?.value ?? null;

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

/* ------------------------------------------------------------------ publishing */

/**
 * Make the draft the questionnaire. One transaction, so participants are never
 * served a half-applied set, and one new generation, so every other machine
 * picks it up on its next poll.
 */
export async function publishDraft({ version, participants, note }) {
  return withTx(async client => {
    await client.query(`DELETE FROM instrument_published`);
    await client.query(
      `INSERT INTO instrument_published (path, value)
       SELECT path, value FROM instrument_overrides WHERE ${CONTENT_ONLY}`
    );
    const { rows } = await client.query(
      `INSERT INTO instrument_publications (instrument_ver, paths, participants, note)
       VALUES ($1, (SELECT COUNT(*) FROM instrument_published), $2, $3)
       RETURNING id, at, instrument_ver, paths, participants, note`,
      [version, participants, note ?? null]
    );
    return rows[0];
  });
}

/** Throw the draft away and start again from what participants are seeing. */
export async function discardDraft() {
  return withTx(async client => {
    await client.query(`DELETE FROM instrument_overrides WHERE ${CONTENT_ONLY}`);
    const { rowCount } = await client.query(
      `INSERT INTO instrument_overrides (path, value, updated_at)
       SELECT path, value, now() FROM instrument_published`
    );
    return rowCount;
  });
}

export async function overrideHistory(limit = 200) {
  const { rows } = await q(
    `SELECT path, old_value, new_value, instrument_ver, participants, at
       FROM instrument_override_log ORDER BY at DESC LIMIT $1`, [limit]
  );
  return rows;
}

export async function publicationHistory(limit = 200) {
  const { rows } = await q(
    `SELECT id, instrument_ver, paths, participants, note, at
       FROM instrument_publications ORDER BY id DESC LIMIT $1`, [limit]
  );
  return rows;
}
