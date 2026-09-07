import type {
  CharacterClass,
  EquipmentMainStat,
  EquipmentSlot,
  EquipmentType,
} from '../types/equipment'

export interface EquipmentDefinition {
  type: EquipmentType
  slot: EquipmentSlot
  requiredClass: CharacterClass | null
  mainStat: EquipmentMainStat
  baselineKey:
    | 'weapon'
    | 'armor'
    | 'head'
    | 'gloves'
    | 'boots'
    | 'shield'
    | 'offhandDagger'
    | 'quiver'
    | 'tome'
    | 'necklace'
    | 'bracelet'
    | 'ring'
  suffix: string
}

export interface EquipmentFamily {
  minLevel: number
  maxLevel: number
  names: Record<CharacterClass, string>
}

export const EQUIPMENT_FAMILIES: EquipmentFamily[] = [
  {
    minLevel: 1,
    maxLevel: 10,
    names: {
      warrior: 'Iron',
      assassin: 'Fang',
      archer: 'Hunter',
      mage: 'Apprentice',
    },
  },
  {
    minLevel: 11,
    maxLevel: 20,
    names: {
      warrior: 'Steel',
      assassin: 'Shadow',
      archer: 'Ranger',
      mage: 'Arcane',
    },
  },
  {
    minLevel: 21,
    maxLevel: 30,
    names: {
      warrior: 'Knight',
      assassin: 'Night',
      archer: 'Falcon',
      mage: 'Mystic',
    },
  },
  {
    minLevel: 31,
    maxLevel: 40,
    names: {
      warrior: 'Royal',
      assassin: 'Venom',
      archer: 'Eagle',
      mage: 'Sage',
    },
  },
  {
    minLevel: 41,
    maxLevel: 50,
    names: {
      warrior: 'Crimson',
      assassin: 'Phantom',
      archer: 'Storm',
      mage: 'Runic',
    },
  },
  {
    minLevel: 51,
    maxLevel: 60,
    names: {
      warrior: 'Frost',
      assassin: 'Reaper',
      archer: 'Frostwind',
      mage: 'Glacial',
    },
  },
  {
    minLevel: 61,
    maxLevel: 70,
    names: {
      warrior: 'Infernal',
      assassin: 'Bloodfang',
      archer: 'Hellfire',
      mage: 'Infernal',
    },
  },
  {
    minLevel: 71,
    maxLevel: 80,
    names: {
      warrior: 'Celestial',
      assassin: 'Void',
      archer: 'Skyfall',
      mage: 'Astral',
    },
  },
  {
    minLevel: 81,
    maxLevel: 90,
    names: {
      warrior: 'Abyssal',
      assassin: 'Deathshade',
      archer: 'Abyss',
      mage: 'Void',
    },
  },
  {
    minLevel: 91,
    maxLevel: 100,
    names: {
      warrior: 'Dragon',
      assassin: 'Nightfall',
      archer: 'Dragonwing',
      mage: 'Ancient',
    },
  },
]

export const CLASS_EQUIPMENT: Record<
  CharacterClass,
  EquipmentDefinition[]
