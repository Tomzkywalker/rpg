import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { STATS_CONFIG } from '../config/stats.config'
import { LEVELING_CONFIG } from '../config/leveling.config'
import { COMBAT_CONFIG } from '../config/combat.config'

import { maps } from '../data/maps'
import { CHARACTER_CLASSES, type DamageType } from '../data/classes'
import { createMonster, type Monster } from '../data/monsters'

import { loadGame, saveGame, type GameSaveData } from '../services/save.service'

import { rollEquipmentDrop } from '../services/equipment.service'

import { useInventoryStore, type InventorySort } from './inventory'

import type { CharacterClass, Equipment, EquipmentRarity } from '../types/equipment'

interface ExtendedInventorySaveData {
    items: Equipment[]
    capacity: number
    sortMode: InventorySort

    autoSell: {
        enabled: boolean

        sellBelowLevelEnabled: boolean
        sellBelowLevel: number

        sellBelowRarityEnabled: boolean
        minimumRarity: EquipmentRarity

        sellOtherClasses: boolean
    }
}

type EquippedSlotKey = 'weapon' | 'head' | 'armor' | 'gloves' | 'boots' | 'offHand' | 'accessory1' | 'accessory2'

type EquippedItems = Record<EquippedSlotKey, Equipment | null>

type ExtendedGameSaveData = GameSaveData & {
    characterClass?: CharacterClass
    inventory?: ExtendedInventorySaveData
    equipped?: Partial<EquippedItems>
}

