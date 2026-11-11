import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Контейнеры
const containers = itemsData.filter(i => i.category === 'containers' || i.category === 'backpacks')
console.log(` Контейнеров: ${containers.length}\n`)

// Броня
const armors = itemsData.filter(i => i.category?.startsWith('armor/'))
console.log(`🛡️ Брони: ${armors.length}\n`)

// Парсим статы контейнеров
console.log('📋 ПРИМЕРЫ КОНТЕЙНЕРОВ:\n')
const containerStats: any[] = []

containers.slice(0, 10).forEach(c => {
  const name = c.name?.lines?.ru || 'N/A'
  const color = c.color?.toUpperCase() || ''
  const rarityMap: Record<string, string> = {
    'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
    'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
  }
  const rarity = rarityMap[color] || 'common'
  
  const stats: any[] = []
  c.infoBlocks?.forEach((block: any) => {
    block.elements?.forEach((elem: any) => {
      if (elem.type === 'range' || elem.type === 'numeric') {
        const statName = elem.name?.lines?.ru || ''
        const value = elem.value
        const min = elem.min
        const max = elem.max
        stats.push({ name: statName, value, min, max })
      }
    })
  })
  
  containerStats.push({ id: c.id, name, rarity, slots: c.category === 'containers' ? 6 : 9, stats })
  
  console.log(`${name} (${rarity}, ${c.category === 'containers' ? 6 : 9} слотов)`)
  stats.forEach(s => {
    if (s.min !== undefined) {
      console.log(`  ${s.name}: ${s.min} - ${s.max}`)
    } else {
      console.log(`  ${s.name}: ${s.value}`)
    }
  })
  console.log('')
})

fs.writeFileSync('data/containerStats.json', JSON.stringify(containerStats, null, 2))
console.log('💾 Сохранено в data/containerStats.json\n')

// Парсим статы брони
console.log(' ПРИМЕРЫ БРОНИ:\n')
const armorStats: any[] = []

armors.slice(0, 10).forEach(a => {
  const name = a.name?.lines?.ru || 'N/A'
  const color = a.color?.toUpperCase() || ''
  const rarityMap: Record<string, string> = {
    'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
    'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
  }
  const rarity = rarityMap[color] || 'common'
  
  const stats: any[] = []
  a.infoBlocks?.forEach((block: any) => {
    block.elements?.forEach((elem: any) => {
      if (elem.type === 'range' || elem.type === 'numeric') {
        const statName = elem.name?.lines?.ru || ''
        const value = elem.value
        const min = elem.min
        const max = elem.max
        stats.push({ name: statName, value, min, max })
      }
    })
  })
  
  armorStats.push({ id: a.id, name, rarity, category: a.category, stats })
  
  console.log(`${name} (${rarity}, ${a.category})`)
  stats.forEach(s => {
    if (s.min !== undefined) {
      console.log(`  ${s.name}: ${s.min} - ${s.max}`)
    } else {
      console.log(`  ${s.name}: ${s.value}`)
    }
  })
  console.log('')
})

fs.writeFileSync('data/armorStats.json', JSON.stringify(armorStats, null, 2))
console.log('💾 Сохранено в data/armorStats.json')

// Все уникальные статы контейнеров
console.log('\n СТАТЫ КОНТЕЙНЕРОВ:')
const allContainerStats = new Set<string>()
containerStats.forEach((c: any) => c.stats.forEach((s: any) => allContainerStats.add(s.name)))
Array.from(allContainerStats).forEach(s => console.log(`  - ${s}`))

// Все уникальные статы брони
console.log('\n📊 СТАТЫ БРОНИ:')
const allArmorStats = new Set<string>()
armorStats.forEach((a: any) => a.stats.forEach((s: any) => allArmorStats.add(s.name)))
Array.from(allArmorStats).forEach(s => console.log(`  - ${s}`))