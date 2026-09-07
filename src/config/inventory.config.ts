export const INVENTORY_CONFIG = {
  defaultCapacity: 100,

  sellPrice: {
    basePerLevel: 2,

    rarityMultiplier: {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      epic: 5.0,
      legendary: 10.0,
      mythical: 25.0,
    },
  },
} as const