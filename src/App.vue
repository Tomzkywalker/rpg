<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { maps } from './data/maps'
import { CHARACTER_CLASSES } from './data/classes'
import { useGameStore } from './stores/game'

import type { CharacterClass, Equipment, EquipmentRarity } from './types/equipment'
import type { InventorySort } from './stores/inventory'

const game = useGameStore()

const pendingAccessory = ref<Equipment | null>(null)
const pendingEquipment = ref<Equipment | null>(null)
const hoveredEquipmentName = ref<string | null>(null)
const equipmentNameTooltipPosition = ref({ top: 0, left: 0 })

let equipmentNameTooltipHideTimer: ReturnType<typeof setTimeout> | null = null

const showPlayer = ref(true)
const showInventory = ref(true)
const showAutoHunt = ref(true)
const showBattleLog = ref(true)

type NonAccessorySlot = 'weapon' | 'head' | 'armor' | 'gloves' | 'boots' | 'offHand'
type PlayerEquipmentSlotKey = NonAccessorySlot | 'accessory1' | 'accessory2'

type SelectedEquipmentSource =
  | { kind: 'inventory' }
  | { kind: 'equipped'; slot: PlayerEquipmentSlotKey }

const selectedEquipment = ref<Equipment | null>(null)
const selectedEquipmentSource = ref<SelectedEquipmentSource | null>(null)

function getRarityClass(rarity: EquipmentRarity) {
  return `rarity-${rarity}`
}

const inventorySlots = computed<(Equipment | null)[]>(() =>
  Array.from(
    { length: game.inventory.capacity },
    (_, index) => game.inventory.sortedItems[index] ?? null,
  ),
)

const equipmentIconPaths: Record<Equipment['slot'], string> = {
  weapon: '/equipment/weapon.svg',
  head: '/equipment/head.svg',
  armor: '/equipment/armor.svg',
  gloves: '/equipment/glove.svg',
  boots: '/equipment/boot.svg',
  offHand: '/equipment/off-hand.svg',
  accessory: '/equipment/accessory.svg',
}

const emptyEquipmentIconPaths: Record<Equipment['slot'], string> = {
  weapon: '/equipment/x-weapon.svg',
  head: '/equipment/x-head.svg',
  armor: '/equipment/x-armor.svg',
  gloves: '/equipment/x-glove.svg',
  boots: '/equipment/x-boot.svg',
  offHand: '/equipment/x-off-hand.svg',
  accessory: '/equipment/x-accessory.svg',
}

function getEquipmentIconStyle(item: Equipment) {
  const iconPath = `url("${equipmentIconPaths[item.slot]}")`

  return {
    maskImage: iconPath,
    WebkitMaskImage: iconPath,
  }
}

function getPlayerEquipmentSlotType(slot: PlayerEquipmentSlotKey): Equipment['slot'] {
  if (slot === 'accessory1' || slot === 'accessory2') {
    return 'accessory'
  }

  return slot
}

function getEmptyEquipmentIconPath(slot: PlayerEquipmentSlotKey) {
  return emptyEquipmentIconPaths[getPlayerEquipmentSlotType(slot)]
}

function cancelEquipmentNameTooltipHide() {
  if (!equipmentNameTooltipHideTimer) {
    return
  }

  clearTimeout(equipmentNameTooltipHideTimer)
  equipmentNameTooltipHideTimer = null
}

function showEquipmentNameTooltip(item: Equipment, event: Event) {
  cancelEquipmentNameTooltipHide()

  const slot = event.currentTarget as HTMLElement
  const slotBounds = slot.getBoundingClientRect()
  const tooltipWidth = 220
  const viewportPadding = 12

  equipmentNameTooltipPosition.value = {
    top: Math.min(slotBounds.bottom + 8, window.innerHeight - 48),
    left: Math.min(
      Math.max(viewportPadding, slotBounds.left),
      window.innerWidth - tooltipWidth - viewportPadding,
    ),
  }

  hoveredEquipmentName.value = item.name
}

function scheduleEquipmentNameTooltipHide() {
  cancelEquipmentNameTooltipHide()

  equipmentNameTooltipHideTimer = setTimeout(() => {
    hoveredEquipmentName.value = null
    equipmentNameTooltipHideTimer = null
  }, 120)
}

function openInventoryItemDetail(item: Equipment) {
  hoveredEquipmentName.value = null
  selectedEquipment.value = item
  selectedEquipmentSource.value = { kind: 'inventory' }
}

