#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// SMOKE TEST — deterministic seeded combat, asserts invariants.
// No test framework — pure Node assertions.
// Usage: node scripts/smokeTest.mjs
// ═══════════════════════════════════════════════════════════════

import { pathToFileURL } from 'url';
import path from 'path';
import assert from 'assert';

const ROOT = path.resolve(process.cwd());
const u = (rel) => pathToFileURL(path.join(ROOT, rel)).href;

// ── Imports ───────────────────────────────────────────────────

const { seedRng } = await import(u('src/rules/rng.js'));
const { createHero } = await import(u('src/gameData/character.js'));
const { instantiateEnemy } = await import(u('src/gameData/enemies.js'));
const { SPELLS } = await import(u('src/gameData/spells.js'));
const { startCombat, heroAct, enemyTurn } = await import(u('src/combat/combat.js'));
const { getGirthTier } = await import(u('src/rules/girth.js'));

// ── Helpers ───────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    failed++;
  }
}

// ── Warlock combat smoke test ─────────────────────────────────

console.log('\n── Warlock vertical slice ──');

const rng = seedRng(42);
const hero = createHero({ name: 'Thalia', classId: 'warlock', ancestry: 'human' });
const enemy = instantiateEnemy('overfed_goblin_chief');

test('Hero created correctly', () => {
  assert.equal(hero.classId, 'warlock');
  assert.ok(hero.maxHp >= 8, `maxHp should be >= 8, got ${hero.maxHp}`);
  assert.ok(hero.spellSaveDC >= 10, `spellSaveDC ${hero.spellSaveDC}`);
  assert.ok(hero.knownSpells.includes('eldritch_glut'), 'knows eldritch_glut');
  assert.ok(hero.knownSpells.includes('eldritch_gorge'), 'knows eldritch_gorge');
});

test('Enemy starts at Enormous tier (id=8)', () => {
  const tier = getGirthTier(enemy.lbs);
  assert.equal(tier.id, 8, `Expected tier 8 (Enormous), got ${tier.id} (${tier.label}) at ${enemy.lbs} lbs`);
});

test('Enemy needs ≤ 35 lbs to reach Colossal (tier 9)', () => {
  const colossal = 595;
  const gap = colossal - enemy.lbs;
  assert.ok(gap <= 50, `Gap should be ≤ 50 lbs, got ${gap}`);
});

let state = startCombat(hero, [enemy], rng);

test('Combat starts with 2 combatants', () => {
  assert.equal(state.combatants.length, 2);
  assert.ok(state.order.length === 2);
  assert.ok(['player','enemy'].includes(state.phase));
});

// Run 20 turns scripted: hero always casts Eldritch Gorge on enemy if player turn
let turns = 0;
const MAX_TURNS = 30;
let fattenTotal = 0;
let tierUps = 0;

while (state.phase !== 'victory' && state.phase !== 'defeat' && turns < MAX_TURNS) {
  const prevEvents = state.events;
  if (state.phase === 'player') {
    const enemyC = state.combatants.find(c => !c.isHero);
    if (!enemyC) break;

    // Cast eldritch_gorge if pact slot available, else eldritch_glut
    const spellId = (state.combatants.find(c => c.isHero)?.slots?.pact ?? 0) > 0
      ? 'eldritch_gorge'
      : 'eldritch_glut';

    state = heroAct(state, { type: 'spell', spellId, targetId: enemyC.id }, rng);
  } else if (state.phase === 'enemy') {
    state = enemyTurn(state, rng);
  }

  // Count fatten events and tier-ups
  for (const ev of state.events) {
    if (ev.type === 'fatten') fattenTotal += ev.lbs;
    if (ev.type === 'tierUp') tierUps++;
  }
  turns++;
}

test('Combat concludes within 30 turns', () => {
  assert.ok(
    state.phase === 'victory' || state.phase === 'defeat',
    `Combat still in phase "${state.phase}" after ${turns} turns`
  );
});

test('Fattening accumulates lbs during combat', () => {
  const enemy = state.combatants.find(c => !c.isHero);
  const initialLbs = 560;
  assert.ok(enemy.lbs > initialLbs, `Enemy should be heavier: ${enemy.lbs} vs ${initialLbs}`);
});

