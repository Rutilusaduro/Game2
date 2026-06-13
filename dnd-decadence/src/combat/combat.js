// ═══════════════════════════════════════════════════════════════
// COMBAT ENGINE — pure state machine, returns state + event list.
// No side effects; callers apply returned state.
//
// State shape:
//   combatants  — array of combatant objects (hero + enemies)
//   order       — initiative order (array of combatant IDs)
//   turnIdx     — index into order
//   round       — current round number
//   phase       — 'player' | 'enemy' | 'victory' | 'defeat'
//   events      — array of narrative events for this action
//   log         — cumulative plain-text log
//
// Narrative events pushed per action:
//   { type: 'spellcast' | 'attack' | 'fatten' | 'tierUp' | 'end', ...data }
// ═══════════════════════════════════════════════════════════════
import { d20, attackRoll, savingThrow, rollDice, randInt, mod } from '../rules/dice.js';
import { getGirthTier, girthAutoCondition, isIncapacitated } from '../rules/girth.js';
import { SPELLS } from '../gameData/spells.js';
import { heroSpellSaveDC, consumeSlot } from '../gameData/character.js';

// ── Condition helpers ─────────────────────────────────────────

const GIRTH_CONDITIONS = ['Incapacitated','Restrained','Slowed','SpeedReduced'];

function addCondition(combatant, cond, duration = 999) {
  if (!cond) return combatant;
  const existing = combatant.conditions.filter(c => c.type !== cond);
  return { ...combatant, conditions: [...existing, { type: cond, duration }] };
}

export function removeCondition(combatant, cond) {
  return { ...combatant, conditions: combatant.conditions.filter(c => c.type !== cond) };
}

function hasCondition(combatant, cond) {
  return combatant.conditions.some(c => c.type === cond);
}

function tickConditions(combatant) {
  const next = combatant.conditions
    .map(c => ({ ...c, duration: c.duration - 1 }))
    .filter(c => c.duration > 0);
  return { ...combatant, conditions: next };
}

// Re-derive girth auto-conditions; keeps spell-applied conditions.
function refreshGirthConditions(combatant) {
  const tier = getGirthTier(combatant.lbs || 80);
  const auto = girthAutoCondition(tier);
  // Remove old girth conditions
  let c = { ...combatant, conditions: combatant.conditions.filter(cd => !GIRTH_CONDITIONS.includes(cd.type)) };
  if (auto) c = addCondition(c, auto, 999);
  return c;
}

// ── Appliers ──────────────────────────────────────────────────

function applyDamage(state, targetId, dmg) {
  if (!dmg || dmg <= 0) return state;
  return mapCombatant(state, targetId, c => ({
    ...c,
    hp: Math.max(0, (c.hp ?? 0) - dmg),
  }));
}

function applyHeal(state, targetId, amount) {
  if (!amount || amount <= 0) return state;
  return mapCombatant(state, targetId, c => ({
    ...c,
    hp: Math.min(c.maxHp ?? c.hp, (c.hp ?? 0) + amount),
  }));
}

function applyFatten(state, targetId, lbs, rng) {
  if (!lbs || lbs <= 0) return state;
  const before = getCombatant(state, targetId);
  const beforeTier = getGirthTier(before.lbs || 80);
  const newLbs = (before.lbs || 80) + lbs;
  const afterTier = getGirthTier(newLbs);

  let next = mapCombatant(state, targetId, c => ({ ...c, lbs: newLbs }));
  next = mapCombatant(next, targetId, c => refreshGirthConditions(c));

  // Record tier crossing
  if (afterTier.id > beforeTier.id) {
    next = pushEvent(next, { type: 'tierUp', targetId, fromTier: beforeTier, toTier: afterTier, lbs });
  }
  return pushEvent(next, { type: 'fatten', targetId, lbs, newLbs });
}

function applyConditionToTarget(state, targetId, cond, duration = 3) {
  if (!cond) return state;
  return mapCombatant(state, targetId, c => addCondition(c, cond, duration));
}

// ── State helpers ─────────────────────────────────────────────

function getCombatant(state, id) {
  return state.combatants.find(c => c.id === id);
}

function mapCombatant(state, id, fn) {
  return { ...state, combatants: state.combatants.map(c => c.id === id ? fn(c) : c) };
}

function pushEvent(state, event) {
  return { ...state, events: [...state.events, event] };
}

function pushLog(state, text) {
  return { ...state, log: [...state.log, text] };
}

