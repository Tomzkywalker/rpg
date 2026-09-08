export const ITEM_CONFIG = {
  quality: {
    baseMultiplier: 0.5,
    divisor: 100,
  },

  affix: {
    baseBonus: 1,
    growthPerLevel: 0.1,
  },

  rarity: {
    common: {
      mainStatMultiplier: 1.0,
      affixCount: 0,
    },

    uncommon: {
      mainStatMultiplier: 1.15,
      affixCount: 1,
      affixMinMultiplier: 0.75,
      affixMaxMultiplier: 1.0,
    },

    rare: {
      mainStatMultiplier: 1.35,
      affixCount: 2,
      affixMinMultiplier: 1.0,
      affixMaxMultiplier: 1.4,
    },

    epic: {
      mainStatMultiplier: 1.6,
      affixCount: 3,
      affixMinMultiplier: 1.4,
      affixMaxMultiplier: 2.0,
    },

    legendary: {
      mainStatMultiplier: 1.9,
      affixCount: 4,
      affixMinMultiplier: 2.0,
      affixMaxMultiplier: 3.0,
    },

    mythical: {
      mainStatMultiplier: 2.25,
      affixCount: 4,
      affixMinMultiplier: 2.75,
      affixMaxMultiplier: 4.0,
    },
  },

  baseline: {
    weapon: {
      baseValue: 4,
      growthPerLevel: 0.5,
    },

    armor: {
      baseValue: 4,
      growthPerLevel: 0.3,
    },

    head: {
      baseValue: 2,
      growthPerLevel: 0.15,
    },

    gloves: {
      baseValue: 2,
      growthPerLevel: 0.15,
    },

    boots: {
      baseValue: 2,
      growthPerLevel: 0.15,
    },

    shield: {
      baseValue: 2,
      growthPerLevel: 0.25,
    },

    offhandDagger: {
      baseValue: 2,
      growthPerLevel: 0.2,
    },

    quiver: {
      baseValue: 2,
      growthPerLevel: 0.2,
    },

    tome: {
      baseValue: 2,
      growthPerLevel: 0.2,
    },

    necklace: {
      baseValue: 10,
      growthPerLevel: 2.0,
    },

    bracelet: {
      baseValue: 2,
      growthPerLevel: 0.2,
    },

    ring: {
      baseValue: 2,
      growthPerLevel: 0.2,
    },
  },
} as const
