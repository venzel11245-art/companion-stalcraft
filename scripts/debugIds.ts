import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Берём первое оружие
const weapon = itemsData.find(i => i.category?.startsWith('weapon/'))
console.log(' ПЕРВОЕ ОРУЖИЕ:')
console.log('ID:', weapon?.id)
console.log('Name:', weapon?.name?.lines?.ru)

// Берём первый магазин
const mod = itemsData.find(i => i.category === 'attachment/mag')
console.log('\n📦 ПЕРВЫЙ МАГАЗИН:')
console.log('ID:', mod?.id)
console.log('Name:', mod?.name?.lines?.ru)

// Ищем блок совместимости
const compatBlock = mod?.infoBlocks?.find((b: any) => 
  b.title?.key?.includes('all_suitable_targets')
)

if (compatBlock?.elements) {
  console.log('\n✅ СОВМЕСТИМОЕ ОРУЖИЕ (из обвеса):')
  compatBlock.elements.forEach((elem: any) => {
    if (elem.type === 'item') {
      const key = elem.name?.key
      const match = key?.match(/item\.wpn\.([a-zA-Z0-9_]+)\.name/)
      console.log(`  Ключ: ${key}`)
      console.log(`  Извлечённый ID: ${match?.[1]}`)
    }
  })
} else {
  console.log('\n Блок совместимости не найден')
}