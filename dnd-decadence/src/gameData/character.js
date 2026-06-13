// ═══════════════════════════════════════════════════════════════
// CHARACTER — hero creation and stat derivation.
// ═══════════════════════════════════════════════════════════════
import { getClass } from './classes.js';
import { mod } from '../rules/dice.js';
import { initPsychState } from '../rules/psychState.js';

export const ANCESTRIES = [
  { id: 'human',    name: 'Human',    bonusCon: 1, bonusCha: 0, flavor: '+1 CON, +1 to all saves' },
  { id: 'halfling', name: 'Halfling', bonusCon: 0, bonusCha: 1, flavor: '+1 CHA, luck reroll once/day' },
  { id: 'tiefling', name: 'Tiefling', bonusCon: 0, bonusCha: 2, flavor: '+2 CHA, dark vision, fire resist' },
  { id: 'dwarf',    name: 'Dwarf',    bonusCon: 2, bonusCha: 0, flavor: '+2 CON, stonecunning, dwarven resilience' },
];

export function createHero({ name, classId, ancestry = 'human' }) {
  const cls = getClass(classId);
  const anc = ANCESTRIES.find(a => a.id === ancestry) || ANCESTRIES[0];

  // Apply ancestry bonuses to stats
  const stats = {
    ...cls.stats,
    CON: cls.stats.CON + (anc.bonusCon || 0),
    CHA: cls.stats.CHA + (anc.bonusCha || 0),
  };

  const castMod = mod(stats[cls.castingStat] ?? 10);
  const maxHp = cls.baseHp + mod(stats.CON);
  const spellSaveDC = 8 + cls.profBonus + castMod;
  const spellAtk = cls.profBonus + castMod;

  return {
    id: 'hero',
    name,
    classId,
    ancestry,
    level: 1,
    // HP
    maxHp,
    hp: maxHp,
    // Girth
    lbs: 130,
    // Stats
    stats,
    // Spellcasting
    spellSaveDC,
    spellAtk,
    castMod,
    profBonus: cls.profBonus,
    // Spell slots / pact slots
    slots: { ...cls.slots },
    maxSlots: { ...cls.slots },
    sorceryPoints: cls.sorceryPoints || 0,
    channelDivinity: cls.channelDivinity || 0,
    knownSpells: [...cls.startingSpells],
    // Conditions
    conditions: [],
    activeBuffs: [],
    corruption: 0,
    psych: initPsychState(),
    frenzyTier: 0,
    hungerTier: 0,
    addictionLevel: 0,
    mood: 'neutral',
    isHero: true,
    isEnemy: false,
    xp: 0,
  };
}

export function heroSpellSaveDC(hero) {
  return hero.spellSaveDC ?? (8 + hero.profBonus + hero.castMod);
}

export function heroSpellAtk(hero) {
  return hero.spellAtk ?? (hero.profBonus + hero.castMod);
}

// Returns spells the hero can currently cast (has slot/pact available).
export function castableSpells(hero, spellsData) {
  return hero.knownSpells.filter(id => {
    const s = spellsData[id];
    if (!s) return false;
    if (s.level === 0) return true;
    if (hero.classId === 'warlock') return (hero.slots.pact ?? 0) > 0;
    return (hero.slots[s.level] ?? 0) > 0;
  });
}

// Consume a spell slot after casting.
export function consumeSlot(hero, spellLevel) {
  if (spellLevel === 0) return hero;
  const slots = { ...hero.slots };
  if (hero.classId === 'warlock') {
    slots.pact = Math.max(0, (slots.pact ?? 0) - 1);
  } else {
    slots[spellLevel] = Math.max(0, (slots[spellLevel] ?? 0) - 1);
  }
  return { ...hero, slots };
}
