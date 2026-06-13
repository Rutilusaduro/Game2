// ═══════════════════════════════════════════════════════════════
// APPETITE — frenzy/bloodlust meter repurposed from hungerAddiction.js.
// Skill tree & talkSystem imports dropped; getHungerModifiers replaced
// with plain effects={} param. Tracks combat frenzy on enemies and
// the hero's eldritch hunger.
// ═══════════════════════════════════════════════════════════════

export const FRENZY_LEVELS = [
  { id: 0, label: "Calm",      color: null },
  { id: 1, label: "Hungry",    color: "rgba(200,120,80,0.18)" },
  { id: 2, label: "Frenzied",  color: "rgba(210,80,40,0.24)" },
  { id: 3, label: "Ravenous",  color: "rgba(220,50,30,0.30)" },
  { id: 4, label: "Berserk",   color: "rgba(230,30,20,0.38)" },
];

export const FRENZY_TIERS = [
  { id: 0, label: "Calm" },
  { id: 1, label: "Hungry" },
  { id: 2, label: "Frenzied" },
  { id: 3, label: "Ravenous" },
  { id: 4, label: "Berserk" },
];

export const APPETITE_CONFIG = {
  passiveFrenzyRise: { 0: 0, 1: 0.15, 2: 0.25, 3: 0.4, 4: 0.55 },
  feedFrenzyDrop: [0, 1, 2, 2, 3],
};

export function getFrenzyLevel(character) {
  return Math.min(4, Math.max(0, character?.frenzyLevel ?? 0));
}

export function getFrenzyTier(character) {
  return Math.min(4, Math.max(0, character?.frenzyTier ?? 0));
}

export function getAddictionLevel(character) {
  return Math.min(4, Math.max(0, character?.addictionLevel ?? 0));
}

export function getHungerTier(character) {
  return Math.min(4, Math.max(0, character?.hungerTier ?? 0));
}

export function isInWithdrawal(_character) {
  return false;
}

// Raise frenzy by delta; returns updated character.
export function adjustFrenzy(character, delta) {
  const next = Math.min(4, Math.max(0, getFrenzyTier(character) + delta));
  return { ...character, frenzyTier: next };
}

// Passive frenzy rise each turn (used by enemy AI).
export function tickFrenzy(character, rng = Math.random) {
  const level = getFrenzyLevel(character);
  const rise = APPETITE_CONFIG.passiveFrenzyRise[level] ?? 0;
  if (rise > 0 && rng() < rise) return adjustFrenzy(character, 1);
  return character;
}

// Modifiers from effects (replaces skill aggregation).
export function getHungerModifiers(_character, effects = {}) {
  return {
    passiveRiseMult: effects.ravenousBloodline ? 1.5 : 1,
    feedDropMult: 1,
    addictionDriftChance: 0,
  };
}
