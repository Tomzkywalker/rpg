export interface GameMap {
  id: number
  name: string
  minLevel: number
  maxLevel: number
}

export const maps: GameMap[] = [
  { id: 1, name: 'Green Fields', minLevel: 1, maxLevel: 10 },
  { id: 2, name: 'Dusty Canyon', minLevel: 11, maxLevel: 20 },
  { id: 3, name: 'Blackwood Forest', minLevel: 21, maxLevel: 30 },
  { id: 4, name: 'Sunken Ruins', minLevel: 31, maxLevel: 40 },
  { id: 5, name: 'Ashen Valley', minLevel: 41, maxLevel: 50 },
  { id: 6, name: 'Frostpeak', minLevel: 51, maxLevel: 60 },
  { id: 7, name: 'Demon Marsh', minLevel: 61, maxLevel: 70 },
  { id: 8, name: 'Sky Fortress', minLevel: 71, maxLevel: 80 },
  { id: 9, name: 'Abyssal Depths', minLevel: 81, maxLevel: 90 },
  { id: 10, name: 'Dragon Graveyard', minLevel: 91, maxLevel: 100 },
]