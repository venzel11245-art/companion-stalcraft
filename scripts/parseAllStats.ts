import * as fs from 'fs'
import * as path from 'path'

console.log('🔬 Парсим статы предметов...\n')

const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Артефакты
const artifacts = itemsData.filter((item: any) => 
  item.category?.startsWith('artefact/')
)

// Оружие
const weapons = itemsData.filter((item: any) => 
  item.category?.startsWith('weapon/')
)

// Обвесы (модификации оружия)
const modifications = itemsData.filter((item: any) => 
  item.category?.startsWith('modification/')
)

// Контейнеры
const containers = itemsData.filter((item: any) => 
  item.category?.startsWith('container/')
)

console.log(`✅ Артефакты: ${artifacts.length}`)
console.log(`✅ Оружие: ${weapons.length}`)
console.log(`✅ Обвесы: ${modifications.length}`)
console.log(`✅ Контейнеры: ${containers.length}`)

// Пример структуры артефакта
console.log('\n📋 Пример артефакта:')
if (artifacts.length > 0) {
  const sample = artifacts[0]
  console.log(JSON.stringify(sample, null, 2))
}

// Пример структуры обвеса
console.log('\n Пример обвеса:')
if (modifications.length > 0) {
  const sample = modifications[0]
  console.log(JSON.stringify(sample, null, 2))
}

// Сохраняем в отдельные файлы
fs.writeFileSync(path.join(process.cwd(), 'data', 'artifacts.json'), JSON.stringify(artifacts, null, 2))
fs.writeFileSync(path.join(process.cwd(), 'data', 'weapons.json'), JSON.stringify(weapons, null, 2))
fs.writeFileSync(path.join(process.cwd(), 'data', 'modifications.json'), JSON.stringify(modifications, null, 2))
fs.writeFileSync(path.join(process.cwd(), 'data', 'containers.json'), JSON.stringify(containers, null, 2))

console.log('\n💾 Сохранено в data/')
