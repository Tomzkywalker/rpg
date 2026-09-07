<script setup lang="ts">
import { onMounted } from 'vue'

import { maps } from './data/maps'
import { CHARACTER_CLASSES } from './data/classes'
import { useGameStore } from './stores/game'

import type {
  CharacterClass,
  EquipmentRarity,
} from './types/equipment'

import type {
  InventorySort,
} from './stores/inventory'

const game = useGameStore()

const rarityOptions: EquipmentRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythical',
]

onMounted(() => {
  void game.initializeGame()
})

function changeJob(
  event: Event,
) {
  const target =
    event.target as HTMLSelectElement

  void game.setCharacterClass(
    target.value as CharacterClass,
  )
}

function changeInventorySort(
  event: Event,
) {
  const target =
    event.target as HTMLSelectElement

  void game.setInventorySort(
    target.value as InventorySort,
  )
}

function changeAutoSellEnabled(
  event: Event,
) {
  const target =
    event.target as HTMLInputElement

  void game.setAutoSellEnabled(
    target.checked,
  )
}

function changeAutoSellLevelEnabled(
  event: Event,
) {
  const target =
    event.target as HTMLInputElement

  void game.setAutoSellBelowLevel(
    target.checked,
    game.inventory.autoSell.sellBelowLevel,
  )
}

function changeAutoSellLevel(
  event: Event,
) {
  const target =
    event.target as HTMLInputElement

  void game.setAutoSellBelowLevel(
    game.inventory.autoSell
      .sellBelowLevelEnabled,
    Number(target.value),
  )
}

function changeAutoSellRarityEnabled(
  event: Event,
) {
  const target =
    event.target as HTMLInputElement

  void game.setAutoSellMinimumRarity(
    target.checked,
    game.inventory.autoSell
      .minimumRarity,
  )
}

function changeMinimumRarity(
  event: Event,
) {
  const target =
    event.target as HTMLSelectElement

  void game.setAutoSellMinimumRarity(
    game.inventory.autoSell
      .sellBelowRarityEnabled,
    target.value as EquipmentRarity,
  )
}

function changeOtherJobAutoSell(
  event: Event,
) {
  const target =
    event.target as HTMLInputElement

  void game.setAutoSellOtherClasses(
    target.checked,
  )
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
          <select
            :value="game.characterClass"
            :disabled="game.isAutoHunting"
            @change="changeJob"
          >
            <option
              v-for="job in CHARACTER_CLASSES"
              :key="job.value"
              :value="job.value"
            >
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

        <div
          v-for="(value, stat) in game.stats"
          :key="stat"
        >
          <strong>{{ stat }}</strong>: {{ value }}

          <button
            :disabled="game.statusPoints <= 0"
            @click="game.addStat(stat)"
          >
            +1
          </button>
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
            @change="
              game.selectMap(
                Number(
                  ($event.target as HTMLSelectElement).value,
                ),
              )
            "
          >
            <option
              v-for="map in maps"
              :key="map.id"
              :value="map.id"
            >
              {{ map.name }}
              (Lv. {{ map.minLevel }}-{{ map.maxLevel }})
            </option>
          </select>
        </label>

        <p>
          Selected:
          <strong>{{ game.selectedMap.name }}</strong>
        </p>

        <button
          v-if="!game.isAutoHunting"
          @click="game.startAutoHunt"
        >
          Start Auto Hunt
        </button>

        <button
          v-else
          @click="game.stopAutoHunt"
        >
          Stop Auto Hunt
        </button>

        <button
          :disabled="game.isAutoHunting"
          @click="game.rest"
        >
          Rest
        </button>

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

        <h2>Inventory</h2>

        <p>
          {{ game.inventory.itemCount }}
          /
          {{ game.inventory.capacity }}
        </p>

        <label>
          Sort
          <select
            :value="game.inventory.sortMode"
            @change="changeInventorySort"
          >
            <option value="rarityDesc">
              Rarity ↓
            </option>

            <option value="rarityAsc">
              Rarity ↑
            </option>

            <option value="levelDesc">
              Level ↓
            </option>

            <option value="levelAsc">
              Level ↑
            </option>
          </select>
        </label>

        <button
          :disabled="game.inventory.isEmpty"
          @click="game.sellAllUnlockedItems"
        >
          Sell All Unlocked
        </button>

        <h3>Auto Sell</h3>

        <label>
          <input
            type="checkbox"
            :checked="
              game.inventory.autoSell.enabled
            "
            @change="changeAutoSellEnabled"
          />

          Enable Auto Sell
        </label>

        <br />

        <label>
          <input
            type="checkbox"
            :checked="
              game.inventory.autoSell
                .sellBelowLevelEnabled
            "
            @change="
              changeAutoSellLevelEnabled
            "
          />

          Sell item below Level
        </label>

        <input
          type="number"
          min="1"
          :value="
            game.inventory.autoSell
              .sellBelowLevel
          "
          @change="changeAutoSellLevel"
        />

        <br />

        <label>
          <input
            type="checkbox"
            :checked="
              game.inventory.autoSell
                .sellBelowRarityEnabled
            "
            @change="
              changeAutoSellRarityEnabled
            "
          />

          Sell below rarity
        </label>

        <select
          :value="
            game.inventory.autoSell
              .minimumRarity
          "
          @change="changeMinimumRarity"
        >
          <option
            v-for="rarity in rarityOptions"
            :key="rarity"
            :value="rarity"
          >
            {{ rarity }}
          </option>
        </select>

        <br />

        <label>
          <input
            type="checkbox"
            :checked="
              game.inventory.autoSell
                .sellOtherClasses
            "
            @change="
              changeOtherJobAutoSell
            "
          />

          Sell equipment from other jobs
        </label>

        <div v-if="game.inventory.isEmpty">
          <p>Inventory kosong.</p>
        </div>

        <div
          v-for="
            item in game.inventory.sortedItems
          "
          :key="item.id"
        >
          <hr />

          <strong>{{ item.name }}</strong>

          <p>
            {{ item.rarity.toUpperCase() }}
            • Lv.{{ item.level }}
            • Quality {{ item.quality }}%
          </p>

          <p>
            {{ item.mainStat }}
            +{{ item.mainStatValue }}
          </p>

          <p
            v-for="(
              affix,
              index
            ) in item.affixes"
            :key="index"
          >
            {{ affix.stat }}
            +{{ affix.value }}
          </p>

          <p>
            Job:
            {{ item.requiredClass ?? 'All' }}
          </p>

          <p>
            Sell:
            {{
              game.inventory.calculateSellPrice(
                item,
              )
            }}
            Gold
          </p>

          <button
            @click="
              game.toggleInventoryItemLock(
                item.id,
              )
            "
          >
            {{
              item.locked
                ? 'Unlock'
                : 'Lock'
            }}
          </button>

          <button
            :disabled="item.locked"
            @click="
              game.sellInventoryItem(
                item.id,
              )
            "
          >
            Sell
          </button>
        </div>

        <div v-if="game.battleLog.length">
          <hr />

          <h2>Battle Log</h2>

          <p
            v-for="(log, index) in game.battleLog"
            :key="index"
          >
            {{ log }}
          </p>
        </div>
      </template>
    </section>
  </main>
</template>
