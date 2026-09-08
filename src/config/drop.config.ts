export const DROP_CONFIG = {
  equipmentChance: 0.1,

  rarity: {
    common: 0.639,
    uncommon: 0.2,
    rare: 0.1,
    epic: 0.05,
    legendary: 0.01,
    mythical: 0.001,
  },

  quality: {
    min: 1,
    max: 100,
  },
} as const
