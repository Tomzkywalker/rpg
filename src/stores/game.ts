import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { STATS_CONFIG } from '../config/stats.config'
import { LEVELING_CONFIG } from '../config/leveling.config'
import { COMBAT_CONFIG } from '../config/combat.config'

import { maps } from '../data/maps'
import { createMonster, type Monster } from '../data/monsters'

import {
    loadGame,
    saveGame,
    type GameSaveData,
} from '../services/save.service'

export const useGameStore = defineStore('game', () => {
    const level = ref<number>(LEVELING_CONFIG.initialLevel)
    const exp = ref<number>(LEVELING_CONFIG.initialExp)

    // Nilai awal sementara.
    // Saat initializeGame(), HP/MP akan disesuaikan dengan Max HP/MP
    // atau save game yang tersedia.
    const hp = ref(0)
    const mp = ref(0)

    const gold = ref(0)
    const statusPoints = ref(0)
    const kills = ref(0)
    const deaths = ref(0)

    const selectedMapId = ref(1)
    const currentMonster = ref<Monster | null>(null)
    const monsterHp = ref(0)

    const isAutoHunting = ref(false)
    const isFighting = ref(false)
    const isLoaded = ref(false)

    const battleLog = ref<string[]>([])

    let playerAttackTimer: ReturnType<typeof setTimeout> | null = null
    let monsterAttackTimer: ReturnType<typeof setTimeout> | null = null
    let nextActionTimer: ReturnType<typeof setTimeout> | null = null

    const stats = ref({
        STR: Number(STATS_CONFIG.initial.STR),
        AGI: Number(STATS_CONFIG.initial.AGI),
        VIT: Number(STATS_CONFIG.initial.VIT),
        INT: Number(STATS_CONFIG.initial.INT),
        DEX: Number(STATS_CONFIG.initial.DEX),
        LUK: Number(STATS_CONFIG.initial.LUK),
    })

    const maxHp = computed(() => {
        const config = STATS_CONFIG.hp

        return (
            config.base +
            stats.value.VIT * config.perVit +
            level.value * config.perLevel
        )
    })

    const maxMp = computed(() => {
        const config = STATS_CONFIG.mp

        return (
            config.base +
            stats.value.INT * config.perInt +
            level.value * config.perLevel
        )
    })

    const attack = computed(() => {
        const config = STATS_CONFIG.attack

        return Math.round(
            config.base +
            stats.value.STR * config.perStr +
            level.value * config.perLevel,
        )
    })

    const defense = computed(() => {
        const config = STATS_CONFIG.defense

        return Math.floor(
            stats.value.VIT * config.perVit +
            level.value * config.perLevel,
        )
    })

    const magicAttack = computed(() => {
        const config = STATS_CONFIG.magicAttack

        return Math.round(
            config.base +
            stats.value.INT * config.perInt +
            level.value * config.perLevel,
        )
    })

    const magicDefense = computed(() => {
        const config = STATS_CONFIG.magicDefense

        return Math.floor(
            stats.value.INT * config.perInt +
            stats.value.VIT * config.perVit +
            level.value * config.perLevel,
        )
    })

    const hit = computed(() => {
        const config = STATS_CONFIG.hit

        return Math.round(
            config.base +
            stats.value.DEX * config.perDex +
            level.value * config.perLevel,
        )
    })

    const flee = computed(() => {
        const config = STATS_CONFIG.flee

        return Math.round(
            config.base +
            stats.value.AGI * config.perAgi +
            level.value * config.perLevel,
        )
    })

    const criticalChance = computed(() => {
        const config = STATS_CONFIG.critical

        return Math.min(
            config.max,
            config.base +
            stats.value.LUK * config.perLuk,
        )
    })

    const attackSpeed = computed(() => {
        const config = STATS_CONFIG.attackSpeed

        return Math.min(
            config.max,
            Math.round(
                config.base +
                stats.value.AGI * config.perAgi +
                stats.value.DEX * config.perDex,
            ),
        )
    })

    const playerAttackInterval = computed(() => {
        const config = COMBAT_CONFIG.playerAttackInterval

        const reduction =
            (attackSpeed.value - STATS_CONFIG.attackSpeed.base) *
            config.reductionPerAspd

        return Math.max(
            config.minimumMs,
            config.baseMs - reduction,
        )
    })

    const expNeeded = computed(() => {
        return Math.round(
            LEVELING_CONFIG.exp.base *
            Math.pow(
                LEVELING_CONFIG.exp.growth,
                level.value - 1,
            ),
        )
    })

    const selectedMap = computed(() => {
        return (
            maps.find(
                (map) => map.id === selectedMapId.value,
            ) ?? maps[0]
        )
    })

    function addLog(message: string) {
        battleLog.value.unshift(message)

        if (
            battleLog.value.length >
            COMBAT_CONFIG.battleLogMaxEntries
        ) {
            battleLog.value.pop()
        }
    }

    function getSaveData(): GameSaveData {
        return {
            level: level.value,
            exp: exp.value,
            hp: hp.value,
            mp: mp.value,
            gold: gold.value,
            statusPoints: statusPoints.value,
            kills: kills.value,
            deaths: deaths.value,
            selectedMapId: selectedMapId.value,
            stats: { ...stats.value },
        }
    }

    async function persistGame() {
        try {
            await saveGame(getSaveData())
        } catch (error) {
            console.error('Failed to save game:', error)
        }
    }

    async function initializeGame() {
        try {
            const save = await loadGame()

            if (save) {
                level.value = save.level
                exp.value = save.exp
                gold.value = save.gold
                statusPoints.value = save.statusPoints
                kills.value = save.kills
                deaths.value = save.deaths
                selectedMapId.value = save.selectedMapId
                stats.value = { ...save.stats }

                hp.value = Math.min(
                    save.hp,
                    maxHp.value,
                )

                mp.value = Math.min(
                    save.mp,
                    maxMp.value,
                )

                addLog('Save game berhasil dimuat.')
            } else {
                hp.value = maxHp.value
                mp.value = maxMp.value

                await persistGame()

                addLog('Game baru dibuat.')
            }
        } catch (error) {
            console.error(
                'Failed to load game:',
                error,
            )

            hp.value = maxHp.value
            mp.value = maxMp.value

            addLog(
                'Save gagal dimuat. Game berjalan dengan data baru.',
            )
        } finally {
            isLoaded.value = true
        }
    }

    async function addExp(amount: number) {
        if (amount <= 0) return

        exp.value += amount

        while (
            exp.value >= expNeeded.value
        ) {
            const requiredExp = expNeeded.value

            exp.value -= requiredExp
            level.value += 1

            statusPoints.value +=
                LEVELING_CONFIG.statusPointsPerLevel

            hp.value = maxHp.value
            mp.value = maxMp.value

            addLog(
                `LEVEL UP! Kamu sekarang Level ${level.value}.`,
            )
        }

        await persistGame()
    }

    async function addStat(
        stat: keyof typeof stats.value,
    ) {
        if (statusPoints.value <= 0) return

        stats.value[stat] +=
            LEVELING_CONFIG.statIncreasePerPoint

        statusPoints.value -= 1

        if (stat === 'VIT') {
            hp.value = Math.min(
                hp.value + STATS_CONFIG.hp.perVit,
                maxHp.value,
            )
        }

        if (stat === 'INT') {
            mp.value = Math.min(
                mp.value + STATS_CONFIG.mp.perInt,
                maxMp.value,
            )
        }

        await persistGame()
    }

    async function selectMap(mapId: number) {
        if (isAutoHunting.value) return

        selectedMapId.value = mapId
        currentMonster.value = null
        monsterHp.value = 0
        battleLog.value = []

        await persistGame()
    }

    function createCurrentMonster() {
        const map = selectedMap.value

        const monster = createMonster(
            map.minLevel,
            map.maxLevel,
        )

        currentMonster.value = monster
        monsterHp.value = monster.maxHp

        addLog(
            `Lv.${monster.level} ${monster.name} ditemukan.`,
        )
    }

    function calculatePlayerHitChance(
        monster: Monster,
    ) {
        const config =
            COMBAT_CONFIG.hitChance

        return Math.max(
            config.min,
            Math.min(
                config.max,
                config.base +
                (hit.value - monster.flee) *
                config.statDifferenceMultiplier,
            ),
        )
    }

    function calculateMonsterHitChance(
        monster: Monster,
    ) {
        const config =
            COMBAT_CONFIG.hitChance

        return Math.max(
            config.min,
            Math.min(
                config.max,
                config.base +
                (monster.hit - flee.value) *
                config.statDifferenceMultiplier,
            ),
        )
    }

    function calculatePlayerDamage() {
        const damageConfig =
            COMBAT_CONFIG.playerDamage

        const randomBonus =
            Math.floor(
                Math.random() *
                (damageConfig.randomBonusMax + 1),
            )

        const isCritical =
            Math.random() <
            criticalChance.value / 100

        const rawDamage =
            attack.value + randomBonus

        return {
            damage: Math.max(
                damageConfig.min,
                Math.round(
                    rawDamage *
                    (isCritical
                        ? COMBAT_CONFIG.criticalDamageMultiplier
                        : 1),
                ),
            ),
            isCritical,
        }
    }

    function calculateMonsterDamage(
        monster: Monster,
    ) {
        const damageConfig =
            COMBAT_CONFIG.monsterDamage

        const randomBonus =
            Math.floor(
                Math.random() *
                (damageConfig.randomBonusMax + 1),
            )

        return Math.max(
            damageConfig.min,
            monster.attack -
            defense.value +
            randomBonus,
        )
    }

    function clearCombatTimers() {
        if (playerAttackTimer) {
            clearTimeout(playerAttackTimer)
            playerAttackTimer = null
        }

        if (monsterAttackTimer) {
            clearTimeout(monsterAttackTimer)
            monsterAttackTimer = null
        }

        isFighting.value = false
    }

    function clearNextActionTimer() {
        if (nextActionTimer) {
            clearTimeout(nextActionTimer)
            nextActionTimer = null
        }
    }

    function scheduleNextMonster(
        delay: number = COMBAT_CONFIG.nextMonsterDelayMs,
    ) {
        if (!isAutoHunting.value) return

        clearNextActionTimer()

        nextActionTimer = setTimeout(() => {
            if (!isAutoHunting.value) return

            createCurrentMonster()
            startCombat()
        }, delay)
    }

    async function playerWins() {
        const monster =
            currentMonster.value

        if (!monster) return

        clearCombatTimers()

        kills.value += 1
        gold.value += monster.gold

        addLog(
            `${monster.name} dikalahkan! +${monster.exp} EXP, +${monster.gold} Gold.`,
        )

        await addExp(monster.exp)

        scheduleNextMonster()
    }

    async function playerDies() {
        clearCombatTimers()

        deaths.value += 1

        const expPenalty = Math.ceil(
            expNeeded.value *
            LEVELING_CONFIG.death.expPenaltyRate,
        )

        const actualExpLost = Math.min(
            exp.value,
            expPenalty,
        )

        exp.value = Math.max(
            LEVELING_CONFIG.death.minimumExp,
            exp.value - expPenalty,
        )

        hp.value = maxHp.value
        mp.value = maxMp.value

        addLog(
            `Kamu kalah. Kehilangan ${actualExpLost} EXP dan respawn otomatis. Total death: ${deaths.value}.`,
        )

        await persistGame()

        scheduleNextMonster(
            COMBAT_CONFIG.deathRespawnDelayMs,
        )
    }

    async function playerAttackTick() {
        const monster =
            currentMonster.value

        if (
            !monster ||
            !isAutoHunting.value ||
            !isFighting.value
        ) {
            return
        }

        const hitChance =
            calculatePlayerHitChance(monster)

        if (
            Math.random() * 100 >
            hitChance
        ) {
            addLog(
                `Seranganmu MISS terhadap ${monster.name}.`,
            )
        } else {
            const playerAttack =
                calculatePlayerDamage()

            monsterHp.value = Math.max(
                0,
                monsterHp.value -
                playerAttack.damage,
            )

            addLog(
                playerAttack.isCritical
                    ? `CRITICAL! Kamu memberikan ${playerAttack.damage} damage.`
                    : `Kamu memberikan ${playerAttack.damage} damage.`,
            )

            if (
                monsterHp.value <= 0
            ) {
                await playerWins()
                return
            }
        }

        if (
            isAutoHunting.value &&
            isFighting.value
        ) {
            playerAttackTimer = setTimeout(
                () => {
                    void playerAttackTick()
                },
                playerAttackInterval.value,
            )
        }
    }

    async function monsterAttackTick() {
        const monster =
            currentMonster.value

        if (
            !monster ||
            !isAutoHunting.value ||
            !isFighting.value
        ) {
            return
        }

        const hitChance =
            calculateMonsterHitChance(
                monster,
            )

        if (
            Math.random() * 100 >
            hitChance
        ) {
            addLog(
                `Kamu menghindari serangan ${monster.name}.`,
            )
        } else {
            const monsterDamage =
                calculateMonsterDamage(
                    monster,
                )

            hp.value = Math.max(
                0,
                hp.value - monsterDamage,
            )

            addLog(
                `${monster.name} memberikan ${monsterDamage} damage.`,
            )

            if (hp.value <= 0) {
                await playerDies()
                return
            }
        }

        if (
            isAutoHunting.value &&
            isFighting.value
        ) {
            monsterAttackTimer = setTimeout(
                () => {
                    void monsterAttackTick()
                },
                COMBAT_CONFIG.monsterAttackIntervalMs,
            )
        }
    }

    function startCombat() {
        if (
            !isAutoHunting.value ||
            isFighting.value ||
            !currentMonster.value
        ) {
            return
        }

        isFighting.value = true

        void playerAttackTick()
        void monsterAttackTick()
    }

    function startAutoHunt() {
        if (isAutoHunting.value) return

        isAutoHunting.value = true

        addLog(
            `Auto Hunt dimulai di ${selectedMap.value.name}.`,
        )

        createCurrentMonster()
        startCombat()
    }

    async function stopAutoHunt() {
        if (!isAutoHunting.value) return

        isAutoHunting.value = false

        clearCombatTimers()
        clearNextActionTimer()

        currentMonster.value = null
        monsterHp.value = 0

        addLog(
            'Auto Hunt dihentikan.',
        )

        await persistGame()
    }

    async function rest() {
        if (isAutoHunting.value) return

        hp.value = maxHp.value
        mp.value = maxMp.value

        addLog(
            'HP dan MP dipulihkan.',
        )

        await persistGame()
    }

    return {
        level,
        exp,
        hp,
        mp,
        gold,
        statusPoints,
        kills,
        deaths,

        selectedMapId,
        currentMonster,
        monsterHp,

        isAutoHunting,
        isFighting,
        isLoaded,

        battleLog,
        stats,

        maxHp,
        maxMp,

        attack,
        defense,
        magicAttack,
        magicDefense,
        hit,
        flee,
        criticalChance,
        attackSpeed,
        playerAttackInterval,

        expNeeded,
        selectedMap,

        initializeGame,
        addStat,
        selectMap,
        startAutoHunt,
        stopAutoHunt,
        rest,
    }
})