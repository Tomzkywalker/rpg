export const ITEM_CONFIG = {
  quality: {
    baseMultiplier: 0.50,
    divisor: 100,
  },

  affix: {
    baseBonus: 1,
    growthPerLevel: 0.10,
  },

  rarity: {
    common: {
      mainStatMultiplier: 1.00,
      affixCount: 0,
    },

    uncommon: {
      mainStatMultiplier: 1.15,
      affixCount: 1,
      affixMinMultiplier: 0.75,
      affixMaxMultiplier: 1.00,
    },

    rare: {
      mainStatMultiplier: 1.35,
      affixCount: 2,
      affixMinMultiplier: 1.00,
      affixMaxMultiplier: 1.40,
    },

    epic: {
      mainStatMultiplier: 1.60,
      affixCount: 3,
      affixMinMultiplier: 1.40,
      affixMaxMultiplier: 2.00,
    },

    legendary: {
      mainStatMultiplier: 1.90,
      affixCount: 4,
      affixMinMultiplier: 2.00,
      affixMaxMultiplier: 3.00,
    },

    mythical: {
      mainStatMultiplier: 2.25,
      affixCount: 4,
      affixMinMultiplier: 2.75,
      affixMaxMultiplier: 4.00,
    },
  },

  baseline: {
    weapon: {
      baseValue: 4,
      growthPerLevel: 0.50,
    },

    armor: {
      baseValue: 4,
      growthPerLevel: 0.30,
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
      growthPerLevel: 0.20,
    },

    quiver: {
      baseValue: 2,
      growthPerLevel: 0.20,
    },

    tome: {
      baseValue: 2,
      growthPerLevel: 0.20,
    },

    necklace: {
      baseValue: 10,
      growthPerLevel: 2.00,
    },

    bracelet: {
      baseValue: 2,
      growthPerLevel: 0.20,
    },

    ring: {
      baseValue: 2,
      growthPerLevel: 0.20,
    },
  },
} as const