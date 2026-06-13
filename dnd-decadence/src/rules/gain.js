// ═══════════════════════════════════════════════════════════════
// GAIN — calorie/weight math. In combat, lbs are added directly.
// Ported from gameData/gainSystem.js; weekly calorie model stripped.
// ═══════════════════════════════════════════════════════════════

export const GAIN_CONFIG = {
  calsPerLb: 3500,
  baseCapacity: 100,
};

export const calsToLbs = (cals) => cals / GAIN_CONFIG.calsPerLb;

// Apply direct lbs to a character; returns updated lbs value.
export function applyLbs(character, lbs) {
  return Math.max(0, (character.lbs || 100) + lbs);
}
