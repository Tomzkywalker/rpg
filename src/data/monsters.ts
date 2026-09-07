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

export function createMonster(
  minLevel: number,
  maxLevel: number,
): Monster {
  const level =
    Math.floor(Math.random() * (maxLevel - minLevel + 1)) +
    minLevel

  const tier = Math.min(
    Math.floor((level - 1) / 10),
    monsterNames.length - 1,
  )

  return {
    name: monsterNames[tier],
    level,

    maxHp: Math.round(
      35 +
        level * 13 +
        Math.pow(level, 2) * 0.75,
    ),

    attack: Math.round(
      6 + level * 2.2,
    ),

    hit: Math.round(
      70 + level * 2,
    ),

    flee: Math.round(
      5 + level * 1.2,
    ),

    exp: Math.round(
      25 +
        level * 20 +
        Math.pow(level, 2) * 1.2,
    ),

    gold: Math.round(
      5 + level * 3.2,
    ),
  }
}