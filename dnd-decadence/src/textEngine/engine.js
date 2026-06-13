// ═══════════════════════════════════════════════════════════════
// MODULAR TEXT ENGINE — core resolver (ported from sim).
// deriveFor() rewritten for D&D characters; all other logic verbatim.
// ═══════════════════════════════════════════════════════════════
import { getGirthTier } from '../rules/girth.js';
import { getCorruptionTier } from '../rules/corruption.js';
import { getAddictionLevel, getHungerTier, isInWithdrawal } from '../rules/appetite.js';
import { getFixationTier, getObsessionTier, getDependenceTier, getShameTier } from '../rules/psychState.js';

const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
const warn = (...args) => { if (DEV) console.warn('[textEngine]', ...args); };

// ── helpers ───────────────────────────────────────────────────

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function weightedPick(entries) {
  let total = 0;
  for (const e of entries) total += e.w;
  if (total <= 0) return entries.length ? entries[0].item : undefined;
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.w;
    if (roll <= 0) return e.item;
  }
  return entries[entries.length - 1].item;
}

export function relSize(subject, ref) {
  if (!subject || !ref || !ref.lbs) return null;
  const r = subject.lbs / ref.lbs;
  if (r < 0.6)   return "much_smaller";
  if (r < 0.85)  return "smaller";
  if (r <= 1.18) return "similar";
  if (r <= 1.67) return "larger";
  return "much_larger";
}

export const STAGE_KEYS = [
  "slight","slim","soft","chubby","plump","heavy",
  "fat","veryFat","enormous","colossal","blob","leviathan",
];

export function stageBucket(stageId) {
  return STAGE_KEYS[Math.min(Math.max(0, stageId ?? 0), STAGE_KEYS.length - 1)];
}

// ── context ───────────────────────────────────────────────────

// D&D deriveFor: character has classId, ancestry, level, conditions, etc.
function deriveFor(character, ref, effects) {
  if (!character) return {};
  const gt = getGirthTier(character.lbs || 100);
  return {
    // Core girth (same key as original — all stageMin/Max selectors work)
    stage: gt.id,
    mood: character.mood || null,
    // D&D identity
    characterId: character.id ?? null,
    classId: character.classId || null,
    ancestry: character.ancestry || null,
    level: character.level || 1,
    // Combat state
    frenzyTier: character.frenzyTier || 0,
    hpBand: hpBand(character),
    // Corruption / psych (re-used)
    corruption: getCorruptionTier(character.corruption || 0).id,
    bodyType: character.bodyType || null,
    relSize: ref ? relSize(character, ref) : null,
    refStage: ref ? getGirthTier(ref.lbs || 100).id : null,
    // Psych tiers
    fixationTier:   getFixationTier(character.psych?.fixation ?? 0).id,
    obsessionTier:  getObsessionTier(character.psych?.obsession ?? 0).id,
    dependenceTier: getDependenceTier(character.psych?.dependence ?? 0).id,
    shameTier:      getShameTier(character.psych?.shame ?? 0).id,
    // Appetite (frenzy/bloodlust)
    addictionLevel: getAddictionLevel(character),
    hungerTier:     getHungerTier(character),
    inWithdrawal:   isInWithdrawal(character),
    // Pass-through for spell prose
    effects: effects || {},
  };
}

function hpBand(character) {
  if (!character?.maxHp) return 'full';
  const ratio = (character.hp ?? character.maxHp) / character.maxHp;
  if (ratio > 0.66) return 'full';
  if (ratio > 0.33) return 'bloodied';
  return 'low';
}

export function createContext(raw = {}) {
  const { subject = null, ref = null, group = null, effects = {}, globals = {} } = raw;
  return { subject, ref, group, effects, globals, d: deriveFor(subject, ref, effects) };
}

function retarget(ctx, who) {
  if (who === "ref" && ctx.ref)
    return { ...ctx, subject: ctx.ref, ref: ctx.subject, d: deriveFor(ctx.ref, ctx.subject, ctx.effects) };
  if (who === "group" && ctx.group?.length) {
    const proxy = ctx.group[0];
    return { ...ctx, subject: proxy, d: deriveFor(proxy, ctx.ref, ctx.effects) };
  }
  return ctx;
}

// ── module registry ───────────────────────────────────────────

