import { getGirthTier } from '../rules/girth.js';
import { mod } from '../rules/dice.js';
import { CLASSES } from '../gameData/classes.js';
import { SPELLS } from '../gameData/spells.js';
import { C } from '../styles.js';

function StatBox({ label, score }) {
  const m = mod(score);
  return (
    <div style={{ textAlign: 'center', background: 'rgba(80,20,140,0.2)', borderRadius: 6, padding: '6px 10px', minWidth: 50 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#6040a0', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#c090ff' }}>{score}</div>
      <div style={{ fontSize: 11, color: '#9070c0' }}>{m >= 0 ? '+' : ''}{m}</div>
    </div>
  );
}

function Bar({ value, max, color, label, small }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div style={{ marginBottom: small ? 4 : 6 }}>
      {label && <div style={{ fontSize: 10, color: '#7050a0', marginBottom: 2 }}>{label}</div>}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: small ? 8 : 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 10, color: '#9070a0', marginTop: 1 }}>{value}/{max}</div>
    </div>
  );
}

export default function CharacterSheet({ hero }) {
  if (!hero) return null;
  const cls = CLASSES[hero.classId];
  const girthTier = getGirthTier(hero.lbs || 130);

  const hpColor = () => {
    const r = hero.hp / hero.maxHp;
    if (r > 0.66) return '#3a8a3a';
    if (r > 0.33) return '#c07010';
    return '#982808';
  };

  return (
    <div style={{ padding: 10 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#c090ff', marginBottom: 2 }}>{hero.name}</div>
      <div style={{ fontSize: 11, color: '#7050a0', marginBottom: 10 }}>
        {cls?.name} · {cls?.subclass} · Level {hero.level}
      </div>

      <Bar value={hero.hp} max={hero.maxHp} color={hpColor()} label={`HP`} />
      <Bar
        value={hero.lbs - 80}
        max={1000 - 80}
        color={girthTier.color}
        label={`Girth — ${girthTier.label} (${hero.lbs} lbs)`}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '10px 0' }}>
        {Object.entries(hero.stats || {}).map(([k, v]) => (
          <StatBox key={k} label={k} score={v} />
        ))}
      </div>

      {/* Spell info */}
      <div style={C.secT}>Spellcasting</div>
      <div style={{ fontSize: 11, color: '#9070a0', lineHeight: 1.7 }}>
        <div>Save DC: <strong style={{ color: '#c090ff' }}>{hero.spellSaveDC}</strong></div>
        <div>Atk Bonus: <strong style={{ color: '#c090ff' }}>+{hero.spellAtk}</strong></div>
        {hero.classId === 'warlock' && (
          <div>Pact Slots: <strong style={{ color: '#c090ff' }}>{hero.slots?.pact ?? 0}/{hero.maxSlots?.pact ?? 0}</strong></div>
        )}
        {hero.classId !== 'warlock' && (
          <div>Slots: {[1, 2, 3].filter(l => (hero.maxSlots?.[l] ?? 0) > 0).map(l =>
            <span key={l} style={{ marginRight: 6 }}>L{l}: <strong style={{ color: '#c090ff' }}>{hero.slots?.[l] ?? 0}/{hero.maxSlots?.[l] ?? 0}</strong></span>
          )}</div>
        )}
      </div>

      {/* Known spells */}
      <div style={{ ...C.secT, marginTop: 10 }}>Known Spells</div>
      <div>
        {(hero.knownSpells || []).map(id => {
          const s = SPELLS[id];
          if (!s) return null;
          return (
            <div key={id} style={{ fontSize: 11, color: '#9070a0', padding: '2px 0', borderBottom: '1px solid rgba(80,18,140,0.15)' }}>
              <span style={{ color: '#b080e8' }}>{s.name}</span>
              <span style={{ color: '#504060', marginLeft: 6 }}>{s.level === 0 ? 'Cantrip' : `L${s.level}`}</span>
            </div>
          );
        })}
      </div>

      {/* Conditions */}
      {(hero.conditions?.length > 0) && (
        <>
          <div style={{ ...C.secT, marginTop: 10 }}>Conditions</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {hero.conditions.map((c, i) => (
              <span key={i} style={C.tag('#6a1a3a')}>
                {typeof c === 'string' ? c : c.type}
                {c.duration && c.duration < 99 ? ` (${c.duration}t)` : ''}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
