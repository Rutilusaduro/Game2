// ═══════════════════════════════════════════════════════════════
// DICE — D&D resolution helpers.
// ═══════════════════════════════════════════════════════════════

// Parse and roll "2d6", "1d10+3", "d8-1", etc.
export function rollDice(expr, rng = Math.random) {
  const m = String(expr).match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return Number(expr) || 0;
  const count = Number(m[1] || 1);
  const sides = Number(m[2]);
  const bonus = Number(m[3] || 0);
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(rng() * sides) + 1;
  return total + bonus;
}

export function d20(opts = {}, rng = Math.random) {
  const r1 = Math.floor(rng() * 20) + 1;
  if (!opts.adv && !opts.dis) return r1;
  const r2 = Math.floor(rng() * 20) + 1;
  return opts.adv ? Math.max(r1, r2) : Math.min(r1, r2);
}

export function mod(score) {
  return Math.floor((score - 10) / 2);
}

// Returns { roll, total, success, nat20, nat1 }
export function savingThrow(score, dc, opts = {}, rng = Math.random) {
  const roll = d20(opts, rng);
  const total = roll + mod(score);
  return { roll, total, success: total >= dc, nat20: roll === 20, nat1: roll === 1 };
}

// Returns { roll, total, hit, crit }
export function attackRoll(atkBonus, ac, opts = {}, rng = Math.random) {
  const roll = d20(opts, rng);
  const total = roll + atkBonus;
  const crit = roll === 20;
  const hit = crit || (roll !== 1 && total >= ac);
  return { roll, total, hit, crit };
}

// Random integer in [min, max] inclusive.
export function randInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
