export const MONSTER_CONFIG = {
  hp: {
    base: 35,
    perLevel: 13,
    quadraticPerLevel: 0.75,
  },

  attack: {
    base: 6,
    perLevel: 2.2,
  },

  hit: {
    base: 70,
    perLevel: 2,
  },

  flee: {
    base: 5,
    perLevel: 1.2,
  },

  exp: {
    base: 25,
    perLevel: 20,
    quadraticPerLevel: 1.2,
  },

  gold: {
    base: 5,
    perLevel: 3.2,
  },
} as const