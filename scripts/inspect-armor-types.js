const fs = require('fs')
const path = require('path')

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items', 'items.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'debug')
const OUT_PATH = path.join(OUT_DIR, 'armor-type-report.json')

const DEFAULT_TARGETS = [
  'SBA TANK',
  'Скиф-5',
  'Каратель',
  'Долгожитель',
  'Сатурн',
  'Ганимед',
  'Мул',
  'Центурион',
  'Альбатрос-Разведчик',
  'Гончий',
]

const targets = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : DEFAULT_TARGETS

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

function collectKeyValues(infoBlocks) {
  const result = []

  walk(infoBlocks, (node, path) => {
    if (node.type !== 'key-value') return

    const keyRu = ru(node.key)
    const keyKey = node.key?.key || ''
    const valueRu = textOf(node.value)
    const valueKey = node.value?.key || ''

    result.push({
      path,
      keyRu,
      keyKey,
      valueRu,
      valueKey,
    })
  })

  return result
}

function collectNumericStats(infoBlocks) {
  const result = []

  walk(infoBlocks, (node, path) => {
    if (node.type !== 'numeric' && node.type !== 'range') return

    const nameRu = ru(node.name)
    const nameKey = node.name?.key || ''

    result.push({
      path,
      type: node.type,
      nameRu,
      nameKey,
      value: node.value ?? null,
      min: node.min ?? null,
      max: node.max ?? null,
      formattedRu: node.formatted?.value?.ru || null,
    })
  })

  return result
}

function collectBlockTitles(infoBlocks) {
  const result = []

  if (!Array.isArray(infoBlocks)) return result

  infoBlocks.forEach((block, index) => {
    if (!block || typeof block !== 'object') return

    result.push({
      index,
      type: block.type || null,
      titleRu: ru(block.title),
      titleKey: block.title?.key || null,
    })
  })

  return result
}

function isInterestingKeyValue(kv) {
  const keyRu = kv.keyRu.toLowerCase()
  const keyKey = kv.keyKey.toLowerCase()
  const valueRu = kv.valueRu.toLowerCase()

  return (
    keyRu.includes('класс') ||
    keyRu.includes('тип') ||
    keyRu.includes('категор') ||
    keyRu.includes('ранг') ||
    keyKey.includes('category') ||
    keyKey.includes('type') ||
    keyKey.includes('class') ||
    keyKey.includes('rank') ||
    valueRu.includes('боевая') ||
    valueRu.includes('комбинирован') ||
    valueRu.includes('научн') ||
    valueRu.includes('экзо')
  )
}

function isProtectionStat(stat) {
  const nameRu = stat.nameRu.toLowerCase()
  const nameKey = stat.nameKey.toLowerCase()

  return (
    nameRu.includes('пулестой') ||
    nameRu.includes('пуле') ||
    nameRu.includes('защит') ||
    nameRu.includes('взрыв') ||
    nameRu.includes('разрыв') ||
    nameRu.includes('радиа') ||
    nameRu.includes('зараж') ||
    nameRu.includes('температур') ||
    nameRu.includes('электро') ||
    nameRu.includes('пси') ||
    nameKey.includes('protection') ||
    nameKey.includes('armor') ||
    nameKey.includes('bullet') ||
    nameKey.includes('explosion') ||
    nameKey.includes('rupture') ||
    nameKey.includes('radiation') ||
    nameKey.includes('temperature') ||
    nameKey.includes('electro') ||
    nameKey.includes('psy')
  )
}

function guessTypeByName(name, category) {
  const n = name.toLowerCase()
  const c = String(category || '').toLowerCase()

  if (n.includes('научный') || n.includes('сатурн') || n.includes('долгожитель') || n.includes('ганимед')) {
    return 'science_candidate'
  }

  if (n.includes('комбинирован') || n.includes('скиф') || n.includes('каратель')) {
    return 'combined_candidate'
  }

  if (n.includes('боевая') || n.includes('sba') || n.includes('мул') || n.includes('центурион')) {
    return 'combat_candidate'
  }

  if (n.includes('экзоброня') || n.includes('гончий') || n.includes('альбатрос')) {
    return 'exo_candidate'
  }

  if (c.includes('armor')) {
    return 'armor_unknown'
  }

  return 'unknown'
}

function compactItemReport(item) {
  const name = item.name?.lines?.ru || item.name?.ru || item.id
  const keyValues = collectKeyValues(item.infoBlocks)
  const numericStats = collectNumericStats(item.infoBlocks)
  const blockTitles = collectBlockTitles(item.infoBlocks)

  const interestingKeyValues = keyValues.filter(isInterestingKeyValue)
  const protectionStats = numericStats.filter(isProtectionStat)

  return {
    id: item.id,
    name,
    category: item.category || null,
    color: item.color || null,
    status: item.status || null,

    guessByName: guessTypeByName(name, item.category),

    interestingKeyValues,
    protectionStats,

    blockTitles,
  }
}

