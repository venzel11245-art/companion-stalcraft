import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

const weapons = itemsData.filter(i => i.category?.startsWith('weapon/'))
console.log(`🔫 Оружия: ${weapons.length}\n`)

const modifications = itemsData.filter(i => i.category?.startsWith('attachment/'))
console.log(`🔧 Обвесов: ${modifications.length}\n`)

// === ПАРСИНГ ОРУЖИЯ ===
console.log('📋 ПРИМЕРЫ ОРУЖИЯ:\n')
const weaponStats: any[] = []

weapons.slice(0, 5).forEach((w: any) => {
  const name = w.name?.lines?.ru || 'N/A'
  const color = w.color?.toUpperCase() || ''
  const rarityMap: Record<string, string> = {
    'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
    'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
  }
  const rarity = rarityMap[color] || 'common'
  
  const stats: any[] = []
  
  // 1. Ищем блок урона (type: "damage")
  const damageBlock = w.infoBlocks?.find((b: any) => b.type === 'damage')
  if (damageBlock) {
    stats.push({ name: 'Начальный урон', value: damageBlock.startDamage })
    stats.push({ name: 'Урон на дистанции', value: damageBlock.endDamage })
    stats.push({ name: 'Дистанция падения урона', value: damageBlock.damageDecreaseStart })
    stats.push({ name: 'Макс. дистанция', value: damageBlock.maxDistance })
  }

  // 2. Ищем числовые и range статы (отдача, разброс, вес, скорость)
  w.infoBlocks?.forEach((block: any) => {
    if (block.type === 'list' && block.elements) {
      block.elements.forEach((elem: any) => {
        if (elem.type === 'numeric' || elem.type === 'range') {
          const statName = elem.name?.lines?.ru || ''
          // Фильтруем только важные для калькулятора статы
          if (statName.includes('Отдача') || statName.includes('Разброс') || statName.includes('Скорость') || statName.includes('Вес') || statName.includes('Перезарядка') || statName.includes('Эргономика')) {
            const value = elem.value !== undefined ? elem.value : (elem.min !== undefined ? elem.min : 0)
            stats.push({ name: statName, value })
          }
        }
      })
    }
  })
  
  weaponStats.push({ id: w.id, name, rarity, category: w.category, stats })
  
  console.log(`${name} (${rarity}, ${w.category})`)
  stats.forEach((s: any) => {
    console.log(`  ${s.name}: ${s.value}`)
  })
  console.log('')
})

fs.writeFileSync('data/weaponStats.json', JSON.stringify(weaponStats, null, 2))
console.log('💾 Сохранено в data/weaponStats.json\n')

// === ПАРСИНГ ОБВЕСОВ ===
console.log('🔧 ПРИМЕРЫ ОБВЕСОВ:\n')
const modStats: any[] = []

modifications.slice(0, 10).forEach((m: any) => {
  const name = m.name?.lines?.ru || 'N/A'
  const color = m.color?.toUpperCase() || ''
  const rarityMap: Record<string, string> = {
    'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
    'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
  }
  const rarity = rarityMap[color] || 'common'
  
  const stats: any[] = []
  m.infoBlocks?.forEach((block: any) => {
    if (block.type === 'list' && block.elements) {
      block.elements.forEach((elem: any) => {
        if (elem.type === 'numeric' || elem.type === 'range') {
          const statName = elem.name?.lines?.ru || ''
          if (statName.includes('Отдача') || statName.includes('Разброс') || statName.includes('Скорость') || statName.includes('Вес') || statName.includes('Эргономика') || statName.includes('Перезарядка')) {
            const value = elem.value !== undefined ? elem.value : (elem.min !== undefined ? elem.min : 0)
            stats.push({ name: statName, value })
          }
        }
      })
    }
  })
  
  modStats.push({ id: m.id, name, rarity, category: m.category, stats })
  
  console.log(`${name} (${rarity}, ${m.category})`)
  stats.forEach((s: any) => {
    console.log(`  ${s.name}: ${s.value}`)
  })
  console.log('')
})

fs.writeFileSync('data/modificationStats.json', JSON.stringify(modStats, null, 2))
console.log('💾 Сохранено в data/modificationStats.json')