> = {
  warrior: [
    {
      type: 'sword',
      slot: 'weapon',
      requiredClass: 'warrior',
      mainStat: 'ATK',
      baselineKey: 'weapon',
      suffix: 'Sword',
    },
    {
      type: 'helmet',
      slot: 'head',
      requiredClass: 'warrior',
      mainStat: 'MDEF',
      baselineKey: 'head',
      suffix: 'Helmet',
    },
    {
      type: 'plateArmor',
      slot: 'armor',
      requiredClass: 'warrior',
      mainStat: 'DEF',
      baselineKey: 'armor',
      suffix: 'Plate Armor',
    },
    {
      type: 'gauntlets',
      slot: 'gloves',
      requiredClass: 'warrior',
      mainStat: 'MDEF',
      baselineKey: 'gloves',
      suffix: 'Gauntlets',
    },
    {
      type: 'greaves',
      slot: 'boots',
      requiredClass: 'warrior',
      mainStat: 'MDEF',
      baselineKey: 'boots',
      suffix: 'Greaves',
    },
    {
      type: 'shield',
      slot: 'offHand',
      requiredClass: 'warrior',
      mainStat: 'DEF',
      baselineKey: 'shield',
      suffix: 'Shield',
    },
  ],

  assassin: [
    {
      type: 'dagger',
      slot: 'weapon',
      requiredClass: 'assassin',
      mainStat: 'ATK',
      baselineKey: 'weapon',
      suffix: 'Dagger',
    },
    {
      type: 'hood',
      slot: 'head',
      requiredClass: 'assassin',
      mainStat: 'MDEF',
      baselineKey: 'head',
      suffix: 'Hood',
    },
    {
      type: 'garb',
      slot: 'armor',
      requiredClass: 'assassin',
      mainStat: 'DEF',
      baselineKey: 'armor',
      suffix: 'Garb',
    },
    {
      type: 'assassinGloves',
      slot: 'gloves',
      requiredClass: 'assassin',
      mainStat: 'MDEF',
      baselineKey: 'gloves',
      suffix: 'Gloves',
    },
    {
      type: 'assassinBoots',
      slot: 'boots',
      requiredClass: 'assassin',
      mainStat: 'MDEF',
      baselineKey: 'boots',
      suffix: 'Boots',
    },
    {
      type: 'offhandDagger',
      slot: 'offHand',
      requiredClass: 'assassin',
      mainStat: 'ATK',
      baselineKey: 'offhandDagger',
      suffix: 'Dagger',
    },
  ],

  archer: [
    {
      type: 'bow',
      slot: 'weapon',
      requiredClass: 'archer',
      mainStat: 'ATK',
      baselineKey: 'weapon',
      suffix: 'Bow',
    },
    {
      type: 'rangerCap',
      slot: 'head',
      requiredClass: 'archer',
      mainStat: 'MDEF',
      baselineKey: 'head',
      suffix: 'Cap',
    },
    {
      type: 'rangerArmor',
      slot: 'armor',
      requiredClass: 'archer',
      mainStat: 'DEF',
      baselineKey: 'armor',
      suffix: 'Armor',
    },
    {
      type: 'rangerGloves',
      slot: 'gloves',
      requiredClass: 'archer',
      mainStat: 'MDEF',
      baselineKey: 'gloves',
      suffix: 'Gloves',
    },
    {
      type: 'rangerBoots',
      slot: 'boots',
      requiredClass: 'archer',
      mainStat: 'MDEF',
      baselineKey: 'boots',
      suffix: 'Boots',
    },
    {
      type: 'quiver',
      slot: 'offHand',
      requiredClass: 'archer',
      mainStat: 'ATK',
      baselineKey: 'quiver',
      suffix: 'Quiver',
    },
  ],

  mage: [
    {
      type: 'staff',
      slot: 'weapon',
      requiredClass: 'mage',
      mainStat: 'MATK',
      baselineKey: 'weapon',
      suffix: 'Staff',
    },
    {
      type: 'circlet',
      slot: 'head',
      requiredClass: 'mage',
      mainStat: 'MDEF',
      baselineKey: 'head',
      suffix: 'Circlet',
    },
    {
      type: 'robe',
      slot: 'armor',
      requiredClass: 'mage',
      mainStat: 'DEF',
      baselineKey: 'armor',
      suffix: 'Robe',
    },
    {
      type: 'mysticGloves',
      slot: 'gloves',
      requiredClass: 'mage',
      mainStat: 'MDEF',
      baselineKey: 'gloves',
      suffix: 'Gloves',
    },
    {
      type: 'mysticBoots',
      slot: 'boots',
      requiredClass: 'mage',
      mainStat: 'MDEF',
      baselineKey: 'boots',
      suffix: 'Boots',
    },
    {
      type: 'tome',
      slot: 'offHand',
      requiredClass: 'mage',
      mainStat: 'MATK',
      baselineKey: 'tome',
      suffix: 'Tome',
    },
  ],
}

export const ACCESSORY_EQUIPMENT: EquipmentDefinition[] = [
  {
    type: 'necklace',
    slot: 'accessory',
    requiredClass: null,
    mainStat: 'HP',
    baselineKey: 'necklace',
    suffix: 'Necklace',
  },
  {
    type: 'bracelet',
    slot: 'accessory',
    requiredClass: null,
    mainStat: 'ATK',
    baselineKey: 'bracelet',
    suffix: 'Bracelet',
  },
  {
    type: 'ring',
    slot: 'accessory',
    requiredClass: null,
    mainStat: 'MATK',
    baselineKey: 'ring',
    suffix: 'Ring',
  },
]

export function getEquipmentFamily(
  level: number,
): EquipmentFamily {
  return (
    EQUIPMENT_FAMILIES.find(
      (family) =>
        level >= family.minLevel &&
        level <= family.maxLevel,
    ) ??
    EQUIPMENT_FAMILIES[
      EQUIPMENT_FAMILIES.length - 1
    ]
  )
}