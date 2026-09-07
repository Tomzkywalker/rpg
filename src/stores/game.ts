import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { maps } from '../data/maps'
import { createMonster, type Monster } from '../data/monsters'
import {
    loadGame,
    saveGame,
    type GameSaveData,
} from '../services/save.service'

export const useGameStore = defineStore('game', () => {
    const level = ref(1)
    const exp = ref(0)

    const hp = ref(100)
    const mp = ref(40)

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
        STR: 5,
        AGI: 5,
        VIT: 5,
        INT: 5,
        DEX: 5,
        LUK: 5,
    })

    const maxHp = computed(() => {
        return 75 + stats.value.VIT * 5 + level.value * 3
    })

    const maxMp = computed(() => {
        return 25 + stats.value.INT * 3 + level.value
    })

    const attack = computed(() => {
        return Math.round(
            9 +
            stats.value.STR * 2.4 +
            level.value * 0.8,
        )
    })

    const defense = computed(() => {
        return Math.floor(
            stats.value.VIT * 0.55 +
            level.value * 0.15,
        )
    })

    const magicAttack = computed(() => {
        return Math.round(
            5 +
            stats.value.INT * 2.2 +
            level.value * 0.7,
        )
    })

    const magicDefense = computed(() => {
        return Math.floor(
            stats.value.INT * 0.35 +
            stats.value.VIT * 0.25 +
            level.value * 0.15,
        )
    })

    const hit = computed(() => {
        return Math.round(
            75 +
            stats.value.DEX * 2 +
            level.value,
        )
    })

    const flee = computed(() => {
        return Math.round(
            5 +
            stats.value.AGI * 1.5 +
            level.value * 0.5,
        )
    })

    const criticalChance = computed(() => {
        return Math.min(
            40,
            5 + stats.value.LUK * 0.4,
        )
    })

    const attackSpeed = computed(() => {
        return Math.min(
            200,
            Math.round(
                100 +
                stats.value.AGI * 1.5 +
                stats.value.DEX * 0.3,
            ),
        )
    })

    const playerAttackInterval = computed(() => {
        const reduction =
            (attackSpeed.value - 100) * 5

        return Math.max(
            250,
            1000 - reduction,
        )
    })

    const expNeeded = computed(() => {
        return Math.round(
            100 * Math.pow(1.34, level.value - 1),
        )
    })

    const selectedMap = computed(() => {
        return maps.find((map) => map.id === selectedMapId.value) ?? maps[0]
    })

    function addLog(message: string) {
        battleLog.value.unshift(message)

        if (battleLog.value.length > 30) {
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

                hp.value = Math.min(save.hp, maxHp.value)
                mp.value = Math.min(save.mp, maxMp.value)

                addLog('Save game berhasil dimuat.')
            } else {
                hp.value = maxHp.value
                mp.value = maxMp.value

                await persistGame()

                addLog('Game baru dibuat.')
            }
        } catch (error) {
            console.error('Failed to load game:', error)

            hp.value = maxHp.value
            mp.value = maxMp.value

            addLog('Save gagal dimuat. Game berjalan dengan data baru.')
        } finally {
            isLoaded.value = true
        }
    }

    async function addExp(amount: number) {
        if (amount <= 0) return

        exp.value += amount

        while (exp.value >= expNeeded.value) {
            const requiredExp = expNeeded.value

            exp.value -= requiredExp
            level.value += 1
            statusPoints.value += 5

            hp.value = maxHp.value
            mp.value = maxMp.value

            addLog(
                `LEVEL UP! Kamu sekarang Level ${level.value}.`,
            )
        }

        await persistGame()
    }

    async function addStat(stat: keyof typeof stats.value) {
        if (statusPoints.value <= 0) return

        stats.value[stat] += 1
        statusPoints.value -= 1

        if (stat === 'VIT') {
            hp.value = Math.min(
                hp.value + 5,
                maxHp.value,
            )
        }

        if (stat === 'INT') {
            mp.value = Math.min(
                mp.value + 3,
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

    function calculatePlayerHitChance(monster: Monster) {
        return Math.max(
            5,
            Math.min(
                95,
                80 +
                (hit.value - monster.flee) * 0.5,
            ),
        )
    }

    function calculateMonsterHitChance(monster: Monster) {
        return Math.max(
            5,
            Math.min(
                95,
                80 +
                (monster.hit - flee.value) * 0.5,
            ),
        )
    }

    function calculatePlayerDamage() {
        const randomBonus =
            Math.floor(Math.random() * 9)

        const isCritical =
            Math.random() <
            criticalChance.value / 100

        const rawDamage =
            attack.value + randomBonus

        return {
            damage: Math.max(
                1,
                Math.round(
                    rawDamage *
                    (isCritical ? 1.7 : 1),
                ),
            ),
            isCritical,
        }
    }

    function calculateMonsterDamage(monster: Monster) {
        const randomBonus =
            Math.floor(Math.random() * 6)

        return Math.max(
            1,
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

    function scheduleNextMonster(delay = 650) {
        if (!isAutoHunting.value) return

        clearNextActionTimer()

        nextActionTimer = setTimeout(() => {
            if (!isAutoHunting.value) return

            createCurrentMonster()
            startCombat()
        }, delay)
    }

    async function playerWins() {
        const monster = currentMonster.value

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
            expNeeded.value * 0.01,
        )

        const actualExpLost = Math.min(
            exp.value,
            expPenalty,
        )

        exp.value = Math.max(
            0,
            exp.value - expPenalty,
        )

        hp.value = maxHp.value
        mp.value = maxMp.value

        addLog(
            `Kamu kalah. Kehilangan ${actualExpLost} EXP dan respawn otomatis. Total death: ${deaths.value}.`,
        )

        await persistGame()

        scheduleNextMonster(900)
    }

    async function playerAttackTick() {
        const monster = currentMonster.value

        if (
            !monster ||
            !isAutoHunting.value ||
            !isFighting.value
        ) {
            return
        }

        const hitChance =
            calculatePlayerHitChance(monster)

        if (Math.random() * 100 > hitChance) {
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

            if (monsterHp.value <= 0) {
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
        const monster = currentMonster.value

        if (
            !monster ||
            !isAutoHunting.value ||
            !isFighting.value
        ) {
            return
        }

        const hitChance =
            calculateMonsterHitChance(monster)

        if (Math.random() * 100 > hitChance) {
            addLog(
                `Kamu menghindari serangan ${monster.name}.`,
            )
        } else {
            const monsterDamage =
                calculateMonsterDamage(monster)

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
                1000,
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

        addLog('Auto Hunt dihentikan.')

        await persistGame()
    }

    async function rest() {
        if (isAutoHunting.value) return

        hp.value = maxHp.value
        mp.value = maxMp.value

        addLog('HP dan MP dipulihkan.')

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