// ═══════════════════════════════════════════════════════════════
// CORRUPTION — verbatim from gameData/corruption.js
// In D&D context: tracks how "broken in" an enemy is to their
// own gluttony, or how far a hero has fallen to eldritch appetite.
// ═══════════════════════════════════════════════════════════════

export const CORRUPTION_CONFIG = {
  max: 100,
  perForceFeed: 2,
  perStuffedWeek: 1,
  perStageUp: 3,
  resistancePerPoint: 0.003,
  tier2AutoLbs: [0, 2],
  tier3AutoLbs: [1, 4],
  tier3SelfStuffChance: 0.35,
  dialogueChance: 0.45,
  revealRelationship: 55,
};

export const CORRUPTION_TIERS = [
  { id: 0, min: 0,  label: "Hesitant",   color: "#7a8a9a" },
  { id: 1, min: 34, label: "Conflicted", color: "#c8860a" },
  { id: 2, min: 67, label: "Broken In",  color: "#c03050" },
];

export const getCorruptionTier = (c = 0) =>
  [...CORRUPTION_TIERS].reverse().find(t => c >= t.min) || CORRUPTION_TIERS[0];
