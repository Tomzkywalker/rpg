import {
  computed,
  ref,
} from 'vue'

import {
  defineStore,
} from 'pinia'

import {
  INVENTORY_CONFIG,
} from '../config/inventory.config'

import type {
  CharacterClass,
  Equipment,
  EquipmentRarity,
} from '../types/equipment'

export type InventorySort =
  | 'levelDesc'
  | 'levelAsc'
  | 'rarityDesc'
  | 'rarityAsc'

export interface AutoSellSettings {
  enabled: boolean

  sellBelowLevelEnabled: boolean
  sellBelowLevel: number

  sellBelowRarityEnabled: boolean
  minimumRarity: EquipmentRarity

  sellOtherClasses: boolean
}

export interface AddItemResult {
  added: boolean
  autoSold: boolean
  inventoryFull: boolean
  goldEarned: number
}

const RARITY_RANK: Record<
  EquipmentRarity,
  number
> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythical: 6,
}

export const useInventoryStore = defineStore(
  'inventory',
  () => {
    const items = ref<Equipment[]>([])

    const capacity = ref<number>(
      INVENTORY_CONFIG.defaultCapacity,
    )

    const sortMode = ref<InventorySort>(
      'rarityDesc',
    )

    const autoSell = ref<AutoSellSettings>({
      enabled: false,

      sellBelowLevelEnabled: false,
      sellBelowLevel: 1,

      sellBelowRarityEnabled: false,
      minimumRarity: 'common',

      sellOtherClasses: false,
    })

    const itemCount = computed(
      () => items.value.length,
    )

    const remainingCapacity = computed(
      () =>
        Math.max(
          0,
          capacity.value -
            items.value.length,
        ),
    )

    const isEmpty = computed(
      () => items.value.length === 0,
    )

    const isFull = computed(
      () =>
        items.value.length >=
        capacity.value,
    )

    const sortedItems = computed(() => {
      const result = [...items.value]

      switch (sortMode.value) {
        case 'levelDesc':
          return result.sort(
            (a, b) =>
              b.level - a.level,
          )

        case 'levelAsc':
          return result.sort(
            (a, b) =>
              a.level - b.level,
          )

        case 'rarityDesc':
          return result.sort(
            (a, b) => {
              const rarityDifference =
                RARITY_RANK[b.rarity] -
                RARITY_RANK[a.rarity]

              if (rarityDifference !== 0) {
                return rarityDifference
              }

              return b.level - a.level
            },
          )

        case 'rarityAsc':
          return result.sort(
            (a, b) => {
              const rarityDifference =
                RARITY_RANK[a.rarity] -
                RARITY_RANK[b.rarity]

              if (rarityDifference !== 0) {
                return rarityDifference
              }

              return b.level - a.level
            },
          )

        default:
          return result
      }
    })

    function calculateSellPrice(
      item: Equipment,
    ): number {
      const rarityMultiplier =
        INVENTORY_CONFIG.sellPrice
          .rarityMultiplier[
            item.rarity
          ]

      return Math.max(
        1,
        Math.floor(
          item.level *
            INVENTORY_CONFIG.sellPrice
              .basePerLevel *
            rarityMultiplier,
        ),
      )
    }

    function shouldAutoSell(
      item: Equipment,
      characterClass: CharacterClass,
    ): boolean {
      if (!autoSell.value.enabled) {
        return false
      }

      if (item.locked) {
        return false
      }

      if (
        autoSell.value
          .sellBelowLevelEnabled &&
        item.level <
          autoSell.value.sellBelowLevel
      ) {
        return true
      }

      if (
        autoSell.value
          .sellBelowRarityEnabled &&
        RARITY_RANK[item.rarity] <
          RARITY_RANK[
            autoSell.value.minimumRarity
          ]
      ) {
        return true
      }

      if (
        autoSell.value.sellOtherClasses &&
        item.requiredClass !== 'all' &&
        item.requiredClass !==
          characterClass
      ) {
        return true
      }

      return false
    }

    function addItem(
      item: Equipment,
      characterClass: CharacterClass,
    ): AddItemResult {
      if (
        shouldAutoSell(
          item,
          characterClass,
        )
      ) {
        return {
          added: false,
          autoSold: true,
          inventoryFull: false,
          goldEarned:
            calculateSellPrice(item),
        }
      }

      if (isFull.value) {
        return {
          added: false,
          autoSold: false,
          inventoryFull: true,
          goldEarned: 0,
        }
      }

      items.value.push(item)

      return {
        added: true,
        autoSold: false,
        inventoryFull: false,
        goldEarned: 0,
      }
    }

    function removeItem(
      itemId: string,
    ): Equipment | null {
      const index =
        items.value.findIndex(
          (item) =>
            item.id === itemId,
        )

      if (index === -1) {
        return null
      }

      const [removedItem] =
        items.value.splice(
          index,
          1,
        )

      return removedItem ?? null
    }

    function getItemById(
      itemId: string,
    ): Equipment | null {
      return (
        items.value.find(
          (item) =>
            item.id === itemId,
        ) ?? null
      )
    }

    function toggleItemLock(
      itemId: string,
    ): boolean {
      const item =
        getItemById(itemId)

      if (!item) {
        return false
      }

      item.locked =
        !item.locked

      return true
    }

    function lockItem(
      itemId: string,
    ): boolean {
      const item =
        getItemById(itemId)

      if (!item) {
        return false
      }

      item.locked = true

      return true
    }

    function unlockItem(
      itemId: string,
    ): boolean {
      const item =
        getItemById(itemId)

      if (!item) {
        return false
      }

      item.locked = false

      return true
    }

    function sellItem(
      itemId: string,
    ): number {
      const item =
        getItemById(itemId)

      if (!item) {
        return 0
      }

      if (item.locked) {
        return 0
      }

      const sellPrice =
        calculateSellPrice(item)

      removeItem(itemId)

      return sellPrice
    }

    function sellUnlockedItems(): number {
      let totalGold = 0

      const remainingItems:
        Equipment[] = []

      for (const item of items.value) {
        if (item.locked) {
          remainingItems.push(item)
          continue
        }

        totalGold +=
          calculateSellPrice(item)
      }

      items.value =
        remainingItems

      return totalGold
    }

    function setSortMode(
      mode: InventorySort,
    ): void {
      sortMode.value = mode
    }

    function setCapacity(
      newCapacity: number,
    ): void {
      capacity.value = Math.max(
        items.value.length,
        Math.floor(newCapacity),
      )
    }

    function setAutoSellEnabled(
      enabled: boolean,
    ): void {
      autoSell.value.enabled =
        enabled
    }

    function setSellBelowLevel(
      enabled: boolean,
      level: number,
    ): void {
      autoSell.value
        .sellBelowLevelEnabled =
        enabled

      autoSell.value.sellBelowLevel =
        Math.max(
          1,
          Math.floor(level),
        )
    }

    function setMinimumRarity(
      enabled: boolean,
      rarity: EquipmentRarity,
    ): void {
      autoSell.value
        .sellBelowRarityEnabled =
        enabled

      autoSell.value.minimumRarity =
        rarity
    }

    function setSellOtherClasses(
      enabled: boolean,
    ): void {
      autoSell.value
        .sellOtherClasses =
        enabled
    }

    function setItems(
      savedItems: Equipment[],
    ): void {
      items.value =
        savedItems.map(
          (item) => ({
            ...item,
            locked:
              item.locked ??
              false,
          }),
        )
    }

    function clearInventory(): void {
      items.value = []
    }

    return {
      items,
      sortedItems,

      capacity,
      itemCount,
      remainingCapacity,
      isEmpty,
      isFull,

      sortMode,
      autoSell,

      addItem,
      removeItem,
      getItemById,

      toggleItemLock,
      lockItem,
      unlockItem,

      sellItem,
      sellUnlockedItems,
      calculateSellPrice,

      setSortMode,
      setCapacity,

      setAutoSellEnabled,
      setSellBelowLevel,
      setMinimumRarity,
      setSellOtherClasses,

      setItems,
      clearInventory,
    }
  },
)