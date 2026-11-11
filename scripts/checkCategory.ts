import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Ищем "Пыль" и похожие предметы
const dust = itemsData.filter(i => {
  const name = i.name?.lines?.ru?.toLowerCase() || ''
  return name.includes('пыль') || name.includes('изменен') || name.includes('расход')
})

console.log(`Найдено предметов: ${dust.length}\n`)

dust.slice(0, 10).forEach(item => {
  console.log(`Название: ${item.name?.lines?.ru}`)
  console.log(`Категория: ${item.category}`)
  console.log(`ID: ${item.id}`)
  console.log('---')
})

// Покажем все уникальные категории расходников
console.log('\n📊 Все категории предметов:')
const allCategories = new Set<string>()
itemsData.forEach(i => {
  if (i.category) allCategories.add(i.category)
})
Array.from(allCategories).sort().forEach(c => console.log(`  - ${c}`))