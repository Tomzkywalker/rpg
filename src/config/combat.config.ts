export const COMBAT_CONFIG = {
  hitChance: {
    base: 80,
    min: 5,
    max: 95,
    statDifferenceMultiplier: 0.5,
  },

  criticalDamageMultiplier: 1.7,

  playerDamage: {
    min: 1,
    randomBonusMax: 8,
  },

  monsterDamage: {
    min: 1,
    randomBonusMax: 5,
  },

  playerAttackInterval: {
    baseMs: 1000,
    reductionPerAspd: 5,
    minimumMs: 250,
  },

  monsterAttackIntervalMs: 1000,

  nextMonsterDelayMs: 650,
  deathRespawnDelayMs: 900,

  battleLogMaxEntries: 30,
} as const
