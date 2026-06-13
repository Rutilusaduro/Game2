import { useState, useEffect, useCallback } from 'react';
import { getGirthTier } from '../rules/girth.js';
import { SPELLS } from '../gameData/spells.js';
import { heroAct, enemyTurn } from '../combat/combat.js';
import { renderFattenBurst } from '../textEngine/scenes/fattenBurst.js';
import { renderSpellcast } from '../textEngine/scenes/spellcast.js';
import { renderVictory, renderDefeat } from '../textEngine/scenes/combatBeats.js';
import CombatLogPopup from './CombatLogPopup.jsx';
import { C } from '../styles.js';

// ── Sub-components ────────────────────────────────────────────

function HpBar({ hp, maxHp }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) * 100 : 0;
  const color = pct > 66 ? '#3a8a3a' : pct > 33 ? '#c07010' : '#982808';
  return (
    <div>
      <div style={{ fontSize: 10, color: '#7050a0', marginBottom: 2 }}>HP {hp}/{maxHp}</div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 3, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function GirthBar({ lbs }) {
  const tier = getGirthTier(lbs || 80);
  const pct = Math.min(100, Math.max(0, ((lbs - 80) / (1000 - 80)) * 100));
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 10, color: '#7050a0', marginBottom: 2 }}>
        Girth — {tier.label} ({lbs} lbs)
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 3, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: tier.color, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

function CombatantCard({ c, isActive, isTarget, onClick }) {
  const defeated = c.hp <= 0 || getGirthTier(c.lbs || 80).id >= 9;
  return (
    <div
      onClick={!defeated && onClick ? onClick : undefined}
      style={{
        background: isActive ? 'rgba(120,40,200,0.18)' : 'rgba(255,255,255,0.03)',
        border: isTarget ? '1px solid #c040a0' : isActive ? '1px solid #6030b0' : '1px solid #180830',
        borderRadius: 8, padding: 10, marginBottom: 8,
        cursor: (onClick && !defeated) ? 'pointer' : 'default',
        opacity: defeated ? 0.45 : 1,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 700, color: isActive ? '#e0b0ff' : '#c0a888' }}>{c.name}</span>
          {isActive && <span style={{ marginLeft: 6, fontSize: 10, color: '#7030b0' }}>◀ ACTIVE</span>}
          {defeated && <span style={{ marginLeft: 6, fontSize: 10, color: '#802020' }}>✦ DEFEATED</span>}
        </div>
        {c.isHero && (
          <span style={{ fontSize: 10, color: '#5030a0' }}>
            {c.classId?.charAt(0).toUpperCase() + c.classId?.slice(1)} Lv.{c.level}
          </span>
        )}
      </div>
      <HpBar hp={c.hp ?? 0} maxHp={c.maxHp ?? 1} />
      <GirthBar lbs={c.lbs ?? 80} />
      {c.conditions?.filter(cd => cd.type !== 'SpeedReduced').map((cd, i) => (
        <span key={i} style={{ ...C.tag('#6a1a3a'), marginRight: 4, marginTop: 4, display: 'inline-block' }}>
          {cd.type}{cd.duration < 99 ? ` (${cd.duration})` : ''}
        </span>
      ))}
    </div>
  );
}

function SpellButton({ spell, disabled, selected, onClick }) {
  if (!spell) return null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: selected ? 'rgba(140,40,200,0.45)' : 'rgba(80,18,140,0.3)',
        border: selected ? '1px solid #c040e0' : '1px solid #4a1280',
        color: disabled ? '#402060' : selected ? '#e0b0ff' : '#b080e8',
        borderRadius: 6, padding: '6px 10px', cursor: disabled ? 'default' : 'pointer',
        fontSize: 11, fontFamily: 'inherit', margin: '2px',
        display: 'inline-block', transition: 'all 0.15s',
      }}
    >
      <div style={{ fontWeight: 600 }}>{spell.name}</div>
      <div style={{ fontSize: 9, opacity: 0.7 }}>{spell.level === 0 ? 'Cantrip' : `L${spell.level}`}</div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────

