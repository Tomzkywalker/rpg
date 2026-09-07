export type CharacterClass =
    | 'warrior'
    | 'assassin'
    | 'archer'
    | 'mage'

export type EquipmentSlot =
    | 'weapon'
    | 'head'
    | 'armor'
    | 'gloves'
    | 'boots'
    | 'offHand'
    | 'accessory'

export type EquipmentRarity =
    | 'common'
    | 'uncommon'
    | 'rare'
    | 'epic'
    | 'legendary'
    | 'mythical'

export type BaseStat =
    | 'STR'
    | 'AGI'
    | 'VIT'
    | 'INT'
    | 'DEX'
    | 'LUK'

export type EquipmentMainStat =
    | 'HP'
    | 'ATK'
    | 'DEF'
    | 'MATK'
    | 'MDEF'

export type EquipmentType =
    | 'sword'
    | 'dagger'
    | 'bow'
    | 'staff'
    | 'helmet'
    | 'hood'
    | 'rangerCap'
    | 'circlet'
    | 'plateArmor'
    | 'garb'
    | 'rangerArmor'
    | 'robe'
    | 'gauntlets'
    | 'assassinGloves'
    | 'rangerGloves'
    | 'mysticGloves'
    | 'greaves'
    | 'assassinBoots'
    | 'rangerBoots'
    | 'mysticBoots'
    | 'shield'
    | 'offhandDagger'
    | 'quiver'
    | 'tome'
    | 'necklace'
    | 'bracelet'
    | 'ring'

export interface EquipmentAffix {
    stat: BaseStat
    value: number
}

export interface Equipment {
    id: string

    name: string
    type: EquipmentType
    slot: EquipmentSlot

    requiredClass: CharacterClass | null

    level: number
    rarity: EquipmentRarity
    quality: number

    mainStat: EquipmentMainStat
    mainStatValue: number

    affixes: EquipmentAffix[]
}

export interface Equipment {
    id: string
    name: string
    type: EquipmentType
    slot: EquipmentSlot
    requiredClass: CharacterClass | null
    level: number
    rarity: EquipmentRarity
    quality: number
    mainStat: EquipmentMainStat
    mainStatValue: number
    affixes: EquipmentAffix[]

    locked: boolean
}