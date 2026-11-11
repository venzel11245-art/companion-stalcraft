const fs = require('fs')
const path = require('path')

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items', 'items.json')

console.log('📦 Читаю items.json...')
const raw = fs.readFileSync(ITEMS_PATH, 'utf-8')
const data = JSON.parse(raw)
const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : Object.values(data))

console.log(`✅ Всего предметов: ${items.length}`)

// Проверяем категории
const categories = new Set()
items.forEach(item => {
  if (item.category) categories.add(item.category)
})

console.log('\n📊 Все категории в items.json:')
Array.from(categories).sort().forEach(cat => {
  const count = items.filter(i => i.category === cat).length
  console.log(`  ${cat}: ${count} предметов`)
})

// Проверяем, есть ли контейнеры
const containers = items.filter(i => 
  i.category?.includes('container') || 
  i.name?.lines?.ru?.toLowerCase().includes('боч') ||
  i.name?.lines?.ru?.toLowerCase().includes('рюкзак')
)

console.log(`\n📦 Контейнеры/рюкзаки: найдено ${containers.length}`)
if (containers.length > 0) {
  console.log('Примеры:')
  containers.slice(0, 5).forEach(c => {
    console.log(`  - ${c.name?.lines?.ru} (category: ${c.category})`)
  })
}

// Проверяем оружие "руна"
const runa = items.filter(i => i.name?.lines?.ru?.toLowerCase().includes('руна'))
console.log(`\n🔫 Оружие "Руна": найдено ${runa.length} версий`)
if (runa.length > 0) {
  console.log('Пример:', runa[0].name?.lines?.ru, '| category:', runa[0].category)
}

// Проверяем броню "цен"
const centurion = items.filter(i => i.name?.lines?.ru?.toLowerCase().includes('цен'))
console.log(`\n🛡️ Броня "Цен": найдено ${centurion.length} версий`)
if (centurion.length > 0) {
  console.log('Пример:', centurion[0].name?.lines?.ru, '| category:', centurion[0].category)
}