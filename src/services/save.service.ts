import type {
  CharacterClass,
  Equipment,
  EquipmentRarity,
} from '../types/equipment'

const DB_NAME = 'solo-rpg-db'
const DB_VERSION = 1
const STORE_NAME = 'game-save'
const SAVE_KEY = 'main-save'

export interface GameSaveData {
  level: number
  exp: number
  hp: number
  mp: number
  gold: number
  statusPoints: number
  kills: number
  deaths: number
  selectedMapId: number

  stats: {
    STR: number
    AGI: number
    VIT: number
    INT: number
    DEX: number
    LUK: number
  }

  characterClass?: CharacterClass

  inventory?: {
    items: Equipment[]
    capacity: number

    sortMode:
      | 'levelDesc'
      | 'levelAsc'
      | 'rarityDesc'
      | 'rarityAsc'

    autoSell: {
      enabled: boolean

      sellBelowLevelEnabled: boolean
      sellBelowLevel: number

      sellBelowRarityEnabled: boolean
      minimumRarity: EquipmentRarity

      sellOtherClasses: boolean
    }
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request =
      indexedDB.open(
        DB_NAME,
        DB_VERSION,
      )

    request.onupgradeneeded = () => {
      const db = request.result

      if (
        !db.objectStoreNames.contains(
          STORE_NAME,
        )
      ) {
        db.createObjectStore(
          STORE_NAME,
        )
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function saveGame(
  data: GameSaveData,
): Promise<void> {
  const db = await openDatabase()

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          'readwrite',
        )

      const store =
        transaction.objectStore(
          STORE_NAME,
        )

      store.put(
        data,
        SAVE_KEY,
      )

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        db.close()
        reject(
          transaction.error,
        )
      }
    },
  )
}

export async function loadGame(): Promise<GameSaveData | null> {
  const db = await openDatabase()

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          'readonly',
        )

      const store =
        transaction.objectStore(
          STORE_NAME,
        )

      const request =
        store.get(SAVE_KEY)

      request.onsuccess = () => {
        db.close()

        resolve(
          request.result ??
            null,
        )
      }

      request.onerror = () => {
        db.close()
        reject(
          request.error,
        )
      }
    },
  )
}