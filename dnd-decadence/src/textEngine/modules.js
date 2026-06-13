// ═══════════════════════════════════════════════════════════════
// D&D PHRASE MODULES — sentence-fragment building blocks.
// subject.name / subject.first / char.desc / enemy.desc / sizeCompare
// ═══════════════════════════════════════════════════════════════
import { registerModule } from './engine.js';
import './lexicon.js';

// ── subject.* identity helpers ────────────────────────────────

registerModule('subject.name', [{ when: {}, text: [(ctx) => ctx.subject?.name || 'Someone'] }]);
registerModule('subject.first', [{ when: {}, text: [(ctx) => (ctx.subject?.name || 'Someone').split(' ')[0]] }]);
registerModule('subject.lbs', [{ when: {}, text: [(ctx) => String(Math.round(ctx.subject?.lbs || 0))] }]);
registerModule('subject.hp', [{ when: {}, text: [(ctx) => String(ctx.subject?.hp ?? '?')] }]);

// ── char.desc — hero/NPC composite ────────────────────────────

registerModule("char.desc", [
  { when: { stageMax: 2 },
    text: [
      (ctx) => `${ctx.subject.name} moves with the ease of someone still comfortable in her body`,
      (ctx) => `${ctx.subject.name} is {word.size} — light on her feet, coiled potential`,
    ] },
  { when: { stageMin: 3, stageMax: 6 },
    text: [
      (ctx) => `${ctx.subject.name} carries visible softness now, {word.movement} with new weight`,
      (ctx) => `${ctx.subject.name}'s {word.size} frame {word.movement} — the gain is real and she knows it`,
    ] },
  { when: { stageMin: 7 },
    text: [
      (ctx) => `${ctx.subject.name}'s {word.size} body {word.movement} — vast and deliberate`,
      (ctx) => `${ctx.subject.name} {word.movement}, immense and unhurried`,
    ] },
  { when: {},
    text: [(ctx) => `${ctx.subject.name} {word.movement}, {word.size} and present`] },
]);

// ── enemy.desc — foe composite ────────────────────────────────

registerModule("enemy.desc", [
  { when: { stageMax: 4 },
    text: [
      (ctx) => `${ctx.subject.name} is {word.size}, still mobile and dangerous`,
      (ctx) => `${ctx.subject.name} faces you — {word.size}, but far from helpless`,
    ] },
  { when: { stageMin: 5, stageMax: 7 },
    text: [
      (ctx) => `${ctx.subject.name} is {word.size} now, movement labored, bulk undeniable`,
      (ctx) => `${ctx.subject.name} {word.movement} — heavy, swollen, slowing`,
    ] },
  { when: { stageMin: 8 },
    text: [
      (ctx) => `${ctx.subject.name} is {word.size} — barely able to act, smothered in new mass`,
      (ctx) => `${ctx.subject.name} is {word.size}, {word.girthReaction}`,
    ] },
  { when: {},
    text: [(ctx) => `${ctx.subject.name} {word.movement}, {word.size}`] },
]);

// ── sizeCompare — subject vs ref ──────────────────────────────

registerModule("sizeCompare", [
  { when: { relSize: ["much_smaller"] },
    text: ["a fraction of the target's size","dwarfed by comparison","almost miniature beside them"] },
  { when: { relSize: ["smaller"] },
    text: ["noticeably smaller","clearly lighter","visibly less substantial"] },
  { when: { relSize: ["similar"] },
    text: ["similar in bulk","matched in girth","equally substantial"] },
  { when: { relSize: ["larger"] },
    text: ["visibly larger","carrying more mass","a size above"] },
  { when: { relSize: ["much_larger"] },
    text: ["dwarfing them","vast by comparison","overwhelming in scale"] },
  { when: {},
    text: ["comparable in size"] },
]);
