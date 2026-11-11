import * as fs from 'fs'
import * as path from 'path'

const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// 1. Сырой JSON артефакта "Виток" (04yr)
console.log('📋 СЫРОЙ JSON АРТЕФАКТА "ВИТОК" (только infoBlocks):\n')
const artifact = itemsData.find(i => i.id === '04yr')
if (artifact) {
  console.log(JSON.stringify(artifact.infoBlocks, null, 2))
}

// 2. Сырой JSON обвеса из attachment/barrel
console.log('\n\n📋 СЫРОЙ JSON ОБВЕСА (attachment/barrel):\n')
const mod = itemsData.find(i => i.category === 'attachment/barrel')
if (mod) {
  console.log(JSON.stringify(mod.infoBlocks, null, 2))
}

// 3. Сырой JSON контейнера
console.log('\n\n📋 СЫРОЙ JSON КОНТЕЙНЕРА (containers):\n')
const container = itemsData.find(i => i.category === 'containers')
if (container) {
  console.log(JSON.stringify(container.infoBlocks, null, 2))
}