// ═══════════════════════════════════════════════════════════════
// RNG — seeded pseudo-random number generator (mulberry32).
// ═══════════════════════════════════════════════════════════════

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedRng(seed = Date.now()) {
  return mulberry32(seed >>> 0);
}

// Global unseeded rng for non-deterministic contexts.
export const rng = () => Math.random();
