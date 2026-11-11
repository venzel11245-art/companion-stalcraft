import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'

async function downloadItemsZip() {
  console.log('📦 Скачиваем базу предметов...\n')
  
  const zipUrl = 'https://github.com/EXBO-Studio/stalzone-database/archive/refs/heads/main.zip'
  const zipPath = path.join(process.cwd(), 'stalzone-database.zip')
  const extractDir = path.join(process.cwd(), 'data', 'stalzone-db')
  
  // Скачиваем ZIP
  console.log('⬇️ Скачиваем ZIP архив...')
  const res = await fetch(zipUrl)
  
  if (!res.ok) {
    console.error('❌ Ошибка скачивания:', res.status)
    return
  }
  
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(zipPath, buffer)
  console.log('✅ ZIP скачан!\n')
  
  // Распаковываем
  console.log('📂 Распаковываем...')
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(extractDir, true)
  console.log('✅ Распаковано!\n')
  
  // Находим все JSON файлы предметов
  const ruDir = path.join(extractDir, 'stalzone-database-main', 'ru')
  
  if (!fs.existsSync(ruDir)) {
    console.error('❌ Папка ru/ не найдена')
    return
  }
  
  const items: any[] = []
  
  function readDirRecursive(dir: string) {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        readDirRecursive(fullPath)
      } else if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          const itemData = JSON.parse(content)
          const itemId = path.basename(file, '.json')
          
          items.push({
            id: itemId,
            ...itemData,
          })
          
          console.log(`   📥 ${itemId}: ${itemData.name || itemData.title || 'N/A'}`)
        } catch (e) {
          // пропускаем
        }
      }
    }
  }
  
  readDirRecursive(ruDir)
  
  // Сохраняем в JSON файл
  const outputPath = path.join(process.cwd(), 'data', 'items', 'items.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2))
  
  console.log(`\n💾 Сохранено ${items.length} предметов в ${outputPath}`)
  
  // Удаляем ZIP
  fs.unlinkSync(zipPath)
  console.log('🗑️ ZIP удалён')
}

downloadItemsZip().catch(console.error)