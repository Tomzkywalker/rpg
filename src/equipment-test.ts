import { generateEquipment } from './services/equipment.service'

const TOTAL = 100_000

const rarityCount = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  mythical: 0,
}

const qualityCount = new Array(101).fill(0)

for (let i = 0; i < TOTAL; i += 1) {
  const item = generateEquipment(100)

  rarityCount[item.rarity] += 1
  qualityCount[item.quality] += 1
}

console.log('=== RARITY ===')

for (const [rarity, count] of Object.entries(rarityCount)) {
  console.log(rarity, count, `${((count / TOTAL) * 100).toFixed(3)}%`)
}

console.log('=== QUALITY ===')

for (let quality = 1; quality <= 100; quality += 1) {
  console.log(`Q${quality}`, qualityCount[quality], `${((qualityCount[quality] / TOTAL) * 100).toFixed(3)}%`)
}

console.log('=== SAMPLE ITEMS ===')

for (let i = 0; i < 10; i += 1) {
  console.log(generateEquipment(100))
}
