import * as fs from 'fs'

const itemsPath = 'data/items/items.json'
const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

const artifacts = itemsData.filter(i => i.category?.startsWith('artefact/'))

console.log(`📊 Найдено артефактов: ${artifacts.length}\n`)

const artifactStats: any[] = []

artifacts.forEach(artifact => {
  const name = artifact.name?.lines?.ru || 'N/A'
  const category = artifact.category || 'unknown'
  const weight = artifact.infoBlocks?.find((b: any) => 
    b.elements?.some((e: any) => e.name?.key?.includes('weight'))
  )?.elements?.find((e: any) => e.name?.key?.includes('weight'))?.value || 0

  const stats: any[] = []

  artifact.infoBlocks?.forEach((block: any) => {
    block.elements?.forEach((elem: any) => {
      if (elem.type === 'range') {
        const statKey = elem.name?.key || ''
        const statName = elem.name?.lines?.ru || statKey
        const min = elem.min
        const max = elem.max
        
        stats.push({
          key: statKey,
          name: statName,
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100,
          avg: Math.round(((min + max) / 2) * 100) / 100,
        })
      }
    })
  })

  if (stats.length > 0) {
    artifactStats.push({
      id: artifact.id,
      name,
      category,
      weight,
      stats,
    })
  }
})

console.log(`✅ Артефактов со статами: ${artifactStats.length}\n`)

console.log('📋 ПРИМЕРЫ АРТЕФАКТОВ:\n')
artifactStats.slice(0, 5).forEach((art: any) => {
  console.log(`${art.name} (${art.category})`)
  console.log(`  Вес: ${art.weight} кг`)
  art.stats.forEach((stat: any) => {
    console.log(`  ${stat.name}: ${stat.min} до ${stat.max} (среднее: ${stat.avg})`)
  })
  console.log('')
})

fs.writeFileSync('data/artifactStats.json', JSON.stringify(artifactStats, null, 2))
console.log(`💾 Сохранено в data/artifactStats.json`)

const allStatKeys = new Set<string>()
artifactStats.forEach((art: any) => {
  art.stats.forEach((stat: any) => allStatKeys.add(stat.key))
})

console.log('\n📊 ВСЕ УНИКАЛЬНЫЕ СТАТЫ:')
Array.from(allStatKeys).forEach(key => {
  const count = artifactStats.filter((a: any) => a.stats.some((s: any) => s.key === key)).length
  console.log(`  ${key}: ${count} артефактов`)
})