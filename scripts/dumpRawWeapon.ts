import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Берём первое оружие
const weapon = itemsData.find(i => i.category?.startsWith('weapon/'))

if (weapon) {
  console.log(' ПОЛНЫЙ JSON ПЕРВОГО ОРУЖИЯ:\n')
  console.log(JSON.stringify(weapon, null, 2))
  
  // Сохраняем в файл
  fs.writeFileSync('scripts/weapon_raw.json', JSON.stringify(weapon, null, 2))
  console.log('\n💾 Сохранено в scripts/weapon_raw.json')
}