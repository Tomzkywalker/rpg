export const LEVELING_CONFIG = {
  initialLevel: 1,
  initialExp: 0,

  exp: {
    base: 100,
    growth: 1.34,
  },

  statusPointsPerLevel: 5,
  statIncreasePerPoint: 1,

  death: {
    expPenaltyRate: 0.01,
    minimumExp: 0,
  },
} as const