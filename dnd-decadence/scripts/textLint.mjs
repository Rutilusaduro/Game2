#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// TEXT LINTER — static checks + dynamic render sweep for D&D scenes.
// Usage: node scripts/textLint.mjs
// Exit 1 if any errors found.
// ═══════════════════════════════════════════════════════════════

import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';

const ROOT = path.resolve(process.cwd());

// ── Dynamic import with Vite-style import.meta shim ──────────
// We need the engine and scenes loaded in Node — they use import.meta.env.DEV.
// Patch globalThis so the engine's DEV guard evaluates cleanly.

// Monkey-patch: inject a minimal import.meta.env for engine.js
// (engine.js guards: typeof import.meta !== 'undefined' && import.meta.env)
// In Node ESM this is fine — import.meta.env is undefined by default.

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }
function section(title) { console.log(`\n── ${title} ──`); }

// ── 1. Static checks on source files ─────────────────────────

import { readFileSync, readdirSync, existsSync } from 'fs';

section('Static file checks');

function checkFile(filePath, rules) {
  if (!existsSync(filePath)) { err(`Missing file: ${filePath}`); return; }
  const text = readFileSync(filePath, 'utf8');
  for (const { re, msg, required } of rules) {
    if (required && !re.test(text)) err(`${filePath}: ${msg}`);
  }
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`);
}

// Check scene files have wildcard fallbacks
const SCENE_DIR = path.join(ROOT, 'src/textEngine/scenes');
const sceneFiles = readdirSync(SCENE_DIR).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const sf of sceneFiles) {
  const fp = path.join(SCENE_DIR, sf);
  const text = readFileSync(fp, 'utf8');

  // Each registerPool call should have a { when: {}, ... } wildcard
  const poolCalls = text.match(/registerPool\(["'][^"']+["']/g) || [];
  for (const call of poolCalls) {
    const key = call.match(/["']([^"']+)["']\s*$/)?.[1];
    if (!key) continue;
    // Check there's a when:{} near this key in the file
    const keyIdx = text.indexOf(call);
    const relevant = text.slice(keyIdx, keyIdx + 8000);
    if (!relevant.includes('when: {}') && !relevant.includes("when:{}")) {
      warn(`${sf}: pool "${key}" may be missing wildcard fallback { when: {} }`);
    }
  }
  console.log(`  ✓ ${sf} (${poolCalls.length} pools)`);
}

// Check index barrel imports all scene files
const barrelPath = path.join(SCENE_DIR, 'index.js');
if (existsSync(barrelPath)) {
  const barrel = readFileSync(barrelPath, 'utf8');
  for (const sf of sceneFiles) {
    const name = sf.replace('.js', '');
    if (!barrel.includes(name)) err(`scenes/index.js missing import for ${sf}`);
  }
  console.log(`  ✓ scenes/index.js barrel`);
}

// ── 2. Dynamic render sweep ───────────────────────────────────

section('Dynamic render sweep');

// We'll do a Node-compatible import of the engine + scenes.
// Since these are ESM modules we import them dynamically.

async function runSweep() {
  // Load engine + all scenes
  const enginePath = pathToFileURL(path.join(ROOT, 'src/textEngine/engine.js')).href;
  const scenesPath = pathToFileURL(path.join(ROOT, 'src/textEngine/scenes/index.js')).href;
  const modulesPath = pathToFileURL(path.join(ROOT, 'src/textEngine/modules.js')).href;
  const lexiconPath = pathToFileURL(path.join(ROOT, 'src/textEngine/lexicon.js')).href;

  let engine, _scenes;
  try {
    engine = await import(enginePath);
    await import(lexiconPath);
    await import(modulesPath);
    _scenes = await import(scenesPath);
  } catch (e) {
    err(`Failed to import engine/scenes: ${e.message}`);
    return;
  }

  const { render, createContext, _registryEntries } = engine;
  const allModules = [..._registryEntries()].map(([k]) => k);
  console.log(`  Loaded ${allModules.length} modules.`);

  // D&D selector grid: class × girth tier × mood × encounter type
  const CLASSES = ['warlock', 'sorcerer', 'cleric'];
  const GIRTH_TIERS = [0, 2, 4, 6, 8, 10];
  const MOODS = ['hostile', 'neutral', 'frenzied'];
  const SPELL_IDS = ['eldritch_glut', 'hex_of_hunger', 'engorging_bolt', 'eldritch_gorge'];

  function makeCtx(classId, stage, mood, spellId) {
    return createContext({
      subject: { id: 'test_enemy', name: 'Test Foe', lbs: 80 + stage * 50, hp: 30, maxHp: 30, classId: null, mood, conditions: [] },
      ref: { id: 'hero', name: 'Hero', lbs: 130, classId, mood: 'neutral', conditions: [] },
      globals: { classId, spellId, spellLevel: 1, saveResult: 'fail' },
    });
  }

  const SCENE_POOLS = ['fb.preLine', 'fb.tierUp', 'fb.reaction', 'sc.cast', 'sc.impact', 'sc.miss', 'cb.enemyAttack', 'cb.victory', 'cb.defeat'];

  let ok = 0, fail = 0;

  for (const classId of CLASSES) {
    for (const stage of GIRTH_TIERS) {
      for (const mood of MOODS) {
        for (const spellId of SPELL_IDS) {
          const ctx = makeCtx(classId, stage, mood, spellId);
          for (const pool of SCENE_POOLS) {
            try {
              const result = render(`{${pool}}`, ctx);
              if (!result || result.trim().length < 5) {
                warn(`Empty render: {${pool}} @ class=${classId} stage=${stage} mood=${mood} spellId=${spellId}`);
                fail++;
              } else {
                ok++;
              }
            } catch (e) {
              err(`Render threw: {${pool}} @ class=${classId} stage=${stage}: ${e.message}`);
              fail++;
            }
          }
        }
      }
    }
  }

  console.log(`  Render sweep: ${ok} OK, ${fail} empty/failed`);
}

await runSweep().catch(e => err(`Sweep error: ${e.message}`));

// ── 3. Report ─────────────────────────────────────────────────

section('Results');

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  ⚠  ${w}`));
}

if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.log(`  ✗  ${e}`));
  process.exit(1);
} else {
  console.log(`\n✓ Text lint clean (${warnings.length} warnings).`);
}
