export type DamageType = 'physical' | 'magical' | 'hybrid'

export interface DamageScaling {
  attack: number
  magicAttack: number
  defense: number
  magicDefense: number
}
