import * as fs from 'fs'
import * as path from 'path'

const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// Артефакт "Виток" (04yr)
const artifact = itemsData.find(i => i.id === '04yr')

if (artifact) {
  console.log('📋 СЫРОЙ JSON АРТЕФАКТА "ВИТОК":\n')
  console.log(JSON.stringify(artifact, null, 2))
  
  // Сохраняем в файл
  const outputPath = path.join(process.cwd(), 'scripts', 'artifact_raw.json')
  fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2))
  console.log(`\n💾 Сохранено в ${outputPath}`)
} else {
  console.log('❌ Артефакт "04yr" не найден!')
}