function increment(map, key) {
  const k = key || '(empty)'
  map[k] = (map[k] || 0) + 1
}

function main() {
  if (!fs.existsSync(ITEMS_PATH)) {
    console.error('❌ Не найден файл:', ITEMS_PATH)
    process.exit(1)
  }

  console.log('📦 Читаю items.json...')
  console.log(ITEMS_PATH)

  const raw = fs.readFileSync(ITEMS_PATH, 'utf-8')
  const data = JSON.parse(raw)

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : Object.values(data)

  console.log(`✅ Всего предметов: ${items.length}`)

  const armorItems = items.filter(item => String(item.category || '').startsWith('armor'))

  const armorCategoryCounts = {}
  const armorClassValueCounts = {}
  const armorTypeValueCounts = {}

  for (const item of armorItems) {
    increment(armorCategoryCounts, item.category)

    const keyValues = collectKeyValues(item.infoBlocks)

    for (const kv of keyValues) {
      const keyRu = kv.keyRu.toLowerCase()
      const keyKey = kv.keyKey.toLowerCase()

      if (keyRu.includes('класс') || keyKey.includes('class')) {
        increment(armorClassValueCounts, `${kv.keyRu} = ${kv.valueRu} (${kv.valueKey})`)
      }

      if (keyRu.includes('тип') || keyKey.includes('type')) {
        increment(armorTypeValueCounts, `${kv.keyRu} = ${kv.valueRu} (${kv.valueKey})`)
      }
    }
  }

  const targetMatches = {}

  for (const target of targets) {
    const q = target.toLowerCase()

    const matches = items
      .filter(item => {
        const name = item.name?.lines?.ru || ''
        return name.toLowerCase().includes(q)
      })
      .map(compactItemReport)

    targetMatches[target] = matches
  }

  const report = {
    totalItems: items.length,
    totalArmorItems: armorItems.length,
    armorCategoryCounts,
    armorClassValueCounts,
    armorTypeValueCounts,
    targetMatches,
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), 'utf-8')

  console.log('\n==============================')
  console.log('📊 КАТЕГОРИИ БРОНИ')
  console.log('==============================')
  console.table(armorCategoryCounts)

  console.log('\n==============================')
  console.log('📊 ЗНАЧЕНИЯ "КЛАСС" У БРОНИ')
  console.log('==============================')
  console.table(armorClassValueCounts)

  console.log('\n==============================')
  console.log('📊 ЗНАЧЕНИЯ "ТИП" У БРОНИ')
  console.log('==============================')
  console.table(armorTypeValueCounts)

  console.log('\n==============================')
  console.log('🎯 НАЙДЕННЫЕ ЦЕЛЕВЫЕ БРОНИ')
  console.log('==============================')

  for (const [target, matches] of Object.entries(targetMatches)) {
    console.log(`\n--- ${target}: найдено ${matches.length} ---`)

    for (const item of matches.slice(0, 3)) {
      console.log(`\nID: ${item.id}`)
      console.log(`Название: ${item.name}`)
      console.log(`category: ${item.category}`)
      console.log(`color: ${item.color}`)
      console.log(`guessByName: ${item.guessByName}`)

      console.log('Класс / тип / категория:')
      console.table(
        item.interestingKeyValues.map(kv => ({
          keyRu: kv.keyRu,
          valueRu: kv.valueRu,
          keyKey: kv.keyKey,
          valueKey: kv.valueKey,
        }))
      )

      console.log('Защитные статы:')
      console.table(
        item.protectionStats.slice(0, 12).map(stat => ({
          nameRu: stat.nameRu,
          value: stat.value,
          min: stat.min,
          max: stat.max,
          formatted: stat.formattedRu,
          nameKey: stat.nameKey,
        }))
      )
    }

    if (matches.length > 3) {
      console.log(`...ещё ${matches.length - 3} вариантов в полном отчёте`)
    }
  }

  console.log('\n✅ Полный отчёт сохранён сюда:')
  console.log(OUT_PATH)
  console.log('\nЕсли в терминале много текста — скинь хотя бы блоки:')
  console.log('- КАТЕГОРИИ БРОНИ')
  console.log('- ЗНАЧЕНИЯ "КЛАСС" У БРОНИ')
  console.log('- 1-2 примера: SBA TANK, Скиф-5, Долгожитель')
}

main()