// ── Defeat check ──────────────────────────────────────────────

function checkDefeated(combatant) {
  return (combatant.hp <= 0) || isIncapacitated(combatant.lbs || 80);
}

function checkEnd(state) {
  const hero = state.combatants.find(c => c.isHero);
  const enemies = state.combatants.filter(c => !c.isHero);

  if (hero && checkDefeated(hero)) {
    return pushEvent({ ...state, phase: 'defeat' }, { type: 'end', result: 'defeat' });
  }
  if (enemies.every(checkDefeated)) {
    return pushEvent({ ...state, phase: 'victory' }, { type: 'end', result: 'victory' });
  }
  return state;
}

// ── Turn advance ──────────────────────────────────────────────

function advanceTurn(state) {
  const order = state.order;
  let nextIdx = (state.turnIdx + 1) % order.length;

  // Tick DoTs and conditions for the upcoming combatant
  let nextState = mapCombatant(state, order[nextIdx], tickConditions);
  // Tick DoT lbs from Hexed / Plagued conditions
  const acting = getCombatant(nextState, order[nextIdx]);
  if (acting) {
    for (const cond of acting.conditions) {
      if (cond.dotLbs && cond.duration > 0) {
        const lbs = randInt(cond.dotLbs[0], cond.dotLbs[1]);
        nextState = applyFatten(nextState, acting.id, lbs);
        nextState = pushLog(nextState, `[DoT] ${acting.name} takes ${lbs} lbs from ${cond.type}.`);
      }
    }
  }

  const nowActing = getCombatant(nextState, order[nextIdx]);
  const phase = nowActing?.isHero ? 'player' : 'enemy';
  return { ...nextState, turnIdx: nextIdx, round: nextIdx === 0 ? state.round + 1 : state.round, phase };
}

// ── startCombat ───────────────────────────────────────────────

export function startCombat(hero, enemies, rng = Math.random) {
  const all = [{ ...hero, hp: hero.maxHp ?? hero.hp, conditions: [] }, ...enemies.map(e => ({ ...e, conditions: [] }))];

  // Roll initiative
  const withInit = all.map(c => ({
    ...c,
    conditions: refreshGirthConditions(c).conditions,
    _init: d20({}, rng) + mod((c.stats?.DEX) ?? 10),
  }));
  withInit.sort((a, b) => b._init - a._init);
  const order = withInit.map(c => c.id);
  const combatants = withInit.map(({ _init, ...c }) => c);

  const firstIsHero = combatants[0]?.isHero;

  return {
    combatants,
    order,
    turnIdx: 0,
    round: 1,
    phase: firstIsHero ? 'player' : 'enemy',
    events: [],
    log: [`Round 1 begins. Initiative order: ${order.join(', ')}.`],
  };
}

// ── heroAct ────────────────────────────────────────────────────
// type: 'spell' | 'dodge' | 'attack'

