import type { CharacterClass } from '../types/equipment'

export type DamageType =
  | 'physical'
  | 'magical'
  | 'hybrid'

export interface DamageScaling {
  attack: number
  magicAttack: number
}

export interface CharacterClassDefinition {
  value: CharacterClass
  label: string

  basicAttack: {
    damageType: DamageType
    scaling: DamageScaling
  }
}

export const CHARACTER_CLASSES: CharacterClassDefinition[] = [
  {
    value: 'warrior',
    label: 'Warrior',
    basicAttack: {
      damageType: 'physical',
      scaling: {
        attack: 1,
        magicAttack: 0,
      },
    },
  },
  {
    value: 'assassin',
    label: 'Assassin',
    basicAttack: {
      damageType: 'physical',
      scaling: {
        attack: 1,
        magicAttack: 0,
      },
    },
  },
  {
    value: 'hunter',
    label: 'Hunter',
    basicAttack: {
      damageType: 'physical',
      scaling: {
        attack: 1,
        magicAttack: 0,
      },
    },
  },
  {
    value: 'mage',
    label: 'Mage',
    basicAttack: {
      damageType: 'magical',
      scaling: {
        attack: 0,
        magicAttack: 1,
      },
    },
  },
]