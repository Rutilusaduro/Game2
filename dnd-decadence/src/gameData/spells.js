// ═══════════════════════════════════════════════════════════════
// SPELLS — all 33 spells as pure data. Phase 1 implements Warlock (11).
// Remaining classes stubbed; Phase 3 fills them out.
//
// Effect shape:
//   damageDice  — "1d10" etc. (optional)
//   damageType  — force | psychic | radiant | piercing
//   fattenRange — [min, max] lbs (optional); save halves
//   saveType    — CON | DEX | WIS (if undefined, no save)
//   saveDC      — override (default: caster spellSaveDC)
//   onSaveFail  — condition string applied on failed save (optional)
//   onSaveSuccess — condition string if save succeeds (optional)
//   applyCondition — condition always applied (optional)
//   dotLbs      — [min, max] lbs per turn (DoT, needs condition Hexed etc.)
//   dotDuration — turns for DoT
//   healSelfFraction — heal caster for this fraction of lbs dealt
//   aoe         — true if multi-target (Phase 2)
// ═══════════════════════════════════════════════════════════════

export const SPELLS = {
  // ── WARLOCK — Pact of the Endless Maw ──────────────────────

  eldritch_glut: {
    id: 'eldritch_glut',
    name: 'Eldritch Glut',
    level: 0,
    classId: 'warlock',
    damageType: 'force',
    damageDice: '1d10',
    fattenRange: [1, 3],
    description: 'Force energy hunger-blasts a foe, dealing 1d10 force + 1–3 lbs.',
  },

  sating_whisper: {
    id: 'sating_whisper',
    name: 'Sating Whisper',
    level: 0,
    classId: 'warlock',
    damageType: 'psychic',
    damageDice: '1d6',
    hungerRaise: 1,
    description: 'Psychic compulsion deals 1d6 and raises target hunger tier by 1.',
  },

  hex_of_hunger: {
    id: 'hex_of_hunger',
    name: 'Hex of Hunger',
    level: 1,
    classId: 'warlock',
    applyCondition: 'Hexed',
    dotLbs: [2, 5],
    dotDuration: 3,
    description: 'Curse: +2–5 lbs/turn for 3 turns; target has disadv on CON saves vs fatten.',
  },

  famished_grasp: {
    id: 'famished_grasp',
    name: 'Famished Grasp',
    level: 1,
    classId: 'warlock',
    damageType: 'piercing',
    damageDice: '2d6',
    fattenRange: [3, 6],
    pullFt: 10,
    description: 'Bite attack that pulls the target 10 ft and deals 2d6 + 3–6 lbs.',
  },

  engorging_bolt: {
    id: 'engorging_bolt',
    name: 'Engorging Bolt',
    level: 2,
    classId: 'warlock',
    fattenRange: [3, 8],
    saveType: 'CON',
    onSaveFail: 'Slowed',
    description: '+3–8 lbs; CON save or also Slowed.',
  },

  mind_feast: {
    id: 'mind_feast',
    name: 'Mind Feast',
    level: 2,
    classId: 'warlock',
    damageType: 'psychic',
    scalesWithGirth: true,
    description: 'Psychic damage scaling with target girth tier (1d6 per tier).',
  },

  suffocating_bloat: {
    id: 'suffocating_bloat',
    name: 'Suffocating Bloat',
    level: 2,
    classId: 'warlock',
    fattenRange: [4, 8],
    saveType: 'CON',
    aoe: true,
    description: 'AoE +4–8 lbs (CON save halves).',
  },

  gluttonous_plague: {
    id: 'gluttonous_plague',
    name: 'Gluttonous Plague',
    level: 3,
    classId: 'warlock',
    applyCondition: 'Plagued',
    dotLbs: [4, 8],
    dotDuration: 4,
    plagueSpread: true,
    description: 'Girth DoT that spreads when target tiers up.',
  },

  pact_devourer: {
    id: 'pact_devourer',
    name: 'Pact Devourer',
    level: 3,
    classId: 'warlock',
    summon: 'maw',
    summonDuration: 3,
    description: 'Summons a Maw for 3 turns that bites + fattens a foe each turn.',
  },

  curse_bottomless_belly: {
    id: 'curse_bottomless_belly',
    name: 'Curse of the Bottomless Belly',
    level: 3,
    classId: 'warlock',
    applyCondition: 'CursedFed',
    escalatingDot: true,
    saveType: 'CON',
    description: 'Escalating self-feed lbs/turn until CON save ends it.',
  },

  eldritch_gorge: {
    id: 'eldritch_gorge',
    name: 'Eldritch Gorge',
    level: 3,
    classId: 'warlock',
    fattenRange: [12, 20],
    saveType: 'CON',
    healSelfFraction: 0.3,
    description: 'Heavy single fatten 12–20 lbs (save halves); heal self 30% of lbs dealt.',
  },

  // ── SORCERER — Gourmand Bloodline ──────────────────────────

  butter_bolt: {
    id: 'butter_bolt',
    name: 'Butter Bolt',
    level: 0,
    classId: 'sorcerer',
    damageType: 'force',
    damageDice: '1d8',
    fattenRange: [1, 3],
    description: '1d8 force + 1–3 lbs.',
  },

  cream_jet: {
    id: 'cream_jet',
    name: 'Cream Jet',
    level: 0,
    classId: 'sorcerer',
    fattenRange: [2, 4],
    lineFt: 15,
    applyCondition: 'DifficultTerrain',
    description: '15 ft line, 2–4 lbs + difficult terrain.',
  },

  fattening_missiles: {
    id: 'fattening_missiles',
    name: 'Fattening Missiles',
    level: 1,
    classId: 'sorcerer',
    autoHit: true,
    missiles: 3,
    lbsPerMissile: 2,
    description: '3 auto-hit darts, 2 lbs each (6 lbs total).',
  },

  caloric_surge: {
    id: 'caloric_surge',
    name: 'Caloric Surge',
    level: 1,
    classId: 'sorcerer',
    selfBuff: 'CaloricSurge',
    description: 'Self buff: next fattening spell +50% lbs.',
  },

  lard_lance: {
    id: 'lard_lance',
    name: 'Lard Lance',
    level: 2,
    classId: 'sorcerer',
    fattenRange: [4, 10],
    bypassSavePartial: true,
    description: 'Single-target 4–10 lbs, partially bypasses resistance.',
  },

  syrup_web: {
    id: 'syrup_web',
    name: 'Syrup Web',
    level: 2,
    classId: 'sorcerer',
    saveType: 'DEX',
    onSaveFail: 'Restrained',
    dotLbs: [2, 4],
    dotDuration: 3,
    aoe: true,
    description: 'AoE DEX save or Restrained + 2–4 lbs/turn.',
  },

  rich_infusion: {
    id: 'rich_infusion',
    name: 'Rich Infusion',
    level: 2,
    classId: 'sorcerer',
    overcharge: true,
    description: 'Spend sorcery pts to overcharge a spell (+lbs/+area).',
  },

  banquet_bomb: {
    id: 'banquet_bomb',
    name: 'Banquet Bomb',
    level: 3,
    classId: 'sorcerer',
    fattenRange: [6, 12],
    saveType: 'DEX',
    onSaveFail: 'Prone',
    aoe: true,
    description: 'AoE 6–12 lbs + DEX save or Prone.',
  },

  gluttons_nova: {
    id: 'gluttons_nova',
    name: "Glutton's Nova",
    level: 3,
    classId: 'sorcerer',
    fattenRange: [5, 10],
    scalesWithGirth: true,
    aoe: true,
    casterImmune: true,
    description: 'Radial scaling fatten, caster immune.',
  },

  chain_gorging: {
    id: 'chain_gorging',
    name: 'Chain Gorging',
    level: 3,
    classId: 'sorcerer',
    chain: true,
    chainMax: 3,
    fattenRange: [8, 14],
    chainDiminishing: true,
    description: 'Bounces up to 3 foes, fattening each (diminishing lbs).',
  },

  wild_gut_surge: {
    id: 'wild_gut_surge',
    name: 'Wild Gut Surge',
    level: 3,
    classId: 'sorcerer',
    wildTable: true,
    description: 'Roll wild table: random strong fatten/utility effect.',
  },

  // ── CLERIC — Domain of the Eternal Feast ───────────────────

  sacred_morsel: {
    id: 'sacred_morsel',
    name: 'Sacred Morsel',
    level: 0,
    classId: 'cleric',
    damageType: 'radiant',
    damageDice: '1d8',
    fattenRange: [1, 3],
    allyHeal: '1d8',
    description: 'Radiant 1d8 to foe (+1–3 lbs) OR heal ally 1d8.',
  },

  blessed_bounty: {
    id: 'blessed_bounty',
    name: 'Blessed Bounty',
    level: 0,
    classId: 'cleric',
    allyBuff: 'BlessedBounty',
    description: 'Buff ally: next fattening effect +lbs & heals them.',
  },

  comfort_food: {
    id: 'comfort_food',
    name: 'Comfort Food',
    level: 1,
    classId: 'cleric',
    healDice: '1d8',
    removeCondition: true,
    description: 'Heal 1d8+mod + remove one condition.',
  },

  divine_stuffing: {
    id: 'divine_stuffing',
    name: 'Divine Stuffing',
    level: 1,
    classId: 'cleric',
    damageType: 'radiant',
    damageDice: '2d6',
    fattenRange: [3, 6],
    saveType: 'CON',
    description: 'Radiant 2d6 + 3–6 lbs (CON save halves lbs).',
  },

  hymn_of_plenty: {
    id: 'hymn_of_plenty',
    name: 'Hymn of Plenty',
    level: 2,
    classId: 'cleric',
    partyRegen: 2,
    enemyHungerRaise: 1,
    aura: true,
    description: 'Party regen/turn + foes gain hunger.',
  },

  sanctified_gavage: {
    id: 'sanctified_gavage',
    name: 'Sanctified Gavage',
    level: 2,
    classId: 'cleric',
    fattenRange: [6, 12],
    saveType: 'CON',
    onSaveFail: 'Stunned',
    description: 'Force-feed 6–12 lbs; CON save or Stunned.',
  },

  aura_of_satiation: {
    id: 'aura_of_satiation',
    name: 'Aura of Satiation',
    level: 2,
    classId: 'cleric',
    partyResistance: 'fatten',
    aura: true,
    description: 'Party resistance to fattening effects.',
  },

  feast_of_the_faithful: {
    id: 'feast_of_the_faithful',
    name: 'Feast of the Faithful',
    level: 3,
    classId: 'cleric',
    massHeal: '3d8',
    partyDamageBuff: true,
    partyGirthBuff: true,
    description: 'Mass heal + party damage/girth buff.',
  },

  famine_ward: {
    id: 'famine_ward',
    name: 'Famine Ward',
    level: 3,
    classId: 'cleric',
    ward: 'Warded',
    absorbDmg: true,
    blockNextFatten: true,
    description: 'Ward an ally: absorb damage / block next fatten.',
  },

  judgment_of_gluttony: {
    id: 'judgment_of_gluttony',
    name: 'Judgment of Gluttony',
    level: 3,
    classId: 'cleric',
    damageType: 'radiant',
    damageDice: '4d6',
    heavyImmobilize: true,
    description: 'Radiant 4d6; foes at Heavy+ become Immobilized.',
  },

  mass_engorgement: {
    id: 'mass_engorgement',
    name: 'Mass Engorgement',
    level: 3,
    classId: 'cleric',
    fattenRange: [8, 14],
    saveType: 'CON',
    aoe: true,
    description: 'AoE 8–14 lbs (CON save halves).',
  },
};

// Spells available by class, ordered cantrip→L3.
export const CLASS_SPELLS = {
  warlock: [
    'eldritch_glut','sating_whisper',
    'hex_of_hunger','famished_grasp',
    'engorging_bolt','mind_feast','suffocating_bloat',
    'gluttonous_plague','pact_devourer','curse_bottomless_belly','eldritch_gorge',
  ],
  sorcerer: [
    'butter_bolt','cream_jet',
    'fattening_missiles','caloric_surge',
    'lard_lance','syrup_web','rich_infusion',
    'banquet_bomb','gluttons_nova','chain_gorging','wild_gut_surge',
  ],
  cleric: [
    'sacred_morsel','blessed_bounty',
    'comfort_food','divine_stuffing',
    'hymn_of_plenty','sanctified_gavage','aura_of_satiation',
    'feast_of_the_faithful','famine_ward','judgment_of_gluttony','mass_engorgement',
  ],
};
