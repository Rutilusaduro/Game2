// ═══════════════════════════════════════════════════════════════
// D&D LEXICON — word-level descriptor pools.
// Ported from sim lexicon.js; body/clothing stripped to dungeon
// context; D&D-specific pools added.
// ═══════════════════════════════════════════════════════════════
import { registerModule, stageBucket, pick } from './engine.js';

// ── size adjectives ───────────────────────────────────────────

export const SIZE_WORDS = {
  slight:    ["slight","angular","wiry","bird-boned","lean as a blade"],
  slim:      ["slim","slender","lean","narrow","willowy"],
  soft:      ["soft","rounded","gently padded","filling out","taking on curves"],
  chubby:    ["chubby","thickening","padded","pleasantly round","noticeably fuller"],
  plump:     ["plump","thick","well-fed","substantially soft","full-figured"],
  heavy:     ["heavy","broad","weighty","substantial","dense with softness"],
  fat:       ["fat","rolling","abundant","overflowing","generously proportioned"],
  veryFat:   ["very fat","vast","immense","overflowing","barely contained"],
  enormous:  ["enormous","staggering","mountainous","colossal in scale","immense by any measure"],
  colossal:  ["colossal","monumental","barely mobile","overwhelmingly vast","architectural in scale"],
  blob:      ["immobile","mountainous","a landscape of flesh","motionless abundance"],
  leviathan: ["impossibly vast","a weather system of softness","beyond measurement"],
};

// ── movement by stage ─────────────────────────────────────────

export const MOVEMENT_WORDS = {
  slight:    ["darts","slips through","moves with easy speed","crosses the room in two strides"],
  slim:      ["walks easily","moves with natural ease","steps without hurry"],
  soft:      ["moves with a soft bounce","carries a new sway","steps with thickened rhythm"],
  chubby:    ["moves with a thickened gait","sways slightly","steps with thighs beginning to brush"],
  plump:     ["sways","moves with deliberate rolling steps","carries her weight with settled rhythm"],
  heavy:     ["waddles slightly","moves with slow weighty purpose","rocks side to side"],
  fat:       ["waddles","moves with a rolling gait","labors pleasantly forward"],
  veryFat:   ["waddles slowly","advances one careful step at a time","pauses between steps"],
  enormous:  ["lumbers","advances like weather","crosses space in slow surges"],
  colossal:  ["shuffles","moves inches at a time","repositions rather than walks"],
  blob:      ["barely shifts","settles rather than walks","ripples when she tries"],
  leviathan: ["exists more than arrives","moves like geography rearranging"],
};

// ── dungeon/adventure flavor words ───────────────────────────

export const GIRTH_REACTION_WORDS = {
  slight:    ["unfazed","unaffected","untouched","immune","barely registering it"],
  slim:      ["lightly affected","mildly flushed","slightly warm","minimally impacted"],
  soft:      ["pleasantly swollen","fuller in the cheeks","noticeably rounder","belly pressing out"],
  chubby:    ["visibly heavier","struggling with new bulk","cheeks flushed round","seams straining"],
  plump:     ["breathless with fullness","belly heavy and insistent","thighs crowding each other"],
  heavy:     ["slowed by new weight","waddling visibly","carrying bulk that wasn't there before"],
  fat:       ["moving with great effort","vast and rolling","the floor answering her steps"],
  veryFat:   ["barely mobile","shuffling with immense weight","a vast soft presence"],
  enormous:  ["barely upright","needing the wall for support","a mountain of soft flesh"],
  colossal:  ["incapacitated by sheer mass","too enormous to act","pinned under her own weight"],
  blob:      ["utterly immobile","a soft endless mass","beyond all movement"],
  leviathan: ["the room reorganizes around her","beyond ordinary description"],
};

// ── spell flavor by class ─────────────────────────────────────

export const SPELL_AURA_WORDS = {
  warlock:  ["eldritch hunger","dark pact energy","void-touched compulsion","the Maw's will","cursed appetite"],
  sorcerer: ["wild surge","chaotic excess","arcane overflow","bloodline power","uncontrolled magic"],
  cleric:   ["divine radiance","sacred bounty","holy fullness","the Eternal Feast's grace","blessed excess"],
};

// ── enemy reaction words by tier ─────────────────────────────

export const ENEMY_REACTION = {
  slight:    ["snarls","keeps moving","looks unimpressed"],
  slim:      ["winces","stumbles slightly","hisses"],
  soft:      ["grunts","slows a step","looks surprised"],
  chubby:    ["gasps","clutches her middle","looks down in alarm"],
  plump:     ["staggers","lets out a low moan","struggles to stay upright"],
  heavy:     ["sways dangerously","grabs at anything solid","groans under new weight"],
  fat:       ["can barely move","wheezes","shuffles desperately"],
  veryFat:   ["can only shift in place","panting heavily","pinned by bulk"],
  enormous:  ["goes completely still","can no longer reach","overwhelmed by mass"],
  colossal:  ["collapses under her own weight","is immobilized","crashes to the ground softly"],
  blob:      ["is utterly spent","cannot rise","has surrendered to gravity"],
  leviathan: ["transcends ordinary defeat"],
};

// ── registration ──────────────────────────────────────────────

function byBucket(dict) {
  return (ctx) => pick(dict[stageBucket(ctx.d.stage ?? 0)] || dict.soft || Object.values(dict)[0]);
}

registerModule("word.size",           [{ when: {}, text: byBucket(SIZE_WORDS) }]);
registerModule("word.movement",       [{ when: {}, text: byBucket(MOVEMENT_WORDS) }]);
registerModule("word.girthReaction",  [{ when: {}, text: byBucket(GIRTH_REACTION_WORDS) }]);
registerModule("word.enemyReaction",  [{ when: {}, text: byBucket(ENEMY_REACTION) }]);

registerModule("word.spellAura", [{
  when: {},
  text: (ctx) => {
    const cls = ctx.d.classId ?? ctx.globals?.classId ?? 'warlock';
    return pick(SPELL_AURA_WORDS[cls] || SPELL_AURA_WORDS.warlock);
  },
}]);
