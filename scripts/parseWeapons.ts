import * as fs from 'fs'
import * as path from 'path'

console.log('🔫 Парсим оружие из базы...\n')

const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

const weapons = itemsData.filter((item: any) => 
  item.category?.startsWith('weapon/')
)

console.log(`✅ Найдено оружия: ${weapons.length}\n`)

console.log(' Первые 10 единиц оружия:\n')
weapons.slice(0, 10).forEach((weapon: any) => {
  const name = weapon.name?.lines?.ru || weapon.name?.ru || 'N/A'
  console.log(`   ${name}`)
  console.log(`   ID: ${weapon.id}`)
  console.log(`   Category: ${weapon.category}`)
  console.log('')
})

const outputPath = path.join(process.cwd(), 'data', 'weapons.json')
fs.writeFileSync(outputPath, JSON.stringify(weapons, null, 2))
console.log(`💾 Сохранено ${weapons.length} единиц оружия в data/weapons.json`)