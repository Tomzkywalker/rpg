import { MAP_CONFIG } from '../config/map.config'
import { MONSTER_CONFIG } from '../config/monster.config'

export interface Monster {
  name: string
  level: number
  maxHp: number
  attack: number
  hit: number
  flee: number
  exp: number
  gold: number
}

const monsterNames = [
  'Slime',
  'Goblin',
  'Wolf',
  'Orc',
  'Lizardman',
  'Golem',
  'Wraith',
  'Minotaur',
  'Demon',
  'Dragonkin',
]

const mapLevelRanges = Object.values(MAP_CONFIG)

function getMonsterTier(level: number): number {
  const tier = mapLevelRanges.findIndex((range) => level >= range.minLevel && level <= range.maxLevel)

  if (tier === -1) {
    return monsterNames.length - 1
  }

  return Math.min(tier, monsterNames.length - 1)
}

export function createMonster(minLevel: number, maxLevel: number): Monster {
  const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel

  const tier = getMonsterTier(level)
  const config = MONSTER_CONFIG

  return {
    name: monsterNames[tier],
    level,

    maxHp: Math.round(config.hp.base + level * config.hp.perLevel + Math.pow(level, 2) * config.hp.quadraticPerLevel),

    attack: Math.round(config.attack.base + level * config.attack.perLevel),

    hit: Math.round(config.hit.base + level * config.hit.perLevel),

    flee: Math.round(config.flee.base + level * config.flee.perLevel),

    exp: Math.round(config.exp.base + level * config.exp.perLevel + Math.pow(level, 2) * config.exp.quadraticPerLevel),

    gold: Math.round(config.gold.base + level * config.gold.perLevel),
  }
}
