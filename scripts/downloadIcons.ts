import * as fs from 'fs'
import * as path from 'path'

console.log('️ Скачиваем иконки предметов...\n')

const iconsDir = path.join(process.cwd(), 'public', 'icons')
fs.mkdirSync(iconsDir, { recursive: true })

// Получаем дерево репозитория
const treeUrl = 'https://api.github.com/repos/EXBO-Studio/stalzone-database/git/trees/main?recursive=1'

async function downloadIcons() {
  const treeRes = await fetch(treeUrl, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  })
  
  if (!treeRes.ok) {
    console.error('❌ Ошибка GitHub API:', treeRes.status)
    return
  }
  
  const treeData = await treeRes.json()
  
  // Фильтруем только PNG файлы из папки ru/icons/
  const iconFiles = treeData.tree.filter((item: any) => 
    item.path.startsWith('ru/icons/') && 
    item.path.endsWith('.png') &&
    item.type === 'blob'
  )
  
  console.log(`✅ Найдено иконок: ${iconFiles.length}\n`)
  console.log('️ Скачиваем первые 100 иконок (чтобы не спамить API)...\n')
  
  let downloaded = 0
  
  for (const file of iconFiles.slice(0, 100)) {
    try {
      const res = await fetch(file.download_url)
      
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        const fileName = path.basename(file.path)
        const filePath = path.join(iconsDir, fileName)
        
        fs.writeFileSync(filePath, buffer)
        downloaded++
        
        if (downloaded % 10 === 0) {
          console.log(`   📥 Скачано: ${downloaded}/100`)
        }
      }
      
      // Задержка 100мс
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      console.log(`   ❌ Ошибка: ${file.path}`)
    }
  }
  
  console.log(`\n💾 Скачано ${downloaded} иконок в ${iconsDir}`)
  console.log('✅ Готово!')
}

downloadIcons().catch(console.error)