import { DROP_CONFIG } from '../config/drop.config'
import { ITEM_CONFIG } from '../config/item.config'

import {
  ACCESSORY_EQUIPMENT,
  CLASS_EQUIPMENT,
  getAccessoryFamily,
  getEquipmentFamily,
  type EquipmentDefinition,
} from '../data/items'

import type {
  BaseStat,
  CharacterClass,
  Equipment,
  EquipmentAffix,
  EquipmentRarity,
} from '../types/equipment'

const CHARACTER_CLASSES: CharacterClass[] = [
  'warrior',
  'assassin',
  'archer',
  'mage',
]

const BASE_STATS: BaseStat[] = [
  'STR',
  'AGI',
  'VIT',
  'INT',
  'DEX',
  'LUK',
]

const RARITY_ORDER: EquipmentRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythical',
]

function randomInt(
  min: number,
  max: number,
): number {
  return (
    Math.floor(
      Math.random() * (max - min + 1),
    ) + min
  )
}

function randomArrayItem<T>(
  items: readonly T[],
): T {
  return items[
    randomInt(0, items.length - 1)
  ] as T
}

function createEquipmentId(): string {
  return crypto.randomUUID()
}

export function shouldDropEquipment(): boolean {
  return Math.random() < DROP_CONFIG.equipmentChance
}

export function rollRarity(): EquipmentRarity {
  const roll = Math.random()

  let cumulativeChance = 0

  for (const rarity of RARITY_ORDER) {
    cumulativeChance +=
      DROP_CONFIG.rarity[rarity]

    if (roll < cumulativeChance) {
      return rarity
    }
  }

  return 'common'
}

export function rollQuality(): number {
  return randomInt(
    DROP_CONFIG.quality.min,
    DROP_CONFIG.quality.max,
  )
}

function rollCharacterClass(): CharacterClass {
  return randomArrayItem(
    CHARACTER_CLASSES,
  )
}

function rollEquipmentDefinition(): {
  definition: EquipmentDefinition
  itemClass: CharacterClass
} {
  const itemClass =
    rollCharacterClass()

  const availableEquipment = [
    ...CLASS_EQUIPMENT[itemClass],
    ...ACCESSORY_EQUIPMENT,
  ]

  return {
    definition:
      randomArrayItem(
        availableEquipment,
      ),

    itemClass,
  }
}

function calculateMainStat(
  definition: EquipmentDefinition,
  itemLevel: number,
  rarity: EquipmentRarity,
  quality: number,
): number {
  const baseline =
    ITEM_CONFIG.baseline[
      definition.baselineKey
    ]

  const rarityConfig =
    ITEM_CONFIG.rarity[rarity]

  const baseCombatStat = Math.floor(
    baseline.baseValue +
      itemLevel *
        baseline.growthPerLevel,
  )

  const qualityMultiplier =
    ITEM_CONFIG.quality.baseMultiplier +
    quality /
      ITEM_CONFIG.quality.divisor

  return Math.floor(
    baseCombatStat *
      rarityConfig.mainStatMultiplier *
      qualityMultiplier,
  )
}

function rollAffixValue(
  itemLevel: number,
  rarity: EquipmentRarity,
): number {
  const rarityConfig =
    ITEM_CONFIG.rarity[rarity]

  if (
    !(
      'affixMinMultiplier' in
      rarityConfig
    ) ||
    !(
      'affixMaxMultiplier' in
      rarityConfig
    )
  ) {
    return 0
  }

  const baseBonus =
    ITEM_CONFIG.affix.baseBonus +
    itemLevel *
      ITEM_CONFIG.affix.growthPerLevel

  const minBonus = Math.floor(
    baseBonus *
      rarityConfig.affixMinMultiplier,
  )

  const maxBonus = Math.ceil(
    baseBonus *
      rarityConfig.affixMaxMultiplier,
  )

  return randomInt(
    minBonus,
    maxBonus,
  )
}

function rollAffixes(
  itemLevel: number,
  rarity: EquipmentRarity,
): EquipmentAffix[] {
  const affixCount =
    ITEM_CONFIG.rarity[rarity].affixCount

  const affixes: EquipmentAffix[] = []

  for (
    let index = 0;
    index < affixCount;
    index += 1
  ) {
    affixes.push({
      stat:
        randomArrayItem(
          BASE_STATS,
        ),

      value:
        rollAffixValue(
          itemLevel,
          rarity,
        ),
    })
  }

  return affixes
}

function createEquipmentName(
  definition: EquipmentDefinition,
  itemClass: CharacterClass,
  itemLevel: number,
): string {
  if (
    definition.requiredClass === null
  ) {
    const family =
      getAccessoryFamily(
        itemLevel,
      )

    return `${family.name} ${definition.suffix}`
  }

  const family =
    getEquipmentFamily(
      itemLevel,
    )

  return `${family.names[itemClass]} ${definition.suffix}`
}

export function generateEquipment(
  monsterLevel: number,
): Equipment {
  const itemLevel =
    monsterLevel

  const rarity =
    rollRarity()

  const quality =
    rollQuality()

  const {
    definition,
    itemClass,
  } =
    rollEquipmentDefinition()

  return {
    id:
      createEquipmentId(),

    name:
      createEquipmentName(
        definition,
        itemClass,
        itemLevel,
      ),

    type:
      definition.type,

    slot:
      definition.slot,

    requiredClass:
      definition.requiredClass,

    level:
      itemLevel,

    rarity,

    quality,

    mainStat:
      definition.mainStat,

    mainStatValue:
      calculateMainStat(
        definition,
        itemLevel,
        rarity,
        quality,
      ),

    affixes:
      rollAffixes(
        itemLevel,
        rarity,
      ),

    locked: false,
  }
}

export function rollEquipmentDrop(
  monsterLevel: number,
): Equipment | null {
  if (
    !shouldDropEquipment()
  ) {
    return null
  }

  return generateEquipment(
    monsterLevel,
  )
}