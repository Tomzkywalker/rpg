import { MAP_CONFIG } from '../config/map.config'
import { MONSTER_CONFIG } from '../config/monster.config'

export interface Monster {
  name: string
  level: number
  maxHp: number
  attack: number
  defense: number
  magicDefense: number
  hit: number
  flee: number
  exp: number
  gold: number
}

interface MonsterProfile {
  name: string
  defenseMultiplier: number
  magicDefenseMultiplier: number
}

const monsterProfiles: MonsterProfile[] = [
  {
    name: 'Slime',
    defenseMultiplier: 0.75,
    magicDefenseMultiplier: 1.25,
  },

  {
    name: 'Goblin',
    defenseMultiplier: 1,
    magicDefenseMultiplier: 0.9,
  },

  {
    name: 'Wolf',
    defenseMultiplier: 0.7,
    magicDefenseMultiplier: 1.1,
  },

  {
    name: 'Orc',
    defenseMultiplier: 1.35,
    magicDefenseMultiplier: 0.7,
  },

  {
    name: 'Lizardman',
    defenseMultiplier: 1.2,
    magicDefenseMultiplier: 0.85,
  },

  {
    name: 'Golem',
    defenseMultiplier: 1.6,
    magicDefenseMultiplier: 0.55,
  },

  {
    name: 'Wraith',
    defenseMultiplier: 0.55,
    magicDefenseMultiplier: 1.6,
  },

  {
    name: 'Minotaur',
    defenseMultiplier: 1.4,
    magicDefenseMultiplier: 0.75,
  },

  {
    name: 'Demon',
    defenseMultiplier: 0.9,
    magicDefenseMultiplier: 1.35,
  },

  {
    name: 'Dragonkin',
    defenseMultiplier: 1.15,
    magicDefenseMultiplier: 1.15,
  },
]

const mapLevelRanges = Object.values(MAP_CONFIG)

function getMonsterTier(level: number): number {
  const tier = mapLevelRanges.findIndex(
    (range) =>
      level >= range.minLevel &&
      level <= range.maxLevel,
  )

  if (tier === -1) {
    return monsterProfiles.length - 1
  }

  return Math.min(tier, monsterProfiles.length - 1)
}

export function createMonster(
  minLevel: number,
  maxLevel: number,
): Monster {
  const level =
    Math.floor(Math.random() * (maxLevel - minLevel + 1)) +
    minLevel

  const tier = getMonsterTier(level)
  const profile = monsterProfiles[tier]
  const config = MONSTER_CONFIG

  const baseDefense =
    config.defense.base +
    level * config.defense.perLevel

  const baseMagicDefense =
    config.magicDefense.base +
    level * config.magicDefense.perLevel

  return {
    name: profile.name,
    level,

    maxHp: Math.round(
      config.hp.base +
        level * config.hp.perLevel +
        Math.pow(level, 2) *
          config.hp.quadraticPerLevel,
    ),

    attack: Math.round(
      config.attack.base +
        level * config.attack.perLevel,
    ),

    defense: Math.max(
      0,
      Math.round(
        baseDefense * profile.defenseMultiplier,
      ),
    ),

    magicDefense: Math.max(
      0,
      Math.round(
        baseMagicDefense *
          profile.magicDefenseMultiplier,
      ),
    ),

    hit: Math.round(
      config.hit.base +
        level * config.hit.perLevel,
    ),

    flee: Math.round(
      config.flee.base +
        level * config.flee.perLevel,
    ),

    exp: Math.round(
      config.exp.base +
        level * config.exp.perLevel +
        Math.pow(level, 2) *
          config.exp.quadraticPerLevel,
    ),

    gold: Math.round(
      config.gold.base +
        level * config.gold.perLevel,
    ),
  }
}