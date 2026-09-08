export const STATS_CONFIG = {
  initial: {
    STR: 5,
    AGI: 5,
    VIT: 5,
    INT: 5,
    DEX: 5,
    LUK: 5,
  },

  hp: {
    base: 75,
    perVit: 5,
    perLevel: 3,
  },

  mp: {
    base: 25,
    perInt: 3,
    perLevel: 1,
  },

  attack: {
    base: 9,
    perStr: 2.4,
    perLevel: 0.8,
  },

  defense: {
    perVit: 0.55,
    perLevel: 0.15,
  },

  magicAttack: {
    base: 5,
    perInt: 2.2,
    perLevel: 0.7,
  },

  magicDefense: {
    perInt: 0.35,
    perVit: 0.25,
    perLevel: 0.15,
  },

  hit: {
    base: 75,
    perDex: 2,
    perLevel: 1,
  },

  flee: {
    base: 5,
    perAgi: 1.5,
    perLevel: 0.5,
  },

  critical: {
    base: 5,
    perLuk: 0.4,
    max: 40,
  },

  attackSpeed: {
    base: 100,
    perAgi: 1.5,
    perDex: 0.3,
    max: 200,
  },
} as const
