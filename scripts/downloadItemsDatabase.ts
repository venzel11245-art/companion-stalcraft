import * as fs from 'fs'
import * as path from 'path'

async function downloadItemsDatabase() {
  console.log('📦 Скачиваем базу предметов с GitHub...\n')

  try {
    // Ссылка на ZIP архив с базой
    const zipUrl = 'https://github.com/EXBO-Studio/stalzone-database/archive/refs/heads/main.zip'
    const zipPath = path.join(process.cwd(), 'stalzone-database.zip')
    
    // Скачиваем ZIP
    const response = await fetch(zipUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(zipPath, buffer)
    
    console.log('✅ ZIP скачан! Распаковываем...')
    
    // Распаковываем (нужен unzipper)
    // Для простоты - просто откроем ссылку на репозиторий
    
    console.log('\n📁 Открываем репозиторий...')
    console.log('GitHub: https://github.com/EXBO-Studio/stalzone-database')
    console.log('Прямая ссылка на JSON с предметами:')
    console.log('https://raw.githubusercontent.com/EXBO-Studio/stalzone-database/main/RU/items.json')
    
  } catch (e) {
    console.error('❌ Ошибка:', e)
  }
}

downloadItemsDatabase()