function openEquippedItemDetail(item: Equipment, slot: PlayerEquipmentSlotKey) {
  hoveredEquipmentName.value = null
  selectedEquipment.value = item
  selectedEquipmentSource.value = { kind: 'equipped', slot }
}

function closeEquipmentDetail() {
  selectedEquipment.value = null
  selectedEquipmentSource.value = null
}

async function equipSelectedInventoryItem() {
  if (!selectedEquipment.value || selectedEquipmentSource.value?.kind !== 'inventory') {
    return
  }

  const item = selectedEquipment.value
  closeEquipmentDetail()

  await equipItem(item)
}

function toggleSelectedInventoryItemLock() {
  if (!selectedEquipment.value || selectedEquipmentSource.value?.kind !== 'inventory') {
    return
  }

  game.toggleInventoryItemLock(selectedEquipment.value.id)
}

function sellSelectedInventoryItem() {
  if (
    !selectedEquipment.value ||
    selectedEquipmentSource.value?.kind !== 'inventory' ||
    selectedEquipment.value.locked
  ) {
    return
  }

  const itemId = selectedEquipment.value.id
  closeEquipmentDetail()

  void game.sellInventoryItem(itemId)
}

function unequipSelectedItem() {
  if (!selectedEquipment.value || selectedEquipmentSource.value?.kind !== 'equipped') {
    return
  }

  const slot = selectedEquipmentSource.value.slot
  closeEquipmentDetail()

  void game.unequipItem(slot)
}

function getClassLabel(characterClass: CharacterClass | 'all') {
  if (characterClass === 'all') {
    return 'All'
  }

  return CHARACTER_CLASSES.find((option) => option.value === characterClass)?.label ?? characterClass
}

const currentReplacementItem = computed<Equipment | null>(() => {
  const item = pendingEquipment.value

  if (!item || item.slot === 'accessory') {
    return null
  }

  return game.equipped[item.slot as NonAccessorySlot] ?? null
})

async function equipItem(item: Equipment) {
  if (item.slot === 'accessory') {
    if (!game.equipped.accessory1 || !game.equipped.accessory2) {
      await game.equipInventoryItem(item.id)
      return
    }

    pendingAccessory.value = item
    return
  }

  const currentItem = game.equipped[item.slot as NonAccessorySlot]

  if (!currentItem) {
    await game.equipInventoryItem(item.id)
    return
  }

  pendingEquipment.value = item
}

function closeAccessoryModal() {
  pendingAccessory.value = null
}

async function replaceAccessory(slot: 'accessory1' | 'accessory2') {
  if (!pendingAccessory.value) {
    return
  }

  const item = pendingAccessory.value
  pendingAccessory.value = null

  await game.equipInventoryItem(item.id, slot)
}

function closeEquipmentModal() {
  pendingEquipment.value = null
}

async function replaceEquipment() {
  if (!pendingEquipment.value) {
    return
  }

  const item = pendingEquipment.value
  pendingEquipment.value = null

  await game.equipInventoryItem(item.id)
}

const rarityOptions: EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical']

const equipmentSlots = [
  { key: 'weapon', label: 'Weapon' },
  { key: 'head', label: 'Head' },
  { key: 'offHand', label: 'Off-Hand' },
  { key: 'armor', label: 'Armor' },
  { key: 'accessory1', label: 'Accessory 1' },
  { key: 'gloves', label: 'Gloves' },
  { key: 'accessory2', label: 'Accessory 2' },
  { key: 'boots', label: 'Boots' },
] as const

onMounted(() => {
  void game.initializeGame()
})

function changeJob(event: Event) {
  const target = event.target as HTMLSelectElement

  void game.setCharacterClass(target.value as CharacterClass)
}

function changeInventorySort(event: Event) {
  const target = event.target as HTMLSelectElement

  void game.setInventorySort(target.value as InventorySort)
}

function changeAutoSellEnabled(event: Event) {
  const target = event.target as HTMLInputElement

  void game.setAutoSellEnabled(target.checked)
}

function changeAutoSellLevelEnabled(event: Event) {
  const target = event.target as HTMLInputElement

  void game.setAutoSellBelowLevel(target.checked, game.inventory.autoSell.sellBelowLevel)
}

function changeAutoSellLevel(event: Event) {
  const target = event.target as HTMLInputElement

  void game.setAutoSellBelowLevel(game.inventory.autoSell.sellBelowLevelEnabled, Number(target.value))
}

