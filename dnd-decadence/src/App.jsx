import { useState } from 'react';
import { C } from './styles.js';
import CharCreateModal from './components/CharCreateModal.jsx';
import CharacterSheet from './components/CharacterSheet.jsx';
import CombatView from './components/CombatView.jsx';
import { createHero } from './gameData/character.js';
import { instantiateEnemy } from './gameData/enemies.js';
import { startCombat } from './combat/combat.js';
// Ensure all scene pools are registered
import './textEngine/scenes/index.js';

export default function App() {
  const [screen, setScreen] = useState('charCreate');  // 'charCreate' | 'prep' | 'combat' | 'victory' | 'defeat'
  const [hero, setHero] = useState(null);
  const [combatState, setCombatState] = useState(null);
  const [_combatResult, setCombatResult] = useState(null);

  function handleCharCreate(opts) {
    const newHero = createHero(opts);
    setHero(newHero);
    setScreen('prep');
  }

  function startEncounter() {
    const enemy = instantiateEnemy('overfed_goblin_chief');
    const state = startCombat(hero, [enemy]);
    setCombatState(state);
    setScreen('combat');
  }

  function handleCombatEnd({ result, hero: updatedHero }) {
    setHero(updatedHero);
    setCombatResult(result);
    setScreen(result === 'victory' ? 'victory' : 'defeat');
  }

  // ── Screens ───────────────────────────────────────────────

  if (screen === 'charCreate') {
    return <CharCreateModal onConfirm={handleCharCreate} />;
  }

  if (screen === 'prep') {
    return (
      <div style={C.app}>
        {/* Header */}
        <div style={C.hdr}>
          <span style={{ fontWeight: 700, color: '#c090ff', fontSize: 16 }}>⚔ Dungeons &amp; Decadence</span>
        </div>
        <div style={{ ...C.body }}>
          {/* Hero sheet */}
          <div style={{ ...C.side, width: 280 }}>
            <CharacterSheet hero={hero} />
          </div>
          {/* Encounter prompt */}
          <div style={C.main}>
            <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#c090ff', marginBottom: 12 }}>
                A Dungeon Awaits
              </div>
              <div style={{ fontSize: 14, color: '#9070a0', lineHeight: 1.75, marginBottom: 24 }}>
                Deep in the tunnels beneath the Feasting Caverns, the <strong style={{ color: '#c090ff' }}>Overfed Goblin Chief</strong> guards
                her feast-hall with jealous fury — and with the enormous mass she has accumulated over years of enchanted gluttony.
                <br /><br />
                She is already <strong style={{ color: '#c07010' }}>Enormous</strong> and <strong style={{ color: '#982808' }}>Restrained</strong> by her own weight.
                Fatten her past the Colossal threshold to <strong style={{ color: '#c090ff' }}>incapacitate her without killing her</strong>,
                or simply drive her HP to zero. Your choice.
              </div>
              <button onClick={startEncounter} style={{ ...C.btn('#7030d0'), padding: '14px 32px', fontSize: 16 }}>
                Enter Combat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'combat' && combatState) {
    return (
      <CombatView
        initialState={combatState}
        onEnd={handleCombatEnd}
      />
    );
  }

  if (screen === 'victory') {
    return (
      <div style={{ ...C.app, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...C.modal, textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 28, color: '#c090ff', marginBottom: 12 }}>✦ Victory ✦</div>
          <p style={{ color: '#d4c8a8', lineHeight: 1.75, marginBottom: 20 }}>
            The Overfed Goblin Chief lies incapacitated — defeated by spell, by girth, by the will of your patron.
            The feast-hall is yours.
          </p>
          <div style={{ fontSize: 12, color: '#6040a0', marginBottom: 20 }}>
            {hero && `${hero.name} survives. HP: ${hero.hp}/${hero.maxHp} · ${hero.lbs} lbs`}
          </div>
          <button onClick={() => { setScreen('charCreate'); setHero(null); setCombatState(null); }} style={{ ...C.btn(), padding: '10px 24px' }}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'defeat') {
    return (
      <div style={{ ...C.app, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...C.modal, textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 28, color: '#982808', marginBottom: 12 }}>✦ Defeated ✦</div>
          <p style={{ color: '#d4c8a8', lineHeight: 1.75, marginBottom: 20 }}>
            The dungeon claims you — for now. The Goblin Chief's laugh echoes through the cavern.
            You will have to retreat, recover, and try again.
          </p>
          <div style={{ fontSize: 12, color: '#6040a0', marginBottom: 20 }}>
            {hero && `${hero.name} falls. HP: ${hero.hp}/${hero.maxHp} · ${hero.lbs} lbs`}
          </div>
          <button onClick={() => { setScreen('charCreate'); setHero(null); setCombatState(null); }} style={{ ...C.btn(), padding: '10px 24px' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
