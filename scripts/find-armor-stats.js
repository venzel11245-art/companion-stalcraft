const fs = require('fs')
const path = require('path')

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items', 'items.json')

const TARGET_ARMORS = [
  'Центурион',
  'SBA TANK',
  'Скиф-5',
  'Каратель',
  'Долгожитель',
  'Сатурн',
  'Ганимед',
  'Мул',
]

// Ключевые слова для поиска статов защиты и выживаемости
const SEARCH_KEYWORDS = [
  'bullet', 'armor', 'protection', 'rupture', 'explosion', 'fire',
  'electro', 'chemical', 'radiation', 'temperature', 'bio', 'psy',
  'bleed', 'blood', 'health', 'heal', 'stamina', 'endurance',
  'carry', 'weight', 'speed', 'move', 'mobility', 'живучесть',
  'кровотеч', 'перенос', 'скорость', 'защит', 'пуле', 'разрыв',
  'взрыв', 'огонь', 'электро', 'хим', 'радиац', 'температур',
  'био', 'пси', 'лечен', 'стойк', 'здоров', 'выжива'
]

function ru(linesObj) {
  return linesObj?.lines?.ru || ''
}

function textOf(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.lines?.ru) return node.lines.ru
  if (node.text) return textOf(node.text)
  if (node.value) return textOf(node.value)
  return ''
}

function walk(node, cb, path = 'root') {
  if (!node) return
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, cb, `${path}[${index}]`))
    return
  }
  if (typeof node !== 'object') return
  cb(node, path)
  for (const key of Object.keys(node)) {
    const value = node[key]
    if (value && typeof value === 'object') {
      walk(value, cb, `${path}.${key}`)
    }
  }
}

function findMatchingStats(infoBlocks) {
  const results = []
  
  walk(infoBlocks, (node, path) => {
    if (node.type !== 'numeric' && node.type !== 'range') return
    
    const nameRu = ru(node.name).toLowerCase()
    const nameKey = (node.name?.key || '').toLowerCase()
    const formattedRu = (node.formatted?.value?.ru || '').toLowerCase()
    
    // Проверяем, содержит ли хоть одно ключевое слово
    const matches = SEARCH_KEYWORDS.some(kw => 
      nameRu.includes(kw) || nameKey.includes(kw) || formattedRu.includes(kw)
    )
    
    if (matches) {
      results.push({
        path,
        type: node.type,
        nameRu: ru(node.name),
        nameKey: node.name?.key || '',
        value: node.value ?? null,
        min: node.min ?? null,
        max: node.max ?? null,
        formattedRu: node.formatted?.value?.ru || null,
      })
    }
  })
  
  return results
}

function main() {
  if (!fs.existsSync(ITEMS_PATH)) {
    console.error('❌ Не найден файл:', ITEMS_PATH)
    process.exit(1)
  }

  console.log('📦 Читаю items.json...')
  const raw = fs.readFileSync(ITEMS_PATH, 'utf-8')
  const data = JSON.parse(raw)
  const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : Object.values(data))
  
  console.log(`✅ Всего предметов: ${items.length}`)

  // Собираем ВСЕ уникальные ключи защитных статов по всей игре
  const allStatKeys = new Map()
  
  for (const item of items) {
    if (!item.category?.startsWith('armor')) continue
    
    const stats = findMatchingStats(item.infoBlocks)
    for (const stat of stats) {
      const key = stat.nameKey || stat.nameRu
      if (!allStatKeys.has(key)) {
        allStatKeys.set(key, {
          nameRu: stat.nameRu,
          nameKey: stat.nameKey,
          sampleValue: stat.value,
          sampleFormatted: stat.formattedRu,
          count: 0,
        })
      }
      allStatKeys.get(key).count++
    }
  }

  console.log('\n==============================')
  console.log('📊 ВСЕ НАЙДЕННЫЕ КЛЮЧИ ЗАЩИТНЫХ СТАТОВ')
  console.log('==============================')
  
  const sortedKeys = Array.from(allStatKeys.entries())
    .sort((a, b) => b[1].count - a[1].count)
  
  for (const [key, info] of sortedKeys) {
    console.log(`\n🔑 Ключ: ${key}`)
    console.log(`   RU: ${info.nameRu}`)
    console.log(`   Пример значения: ${info.sampleValue} (${info.sampleFormatted || 'нет'})`)
    console.log(`   Встречается у ${info.count} предметов брони`)
  }

  // Теперь показываем конкретные статы для целевых бронь
  console.log('\n\n==============================')
  console.log('🎯 ДЕТАЛЬНАЯ РАЗБИВКА ПО ЦЕЛЕВЫМ БРОНЯМ')
  console.log('==============================')

  for (const target of TARGET_ARMORS) {
    const matches = items.filter(item => {
      const name = item.name?.lines?.ru || ''
      return name.toLowerCase().includes(target.toLowerCase())
    })

    if (matches.length === 0) {
      console.log(`\n❌ ${target}: не найдено`)
      continue
    }

    // Берём первую версию предмета
    const item = matches[0]
    const stats = findMatchingStats(item.infoBlocks)
    
    console.log(`\n\n🛡️ ${item.name?.lines?.ru} (ID: ${item.id}, category: ${item.category})`)
    console.log('─'.repeat(60))
    
    if (stats.length === 0) {
      console.log('   ⚠️ Защитные статы не найдены!')
    } else {
      for (const stat of stats) {
        const displayValue = stat.type === 'range' 
          ? `[${stat.min} - ${stat.max}]` 
          : `${stat.value}`
        console.log(`   ${stat.nameRu.padEnd(35)} = ${displayValue.padEnd(15)} (key: ${stat.nameKey})`)
      }
    }
  }
}

main()