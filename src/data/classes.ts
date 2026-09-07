import type {
  CharacterClass,
} from '../types/equipment'

export interface CharacterClassDefinition {
  value: CharacterClass
  label: string
}

export const CHARACTER_CLASSES: CharacterClassDefinition[] = [
  {
    value: 'warrior',
    label: 'Warrior',
  },
  {
    value: 'assassin',
    label: 'Assassin',
  },
  {
    value: 'archer',
    label: 'Archer',
  },
  {
    value: 'mage',
    label: 'Mage',
  },
]