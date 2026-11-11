import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

console.log(' Всего предметов:', itemsData.length)

console.log('\n📋 Первые 10 предметов:')
itemsData.slice(0, 10).forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.category}] ${item.name?.lines?.ru || 'N/A'}`)
})

console.log('\n📦 Все уникальные категории:')
const allCategories = [...new Set(itemsData.map(i => i.category).filter(Boolean))]
allCategories.forEach(cat => {
  const count = itemsData.filter(i => i.category === cat).length
  console.log(`  ${cat} (${count})`)
})

// Ищем артефакты
const artefacts = itemsData.filter(i => {
  const name = i.name?.lines?.ru?.toLowerCase() || ''
  const cat = i.category?.toLowerCase() || ''
  return name.includes('артефакт') || cat.includes('artefact') || cat.includes('artifact')
})

console.log(`\n️ Найдено артефактов: ${artefacts.length}`)
if (artefacts.length > 0) {
  console.log('Примеры:')
  artefacts.slice(0, 5).forEach(a => {
    console.log(`  - [${a.category}] ${a.name?.lines?.ru}`)
  })
}