const REGISTRY = new Map();
const MODULE_OPTS = new Map();

export function registerModule(key, variants, opts = {}) {
  if (key === "join") { warn(`"join" is reserved`); return; }
  if (REGISTRY.has(key)) warn(`module "${key}" re-registered`);
  REGISTRY.set(key, Array.isArray(variants) ? variants : [variants]);
  MODULE_OPTS.set(key, opts);
}

export function registerPool(key, variants, opts = {}) {
  registerModule(key, variants, { select: 'pool', ...opts });
}

export function registerModuleVariants(key, variants) {
  const extra = Array.isArray(variants) ? variants : [variants];
  const existing = REGISTRY.get(key) || [];
  REGISTRY.set(key, [...extra, ...existing]);
}

export function hasModule(key) { return REGISTRY.has(key); }
export function _registryEntries() { return [...REGISTRY.entries()]; }
export function _moduleOpts(key) { return MODULE_OPTS.get(key) || {}; }

// ── selector resolution ───────────────────────────────────────

function evalWhen(when, ctx) {
  if (!when || Object.keys(when).length === 0) return { match: true, score: 0 };
  const d = ctx.d || {};
  let score = 0;
  let rangeCounted = false;

  for (const [k, v] of Object.entries(when)) {
    let ok;
    switch (k) {
      case "stageMin": ok = d.stage != null && d.stage >= v; break;
      case "stageMax": ok = d.stage != null && d.stage <= v; break;
      // D&D aliases
      case "girthMin": ok = d.stage != null && d.stage >= v; break;
      case "girthMax": ok = d.stage != null && d.stage <= v; break;
      case "levelMin": ok = (d.level ?? 1) >= v; break;
      case "levelMax": ok = (d.level ?? 1) <= v; break;
      case "frenzyTierMin": ok = (d.frenzyTier ?? 0) >= v; break;
      case "frenzyTierMax": ok = (d.frenzyTier ?? 0) <= v; break;
      case "hungerTierMin": ok = (d.hungerTier ?? 0) >= v; break;
      case "hungerTierMax": ok = (d.hungerTier ?? 0) <= v; break;
      case "addictionLevelMin": ok = (d.addictionLevel ?? 0) >= v; break;
      case "fixationTierMin": ok = (d.fixationTier ?? 0) >= v; break;
      case "obsessionTierMin": ok = (d.obsessionTier ?? 0) >= v; break;
      case "dependenceTierMin": ok = (d.dependenceTier ?? 0) >= v; break;
      case "shameTierMin": ok = (d.shameTier ?? 0) >= v; break;
      case "conditionHas": {
        const conds = d.conditions ?? ctx.globals?.conditions ?? [];
        ok = conds.includes(v);
        break;
      }
      default: {
        const actual = d[k] ?? ctx.globals?.[k];
        ok = Array.isArray(v) ? v.includes(actual) : actual === v;
      }
    }
    if (!ok) return { match: false, score: 0 };
    if (k === "stageMin" || k === "stageMax" || k === "girthMin" || k === "girthMax" ||
        k === "levelMin" || k === "levelMax") {
      if (!rangeCounted) { score += 1; rangeCounted = true; }
    } else {
      score += 1;
    }
  }
  return { match: true, score };
}

function resolveChosen(variant, ctx) {
  const t = variant.text;
  const chosen = Array.isArray(t) ? pick(t) : t;
  return typeof chosen === "function" ? (chosen(ctx) ?? "") : (chosen ?? "");
}

