// ═══════════════════════════════════════════════════════════════
// CLASSES — Warlock, Sorcerer, Cleric base definitions.
// Phase 1 fully wires Warlock; others stubbed for Phase 3.
// ═══════════════════════════════════════════════════════════════
import { CLASS_SPELLS } from './spells.js';

export const CLASSES = {
  warlock: {
    id: 'warlock',
    name: 'Warlock',
    subclass: 'Pact of the Endless Maw',
    castingStat: 'CHA',
    baseHp: 8,
    hpPerLevel: 5,
    profBonus: 2,
    stats: { STR: 10, DEX: 12, CON: 13, INT: 11, WIS: 10, CHA: 16 },
    // Pact slots (not traditional slots): refresh on short rest
    slots: { pact: 2 },
    cantripsKnown: 2,
    spellsKnown: 3,
    allSpells: CLASS_SPELLS.warlock,
    startingSpells: ['eldritch_glut','sating_whisper','hex_of_hunger','engorging_bolt','eldritch_gorge'],
    flavor: 'Your patron is the Endless Maw — a void of insatiable appetite that grants power in exchange for feeding it vicariously through your victims.',
    voice: 'Eldritch dread + cursed hunger. Spare no horror for what the Maw demands.',
  },
  sorcerer: {
    id: 'sorcerer',
    name: 'Sorcerer',
    subclass: 'Gourmand Bloodline',
    castingStat: 'CHA',
    baseHp: 6,
    hpPerLevel: 4,
    profBonus: 2,
    stats: { STR: 9, DEX: 14, CON: 12, INT: 12, WIS: 10, CHA: 17 },
    slots: { 1: 2, 2: 1, 3: 0 },
    sorceryPoints: 2,
    allSpells: CLASS_SPELLS.sorcerer,
    startingSpells: ['butter_bolt','cream_jet','fattening_missiles','lard_lance','banquet_bomb'],
    flavor: 'Your bloodline runs thick with Gourmand magic — wild, overflowing, and impossible to fully control.',
    voice: 'Chaotic and messy. More excess than precision. Comedy welcome; things go wrong in spectacular ways.',
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    subclass: 'Domain of the Eternal Feast',
    castingStat: 'WIS',
    baseHp: 8,
    hpPerLevel: 5,
    profBonus: 2,
    stats: { STR: 13, DEX: 10, CON: 14, INT: 10, WIS: 16, CHA: 12 },
    slots: { 1: 2, 2: 1, 3: 0 },
    channelDivinity: 1,
    allSpells: CLASS_SPELLS.cleric,
    startingSpells: ['sacred_morsel','blessed_bounty','comfort_food','divine_stuffing','sanctified_gavage'],
    flavor: 'You serve the Eternal Feast, a goddess of boundless abundance who blesses the overfed and fattens her enemies with divine excess.',
    voice: 'Blissful, devotional, sacred. The fattening is a gift. The gorging is prayer.',
  },
};

export function getClass(classId) {
  return CLASSES[classId] || CLASSES.warlock;
}
