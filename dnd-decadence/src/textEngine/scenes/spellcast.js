// ═══════════════════════════════════════════════════════════════
// SCENE: SPELLCAST — classId × spellId × save/crit impact prose.
// Templates: {sc.cast} {sc.impact} {sc.saveLine} {sc.miss}
//
// Escalation by level baked into selectors (spellLevel in globals).
// ═══════════════════════════════════════════════════════════════
import { registerPool, createContext, render } from '../engine.js';
import '../modules.js';

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: sc.cast — the caster sends the spell
// ╚══════════════════════════════════════════════════════════════
registerPool("sc.cast", [
  // Warlock cantrips (spellLevel 0)
  { when: { classId: 'warlock', spellLevel: 0 }, text: [
    "You channel dark pact energy through an outstretched hand, loosing {word.spellAura} at {subject.name}.",
    "The Maw's will flows through you — a tendril of void-hunger lances toward {subject.name}.",
    "You speak a single syllable of your patron's tongue and {word.spellAura} erupts forward.",
  ]},
  // Warlock leveled spells
  { when: { classId: 'warlock', spellLevel: 1 }, text: [
    "You burn a pact slot, binding {subject.name} in eldritch chains of compulsion.",
    "Dark energy pools in your palm — {word.spellAura} reaches out and takes hold.",
    "Your patron's power floods through the pact and into {subject.name}.",
  ]},
  { when: { classId: 'warlock', spellLevel: 2 }, text: [
    "You pour deeper into your pact, {word.spellAura} detonating against {subject.name}.",
    "The Maw opens wider — you channel its desire directly into {subject.name}.",
    "Eldritch hunger, concentrated and directed, slams into {subject.name}.",
  ]},
  { when: { classId: 'warlock', spellLevel: 3 }, text: [
    "You invoke the Endless Maw's full name and {subject.name} feels it in her bones.",
    "The pact tears open — overwhelming eldritch compulsion floods toward {subject.name}.",
    "You pour everything your patron grants into this one moment, aimed at {subject.name}.",
  ]},
  // Sorcerer cantrips
  { when: { classId: 'sorcerer', spellLevel: 0 }, text: [
    "Wild magic crackles in your bloodline — you loose {word.spellAura} with casual ease.",
    "You let the magic go where it wants, and it wants to hit {subject.name}.",
    "Bloodline power flares uncontrolled toward {subject.name}.",
  ]},
  // Cleric cantrips
  { when: { classId: 'cleric', spellLevel: 0 }, text: [
    "You offer a prayer and the Eternal Feast answers — {word.spellAura} descends on {subject.name}.",
    "Sacred light gathers at your fingertips and launches toward {subject.name}.",
    "The goddess's bounty flows through you in a bright warm arc.",
  ]},
  // Wildcard fallback
  { when: {}, text: [
    "You cast — {word.spellAura} surges toward {subject.name}.",
    "Magic leaves your hands and finds its mark.",
    "The spell launches. {subject.name} has nowhere to go.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: sc.impact — spell lands, lbs/damage described
// ╚══════════════════════════════════════════════════════════════
registerPool("sc.impact", [
  // Specific spells
  { when: { spellId: 'eldritch_glut' }, text: [
    "{subject.name} convulses as void-hunger forces mass into her — {subject.name} swells, visibly.",
    "The eldritch glut hits {subject.name} and she fills like a balloon, helpless against it.",
    "{subject.name} gasps as dark energy forces richness through her — her belly rounds outward.",
  ]},
  { when: { spellId: 'sating_whisper' }, text: [
    "{subject.name} goes briefly still, eyes glazing with sudden, irresistible hunger.",
    "The whisper reaches {subject.name} and she shudders — not in pain, in craving.",
    "{subject.name} blinks, confused by the ravenous need blooming inside her.",
  ]},
  { when: { spellId: 'hex_of_hunger' }, text: [
    "Dark runes spiral around {subject.name} — the Hex of Hunger takes root and will not let go.",
    "{subject.name} jolts as the hex lands, already feeling the compulsion build.",
    "The curse settles into {subject.name}'s flesh like a second heartbeat — hungry, insistent.",
  ]},
  { when: { spellId: 'engorging_bolt' }, text: [
    "The bolt hits {subject.name} and spreads through her like warm oil — she rounds, she fattens.",
    "{subject.name} takes the engorging bolt and staggers, suddenly heavier.",
    "Eldritch mass floods into {subject.name} on impact — her silhouette shifts.",
  ]},
  { when: { spellId: 'eldritch_gorge' }, text: [
    "The Maw gorges on {subject.name} — dark magic forces pounds into her in a single devouring rush.",
    "{subject.name} screams as her body is force-fed beyond any natural limit, ballooning fast.",
    "Eldritch gorging sweeps over {subject.name} — she swells dramatically, overwhelmingly, all at once.",
  ]},
  // Generic impact by tier
  { when: { stageMin: 7 }, text: [
    "The spell pours into {subject.name}'s already-enormous body and she gets bigger — barely believably so.",
    "{subject.name}'s {word.size} form adds more mass — she is beyond ordinary measure now.",
  ]},
  { when: {}, text: [
    "The spell hits {subject.name} and she is, undeniably, fatter for it.",
    "{subject.name} swells — clothes tighter, body heavier, the change immediate.",
    "Impact. {subject.name} takes on new mass, the magic doing exactly what it was meant to.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: sc.saveLine — target attempts or succeeds at a save
// ╚══════════════════════════════════════════════════════════════
registerPool("sc.saveLine", [
  { when: { saveResult: 'success' }, text: [
    "{subject.name} braces against the magic — it takes hold, but the worst is blunted.",
    "She resists. The spell still lands, but her constitution holds half of it at bay.",
    "{subject.name} grits her teeth and endures — lesser than it could have been.",
  ]},
  { when: { saveResult: 'fail' }, text: [
    "{subject.name} fails to resist — the full force slams home.",
    "No save. {subject.name} takes it all.",
    "{subject.name}'s constitution crumbles and the magic floods in unchecked.",
  ]},
  { when: {}, text: [
    "{subject.name} shudders under the impact.",
  ]},
]);

// ╔══════════════════════════════════════════════════════════════
// ║ BEAT: sc.miss — spell misses or target evades
// ╚══════════════════════════════════════════════════════════════
registerPool("sc.miss", [
  { when: { classId: 'warlock' }, text: [
    "The void-tendril misses — {subject.name} sidesteps and the dark hunger dissipates.",
    "Your eldritch bolt goes wide. {subject.name} is luckier than she should be.",
    "The Maw reaches and finds nothing. {subject.name} escapes this time.",
  ]},
  { when: { classId: 'sorcerer' }, text: [
    "Wild magic veers off-course — harmless chaos, no target found.",
    "The blast misses wildly. Your bloodline has its own ideas.",
    "Uncontrolled swerve. {subject.name} stumbles clear by accident.",
  ]},
  { when: { classId: 'cleric' }, text: [
    "The sacred light arcs past {subject.name} — the goddess's aim was not yours today.",
    "{subject.name} ducks and the blessing hits stone.",
    "The prayer goes unanswered, at least here and now.",
  ]},
  { when: {}, text: [
    "The spell misses — {subject.name} evades by instinct or luck.",
    "Nothing. {subject.name} is unaffected.",
    "Wide. The magic finds no purchase.",
  ]},
]);

// ── Render helpers ────────────────────────────────────────────

export const SC_HIT_TEMPLATE  = "{sc.cast}\n\n{sc.impact}";
export const SC_MISS_TEMPLATE = "{sc.cast}\n\n{sc.miss}";
export const SC_SAVE_TEMPLATE = "{sc.cast}\n\n{sc.impact} {sc.saveLine}";

export function renderSpellcast(target, caster, opts = {}) {
  const ctx = createContext({
    subject: target,
    ref: caster || null,
    globals: {
      classId: caster?.classId || null,
      spellId: opts.spellId || null,
      spellLevel: opts.spellLevel ?? 0,
      saveResult: opts.saveResult || null,
      ...opts.globals,
    },
  });
  if (opts.miss) return render(SC_MISS_TEMPLATE, ctx);
  if (opts.saveResult) return render(SC_SAVE_TEMPLATE, ctx);
  return render(SC_HIT_TEMPLATE, ctx);
}