export const useGameStore = defineStore('game', () => {
    const inventory = useInventoryStore()

    const characterClass = ref<CharacterClass>('warrior')

    const equipped = ref<EquippedItems>({
        weapon: null,
        head: null,
        armor: null,
        gloves: null,
        boots: null,
        offHand: null,
        accessory1: null,
        accessory2: null,
    })

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

    const equipmentBaseStatBonuses = computed(() => {
        const bonuses = {
            STR: 0,
            AGI: 0,
            VIT: 0,
            INT: 0,
            DEX: 0,
            LUK: 0,
        }

        for (const item of Object.values(equipped.value)) {
            if (!item) {
                continue
            }

            for (const affix of item.affixes) {
                bonuses[affix.stat] += affix.value
            }
        }

        return bonuses
    })

    const totalStats = computed(() => ({
        STR: stats.value.STR + equipmentBaseStatBonuses.value.STR,

        AGI: stats.value.AGI + equipmentBaseStatBonuses.value.AGI,

        VIT: stats.value.VIT + equipmentBaseStatBonuses.value.VIT,

        INT: stats.value.INT + equipmentBaseStatBonuses.value.INT,

        DEX: stats.value.DEX + equipmentBaseStatBonuses.value.DEX,

        LUK: stats.value.LUK + equipmentBaseStatBonuses.value.LUK,
    }))

    const equipmentMainStatBonuses = computed(() => {
        const bonuses = {
            HP: 0,
            ATK: 0,
            DEF: 0,
            MATK: 0,
            MDEF: 0,
        }

        for (const item of Object.values(equipped.value)) {
            if (!item) {
                continue
            }

            bonuses[item.mainStat] += item.mainStatValue
        }

        return bonuses
    })

    const maxHp = computed(() => {
        const config = STATS_CONFIG.hp

        return (
            config.base +
            totalStats.value.VIT * config.perVit +
            level.value * config.perLevel +
            equipmentMainStatBonuses.value.HP
        )
    })

    const maxMp = computed(() => {
        const config = STATS_CONFIG.mp

        return config.base + totalStats.value.INT * config.perInt + level.value * config.perLevel
    })

    const attack = computed(() => {
        const config = STATS_CONFIG.attack

        return Math.round(
            config.base +
            totalStats.value.STR * config.perStr +
            level.value * config.perLevel +
            equipmentMainStatBonuses.value.ATK,
        )
    })

    const defense = computed(() => {
        const config = STATS_CONFIG.defense

        return Math.floor(
            totalStats.value.VIT * config.perVit + level.value * config.perLevel + equipmentMainStatBonuses.value.DEF,
        )
    })

    const magicAttack = computed(() => {
        const config = STATS_CONFIG.magicAttack

        return Math.round(
            config.base +
            totalStats.value.INT * config.perInt +
            level.value * config.perLevel +
            equipmentMainStatBonuses.value.MATK,
        )
    })

    const magicDefense = computed(() => {
        const config = STATS_CONFIG.magicDefense

        return Math.floor(
            totalStats.value.INT * config.perInt +
            totalStats.value.VIT * config.perVit +
            level.value * config.perLevel +
            equipmentMainStatBonuses.value.MDEF,
        )
    })

    const hit = computed(() => {
        const config = STATS_CONFIG.hit

        return Math.round(config.base + totalStats.value.DEX * config.perDex + level.value * config.perLevel)
    })

    const flee = computed(() => {
        const config = STATS_CONFIG.flee

        return Math.round(config.base + totalStats.value.AGI * config.perAgi + level.value * config.perLevel)
    })

    const criticalChance = computed(() => {
        const config = STATS_CONFIG.critical

        return Math.min(config.max, config.base + totalStats.value.LUK * config.perLuk)
    })

    const attackSpeed = computed(() => {
        const config = STATS_CONFIG.attackSpeed

        return Math.min(
            config.max,

            Math.round(config.base + totalStats.value.AGI * config.perAgi + totalStats.value.DEX * config.perDex),
        )
    })

    const playerAttackInterval = computed(() => {
        const config = COMBAT_CONFIG.playerAttackInterval

        const reduction = (attackSpeed.value - STATS_CONFIG.attackSpeed.base) * config.reductionPerAspd

        return Math.max(config.minimumMs, config.baseMs - reduction)
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
        return maps.find((map) => map.id === selectedMapId.value) ?? maps[0]
    })

    function addLog(message: string) {
        battleLog.value.unshift(message)

        if (battleLog.value.length > COMBAT_CONFIG.battleLogMaxEntries) {
            battleLog.value.pop()
        }
    }

    function getSaveData(): ExtendedGameSaveData {
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

            stats: {
                ...stats.value,
            },

            characterClass: characterClass.value,

            equipped: Object.fromEntries(
                Object.entries(equipped.value).map(([slot, item]) => [
                    slot,
                    item
                        ? {
                            ...item,
                            affixes: item.affixes.map((affix) => ({
                                ...affix,
                            })),
                        }
                        : null,
                ]),
            ) as EquippedItems,

            inventory: {
                items: inventory.items.map((item) => ({
                    ...item,

                    affixes: item.affixes.map((affix) => ({
                        ...affix,
                    })),
                })),

                capacity: inventory.capacity,

                sortMode: inventory.sortMode,

                autoSell: {
                    ...inventory.autoSell,
                },
            },
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
            const save = (await loadGame()) as ExtendedGameSaveData | null

            if (save) {
                level.value = save.level

                exp.value = save.exp

                gold.value = save.gold

                statusPoints.value = save.statusPoints

                kills.value = save.kills

                deaths.value = save.deaths

                selectedMapId.value = save.selectedMapId

                stats.value = {
                    ...save.stats,
                }

                characterClass.value = save.characterClass ?? 'warrior'

                equipped.value = {
                    weapon: save.equipped?.weapon ?? null,

                    head: save.equipped?.head ?? null,

                    armor: save.equipped?.armor ?? null,

                    gloves: save.equipped?.gloves ?? null,

                    boots: save.equipped?.boots ?? null,

                    offHand: save.equipped?.offHand ?? null,

                    accessory1: save.equipped?.accessory1 ?? null,

                    accessory2: save.equipped?.accessory2 ?? null,
                }

                if (save.inventory) {
                    inventory.setItems(save.inventory.items ?? [])

                    inventory.setCapacity(save.inventory.capacity)

                    inventory.setSortMode(save.inventory.sortMode ?? 'rarityDesc')

                    inventory.setAutoSellEnabled(save.inventory.autoSell?.enabled ?? false)

                    inventory.setSellBelowLevel(
                        save.inventory.autoSell?.sellBelowLevelEnabled ?? false,

                        save.inventory.autoSell?.sellBelowLevel ?? 1,
                    )

                    inventory.setMinimumRarity(
                        save.inventory.autoSell?.sellBelowRarityEnabled ?? false,

                        save.inventory.autoSell?.minimumRarity ?? 'common',
                    )

                    inventory.setSellOtherClasses(save.inventory.autoSell?.sellOtherClasses ?? false)
                }

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
        if (amount <= 0) {
            return
        }

        exp.value += amount

        while (exp.value >= expNeeded.value) {
            const requiredExp = expNeeded.value

            exp.value -= requiredExp

            level.value += 1

            statusPoints.value += LEVELING_CONFIG.statusPointsPerLevel

            hp.value = maxHp.value

            mp.value = maxMp.value

            addLog(`LEVEL UP! Kamu sekarang Level ${level.value}.`)
        }

        await persistGame()
    }

    async function addStat(stat: keyof typeof stats.value) {
        if (statusPoints.value <= 0) {
            return
        }

        stats.value[stat] += LEVELING_CONFIG.statIncreasePerPoint

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
        if (isAutoHunting.value) {
            return
        }

        selectedMapId.value = mapId

        currentMonster.value = null

        monsterHp.value = 0

        battleLog.value = []

        await persistGame()
    }

    function createCurrentMonster() {
        const map = selectedMap.value

        const monster = createMonster(map.minLevel, map.maxLevel)

        currentMonster.value = monster

        monsterHp.value = monster.maxHp

        addLog(`Lv.${monster.level} ${monster.name} ditemukan.`)
    }

    function calculatePlayerHitChance(monster: Monster) {
        const config = COMBAT_CONFIG.hitChance

        return Math.max(
            config.min,

            Math.min(
                config.max,

                config.base + (hit.value - monster.flee) * config.statDifferenceMultiplier,
            ),
        )
    }

    function calculateMonsterHitChance(monster: Monster) {
        const config = COMBAT_CONFIG.hitChance

        return Math.max(
            config.min,

            Math.min(
                config.max,

                config.base + (monster.hit - flee.value) * config.statDifferenceMultiplier,
            ),
        )
    }

    function calculateBasicAttackOffense() {
        const classDefinition =
            CHARACTER_CLASSES.find(
                (definition) =>
                    definition.value === characterClass.value,
            ) ?? CHARACTER_CLASSES[0]

        const scaling = classDefinition.basicAttack.scaling

        return {
            damageType: classDefinition.basicAttack.damageType,

            offensivePower:
                attack.value * scaling.attack +
                magicAttack.value * scaling.magicAttack,
        }
    }

    function calculatePlayerDamage(monster: Monster) {
        const damageConfig = COMBAT_CONFIG.playerDamage

        const randomBonus = Math.floor(
            Math.random() *
            (damageConfig.randomBonusMax + 1),
        )

        const isCritical =
            Math.random() <
            criticalChance.value / 100

        const basicAttack = calculateBasicAttackOffense()

        const defensivePower = getMonsterDefense(
            monster,
            basicAttack.damageType,
        )

        const rawDamage = Math.max(
            damageConfig.min,
            basicAttack.offensivePower -
            defensivePower +
            randomBonus,
        )

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
            damageType: basicAttack.damageType,
        }
    }

    function calculateMonsterDamage(monster: Monster) {
        const damageConfig = COMBAT_CONFIG.monsterDamage

        const randomBonus = Math.floor(Math.random() * (damageConfig.randomBonusMax + 1))

        return Math.max(
            damageConfig.min,

            monster.attack - defense.value + randomBonus,
        )
    }

    function getMonsterDefense(
        monster: Monster,
        damageType: DamageType,
    ) {
        switch (damageType) {
            case 'physical':
                return monster.defense

            case 'magical':
                return monster.magicDefense

            case 'hybrid':
                throw new Error(
                    'Hybrid damage mitigation formula is not configured yet.',
                )
        }
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

    function scheduleNextMonster(delay: number = COMBAT_CONFIG.nextMonsterDelayMs) {
        if (!isAutoHunting.value) {
            return
        }

        clearNextActionTimer()

        nextActionTimer = setTimeout(() => {
            if (!isAutoHunting.value) {
                return
            }

            createCurrentMonster()
            startCombat()
        }, delay)
    }

    async function playerWins() {
        const monster = currentMonster.value

        if (!monster) {
            return
        }

        clearCombatTimers()

        kills.value += 1

        gold.value += monster.gold

        addLog(`${monster.name} dikalahkan! +${monster.exp} EXP, +${monster.gold} Gold.`)

        const equipment = rollEquipmentDrop(monster.level)

        if (equipment) {
            const result = inventory.addItem(equipment, characterClass.value)

            if (result.autoSold) {
                gold.value += result.goldEarned

                addLog(
                    `DROP: ${equipment.name} [${equipment.rarity.toUpperCase()}] Q${equipment.quality} auto-sold +${result.goldEarned} Gold.`,
                )
            } else if (result.inventoryFull) {
                addLog(`DROP: ${equipment.name} tidak masuk karena inventory penuh.`)
            } else {
                addLog(`DROP: ${equipment.name} [${equipment.rarity.toUpperCase()}] Q${equipment.quality}.`)
            }
        }

        await addExp(monster.exp)

        scheduleNextMonster()
    }

    async function playerDies() {
        clearCombatTimers()

        deaths.value += 1

        const expPenalty = Math.ceil(expNeeded.value * LEVELING_CONFIG.death.expPenaltyRate)

        const actualExpLost = Math.min(exp.value, expPenalty)

        exp.value = Math.max(
            LEVELING_CONFIG.death.minimumExp,

            exp.value - expPenalty,
        )

        hp.value = maxHp.value

        mp.value = maxMp.value

        addLog(`Kamu kalah. Kehilangan ${actualExpLost} EXP dan respawn otomatis. Total death: ${deaths.value}.`)

        await persistGame()

        scheduleNextMonster(COMBAT_CONFIG.deathRespawnDelayMs)
    }

    async function playerAttackTick() {
        const monster = currentMonster.value

        if (!monster || !isAutoHunting.value || !isFighting.value) {
            return
        }

        const hitChance = calculatePlayerHitChance(monster)

        if (Math.random() * 100 > hitChance) {
            addLog(`Seranganmu MISS terhadap ${monster.name}.`)
        } else {
            const playerAttack = calculatePlayerDamage(monster)

            monsterHp.value = Math.max(
                0,

                monsterHp.value - playerAttack.damage,
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

        if (isAutoHunting.value && isFighting.value) {
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

        if (!monster || !isAutoHunting.value || !isFighting.value) {
            return
        }

        const hitChance = calculateMonsterHitChance(monster)

        if (Math.random() * 100 > hitChance) {
            addLog(`Kamu menghindari serangan ${monster.name}.`)
        } else {
            const monsterDamage = calculateMonsterDamage(monster)

            hp.value = Math.max(
                0,

                hp.value - monsterDamage,
            )

            addLog(`${monster.name} memberikan ${monsterDamage} damage.`)

            if (hp.value <= 0) {
                await playerDies()
                return
            }
        }

        if (isAutoHunting.value && isFighting.value) {
            monsterAttackTimer = setTimeout(
                () => {
                    void monsterAttackTick()
                },

                COMBAT_CONFIG.monsterAttackIntervalMs,
            )
        }
    }

    function startCombat() {
        if (!isAutoHunting.value || isFighting.value || !currentMonster.value) {
            return
        }

        isFighting.value = true

        void playerAttackTick()
        void monsterAttackTick()
    }

    function startAutoHunt() {
        if (isAutoHunting.value) {
            return
        }

        isAutoHunting.value = true

        addLog(`Auto Hunt dimulai di ${selectedMap.value.name}.`)

        createCurrentMonster()
        startCombat()
    }

    async function stopAutoHunt() {
        if (!isAutoHunting.value) {
            return
        }

        isAutoHunting.value = false

        clearCombatTimers()
        clearNextActionTimer()

        currentMonster.value = null

        monsterHp.value = 0

        addLog('Auto Hunt dihentikan.')

        await persistGame()
    }

    async function rest() {
        if (isAutoHunting.value) {
            return
        }

        hp.value = maxHp.value

        mp.value = maxMp.value

        addLog('HP dan MP dipulihkan.')

        await persistGame()
    }

    function getEquipmentTargetSlot(
        item: Equipment,
        accessorySlot: 'accessory1' | 'accessory2' = 'accessory1',
    ): EquippedSlotKey {
        if (item.slot === 'accessory') {
            return accessorySlot
        }

        return item.slot
    }

    function canEquipItem(item: Equipment) {
        return item.requiredClass === 'all' || item.requiredClass === characterClass.value
    }

    async function equipInventoryItem(itemId: string, accessorySlot: 'accessory1' | 'accessory2' = 'accessory1') {
        const item = inventory.getItemById(itemId)

        if (!item) {
            return
        }

        if (!canEquipItem(item)) {
            addLog(`${item.name} tidak bisa dipakai oleh job ${characterClass.value}.`)

            return
        }

        let targetSlot: EquippedSlotKey

        if (item.slot === 'accessory') {
            if (!equipped.value.accessory1) {
                targetSlot = 'accessory1'
            } else if (!equipped.value.accessory2) {
                targetSlot = 'accessory2'
            } else {
                targetSlot = accessorySlot
            }
        } else {
            targetSlot = getEquipmentTargetSlot(item, accessorySlot)
        }

        const previousItem = equipped.value[targetSlot]

        inventory.setItems(inventory.items.filter((inventoryItem) => inventoryItem.id !== item.id))

        if (previousItem) {
            inventory.setItems([...inventory.items, previousItem])
        }

        equipped.value[targetSlot] = item

        hp.value = Math.min(hp.value, maxHp.value)

        mp.value = Math.min(mp.value, maxMp.value)

        addLog(`${item.name} dipasang.`)

        await persistGame()
    }

    async function unequipItem(slot: EquippedSlotKey) {
        const item = equipped.value[slot]

        if (!item) {
            return
        }

        if (inventory.itemCount >= inventory.capacity) {
            addLog(`${item.name} tidak bisa dilepas karena inventory penuh.`)

            return
        }

        equipped.value[slot] = null

        inventory.setItems([...inventory.items, item])

        hp.value = Math.min(hp.value, maxHp.value)

        mp.value = Math.min(mp.value, maxMp.value)

        addLog(`${item.name} dilepas.`)

        await persistGame()
    }

    async function setCharacterClass(newClass: CharacterClass) {
        if (isAutoHunting.value) {
            return
        }

        if (characterClass.value === newClass) {
            return
        }

        const incompatibleItem = Object.values(equipped.value).find(
            (item) => item !== null && item.requiredClass !== 'all' && item.requiredClass !== newClass,
        )

        if (incompatibleItem) {
            addLog(`Lepas ${incompatibleItem.name} sebelum mengganti job.`)

            return
        }

        characterClass.value = newClass

        addLog(`Job diubah menjadi ${newClass}.`)

        await persistGame()
    }

    async function toggleInventoryItemLock(itemId: string) {
        const changed = inventory.toggleItemLock(itemId)

        if (!changed) {
            return
        }

        await persistGame()
    }

    async function sellInventoryItem(itemId: string) {
        const item = inventory.getItemById(itemId)

        if (!item) {
            return
        }

        const earned = inventory.sellItem(itemId)

        if (earned <= 0) {
            return
        }

        gold.value += earned

        addLog(`${item.name} dijual +${earned} Gold.`)

        await persistGame()
    }

    async function sellAllFilteredItems() {
        const earned = inventory.sellFilteredItems(characterClass.value)

        if (earned <= 0) {
            return
        }

        gold.value += earned

        addLog(`Sell All berhasil +${earned} Gold.`)

        await persistGame()
    }

    async function setInventorySort(mode: InventorySort) {
        inventory.setSortMode(mode)

        await persistGame()
    }

    async function setInventoryCapacity(newCapacity: number) {
        inventory.setCapacity(newCapacity)

        await persistGame()
    }

    async function setAutoSellEnabled(enabled: boolean) {
        inventory.setAutoSellEnabled(enabled)

        await persistGame()
    }

    async function setAutoSellBelowLevel(enabled: boolean, minimumLevel: number) {
        inventory.setSellBelowLevel(enabled, minimumLevel)

        await persistGame()
    }

    async function setAutoSellMinimumRarity(enabled: boolean, rarity: EquipmentRarity) {
        inventory.setMinimumRarity(enabled, rarity)

        await persistGame()
    }

    async function setAutoSellOtherClasses(enabled: boolean) {
        inventory.setSellOtherClasses(enabled)

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

        characterClass,
        inventory,
        equipped,

        selectedMapId,
        currentMonster,
        monsterHp,

        isAutoHunting,
        isFighting,
        isLoaded,

        battleLog,
        stats,
        totalStats,
        equipmentBaseStatBonuses,
        equipmentMainStatBonuses,

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

        setCharacterClass,

        equipInventoryItem,
        unequipItem,

        toggleInventoryItemLock,
        sellInventoryItem,
        sellAllFilteredItems,

        setInventorySort,
        setInventoryCapacity,

        setAutoSellEnabled,
        setAutoSellBelowLevel,
        setAutoSellMinimumRarity,
        setAutoSellOtherClasses,
    }
})
