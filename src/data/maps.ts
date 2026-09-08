import { MAP_CONFIG } from '../config/map.config'

export interface GameMap {
  id: number
  name: string
  minLevel: number
  maxLevel: number
}

export const maps: GameMap[] = [
  {
    id: 1,
    name: 'Green Fields',
    ...MAP_CONFIG.greenFields,
  },
  {
    id: 2,
    name: 'Dusty Canyon',
    ...MAP_CONFIG.dustyCanyon,
  },
  {
    id: 3,
    name: 'Blackwood Forest',
    ...MAP_CONFIG.blackwoodForest,
  },
  {
    id: 4,
    name: 'Sunken Ruins',
    ...MAP_CONFIG.sunkenRuins,
  },
  {
    id: 5,
    name: 'Ashen Valley',
    ...MAP_CONFIG.ashenValley,
  },
  {
    id: 6,
    name: 'Frostpeak',
    ...MAP_CONFIG.frostpeak,
  },
  {
    id: 7,
    name: 'Demon Marsh',
    ...MAP_CONFIG.demonMarsh,
  },
  {
    id: 8,
    name: 'Sky Fortress',
    ...MAP_CONFIG.skyFortress,
  },
  {
    id: 9,
    name: 'Abyssal Depths',
    ...MAP_CONFIG.abyssalDepths,
  },
  {
    id: 10,
    name: 'Dragon Graveyard',
    ...MAP_CONFIG.dragonGraveyard,
  },
]