function selectVariant(key, ctx) {
  const variants = REGISTRY.get(key);
  if (!variants) { warn(`unknown module "${key}"`); return ""; }
  const opts = MODULE_OPTS.get(key) || {};

  if (opts.select === 'pool') {
    const matches = [];
    let maxPriority = -Infinity;
    for (const variant of variants) {
      const { match, score } = evalWhen(variant.when, ctx);
      if (!match) continue;
      const priority = variant.priority || 0;
      if (priority > maxPriority) maxPriority = priority;
      matches.push({ variant, score, priority });
    }
    const eligible = matches.filter(m => m.priority === maxPriority);
    if (!eligible.length) return "";
    const base = opts.poolBase ?? 3;
    const entries = eligible.map(m => ({ item: m.variant, w: (m.variant.weight ?? 1) * Math.pow(base, m.score) })).filter(e => e.w > 0);
    if (!entries.length) return "";
    return resolveChosen(weightedPick(entries), ctx);
  }

  let best = [], bestScore = -1, bestPriority = -Infinity;
  for (const variant of variants) {
    const { match, score } = evalWhen(variant.when, ctx);
    if (!match) continue;
    const priority = variant.priority || 0;
    if (score > bestScore || (score === bestScore && priority > bestPriority)) {
      best = [variant]; bestScore = score; bestPriority = priority;
    } else if (score === bestScore && priority === bestPriority) {
      best.push(variant);
    }
  }
  if (!best.length) return "";
  const entries = [];
  for (const variant of best) {
    const w = variant.weight ?? 1;
    if (w <= 0) continue;
    const t = variant.text;
    if (Array.isArray(t)) for (const text of t) entries.push({ item: text, w });
    else entries.push({ item: t, w });
  }
  if (!entries.length) return "";
  const chosen = weightedPick(entries);
  return typeof chosen === "function" ? (chosen(ctx) ?? "") : (chosen ?? "");
}

// ── filters ───────────────────────────────────────────────────

function applyFilters(text, filters) {
  let out = text;
  for (const f of filters) {
    if (f === "cap")          out = out ? out.charAt(0).toUpperCase() + out.slice(1) : out;
    else if (f === "lower")   out = out.toLowerCase();
    else if (f === "a")       out = out ? (/^[aeiou]/i.test(out) ? "an " : "a ") + out : out;
    else if (f.startsWith("prefix:")) out = out ? f.slice(7) + out : out;
    else if (f.startsWith("suffix:")) out = out ? out + f.slice(7) : out;
    else warn(`unknown filter "${f}"`);
  }
  return out;
}

// ── template resolution ───────────────────────────────────────

const SLOT_RE = /\{([a-zA-Z][\w.]*)(?::([^|}]*))?((?:\|[^}]*)?)\}/g;
const ESCAPE_TOKEN = "";
const MAX_DEPTH = 5;

function resolveSlot(name, slotCtx, depth, trace) {
  const raw = String(selectVariant(name, slotCtx));
  let leaf = true;
  SLOT_RE.lastIndex = 0;
  let m;
  while ((m = SLOT_RE.exec(raw))) {
    if (!m[1].startsWith("subject.")) { leaf = false; break; }
  }
  const out = resolveText(raw, slotCtx, depth + 1, trace);
  if (trace && out.trim()) trace.push({ key: name, text: out.trim(), leaf, depth });
  return out;
}

function resolveText(text, ctx, depth, trace) {
  if (depth >= MAX_DEPTH) {
    SLOT_RE.lastIndex = 0;
    if (SLOT_RE.test(text)) {
      warn("max recursion depth; stripping slots");
      SLOT_RE.lastIndex = 0;
      text = text.replace(SLOT_RE, "");
    }
    return text;
  }
  SLOT_RE.lastIndex = 0;
  return text.replace(SLOT_RE, (_, name, arg, filterStr) => {
    const filters = filterStr ? filterStr.split("|").filter(Boolean) : [];

    if (name === "join") {
      const parts = (arg || "").split(",").map(k => k.trim()).filter(Boolean)
        .map(k => resolveSlot(k, ctx, depth, trace).trim()).filter(Boolean);
      const out = parts.length <= 1 ? (parts[0] || "")
        : parts.length === 2 ? `${parts[0]} and ${parts[1]}`
        : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
      return applyFilters(out, filters);
    }

    let slotCtx = ctx;
    if (arg === "ref" || arg === "group") slotCtx = retarget(ctx, arg);
    else if (arg) slotCtx = { ...ctx, arg };
    return applyFilters(resolveSlot(name, slotCtx, depth, trace), filters);
  });
}

function smooth(text) {
  return text
    .replace(/ {2,}/g, " ")
    .replace(/ ([.,!?;:])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .replace(/(^|[.!?] )([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase())
    .trim();
}

export function render(template, ctx, opts = {}) {
  let text = String(template).replace(/\{\{/g, ESCAPE_TOKEN);
  text = resolveText(text, ctx, 0, opts.trace || null);
  text = text.replace(new RegExp(ESCAPE_TOKEN, "g"), "{");
  return opts.noSmooth ? text : smooth(text);
}
