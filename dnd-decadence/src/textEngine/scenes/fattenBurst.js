// ═══════════════════════════════════════════════════════════════
// SCENE: FATTEN BURST — fires when a combatant crosses ≥1 girth tier.
// Reuses the growthEvent beat pattern: pre-line + tier-up + reaction.
// Templates: {fb.preLine} {fb.tierUp} {fb.reaction}
//
// Selector keys available: stage (new tier), classId, stageMin/Max.
// ═══════════════════════════════════════════════════════════════
import { registerPool } from '../engine.js';
import '../modules.js';

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: fb.preLine — opening observation as fattening begins
// ╚══════════════════════════════════════════════════════════════
// Shape: FULL SENTENCE describing the swell of magic/mass.
registerPool("fb.preLine", [
  // Warlock register: cursed/eldritch dread
  { when: { classId: 'warlock' }, text: [
    "Dark pact energy surges through {subject.name}, filling her from the inside out.",
    "The Maw's hunger runs through {subject.name} like a current — she swells with terrible abundance.",
    "An eldritch compulsion seizes {subject.name}, forcing her body to receive what her patron sends.",
    "Eldritch hunger wraps {subject.name} in invisible chains of accumulation.",
  ]},
  // Sorcerer register: chaotic messy excess
  { when: { classId: 'sorcerer' }, text: [
    "Wild arcane energy detonates against {subject.name} — excess made violently literal.",
    "Bloodline magic splashes over {subject.name} in a wave of uncontrolled richness.",
    "The surge hits {subject.name} like a wave of warm, impossible abundance.",
    "Chaotic magic floods {subject.name}'s form, adding mass without apology.",
  ]},
  // Cleric register: blissful devotional
  { when: { classId: 'cleric' }, text: [
    "Sacred light wraps {subject.name} in the Eternal Feast's blessing — and her body swells with it.",
    "Divine bounty pours into {subject.name}, generous and unstoppable.",
    "The goddess's gift settles over {subject.name} — blissful, warm, and heavy.",
    "Holy abundance descends on {subject.name} with devotional thoroughness.",
  ]},
  // Wildcard
  { when: {}, text: [
    "Magic floods {subject.name}'s body, mass piling on in sudden, undeniable surges.",
    "Fattening energy washes over {subject.name} — the change is immediate and visible.",
    "The spell lands and {subject.name}'s body answers, swelling with unasked-for abundance.",
    "{subject.name} bloats visibly as the enchantment does its work.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: fb.tierUp — narrative note when girth tier is crossed
// ╚══════════════════════════════════════════════════════════════
// Shape: FULL SENTENCE naming the new size milestone.
registerPool("fb.tierUp", [
  { when: { stageMin: 9 }, text: [
    "She crosses into something vast — colossal, incapacitated, immobile under her own new weight.",
    "The last threshold shatters. {subject.name} is enormous beyond movement now.",
    "She tips past the point of return — colossal, spread wide, the fight effectively over.",
  ]},
  { when: { stageMin: 7, stageMax: 8 }, text: [
    "Her bulk has become overwhelming — {subject.name} is barely mobile, soft folds everywhere.",
    "{subject.name} has crossed into true enormity. Movement is an achievement now.",
    "She's vast now — very fat and slowing, every step an effort.",
  ]},
  { when: { stageMin: 5, stageMax: 6 }, text: [
    "{subject.name} has gotten heavy — genuinely, visibly heavy, moving differently now.",
    "She's noticeably fatter, her gait changed, her bulk undeniable.",
    "The weight is real now. {subject.name} carries it with audible effort.",
  ]},
  { when: { stageMin: 3, stageMax: 4 }, text: [
    "{subject.name} is plumper than before — chubby turning plump, the rounding unmistakable.",
    "She's gotten chubby fast. The clothes are straining.",
    "The first real threshold. {subject.name} is visibly thicker, softer.",
  ]},
  { when: {}, text: [
    "The change is visible and real — {subject.name} is bigger than she was a moment ago.",
    "{subject.name} has gained, noticeably, and the fight has shifted.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: fb.reaction — the target's response to sudden mass gain
// ╚══════════════════════════════════════════════════════════════
// Shape: SHORT SENTENCE — character's immediate reaction.
registerPool("fb.reaction", [
  { when: { stageMin: 9 }, text: [
    "{subject.name} goes still — colossal and incapacitated, the struggle leaving her eyes.",
    "She can't move anymore. Bulk has won.",
    "{subject.name} sinks, vast and immobile, the fight draining out of her.",
  ]},
  { when: { stageMin: 7 }, text: [
    "{subject.name} staggers, barely upright under new weight, expression stunned.",
    "She grabs for support, {word.size} and reeling.",
    "{subject.name} {word.enemyReaction} — overwhelmed by her own new bulk.",
  ]},
  { when: { stageMin: 5 }, text: [
    "{subject.name} {word.enemyReaction}, feeling the new weight settle into her frame.",
    "She grunts, shifting her heavier body, clearly slowed.",
    "{subject.name} looks down at herself with an expression between disbelief and dismay.",
  ]},
  { when: { stageMin: 3 }, text: [
    "{subject.name} {word.enemyReaction}, feeling the new softness.",
    "She touches her middle, surprised at what she finds.",
    "{subject.name} looks {word.size} and knows it.",
  ]},
  { when: {}, text: [
    "{subject.name} {word.enemyReaction}.",
    "She blinks, feeling heavier.",
    "{subject.name} registers the change — the spell did something real.",
  ]},
]);

// ── Render helpers ────────────────────────────────────────────

import { createContext, render } from '../engine.js';

export const FB_TEMPLATE = "{fb.preLine}\n\n{fb.tierUp} {fb.reaction}";

export function renderFattenBurst(target, caster, opts = {}) {
  const ctx = createContext({
    subject: target,
    ref: caster || null,
    globals: {
      classId: caster?.classId || null,
      spellId: opts.spellId || null,
      ...opts.globals,
    },
  });
  return render(FB_TEMPLATE, ctx);
}
