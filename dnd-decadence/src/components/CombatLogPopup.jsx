import { C } from '../styles.js';

// Displays a burst of narrative text (fatten-burst prose, spell impact, etc.)
// Dismisses on click or Enter.
export default function CombatLogPopup({ lines, onClose }) {
  if (!lines || !lines.length) return null;

  return (
    <div style={C.overlay} onClick={onClose}>
      <div
        style={{
          ...C.modal,
          maxWidth: 500,
          cursor: 'pointer',
          background: '#0a0518',
          border: '1px solid #7030d0',
          boxShadow: '0 0 80px rgba(120,40,200,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#5020a0', marginBottom: 14, textTransform: 'uppercase' }}>
          ⚔ Combat Event
        </div>
        {lines.map((line, i) => (
          <p
            key={i}
            style={{
              fontSize: 14,
              lineHeight: 1.75,
              color: '#d4c8a8',
              marginBottom: i < lines.length - 1 ? 10 : 0,
              fontStyle: i === 0 ? 'italic' : 'normal',
            }}
          >
            {line}
          </p>
        ))}
        <button onClick={onClose} style={{ ...C.btn(), marginTop: 18, width: '100%' }}>
          Continue →
        </button>
      </div>
    </div>
  );
}
