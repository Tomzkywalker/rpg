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

type NonAccessorySlot = 'weapon' | 'head' | 'armor' | 'gloves' | 'boots' | 'offHand'

function getRarityClass(rarity: EquipmentRarity) {
  return `rarity-${rarity}`
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
  { key: 'armor', label: 'Armor' },
  { key: 'gloves', label: 'Gloves' },
  { key: 'boots', label: 'Boots' },
  { key: 'offHand', label: 'Off-Hand' },
  { key: 'accessory1', label: 'Accessory 1' },
  { key: 'accessory2', label: 'Accessory 2' },
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

        <h2>Player</h2>

        <label>
          Job
          <select :value="game.characterClass" :disabled="game.isAutoHunting" @change="changeJob">
            <option v-for="job in CHARACTER_CLASSES" :key="job.value" :value="job.value">
              {{ job.label }}
            </option>
          </select>
        </label>

        <p>Level {{ game.level }}</p>
        <p>EXP {{ game.exp }} / {{ game.expNeeded }}</p>
        <p>HP {{ game.hp }} / {{ game.maxHp }}</p>
        <p>MP {{ game.mp }} / {{ game.maxMp }}</p>
        <p>Gold {{ game.gold }}</p>
        <p>Status Points {{ game.statusPoints }}</p>
        <p>Kills {{ game.kills }}</p>
        <p>Deaths {{ game.deaths }}</p>

        <hr />

        <h2>Base Stats</h2>

        <div v-for="(value, stat) in game.stats" :key="stat">
          <strong>{{ stat }}</strong
          >:
          {{ value }}

          <span v-if="game.equipmentBaseStatBonuses[stat] > 0">
            +{{ game.equipmentBaseStatBonuses[stat] }}
            gear
          </span>

          <button :disabled="game.statusPoints <= 0" @click="game.addStat(stat)">+1</button>
        </div>

        <hr />

        <h2>Combat Stats</h2>
        <p>ATK: {{ game.attack }}</p>
        <p>DEF: {{ game.defense }}</p>
        <p>MATK: {{ game.magicAttack }}</p>
        <p>MDEF: {{ game.magicDefense }}</p>
        <p>HIT: {{ game.hit }}</p>
        <p>FLEE: {{ game.flee }}</p>
        <p>CRIT: {{ game.criticalChance.toFixed(1) }}%</p>
        <p>ASPD: {{ game.attackSpeed }}</p>

        <hr />

        <h2>Auto Hunt</h2>

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

        <div v-if="game.currentMonster">
          <hr />

          <h2>
            {{ game.currentMonster.name }}
            Lv.{{ game.currentMonster.level }}
          </h2>

          <p>
            HP {{ game.monsterHp }} /
            {{ game.currentMonster.maxHp }}
          </p>

          <p>ATK {{ game.currentMonster.attack }}</p>
          <p>EXP {{ game.currentMonster.exp }}</p>
          <p>Gold {{ game.currentMonster.gold }}</p>
        </div>

        <hr />

        <h2>Equipment</h2>

        <div v-for="slot in equipmentSlots" :key="slot.key">
          <strong>{{ slot.label }}</strong>

          <template v-if="game.equipped[slot.key]">
            <span>
              —
              <strong :class="getRarityClass(game.equipped[slot.key]!.rarity)">
                {{ game.equipped[slot.key]!.name }}
              </strong>
            </span>

            <button @click="game.unequipItem(slot.key)">Unequip</button>
          </template>

          <span v-else>— Empty</span>
        </div>

        <p>
          Gear bonus: HP +{{ game.equipmentMainStatBonuses.HP }}, ATK +{{ game.equipmentMainStatBonuses.ATK }}, DEF +{{
            game.equipmentMainStatBonuses.DEF
          }}, MATK +{{ game.equipmentMainStatBonuses.MATK }}, MDEF +{{ game.equipmentMainStatBonuses.MDEF }}
        </p>

        <hr />

        <h2>Inventory</h2>

        <p>
          {{ game.inventory.itemCount }}
          /
          {{ game.inventory.capacity }}
        </p>

        <label>
          Sort
          <select :value="game.inventory.sortMode" @change="changeInventorySort">
            <option value="rarityDesc">Rarity ↓</option>

            <option value="rarityAsc">Rarity ↑</option>

            <option value="levelDesc">Level ↓</option>

            <option value="levelAsc">Level ↑</option>
          </select>
        </label>

        <button :disabled="game.inventory.isEmpty" @click="game.sellAllUnlockedItems">Sell All Unlocked</button>

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

        <div v-if="game.inventory.isEmpty">
          <p>Inventory kosong.</p>
        </div>

        <div v-for="item in game.inventory.sortedItems" :key="item.id">
          <hr />

          <p>
            <strong :class="getRarityClass(item.rarity)">
              {{ item.name }}
            </strong>
            <span> Lv.{{ item.level }}</span>
          </p>

          <p>
            {{ item.rarity.toUpperCase() }}
            • Quality {{ item.quality }}%
          </p>

          <p>
            Job:
            {{ getClassLabel(item.requiredClass) }}
          </p>

          <p>
            {{ item.mainStat }}
            {{ item.mainStatValue }}
          </p>

          <p v-for="(affix, index) in item.affixes" :key="index">
            {{ affix.stat }}
            {{ affix.value }}
          </p>

          <p>
            Sell:
            {{ game.inventory.calculateSellPrice(item) }}
            Gold
          </p>

          <button @click="equipItem(item)">Equip</button>

          <button @click="game.toggleInventoryItemLock(item.id)">
            {{ item.locked ? 'Unlock' : 'Lock' }}
          </button>

          <button :disabled="item.locked" @click="game.sellInventoryItem(item.id)">Sell</button>
        </div>

        <div v-if="game.battleLog.length">
          <hr />

          <h2>Battle Log</h2>

          <p v-for="(log, index) in game.battleLog" :key="index">
            {{ log }}
          </p>
        </div>
      </template>
    </section>

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

            <span>
              {{ pendingAccessory.rarity.toUpperCase() }}
              • Quality {{ pendingAccessory.quality }}%
            </span>

            <span>
              Job:
              {{ pendingAccessory.requiredClass ?? 'All' }}
            </span>

            <span>
              {{ pendingAccessory.mainStat }}
              {{ pendingAccessory.mainStatValue }}
            </span>

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
              {{ game.equipped.accessory1.rarity.toUpperCase() }}
              • Quality {{ game.equipped.accessory1.quality }}%
            </span>

            <span>
              Job:
              {{ game.equipped.accessory1.requiredClass ?? 'All' }}
            </span>

            <span>
              {{ game.equipped.accessory1.mainStat }}
              {{ game.equipped.accessory1.mainStatValue }}
            </span>

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
              {{ game.equipped.accessory2.rarity.toUpperCase() }}
              • Quality {{ game.equipped.accessory2.quality }}%
            </span>

            <span>
              Job:
              {{ game.equipped.accessory2.requiredClass ?? 'All' }}
            </span>

            <span>
              {{ game.equipped.accessory2.mainStat }}
              {{ game.equipped.accessory2.mainStatValue }}
            </span>

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
              {{ currentReplacementItem.rarity.toUpperCase() }}
              • Quality {{ currentReplacementItem.quality }}%
            </span>

            <span>
              Job:
              {{ currentReplacementItem.requiredClass ?? 'All' }}
            </span>

            <span>
              {{ currentReplacementItem.mainStat }}
              {{ currentReplacementItem.mainStatValue }}
            </span>

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

            <span>
              {{ pendingEquipment.rarity.toUpperCase() }}
              • Quality {{ pendingEquipment.quality }}%
            </span>

            <span>
              Job:
              {{ pendingEquipment.requiredClass ?? 'All' }}
            </span>

            <span>
              {{ pendingEquipment.mainStat }}
              {{ pendingEquipment.mainStatValue }}
            </span>

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

@media (max-width: 600px) {
  .accessory-choice-grid {
    grid-template-columns: 1fr;
  }

  .equipment-compare {
    grid-template-columns: 1fr;
  }

  .replace-arrow {
    text-align: center;
    transform: rotate(90deg);
  }
}
</style>