function changeAutoSellRarityEnabled(event: Event) {
  const target = event.target as HTMLInputElement

  void game.setAutoSellMinimumRarity(target.checked, game.inventory.autoSell.minimumRarity)
}

function changeMinimumRarity(event: Event) {
  const target = event.target as HTMLSelectElement

  void game.setAutoSellMinimumRarity(game.inventory.autoSell.sellBelowRarityEnabled, target.value as EquipmentRarity)
}

function changeOtherJobAutoSell(event: Event) {
  const target = event.target as HTMLInputElement

  void game.setAutoSellOtherClasses(target.checked)
}
</script>

<template>
  <main class="app-shell">
    <section class="welcome-card">
      <template v-if="!game.isLoaded">
        <p class="eyebrow">SYSTEM</p>
        <h1>Loading Save...</h1>
      </template>

      <template v-else>
        <p class="eyebrow">SYSTEM</p>
        <h1>Solo RPG Prototype</h1>

        <!-- PLAYER -->
        <section class="collapsible-section">
          <button class="section-header" type="button" @click="showPlayer = !showPlayer">
            <span>Player</span>
            <span>{{ showPlayer ? '−' : '+' }}</span>
          </button>

          <div v-if="showPlayer" class="section-body">
            <div class="player-summary">
              <label>
                Job
                <select :value="game.characterClass" :disabled="game.isAutoHunting" @change="changeJob">
                  <option v-for="job in CHARACTER_CLASSES" :key="job.value" :value="job.value">
                    {{ job.label }}
                  </option>
                </select>
              </label>

              <div class="player-resource-grid">
                <span>Level {{ game.level }}</span>
                <span>EXP {{ game.exp }} / {{ game.expNeeded }}</span>
                <span>HP {{ game.hp }} / {{ game.maxHp }}</span>
                <span>MP {{ game.mp }} / {{ game.maxMp }}</span>
                <span>Gold {{ game.gold }}</span>
                <span>Status Points {{ game.statusPoints }}</span>
                <span>Kills {{ game.kills }}</span>
                <span>Deaths {{ game.deaths }}</span>
              </div>
            </div>

            <div class="player-layout">
              <div class="player-stats-column">
                <div class="stat-panel">
                  <h3>Combat Stats</h3>
                  <div class="stat-grid">
                    <span>ATK</span><strong>{{ game.attack }}</strong>
                    <span>DEF</span><strong>{{ game.defense }}</strong>
                    <span>MATK</span><strong>{{ game.magicAttack }}</strong>
                    <span>MDEF</span><strong>{{ game.magicDefense }}</strong>
                    <span>HIT</span><strong>{{ game.hit }}</strong>
                    <span>FLEE</span><strong>{{ game.flee }}</strong>
                    <span>CRIT</span><strong>{{ game.criticalChance.toFixed(1) }}%</strong>
                    <span>ASPD</span><strong>{{ game.attackSpeed }}</strong>
                  </div>
                </div>

                <div class="stat-panel">
                  <h3>Base Stats</h3>

                  <div v-for="(value, stat) in game.stats" :key="stat" class="base-stat-row">
                    <div>
                      <strong>{{ stat }}</strong>
                      <span>{{ value }}</span>
                      <small v-if="game.equipmentBaseStatBonuses[stat] > 0">
                        +{{ game.equipmentBaseStatBonuses[stat] }} gear
                      </small>
                    </div>

                    <button :disabled="game.statusPoints <= 0" @click="game.addStat(stat)">+1</button>
                  </div>
                </div>
              </div>

              <div class="character-panel">
                <div class="character-art-placeholder">
                  <span>CHARACTER</span>
                  <strong>{{ getClassLabel(game.characterClass) }}</strong>
                  <small>Artwork nanti di sini</small>
                </div>
              </div>

              <div class="equipment-panel">
                <h3>Equipment</h3>

                <div class="equipment-grid">
                  <div v-for="slot in equipmentSlots" :key="slot.key" class="equipment-slot">
                    <span
                      class="equipment-slot-label"
                      :class="
                        game.equipped[slot.key]
                          ? ['equipment-item-name', getRarityClass(game.equipped[slot.key]!.rarity)]
                          : undefined
                      "
                    >
                      {{ game.equipped[slot.key]?.name ?? slot.label }}
                    </span>

                    <button
                      v-if="game.equipped[slot.key]"
                      type="button"
                      class="equipment-slot-content equipment-slot-filled"
                      :aria-label="`View ${game.equipped[slot.key]!.name} details`"
                      @click="openEquippedItemDetail(game.equipped[slot.key]!, slot.key)"
                    >
                      <span
                        class="player-equipment-icon"
                        :class="getRarityClass(game.equipped[slot.key]!.rarity)"
                        :style="getEquipmentIconStyle(game.equipped[slot.key]!)"
                        aria-hidden="true"
                      ></span>

                      <span class="equipment-stat-summary">
                        <span>
                          <strong>{{ game.equipped[slot.key]!.mainStat }}</strong>
                          +{{ game.equipped[slot.key]!.mainStatValue }}
                        </span>
                        <span v-for="(affix, index) in game.equipped[slot.key]!.affixes" :key="index">
                          <strong>{{ affix.stat }}</strong>
                          +{{ affix.value }}
                        </span>
                      </span>
                    </button>

                    <div v-else class="equipment-slot-content equipment-slot-empty-content">
                      <img
                        class="player-equipment-placeholder"
                        :src="getEmptyEquipmentIconPath(slot.key)"
                        alt=""
                        aria-hidden="true"
                      />
                      <span class="equipment-empty">Empty</span>
                    </div>
                  </div>
                </div>

                <p class="gear-bonus">
                  Gear bonus: HP +{{ game.equipmentMainStatBonuses.HP }}, ATK +{{ game.equipmentMainStatBonuses.ATK }},
                  DEF +{{ game.equipmentMainStatBonuses.DEF }}, MATK +{{ game.equipmentMainStatBonuses.MATK }}, MDEF +{{
                    game.equipmentMainStatBonuses.MDEF
                  }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- INVENTORY -->
        <section class="collapsible-section">
          <button class="section-header" type="button" @click="showInventory = !showInventory">
            <span>Inventory</span>
            <span>{{ showInventory ? '−' : '+' }}</span>
          </button>

          <div v-if="showInventory" class="section-body">
            <p>{{ game.inventory.itemCount }} / {{ game.inventory.capacity }}</p>

            <label>
              Sort
              <select :value="game.inventory.sortMode" @change="changeInventorySort">
                <option value="rarityDesc">Rarity ↓</option>
                <option value="rarityAsc">Rarity ↑</option>
                <option value="levelDesc">Level ↓</option>
                <option value="levelAsc">Level ↑</option>
              </select>
            </label>

            <button :disabled="game.inventory.isEmpty" @click="game.sellAllFilteredItems">Sell All</button>

            <h3>Auto Sell</h3>

            <label>
              <input type="checkbox" :checked="game.inventory.autoSell.enabled" @change="changeAutoSellEnabled" />
              Enable Auto Sell
            </label>

            <br />

            <label>
              <input
                type="checkbox"
                :checked="game.inventory.autoSell.sellBelowLevelEnabled"
                @change="changeAutoSellLevelEnabled"
              />
              Sell item below Level
            </label>

            <input type="number" min="1" :value="game.inventory.autoSell.sellBelowLevel" @change="changeAutoSellLevel" />

            <br />

            <label>
              <input
                type="checkbox"
                :checked="game.inventory.autoSell.sellBelowRarityEnabled"
                @change="changeAutoSellRarityEnabled"
              />
              Sell below rarity
            </label>

            <select :value="game.inventory.autoSell.minimumRarity" @change="changeMinimumRarity">
              <option v-for="rarity in rarityOptions" :key="rarity" :value="rarity">
                {{ rarity }}
              </option>
            </select>

            <br />

            <label>
              <input type="checkbox" :checked="game.inventory.autoSell.sellOtherClasses" @change="changeOtherJobAutoSell" />
              Sell equipment from other jobs
            </label>

            <div class="inventory-grid-scroll">
              <div class="inventory-grid" role="grid" aria-label="Inventory equipment slots">
                <div
                  v-for="(item, index) in inventorySlots"
                  :key="item?.id ?? `empty-${index}`"
                  class="inventory-slot"
                  :class="item ? getRarityClass(item.rarity) : 'inventory-slot-empty'"
                  :tabindex="item ? 0 : -1"
                  role="gridcell"
                  :aria-label="item ? `${item.name}, level ${item.level}, ${item.rarity}` : `Empty slot ${index + 1}`"
                  @mouseenter="item && showEquipmentNameTooltip(item, $event)"
                  @mouseleave="item && scheduleEquipmentNameTooltipHide()"
                  @focus="item && showEquipmentNameTooltip(item, $event)"
                  @blur="item && scheduleEquipmentNameTooltipHide()"
                  @click="item && openInventoryItemDetail(item)"
                >
                  <span
                    v-if="item"
                    class="inventory-equipment-icon"
                    :style="getEquipmentIconStyle(item)"
                    aria-hidden="true"
                  ></span>
                  <span v-if="item?.locked" class="inventory-lock-indicator" aria-label="Locked">●</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- AUTO HUNT -->
        <section class="collapsible-section">
          <button class="section-header" type="button" @click="showAutoHunt = !showAutoHunt">
            <span>Auto Hunt</span>
            <span>{{ showAutoHunt ? '−' : '+' }}</span>
          </button>

          <div v-if="showAutoHunt" class="section-body">
            <label>
              Hunting Map
              <select
                :value="game.selectedMapId"
                :disabled="game.isAutoHunting"
                @change="game.selectMap(Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="map in maps" :key="map.id" :value="map.id">
                  {{ map.name }}
                  (Lv. {{ map.minLevel }}-{{ map.maxLevel }})
                </option>
              </select>
            </label>

            <p>
              Selected:
              <strong>{{ game.selectedMap.name }}</strong>
            </p>

            <button v-if="!game.isAutoHunting" @click="game.startAutoHunt">Start Auto Hunt</button>
            <button v-else @click="game.stopAutoHunt">Stop Auto Hunt</button>
            <button :disabled="game.isAutoHunting" @click="game.rest">Rest</button>

            <div v-if="game.currentMonster" class="monster-panel">
              <hr />

              <h3>
                {{ game.currentMonster.name }}
                Lv.{{ game.currentMonster.level }}
              </h3>

              <p>HP {{ game.monsterHp }} / {{ game.currentMonster.maxHp }}</p>
              <p>ATK {{ game.currentMonster.attack }}</p>
              <p>DEF {{ game.currentMonster.defense }}</p>
              <p>MDEF {{ game.currentMonster.magicDefense }}</p>
              <p>EXP {{ game.currentMonster.exp }}</p>
              <p>Gold {{ game.currentMonster.gold }}</p>
            </div>
          </div>
        </section>

        <!-- BATTLE LOG -->
        <section class="collapsible-section">
          <button class="section-header" type="button" @click="showBattleLog = !showBattleLog">
            <span>Battle Log</span>
            <span>{{ showBattleLog ? '−' : '+' }}</span>
          </button>

          <div v-if="showBattleLog" class="section-body battle-log">
            <p v-if="!game.battleLog.length">Belum ada battle log.</p>

            <p v-for="(log, index) in game.battleLog" :key="index">
              {{ log }}
            </p>
          </div>
        </section>
      </template>
    </section>

    <Teleport to="body">
      <div
        v-if="hoveredEquipmentName"
        class="equipment-name-tooltip"
        :style="{
          top: `${equipmentNameTooltipPosition.top}px`,
          left: `${equipmentNameTooltipPosition.left}px`,
        }"
        role="tooltip"
      >
        {{ hoveredEquipmentName }}
      </div>
    </Teleport>

    <!-- SHARED EQUIPMENT DETAIL MODAL -->
    <div
      v-if="selectedEquipment && selectedEquipmentSource"
      class="modal-backdrop"
      @click.self="closeEquipmentDetail"
    >
      <div class="replacement-modal equipment-detail-modal" role="dialog" aria-modal="true">
        <h3>Equipment Detail</h3>

        <div class="item-card">
          <div>
            <strong :class="getRarityClass(selectedEquipment.rarity)">
              {{ selectedEquipment.name }}
            </strong>
            <span> Lv.{{ selectedEquipment.level }}</span>
          </div>

          <span>{{ selectedEquipment.rarity.toUpperCase() }} • Quality {{ selectedEquipment.quality }}%</span>
          <span>Job: {{ getClassLabel(selectedEquipment.requiredClass) }}</span>
          <span>{{ selectedEquipment.mainStat }} {{ selectedEquipment.mainStatValue }}</span>

          <div v-if="selectedEquipment.affixes.length" class="item-affixes">
            <span v-for="(affix, index) in selectedEquipment.affixes" :key="index">
              {{ affix.stat }} {{ affix.value }}
            </span>
          </div>

          <template v-if="selectedEquipmentSource.kind === 'inventory'">
            <span>{{ selectedEquipment.locked ? 'Locked' : 'Unlocked' }}</span>
            <span>Sell: {{ game.inventory.calculateSellPrice(selectedEquipment) }} Gold</span>
          </template>
        </div>

        <div class="modal-actions">
          <template v-if="selectedEquipmentSource.kind === 'inventory'">
            <button type="button" @click="equipSelectedInventoryItem">Equip</button>
            <button type="button" @click="toggleSelectedInventoryItemLock">
              {{ selectedEquipment.locked ? 'Unlock' : 'Lock' }}
            </button>
            <button type="button" :disabled="selectedEquipment.locked" @click="sellSelectedInventoryItem">
              Sell
            </button>
          </template>

          <button v-else type="button" @click="unequipSelectedItem">Unequip</button>
          <button type="button" class="cancel-button" @click="closeEquipmentDetail">Close</button>
        </div>
      </div>
    </div>

    <!-- ACCESSORY REPLACEMENT MODAL -->
    <div v-if="pendingAccessory" class="modal-backdrop" @click.self="closeAccessoryModal">
      <div class="replacement-modal" role="dialog" aria-modal="true">
        <h3>Replace Accessory?</h3>

        <div class="new-accessory">
          <div class="item-card">
            <span class="item-card-label">NEW ACCESSORY</span>

            <div>
              <strong :class="getRarityClass(pendingAccessory.rarity)">
                {{ pendingAccessory.name }}
              </strong>
              <span> Lv.{{ pendingAccessory.level }}</span>
            </div>

            <span>{{ pendingAccessory.rarity.toUpperCase() }} • Quality {{ pendingAccessory.quality }}%</span>
            <span>Job: {{ getClassLabel(pendingAccessory.requiredClass) }}</span>
            <span>{{ pendingAccessory.mainStat }} {{ pendingAccessory.mainStatValue }}</span>

            <div v-if="pendingAccessory.affixes.length" class="item-affixes">
              <span v-for="(affix, index) in pendingAccessory.affixes" :key="index">
                {{ affix.stat }} {{ affix.value }}
              </span>
            </div>
          </div>
        </div>

        <div class="accessory-choice-grid">
          <button
            v-if="game.equipped.accessory1"
            type="button"
            class="item-card item-card-button"
            @click="replaceAccessory('accessory1')"
          >
            <span class="item-card-label">ACCESSORY 1</span>

            <div>
              <strong :class="getRarityClass(game.equipped.accessory1.rarity)">
                {{ game.equipped.accessory1.name }}
              </strong>
              <span> Lv.{{ game.equipped.accessory1.level }}</span>
            </div>

            <span>
              {{ game.equipped.accessory1.rarity.toUpperCase() }} • Quality {{ game.equipped.accessory1.quality }}%
            </span>

            <span>Job: {{ getClassLabel(game.equipped.accessory1.requiredClass) }}</span>
            <span>{{ game.equipped.accessory1.mainStat }} {{ game.equipped.accessory1.mainStatValue }}</span>

            <div v-if="game.equipped.accessory1.affixes.length" class="item-affixes">
              <span v-for="(affix, index) in game.equipped.accessory1.affixes" :key="index">
                {{ affix.stat }} {{ affix.value }}
              </span>
            </div>
          </button>

          <button
            v-if="game.equipped.accessory2"
            type="button"
            class="item-card item-card-button"
            @click="replaceAccessory('accessory2')"
          >
            <span class="item-card-label">ACCESSORY 2</span>

            <div>
              <strong :class="getRarityClass(game.equipped.accessory2.rarity)">
                {{ game.equipped.accessory2.name }}
              </strong>
              <span> Lv.{{ game.equipped.accessory2.level }}</span>
            </div>

            <span>
              {{ game.equipped.accessory2.rarity.toUpperCase() }} • Quality {{ game.equipped.accessory2.quality }}%
            </span>

            <span>Job: {{ getClassLabel(game.equipped.accessory2.requiredClass) }}</span>
            <span>{{ game.equipped.accessory2.mainStat }} {{ game.equipped.accessory2.mainStatValue }}</span>

            <div v-if="game.equipped.accessory2.affixes.length" class="item-affixes">
              <span v-for="(affix, index) in game.equipped.accessory2.affixes" :key="index">
                {{ affix.stat }} {{ affix.value }}
              </span>
            </div>
          </button>
        </div>

        <button type="button" class="cancel-button accessory-cancel-button" @click="closeAccessoryModal">Cancel</button>
      </div>
    </div>

    <!-- NORMAL EQUIPMENT REPLACEMENT MODAL -->
    <div v-if="pendingEquipment && currentReplacementItem" class="modal-backdrop" @click.self="closeEquipmentModal">
      <div class="replacement-modal" role="dialog" aria-modal="true">
        <h3>Replace Equipment?</h3>

        <div class="equipment-compare">
          <div class="item-card">
            <span class="item-card-label">CURRENT</span>

            <div>
              <strong :class="getRarityClass(currentReplacementItem.rarity)">
                {{ currentReplacementItem.name }}
              </strong>
              <span> Lv.{{ currentReplacementItem.level }}</span>
            </div>

            <span>
              {{ currentReplacementItem.rarity.toUpperCase() }} • Quality {{ currentReplacementItem.quality }}%
            </span>

            <span>Job: {{ getClassLabel(currentReplacementItem.requiredClass) }}</span>
            <span>{{ currentReplacementItem.mainStat }} {{ currentReplacementItem.mainStatValue }}</span>

            <div v-if="currentReplacementItem.affixes.length" class="item-affixes">
              <span v-for="(affix, index) in currentReplacementItem.affixes" :key="index">
                {{ affix.stat }} {{ affix.value }}
              </span>
            </div>
          </div>

          <div class="replace-arrow">→</div>

          <div class="item-card">
            <span class="item-card-label">NEW</span>

            <div>
              <strong :class="getRarityClass(pendingEquipment.rarity)">
                {{ pendingEquipment.name }}
              </strong>
              <span> Lv.{{ pendingEquipment.level }}</span>
            </div>

            <span>{{ pendingEquipment.rarity.toUpperCase() }} • Quality {{ pendingEquipment.quality }}%</span>
            <span>Job: {{ getClassLabel(pendingEquipment.requiredClass) }}</span>
            <span>{{ pendingEquipment.mainStat }} {{ pendingEquipment.mainStatValue }}</span>

            <div v-if="pendingEquipment.affixes.length" class="item-affixes">
              <span v-for="(affix, index) in pendingEquipment.affixes" :key="index">
                {{ affix.stat }} {{ affix.value }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="replaceEquipment">Replace</button>
          <button type="button" class="cancel-button" @click="closeEquipmentModal">Cancel</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.collapsible-section {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid #3a414d;
  border-radius: 14px;
  background: #191d24;
}

.section-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 0;
  border-radius: 0;
  background: #252b34;
  color: #f5f5f5;
  font-size: 18px;
  font-weight: 700;
  text-align: left;
}