export function heroAct(state, action, rng = Math.random) {
  if (state.phase !== 'player') return state;

  let next = { ...state, events: [] };
  const hero = getCombatant(next, 'hero');
  if (!hero) return next;

  if (action.type === 'spell') {
    const spell = SPELLS[action.spellId];
    if (!spell) return next;
    const target = getCombatant(next, action.targetId);
    if (!target) return next;

    const _castMod = hero.castMod ?? mod(hero.stats?.CHA ?? 10);
    const spellDC = heroSpellSaveDC(hero);

    // --- Hex of Hunger (DoT applier) ---
    if (spell.id === 'hex_of_hunger') {
      const dotCond = {
        type: 'Hexed',
        duration: spell.dotDuration ?? 3,
        dotLbs: spell.dotLbs ?? [2, 5],
      };
      next = mapCombatant(next, target.id, c => addCondition(c, 'Hexed', spell.dotDuration ?? 3));
      // Store dotLbs on the condition (need custom handling)
      next = mapCombatant(next, target.id, c => ({
        ...c,
        conditions: c.conditions.map(cd => cd.type === 'Hexed' ? { ...cd, dotLbs: dotCond.dotLbs } : cd),
      }));
      next = pushEvent(next, { type: 'spellcast', spellId: spell.id, casterId: 'hero', targetId: target.id, hit: true });
      next = pushLog(next, `You cast Hex of Hunger on ${target.name}. She's cursed — lbs will accumulate.`);
      next = consumeSlotState(next, 'hero', spell.level);
      next = checkEnd(next);
      if (next.phase === 'player') next = advanceTurn(next);
      return next;
    }

    // --- Sating Whisper (hunger raise) ---
    if (spell.id === 'sating_whisper') {
      const dmg = rollDice(spell.damageDice, rng);
      next = applyDamage(next, target.id, dmg);
      next = mapCombatant(next, target.id, c => ({
        ...c,
        hungerTier: Math.min(4, (c.hungerTier ?? 0) + 1),
        frenzyTier: Math.min(4, (c.frenzyTier ?? 0) + 1),
      }));
      next = pushEvent(next, { type: 'spellcast', spellId: spell.id, casterId: 'hero', targetId: target.id, hit: true, dmg });
      next = pushLog(next, `Sating Whisper hits ${target.name} for ${dmg} psychic damage and raises her hunger.`);
      next = checkEnd(next);
      if (next.phase === 'player') next = advanceTurn(next);
      return next;
    }

    // --- Mind Feast (psychic, scales with girth) ---
    if (spell.id === 'mind_feast') {
      const tier = getGirthTier(target.lbs || 80).id;
      const dice = `${Math.max(1, tier)}d6`;
      const dmg = rollDice(dice, rng);
      next = applyDamage(next, target.id, dmg);
      next = consumeSlotState(next, 'hero', spell.level);
      next = pushEvent(next, { type: 'spellcast', spellId: spell.id, casterId: 'hero', targetId: target.id, hit: true, dmg });
      next = pushLog(next, `Mind Feast channels ${target.name}'s girth (tier ${tier}) into psychic pain — ${dmg} dmg.`);
      next = checkEnd(next);
      if (next.phase === 'player') next = advanceTurn(next);
      return next;
    }

    // --- Eldritch Gorge (fatten + self-heal) ---
    if (spell.id === 'eldritch_gorge') {
      const [lbsMin, lbsMax] = spell.fattenRange;
      let lbs = randInt(lbsMin, lbsMax, rng);
      let saved = false;
      if (spell.saveType) {
        const save = savingThrow(target.stats?.[spell.saveType] ?? 10, spellDC, {}, rng);
        saved = save.success;
        if (saved) lbs = Math.floor(lbs / 2);
        next = pushEvent(next, { type: 'save', targetId: target.id, stat: spell.saveType, success: saved });
      }
      next = applyFatten(next, target.id, lbs, rng);
      const healAmt = Math.round(lbs * (spell.healSelfFraction ?? 0.3));
      next = applyHeal(next, 'hero', healAmt);
      next = consumeSlotState(next, 'hero', spell.level);
      next = pushEvent(next, { type: 'spellcast', spellId: spell.id, casterId: 'hero', targetId: target.id, hit: true, lbs, saved, healAmt });
      next = pushLog(next, `Eldritch Gorge devours ${target.name} — +${lbs} lbs${saved ? ' (halved by save)' : ''}. You recover ${healAmt} HP.`);
      next = checkEnd(next);
      if (next.phase === 'player') next = advanceTurn(next);
      return next;
    }

    // --- Generic fatten spell (damage + lbs, optional save) ---
    let totalDmg = 0;
    if (spell.damageDice) totalDmg = rollDice(spell.damageDice, rng);

    let lbs = 0;
    let saved = false;
    if (spell.fattenRange) {
      const [lMin, lMax] = spell.fattenRange;
      lbs = randInt(lMin, lMax, rng);
      if (spell.saveType) {
        // Check if Hexed (disadv on CON saves)
        const saveOpts = hasCondition(target, 'Hexed') ? { dis: true } : {};
        const save = savingThrow(target.stats?.[spell.saveType] ?? 10, spellDC, saveOpts, rng);
        saved = save.success;
        if (saved) lbs = Math.floor(lbs / 2);
        if (!saved && spell.onSaveFail) {
          next = applyConditionToTarget(next, target.id, spell.onSaveFail, 3);
        }
        next = pushEvent(next, { type: 'save', targetId: target.id, stat: spell.saveType, success: saved });
      }
      next = applyFatten(next, target.id, lbs, rng);
    }
    if (totalDmg > 0) next = applyDamage(next, target.id, totalDmg);

    if (spell.level > 0) next = consumeSlotState(next, 'hero', spell.level);

    next = pushEvent(next, {
      type: 'spellcast', spellId: spell.id, casterId: 'hero', targetId: target.id,
      hit: true, dmg: totalDmg, lbs, saved,
    });
    const lbsStr = lbs > 0 ? ` (+${lbs} lbs${saved ? ', halved by save' : ''})` : '';
    const dmgStr = totalDmg > 0 ? ` ${totalDmg} dmg` : '';
    next = pushLog(next, `${spell.name} hits ${target.name}${dmgStr}${lbsStr}.`);

  } else if (action.type === 'dodge') {
    next = mapCombatant(next, 'hero', c => addCondition(c, 'Dodge', 1));
    next = pushLog(next, 'You take the Dodge action — attacks against you have disadvantage this turn.');
    next = pushEvent(next, { type: 'dodge', casterId: 'hero' });
  }

  next = checkEnd(next);
  if (next.phase === 'player') next = advanceTurn(next);
  return next;
}