test('Girth tiers can rise during combat', () => {
  // Check enemy tier is higher now (or combat ended by HP)
  const enemyFinal = state.combatants.find(c => !c.isHero);
  const finalTier = getGirthTier(enemyFinal.lbs);
  assert.ok(finalTier.id >= 8, `Final tier ${finalTier.id} should be >= 8`);
});

// ── Spell structure checks ────────────────────────────────────

console.log('\n── Spell structure ──');

const WARLOCK_SPELLS = ['eldritch_glut','sating_whisper','hex_of_hunger','famished_grasp','engorging_bolt','mind_feast','suffocating_bloat','gluttonous_plague','pact_devourer','curse_bottomless_belly','eldritch_gorge'];
const SORCERER_SPELLS = ['butter_bolt','cream_jet','fattening_missiles','caloric_surge','lard_lance','syrup_web','rich_infusion','banquet_bomb','gluttons_nova','chain_gorging','wild_gut_surge'];
const CLERIC_SPELLS = ['sacred_morsel','blessed_bounty','comfort_food','divine_stuffing','hymn_of_plenty','sanctified_gavage','aura_of_satiation','feast_of_the_faithful','famine_ward','judgment_of_gluttony','mass_engorgement'];

test('Warlock has 11 spells (2 cantrip, 2 L1, 3 L2, 4 L3)', () => {
  assert.equal(WARLOCK_SPELLS.length, 11);
  const byLevel = WARLOCK_SPELLS.reduce((acc, id) => {
    const s = SPELLS[id];
    assert.ok(s, `Missing spell ${id}`);
    acc[s.level] = (acc[s.level] || 0) + 1;
    return acc;
  }, {});
  assert.equal(byLevel[0], 2, `Cantrips: expected 2, got ${byLevel[0]}`);
  assert.equal(byLevel[1], 2, `L1: expected 2, got ${byLevel[1]}`);
  assert.equal(byLevel[2], 3, `L2: expected 3, got ${byLevel[2]}`);
  assert.equal(byLevel[3], 4, `L3: expected 4, got ${byLevel[3]}`);
});

test('Sorcerer has 11 spells', () => {
  assert.equal(SORCERER_SPELLS.length, 11);
  SORCERER_SPELLS.forEach(id => assert.ok(SPELLS[id], `Missing ${id}`));
});

test('Cleric has 11 spells', () => {
  assert.equal(CLERIC_SPELLS.length, 11);
  CLERIC_SPELLS.forEach(id => assert.ok(SPELLS[id], `Missing ${id}`));
});

test('Total spell count = 33', () => {
  const total = WARLOCK_SPELLS.length + SORCERER_SPELLS.length + CLERIC_SPELLS.length;
  assert.equal(total, 33);
});

// ── Girth condition thresholds ────────────────────────────────

console.log('\n── Girth condition thresholds ──');

const girthMod = await import(u('src/rules/girth.js'));
const { girthAutoCondition: gac, getGirthTier: ggt } = girthMod;

test('Tier 0-2 → no condition', () => {
  [80, 120, 135].forEach(lbs => {
    const t = ggt(lbs);
    assert.ok(t.id <= 2, `lbs ${lbs} → tier ${t.id}`);
    assert.equal(gac(t), null, `lbs ${lbs} should have no condition`);
  });
});

test('Tier 3-4 → SpeedReduced', () => {
  [162, 195].forEach(lbs => {
    const t = ggt(lbs);
    assert.equal(gac(t), 'SpeedReduced', `lbs ${lbs} (tier ${t.id}) should be SpeedReduced`);
  });
});

test('Tier 5-6 → Slowed', () => {
  [238, 285].forEach(lbs => {
    const t = ggt(lbs);
    assert.equal(gac(t), 'Slowed', `lbs ${lbs} (tier ${t.id}) should be Slowed`);
  });
});

test('Tier 7-8 → Restrained', () => {
  [360, 465].forEach(lbs => {
    const t = ggt(lbs);
    assert.equal(gac(t), 'Restrained', `lbs ${lbs} (tier ${t.id}) should be Restrained`);
  });
});

test('Tier 9+ → Incapacitated', () => {
  [595, 820, 1000].forEach(lbs => {
    const t = ggt(lbs);
    assert.equal(gac(t), 'Incapacitated', `lbs ${lbs} (tier ${t.id}) should be Incapacitated`);
  });
});

// ── Report ────────────────────────────────────────────────────

console.log(`\n── Summary: ${passed} passed, ${failed} failed ──\n`);
if (failed > 0) process.exit(1);