.section-header:hover {
  background: #303743;
}

.section-body {
  padding: 18px;
}

.player-summary {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
}

.player-resource-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 16px;
}

.player-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(240px, 1.15fr) minmax(320px, 1.35fr);
  gap: 18px;
  align-items: stretch;
}

.player-stats-column {
  display: grid;
  gap: 16px;
}

.stat-panel,
.character-panel,
.equipment-panel {
  padding: 16px;
  border: 1px solid #3a414d;
  border-radius: 12px;
  background: #20252d;
}

.stat-panel h3,
.equipment-panel h3 {
  margin-top: 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 7px 14px;
}

.stat-grid strong {
  text-align: right;
}

.base-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
}

.base-stat-row > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.base-stat-row small {
  color: #9ca6b5;
}

.character-panel {
  display: grid;
  min-height: 500px;
  place-items: center;
}

.character-art-placeholder {
  display: grid;
  width: 100%;
  min-height: 420px;
  place-items: center;
  align-content: center;
  gap: 8px;
  border: 1px dashed #596372;
  border-radius: 12px;
  color: #9ca6b5;
  text-align: center;
}

.character-art-placeholder strong {
  color: #f5f5f5;
  font-size: 24px;
}

.equipment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.equipment-slot {
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 10px;
  border: 1px solid #49515e;
  border-radius: 10px;
  background: #252b34;
}

