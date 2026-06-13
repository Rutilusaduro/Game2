import { useState } from 'react';
import { CLASSES } from '../gameData/classes.js';
import { ANCESTRIES } from '../gameData/character.js';
import { C } from '../styles.js';

export default function CharCreateModal({ onConfirm }) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('warlock');
  const [ancestry, setAncestry] = useState('human');

  const cls = CLASSES[classId];

  return (
    <div style={C.overlay}>
      <div style={{ ...C.modal, maxWidth: 560 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#c090ff', marginBottom: 18, textAlign: 'center' }}>
          ⚔ Dungeons &amp; Decadence
        </div>
        <div style={{ color: '#9070c0', fontSize: 12, textAlign: 'center', marginBottom: 20, letterSpacing: 1 }}>
          CREATE YOUR CHARACTER
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <div style={C.secT}>Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #4a1280',
              color: '#ddd0b8', borderRadius: 6, padding: '8px 12px', fontSize: 14,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Class */}
        <div style={{ marginBottom: 14 }}>
          <div style={C.secT}>Class</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.values(CLASSES).map(c => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                style={{
                  ...C.smBtn,
                  background: classId === c.id ? 'rgba(120,40,200,0.5)' : undefined,
                  border: classId === c.id ? '1px solid #9040e0' : undefined,
                  color: classId === c.id ? '#e0b0ff' : undefined,
                  padding: '8px 14px', fontSize: 13,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          {cls && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#9070c0', lineHeight: 1.6, padding: '8px 12px', background: 'rgba(80,20,140,0.15)', borderRadius: 6 }}>
              <strong style={{ color: '#c090ff' }}>{cls.name}</strong> — <em>{cls.subclass}</em>
              <div style={{ marginTop: 4 }}>{cls.flavor}</div>
            </div>
          )}
        </div>

        {/* Ancestry */}
        <div style={{ marginBottom: 20 }}>
          <div style={C.secT}>Ancestry</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ANCESTRIES.map(a => (
              <button
                key={a.id}
                onClick={() => setAncestry(a.id)}
                style={{
                  ...C.smBtn,
                  background: ancestry === a.id ? 'rgba(120,40,200,0.5)' : undefined,
                  border: ancestry === a.id ? '1px solid #9040e0' : undefined,
                  color: ancestry === a.id ? '#e0b0ff' : undefined,
                  padding: '6px 12px',
                }}
              >
                {a.name}
                <span style={{ color: '#7050a0', marginLeft: 6, fontSize: 10 }}>{a.flavor}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => name.trim() && onConfirm({ name: name.trim(), classId, ancestry })}
          disabled={!name.trim()}
          style={{ ...C.btn(), width: '100%', padding: '12px', fontSize: 15, opacity: name.trim() ? 1 : 0.4 }}
        >
          Enter the Dungeon
        </button>
      </div>
    </div>
  );
}
