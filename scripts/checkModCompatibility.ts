import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Берём один обвес (например, магазин)
const mod = itemsData.find(i => i.category === 'attachment/mag' && i.name?.lines?.ru?.includes('7.62'))

if (mod) {
  console.log('📋 СТРУКТУРА ОБВЕСА (магазин 7.62):\n')
  console.log(JSON.stringify(mod, null, 2))
} else {
  console.log('❌ Обвес не найден')
}