export default function CombatView({ initialState, onEnd }) {
  const [state, setState] = useState(initialState);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [popup, setPopup] = useState(null);   // { lines: [] }
  const [animating, setAnimating] = useState(false);

  const hero = state.combatants.find(c => c.isHero);
  const enemies = state.combatants.filter(c => !c.isHero);
  const activeId = state.order[state.turnIdx];

  // Auto-run enemy turn
  useEffect(() => {
    if (state.phase !== 'enemy' || animating || popup) return;
    const timer = setTimeout(() => {
      setAnimating(true);
      const next = enemyTurn(state);
      const narrativeLines = buildNarrativeLines(next.events, next.combatants, hero);
      setState(next);
      setAnimating(false);
      if (narrativeLines.length) setPopup({ lines: narrativeLines });
      else if (next.phase === 'victory' || next.phase === 'defeat') handleEnd(next);
    }, 600);
    return () => clearTimeout(timer);
  }, [state.phase, animating, popup]);

  const handleCastSpell = useCallback(() => {
    if (!selectedSpell || !selectedTarget || animating) return;
    const spell = SPELLS[selectedSpell];
    if (!spell) return;

    // Build narrative pre-cast text
    const targetC = state.combatants.find(c => c.id === selectedTarget);
    const castText = renderSpellcast(targetC, hero, {
      spellId: selectedSpell,
      spellLevel: spell.level,
    });

    setAnimating(true);
    const next = heroAct(state, { type: 'spell', spellId: selectedSpell, targetId: selectedTarget });
    const narrativeLines = [castText, ...buildNarrativeLines(next.events, next.combatants, hero)];

    setState(next);
    setSelectedSpell(null);
    setSelectedTarget(null);
    setAnimating(false);

    if (narrativeLines.filter(Boolean).length) {
      setPopup({ lines: narrativeLines.filter(Boolean) });
    } else if (next.phase === 'victory' || next.phase === 'defeat') {
      handleEnd(next);
    }
  }, [selectedSpell, selectedTarget, state, animating, hero]);

  const handleDodge = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    const next = heroAct(state, { type: 'dodge' });
    setState(next);
    setAnimating(false);
  }, [state, animating]);

  function handleEnd(s) {
    const resultHero = s.combatants.find(c => c.isHero);
    const resultEnemy = s.combatants.find(c => !c.isHero);
    const prose = s.phase === 'victory'
      ? renderVictory(resultHero, resultEnemy)
      : renderDefeat(resultHero);
    setPopup({ lines: [prose], isEnd: true, result: s.phase });
  }

  function closePopup() {
    const isEnd = popup?.isEnd;
    const result = popup?.result;
    setPopup(null);
    if (isEnd) onEnd?.({ result, hero: state.combatants.find(c => c.isHero) });
  }

  // Determine which spells are castable
  const castableIds = (hero?.knownSpells || []).filter(id => {
    const s = SPELLS[id];
    if (!s) return false;
    if (s.level === 0) return true;
    if (hero.classId === 'warlock') return (hero.slots?.pact ?? 0) > 0;
    return (hero.slots?.[s.level] ?? 0) > 0;
  });

  const isPlayerTurn = state.phase === 'player' && !animating && !popup;
  const canCast = isPlayerTurn && selectedSpell && selectedTarget;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#07050f' }}>
      {/* Left: hero + controls */}
      <div style={{ width: 300, background: '#070410', borderRight: '1px solid #180830', padding: 12, overflowY: 'auto', flexShrink: 0 }}>
        <div style={C.secT}>Your Character</div>
        {hero && <CombatantCard c={hero} isActive={activeId === 'hero'} />}

        <div style={{ ...C.secT, marginTop: 12 }}>Spell Slots</div>
        <div style={{ fontSize: 11, color: '#9070a0', marginBottom: 8 }}>
          {hero?.classId === 'warlock' && (
            <span>Pact Slots: <strong style={{ color: '#c090ff' }}>{hero.slots?.pact ?? 0}/{hero.maxSlots?.pact ?? 0}</strong></span>
          )}
          {hero?.classId !== 'warlock' && [1, 2, 3].filter(l => (hero?.maxSlots?.[l] ?? 0) > 0).map(l => (
            <span key={l} style={{ marginRight: 8 }}>L{l}: <strong style={{ color: '#c090ff' }}>{hero.slots?.[l] ?? 0}/{hero.maxSlots?.[l] ?? 0}</strong></span>
          ))}
        </div>

        <div style={C.secT}>Spells</div>
        <div style={{ marginBottom: 10 }}>
          {(hero?.knownSpells || []).map(id => {
            const s = SPELLS[id];
            if (!s) return null;
            const canUse = castableIds.includes(id);
            return (
              <SpellButton
                key={id}
                spell={s}
                disabled={!isPlayerTurn || !canUse}
                selected={selectedSpell === id}
                onClick={() => setSelectedSpell(selectedSpell === id ? null : id)}
              />
            );
          })}
        </div>

        {selectedSpell && (
          <div style={{ fontSize: 11, color: '#9070a0', marginBottom: 8, padding: '6px 8px', background: 'rgba(80,20,140,0.15)', borderRadius: 6 }}>
            {SPELLS[selectedSpell]?.description}
            <div style={{ marginTop: 4, color: '#6040a0' }}>→ Click an enemy to target</div>
          </div>
        )}

        <button
          onClick={handleCastSpell}
          disabled={!canCast}
          style={{ ...C.btn('#7030c0'), width: '100%', marginBottom: 6, opacity: canCast ? 1 : 0.35 }}
        >
          Cast Spell
        </button>
        <button
          onClick={handleDodge}
          disabled={!isPlayerTurn}
          style={{ ...C.btn('#303060'), width: '100%', opacity: isPlayerTurn ? 1 : 0.35 }}
        >
          Dodge (Disadv on attacks vs you)
        </button>
      </div>

      {/* Center: enemies + initiative */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#c090ff' }}>⚔ Combat</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6040a0' }}>Round {state.round}</span>
          </div>
          <div style={{ fontSize: 12, color: state.phase === 'player' ? '#40c040' : '#c07010' }}>
            {state.phase === 'player' ? '◉ Your Turn' : state.phase === 'enemy' ? '◎ Enemy Turn…' : state.phase.toUpperCase()}
          </div>
        </div>

        <div style={C.secT}>Enemies</div>
        {enemies.map(e => (
          <CombatantCard
            key={e.id}
            c={e}
            isActive={activeId === e.id}
            isTarget={selectedTarget === e.id}
            onClick={() => setSelectedTarget(selectedTarget === e.id ? null : e.id)}
          />
        ))}

        {/* Initiative tracker */}
        <div style={{ ...C.secT, marginTop: 16 }}>Initiative Order</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {state.order.map((id, i) => {
            const c = state.combatants.find(x => x.id === id);
            return (
              <div key={id} style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 11,
                background: i === state.turnIdx ? 'rgba(120,30,200,0.35)' : 'rgba(255,255,255,0.04)',
                border: i === state.turnIdx ? '1px solid #7030d0' : '1px solid #180830',
                color: i === state.turnIdx ? '#e0b0ff' : '#6040a0',
              }}>
                {i + 1}. {c?.name}
              </div>
            );
          })}
        </div>

        {/* Combat log */}
        <div style={C.secT}>Combat Log</div>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 10, maxHeight: 220, overflowY: 'auto' }}>
          {[...state.log].reverse().map((line, i) => (
            <div key={i} style={C.logE}>{line}</div>
          ))}
        </div>
      </div>

      {popup && (
        <CombatLogPopup lines={popup.lines} onClose={closePopup} />
      )}
    </div>
  );
}

// ── Narrative line builder ────────────────────────────────────

function buildNarrativeLines(events, combatants, hero) {
  const lines = [];
  for (const ev of events) {
    if (ev.type === 'tierUp') {
      const target = combatants.find(c => c.id === ev.targetId);
      if (target) {
        lines.push(renderFattenBurst(target, hero, { globals: {} }));
      }
    }
    if (ev.type === 'end') {
      // Handled by handleEnd
    }
  }
  return lines.filter(Boolean);
}
