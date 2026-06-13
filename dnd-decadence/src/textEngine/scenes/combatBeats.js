// ═══════════════════════════════════════════════════════════════
// SCENE: COMBAT BEATS — hit/miss/finisher, enemy action prose,
// foe reactions by girth tier.
// ═══════════════════════════════════════════════════════════════
import { registerPool, createContext, render } from '../engine.js';
import '../modules.js';

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: cb.enemyAttack — enemy strikes the hero
// ╚══════════════════════════════════════════════════════════════
registerPool("cb.enemyAttack", [
  { when: { stageMin: 7 }, text: [
    "{subject.name} hurls her enormous body at you — slow but devastating.",
    "{subject.name} slams into you with the momentum of her considerable mass.",
  ]},
  { when: { stageMin: 5 }, text: [
    "{subject.name} swings at you with heavy, weighty force.",
    "{subject.name} lashes out, bulk behind every swing.",
    "{subject.name} thunders forward, heavy and furious.",
  ]},
  { when: { stageMin: 3 }, text: [
    "{subject.name} strikes with surprising force for her size.",
    "{subject.name} attacks — thicker than before but still fast.",
  ]},
  { when: {}, text: [
    "{subject.name} attacks.",
    "{subject.name} lunges at you.",
    "{subject.name} strikes.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: cb.enemyFatten — enemy fattens the hero
// ╚══════════════════════════════════════════════════════════════
registerPool("cb.enemyFatten", [
  { when: {}, text: [
    "{subject.name} forces something rich and sweet into your mouth — you feel it take hold immediately.",
    "A wave of enchanted excess washes over you from {subject.name}'s attack.",
    "{subject.name}'s attack carries a fattening curse — you feel heavier already.",
    "Enchanted food flies from {subject.name}'s hands and hits you — irresistibly, impossibly delicious.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: cb.heroFattenReact — hero's reaction to being fattened
// ╚══════════════════════════════════════════════════════════════
registerPool("cb.heroFattenReact", [
  { when: { stageMin: 7 }, text: [
    "You feel your movement narrow — enormous now, the fight growing precarious.",
    "You're vast. That's not a metaphor. Your body has grown past easy combat.",
  ]},
  { when: { stageMin: 5 }, text: [
    "You feel genuinely heavier — slowed, weighted, the armor fitting differently.",
    "The fattening magic settles into you and your gait changes immediately.",
  ]},
  { when: {}, text: [
    "You feel it — new mass, immediately real, the spell's effect undeniable.",
    "You're heavier than you were a moment ago. That's going to matter.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: cb.victory — hero wins the fight
// ╚══════════════════════════════════════════════════════════════
registerPool("cb.victory", [
  { when: { classId: 'warlock' }, text: [
    "The Maw is satisfied. Your enemy lies defeated — by the dark patron's hunger.",
    "The pact has been honored. {subject.name} is incapacitated, overfed and undone.",
    "Eldritch appetite wins. The fight is over.",
  ]},
  { when: { classId: 'sorcerer' }, text: [
    "Chaotic excess wins the day — {subject.name} defeated, bloated, unable to continue.",
    "Wild magic did what it does best: turned someone much larger and much less dangerous.",
    "The bloodline burns bright. {subject.name} is finished.",
  ]},
  { when: { classId: 'cleric' }, text: [
    "The Eternal Feast has blessed this battle's end. {subject.name} is too full to fight.",
    "Sacred bounty has overwhelmed the enemy. Praise the goddess — and the fattening.",
    "Your deity's generosity has won the day. {subject.name} cannot rise.",
  ]},
  { when: {}, text: [
    "The enemy falls — defeated, incapacitated, too vast to continue.",
    "Victory. {subject.name} is gone or helpless.",
    "The fight ends. You stand. {subject.name} does not.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: cb.defeat — hero falls
// ╚══════════════════════════════════════════════════════════════
registerPool("cb.defeat", [
  { when: { stageMin: 7 }, text: [
    "You are too large to fight, too fattened to flee. The dungeon has won — for now.",
    "Your own enormous body pins you in place. You've been outplayed.",
    "Vast, incapacitated, and defeated — the enemy smiles down at you.",
  ]},
  { when: {}, text: [
    "You fall — wounded, overfed, or both. The dungeon claims this round.",
    "Defeat. You'll have to withdraw and recover.",
    "The fight is over. You lost. The enemy stands over you, victorious.",
  ]},
]);

// ── Render helpers ────────────────────────────────────────────

export function renderEnemyAttack(enemy, hero) {
  return render("{cb.enemyAttack}", createContext({ subject: enemy, ref: hero }));
}

export function renderEnemyFatten(enemy, hero) {
  return render("{cb.enemyFatten}", createContext({ subject: enemy, ref: hero }));
}

export function renderHeroFattenReact(hero) {
  return render("{cb.heroFattenReact}", createContext({ subject: hero }));
}

export function renderVictory(hero, enemy) {
  return render("{cb.victory}", createContext({
    subject: enemy,
    ref: hero,
    globals: { classId: hero?.classId || null },
  }));
}

export function renderDefeat(hero) {
  return render("{cb.defeat}", createContext({ subject: hero }));
}
