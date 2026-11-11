import * as fs from 'fs'
import * as path from 'path'

const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

// 1. Полный infoBlocks первого артефакта
console.log('📋 ПОЛНЫЙ INFOBLOCKS АРТЕФАКТА "Виток":\n')
const artifact = itemsData.find(i => i.id === '04yr')
if (artifact?.infoBlocks) {
  artifact.infoBlocks.forEach((block: any, idx: number) => {
    console.log(`\n--- Блок ${idx} (type: ${block.type}) ---`)
    if (block.title) {
      const title = block.title?.lines?.ru || block.title?.text || ''
      console.log(`Заголовок: ${title}`)
    }
    if (block.elements) {
      block.elements.forEach((elem: any) => {
        if (elem.type === 'key-value') {
          const key = elem.key?.lines?.ru || elem.key?.key || ''
          const value = elem.value?.lines?.ru || elem.value?.text || elem.value?.key || ''
          console.log(`  ${key}: ${value}`)
        }
      })
    }
  })
}

// 2. Ищем обвесы (модификации оружия)
console.log('\n\n ПОИСК ОБВЕСОВ:\n')
const modKeywords = ['modification', 'modif', 'attach', 'scope', 'barrel', 'magazine', 'grip', 'stock', 'suppressor', 'silencer']
const modifications: any[] = []

itemsData.forEach(item => {
  const cat = item.category?.toLowerCase() || ''
  const name = JSON.stringify(item.name).toLowerCase()
  
  if (modKeywords.some(kw => cat.includes(kw) || name.includes(kw))) {
    modifications.push(item)
  }
})

console.log(`Найдено обвесов: ${modifications.length}`)
if (modifications.length > 0) {
  console.log('\nПримеры:')
  modifications.slice(0, 5).forEach(item => {
    const name = item.name?.lines?.ru || 'N/A'
    console.log(`  - ${name} (${item.category})`)
  })
  
  // Полный infoBlocks первого обвеса
  console.log('\n📋 ПОЛНЫЙ INFOBLOCKS ПЕРВОГО ОБВЕСА:\n')
  const firstMod = modifications[0]
  if (firstMod?.infoBlocks) {
    firstMod.infoBlocks.forEach((block: any, idx: number) => {
      console.log(`\n--- Блок ${idx} (type: ${block.type}) ---`)
      if (block.title) {
        const title = block.title?.lines?.ru || block.title?.text || ''
        console.log(`Заголовок: ${title}`)
      }
      if (block.elements) {
        block.elements.forEach((elem: any) => {
          if (elem.type === 'key-value') {
            const key = elem.key?.lines?.ru || elem.key?.key || ''
            const value = elem.value?.lines?.ru || elem.value?.text || elem.value?.key || ''
            console.log(`  ${key}: ${value}`)
          }
        })
      }
    })
  }
}

// 3. Ищем контейнеры
console.log('\n\n ПОИСК КОНТЕЙНЕРОВ:\n')
const containerKeywords = ['container', 'backpack', 'case', 'pouch', 'bag', 'berlog', 'skat', 'контейнер', 'рюкзак', 'сумк']
const containers: any[] = []

itemsData.forEach(item => {
  const cat = item.category?.toLowerCase() || ''
  const name = JSON.stringify(item.name).toLowerCase()
  
  if (containerKeywords.some(kw => cat.includes(kw) || name.includes(kw))) {
    containers.push(item)
  }
})

console.log(`Найдено контейнеров: ${containers.length}`)
if (containers.length > 0) {
  console.log('\nПримеры:')
  containers.slice(0, 5).forEach(item => {
    const name = item.name?.lines?.ru || 'N/A'
    console.log(`  - ${name} (${item.category})`)
  })
}

// 4. Все уникальные категории
console.log('\n\n📊 ВСЕ КАТЕГОРИИ В БАЗЕ:\n')
const categories = new Map<string, number>()
itemsData.forEach(item => {
  if (item.category) {
    categories.set(item.category, (categories.get(item.category) || 0) + 1)
  }
})
Array.from(categories.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })