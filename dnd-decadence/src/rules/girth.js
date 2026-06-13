// ═══════════════════════════════════════════════════════════════
// GIRTH — weight tiers and auto-conditions for D&D combat.
// Verbatim WEIGHT_STAGES from gameData/stages.js + getGirthTier alias
// + condition mapping (plan §Health model).
// ═══════════════════════════════════════════════════════════════

export const WEIGHT_STAGES = [
  { id:0,  label:"Slight",    min:80,  color:"#2a8070" },
  { id:1,  label:"Slim",      min:120, color:"#3a8a3a" },
  { id:2,  label:"Soft",      min:135, color:"#6a9a20" },
  { id:3,  label:"Chubby",    min:162, color:"#b0a000" },
  { id:4,  label:"Plump",     min:195, color:"#c07010" },
  { id:5,  label:"Heavy",     min:238, color:"#b05010" },
  { id:6,  label:"Fat",       min:285, color:"#982808" },
  { id:7,  label:"Very Fat",  min:360, color:"#800000" },
  { id:8,  label:"Enormous",  min:465, color:"#600000" },
  { id:9,  label:"Colossal",  min:595, color:"#400000" },
  { id:10, label:"Blob",      min:820, color:"#200000" },
  { id:11, label:"Leviathan", min:1000,color:"#100000" },
];

export function getStage(lbs) {
  for (let i = WEIGHT_STAGES.length - 1; i >= 0; i--)
    if (lbs >= WEIGHT_STAGES[i].min) return WEIGHT_STAGES[i];
  return WEIGHT_STAGES[0];
}

export const getGirthTier = getStage;

// Auto-condition applied each turn based on current girth tier.
// Tier 0-2: none | 3-4: SpeedReduced | 5-6: Slowed | 7-8: Restrained | 9+: Incapacitated
export function girthAutoCondition(tier) {
  const id = tier.id ?? (tier.min != null ? getStage(tier.min).id : 0);
  if (id >= 9) return 'Incapacitated';
  if (id >= 7) return 'Restrained';
  if (id >= 5) return 'Slowed';
  if (id >= 3) return 'SpeedReduced';
  return null;
}

// Is this girth tier a defeat threshold?
export function isIncapacitated(lbs) {
  return getGirthTier(lbs).id >= 9;
}