// ── enemyTurn ─────────────────────────────────────────────────

export function enemyTurn(state, rng = Math.random) {
  if (state.phase !== 'enemy') return state;

  const actingId = state.order[state.turnIdx];
  const enemy = getCombatant(state, actingId);
  if (!enemy || !enemy.isEnemy || checkDefeated(enemy)) {
    // Skip defeated enemy
    let next = advanceTurn(state);
    return next;
  }

  const hero = getCombatant(state, 'hero');
  if (!hero) return { ...state, phase: 'victory' };

  let next = { ...state, events: [] };

  // Rule-based AI: pick an attack
  const attacks = enemy.attacks || [];
  if (!attacks.length) {
    next = pushLog(next, `${enemy.name} does nothing.`);
    next = advanceTurn(next);
    return next;
  }

  const attack = attacks[Math.floor(rng() * attacks.length)];
  const atkBonus = mod(enemy.stats?.STR ?? 10) + 2;
  const heroAC = hero.stats?.DEX ? 10 + mod(hero.stats.DEX) : 10;
  const dodging = hasCondition(hero, 'Dodge');
  const rollOpts = dodging ? { dis: true } : {};

  // Decide if this is an attack roll or a save-forcing effect
  const isDirectFatten = !attack.damageDice && attack.fattenRange;

  if (isDirectFatten) {
    // Force-feed style: hero makes save
    const saveDC = attack.saveDC ?? (8 + mod(enemy.stats?.CON ?? 10));
    const save = savingThrow(hero.stats?.CON ?? 10, saveDC, {}, rng);
    const [lMin, lMax] = attack.fattenRange;
    let lbs = randInt(lMin, lMax, rng);
    if (save.success) lbs = Math.floor(lbs / 2);
    next = applyFatten(next, 'hero', lbs, rng);
    next = pushEvent(next, { type: 'enemyFatten', enemyId: enemy.id, lbs, saved: save.success });
    next = pushLog(next, `${enemy.name} uses ${attack.name} — you take +${lbs} lbs${save.success ? ' (save halved)' : ''}.`);
  } else {
    // Standard attack roll
    const atk = attackRoll(atkBonus, heroAC, rollOpts, rng);
    if (!atk.hit) {
      next = pushLog(next, `${enemy.name} attacks — miss!`);
      next = pushEvent(next, { type: 'enemyAttack', enemyId: enemy.id, hit: false });
    } else {
      let dmg = rollDice(attack.damageDice || '1d4', rng);
      if (atk.crit) dmg *= 2;
      next = applyDamage(next, 'hero', dmg);
      next = pushLog(next, `${enemy.name} hits you for ${dmg}${atk.crit ? ' (CRIT)' : ''} damage.`);

      if (attack.fattenRange && attack.saveType) {
        const saveDC = attack.saveDC ?? (8 + mod(enemy.stats?.CON ?? 10));
        const save = savingThrow(hero.stats?.[attack.saveType] ?? 10, saveDC, {}, rng);
        const [lMin, lMax] = attack.fattenRange;
        let lbs = randInt(lMin, lMax, rng);
        if (save.success) lbs = Math.floor(lbs / 2);
        next = applyFatten(next, 'hero', lbs, rng);
        next = pushLog(next, `  → +${lbs} lbs from ${attack.name}'s fattening curse${save.success ? ' (save halved)' : ''}.`);
      }
      next = pushEvent(next, { type: 'enemyAttack', enemyId: enemy.id, hit: true, dmg });
    }
  }

  next = checkEnd(next);
  if (next.phase === 'enemy') next = advanceTurn(next);
  return next;
}

// ── Slot consumption ──────────────────────────────────────────

function consumeSlotState(state, heroId, spellLevel) {
  return mapCombatant(state, heroId, c => consumeSlot(c, spellLevel));
}