.equipment-slot-label {
  color: #9ca6b5;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.equipment-item-name {
  text-transform: none;
}

.equipment-slot-content {
  display: grid;
  grid-template-columns: minmax(48px, 68px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  padding: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #f5f5f5;
  text-align: left;
}

.equipment-slot-filled:hover,
.equipment-slot-filled:focus-visible {
  background: #303743;
}

.player-equipment-icon,
.player-equipment-placeholder {
  width: 100%;
  aspect-ratio: 1;
}

.player-equipment-icon {
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

.player-equipment-placeholder {
  object-fit: contain;
}

.equipment-stat-summary {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: #c9d2df;
  font-size: 12px;
}

.equipment-stat-summary > span {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.equipment-empty {
  color: #737d8c;
}

.gear-bonus {
  margin-bottom: 0;
  color: #9ca6b5;
  font-size: 12px;
}

.inventory-grid-scroll {
  max-height: 520px;
  margin-top: 18px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.inventory-grid {
  --inventory-empty-slot-color: #ffffff;
  --inventory-slot-radius: 8px;

  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
}

.inventory-slot {
  position: relative;
  display: grid;
  min-width: 0;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border: 2px solid currentColor;
  border-radius: var(--inventory-slot-radius);
  background: #252b34;
}

.inventory-slot:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: -5px;
}

.inventory-slot-empty {
  color: var(--inventory-empty-slot-color);
}

.inventory-equipment-icon {
  width: 72%;
  height: 72%;
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

.inventory-lock-indicator {
  position: absolute;
  top: 5px;
  right: 6px;
  color: currentColor;
  font-size: 9px;
  line-height: 1;
}

.equipment-name-tooltip {
  position: fixed;
  z-index: 1100;
  max-width: min(220px, calc(100vw - 24px));
  overflow: hidden;
  padding: 6px 9px;
  border: 1px solid #49515e;
  border-radius: 6px;
  background: #20252d;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
  color: #f5f5f5;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.battle-log {
  max-height: 420px;
  overflow-y: auto;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.68);
}

.replacement-modal {
  width: min(100%, 720px);
  padding: 24px;
  border: 1px solid #3a414d;
  border-radius: 14px;
  background: #191d24;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.replacement-modal h3 {
  margin: 0 0 20px;
  text-align: center;
}

.equipment-detail-modal {
  width: min(100%, 420px);
}

.item-card {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid #49515e;
  border-radius: 10px;
  background: #252b34;
  color: #f5f5f5;
  text-align: left;
}

.item-card strong {
  font-size: 16px;
}

.item-card-label {
  margin-bottom: 4px;
  color: #9ca6b5;
  font-size: 12px;
  font-weight: 700;
}

.item-card-button {
  width: 100%;
  align-items: start;
}

.item-card-button:hover {
  background: #303743;
}

.new-accessory {
  width: min(100%, 330px);
  margin: 0 auto 20px;
}

.accessory-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.equipment-compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}

.replace-arrow {
  font-size: 28px;
  font-weight: 700;
}

.item-affixes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.item-affixes span {
  padding: 3px 7px;
  border-radius: 6px;
  background: #1d222a;
  color: #c9d2df;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.cancel-button {
  padding: 10px 14px;
  border: 1px solid #49515e;
  border-radius: 10px;
  background: transparent;
  color: #f5f5f5;
}

.accessory-cancel-button {
  width: 100%;
  margin-top: 16px;
}

.cancel-button:hover {
  background: #252b34;
}

/* Equipment rarity colors */
.rarity-common {
  color: #f5f5f5;
}

.rarity-uncommon {
  color: #5fd35f;
}

.rarity-rare {
  color: #5b9dff;
}

.rarity-epic {
  color: #b56cff;
}

.rarity-legendary {
  color: #ff9f43;
}

.rarity-mythical {
  color: #ff5252;
}

@media (max-width: 1050px) {
  .player-layout {
    grid-template-columns: 1fr 1fr;
  }

  .character-panel {
    grid-column: 1 / -1;
    order: 3;
    min-height: 360px;
  }

  .character-art-placeholder {
    min-height: 300px;
  }
}

@media (max-width: 700px) {
  .player-resource-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .player-layout {
    grid-template-columns: 1fr;
  }

  .character-panel {
    grid-column: auto;
    order: initial;
  }

  .equipment-grid {
    grid-template-columns: 1fr 1fr;
  }

  .accessory-choice-grid {
    grid-template-columns: 1fr;
  }

  .equipment-compare {
    grid-template-columns: 1fr;
  }

  .inventory-grid {
    gap: 4px;
  }

  .inventory-slot {
    border-width: 1px;
  }

  .replace-arrow {
    text-align: center;
    transform: rotate(90deg);
  }
}

@media (max-width: 460px) {
  .player-resource-grid,
  .equipment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
