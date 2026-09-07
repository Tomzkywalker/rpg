<script setup lang="ts">
import { onMounted } from 'vue'
import { maps } from './data/maps'
import { useGameStore } from './stores/game'

const game = useGameStore()

onMounted(() => {
  void game.initializeGame()
})
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
                Number(($event.target as HTMLSelectElement).value),
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