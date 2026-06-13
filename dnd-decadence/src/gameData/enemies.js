// ═══════════════════════════════════════════════════════════════
// ENEMIES — Phase 1 enemy roster.
// The Overfed Goblin Chief starts near tier 8 (Enormous, 560 lbs)
// so fattening her to Colossal (595 lbs = +35 lbs) is achievable in
// a single fight — showing the girth-defeat mechanic cleanly.
// ═══════════════════════════════════════════════════════════════
import { mod } from '../rules/dice.js';

export const ENEMY_DEFS = {
  overfed_goblin_chief: {
    id: 'overfed_goblin_chief',
    name: 'Overfed Goblin Chief',
    lbs: 560,
    maxHp: 45,
    ac: 9,
    stats: { STR: 14, DEX: 6, CON: 18, INT: 6, WIS: 8, CHA: 8 },
    attacks: [
      {
        id: 'gorge_slam',
        name: 'Gorge Slam',
        damageDice: '1d6+2',
        damageType: 'bludgeoning',
        fattenRange: [2, 5],
        saveType: 'CON',
        saveDC: 14,
        description: 'Slams you with her massive gut — 1d6+2 bludgeoning + CON save DC 14 or gain 2–5 lbs.',
      },
      {
        id: 'force_feed',
        name: 'Force Feed',
        fattenRange: [4, 8],
        saveType: 'CON',
        saveDC: 14,
        description: 'Shoves enchanted food into your mouth — CON save DC 14 or gain 4–8 lbs.',
      },
    ],
    ai: 'aggressive',
    xp: 200,
    flavor: 'Once a cunning raid leader, she discovered an enchanted feast-hall years ago and never left. She is enormous, aggressive, and surprisingly fast for her size — her bulk is a weapon.',
  },

  gluttony_imp: {
    id: 'gluttony_imp',
    name: 'Gluttony Imp',
    lbs: 90,
    maxHp: 22,
    ac: 12,
    stats: { STR: 6, DEX: 17, CON: 13, INT: 11, WIS: 10, CHA: 14 },
    attacks: [
      {
        id: 'tempting_morsel',
        name: 'Tempting Morsel',
        fattenRange: [2, 4],
        saveType: 'CON',
        saveDC: 11,
        description: 'Offers enchanted food — CON save DC 11 or gain 2–4 lbs.',
      },
    ],
    ai: 'harasser',
    xp: 50,
    flavor: 'A minor devil of gluttony, sent to fatten mortals for sport. Annoying, quick, and surprisingly persuasive about dessert.',
  },
};

export function instantiateEnemy(defId, overrides = {}) {
  const def = ENEMY_DEFS[defId];
  if (!def) throw new Error(`Unknown enemy: ${defId}`);
  const base = {
    ...def,
    hp: def.maxHp,
    conditions: [],
    corruption: 0,
    frenzyTier: 0,
    psych: { fixation: 0, obsession: 0, dependence: 0, shame: 0 },
    mood: 'hostile',
    isHero: false,
    isEnemy: true,
    // Spell save DC for enemy attacks
    get spellSaveDC() { return 8 + mod(this.stats.CON); },
  };
  return { ...base, ...overrides };
}
