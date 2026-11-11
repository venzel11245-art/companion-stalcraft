import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Ищем бронекостюмы
const armors = itemsData.filter(i => {
  const name = i.name?.lines?.ru?.toLowerCase() || ''
  return name.includes('авангард') || name.includes('храмовник') || name.includes('ворса')
})

console.log(`Найдено бронекостюмов: ${armors.length}\n`)

armors.forEach(item => {
  console.log(`Название: ${item.name?.lines?.ru}`)
  console.log(`ID: ${item.id}`)
  console.log(`Категория: ${item.category}`)
  console.log(`Статус:`, item.status)
  console.log(`Торгуемый:`, item.tradable)
  console.log('---')
})

// Покажем все возможные статусы
console.log('\n Все возможные статусы:')
const allStatuses = new Set<string>()
itemsData.forEach(i => {
  if (i.status?.state) allStatuses.add(i.status.state)
})
Array.from(allStatuses).forEach(s => console.log(`  - ${s}`))