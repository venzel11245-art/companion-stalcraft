import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

const artifact = itemsData.find(i => i.id === '04yr')

if (artifact?.infoBlocks) {
  console.log('📋 ВСЕ INFOBLOCKS АРТЕФАКТА "ВИТОК":\n')
  
  artifact.infoBlocks.forEach((block: any, idx: number) => {
    console.log(`\n=== БЛОК ${idx} (type: ${block.type}) ===`)
    
    // Заголовок блока
    if (block.title) {
      const title = block.title?.lines?.ru || block.title?.text || ''
      if (title) console.log(`Заголовок: "${title}"`)
    }
    
    // Элементы
    if (block.elements) {
      block.elements.forEach((elem: any, eIdx: number) => {
        console.log(`  Элемент ${eIdx}:`)
        
        // key-value
        if (elem.type === 'key-value') {
          const key = elem.key?.lines?.ru || elem.key?.key || ''
          const value = elem.value?.lines?.ru || elem.value?.text || elem.value?.key || ''
          console.log(`    ${key}: ${value}`)
        }
        
        // numeric (числовые значения)
        if (elem.type === 'numeric') {
          const name = elem.name?.lines?.ru || ''
          const value = elem.value
          const formatted = elem.formatted?.value?.ru || ''
          console.log(`    ${name}: ${value} (${formatted})`)
        }
      })
    }
  })
}