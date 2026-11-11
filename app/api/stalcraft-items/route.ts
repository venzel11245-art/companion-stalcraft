import { NextResponse } from 'next/server'
import { getItemsCache } from '@/lib/items-cache'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''

  console.log(`\n[API] 🔍 Запрос: category="${category}", search="${search}"`)

  const items = getItemsCache()
  console.log(`[API] 📦 Всего предметов в кэше: ${items.length}`)

  let filtered = items
  
  // 1. Фильтр по категории
  if (category) {
    filtered = filtered.filter(i => {
      if (!i.category) return false
      if (category === 'weapon') return i.category.startsWith('weapon/')
      if (category === 'armor') return i.category.startsWith('armor/')
      if (category === 'artefact') return i.category.startsWith('artefact/')
      if (category === 'container') return i.category === 'backpacks' || i.category === 'containers'
      return i.category === category
    })
    console.log(`[API] ✅ После фильтра категории: ${filtered.length} предметов`)
  }
  
  // 2. Фильтр по поиску
  if (search.length >= 2) {
    const q = search.toLowerCase()
    const beforeSearch = filtered.length
    filtered = filtered.filter(i => i.name?.lines?.ru?.toLowerCase().includes(q))
    console.log(`[API] 🔤 После фильтра поиска ("${q}"): ${filtered.length} предметов (было ${beforeSearch})`)
    
    // Если ничего не найдено, покажем примеры того, что есть в кэше, чтобы понять причину
    if (filtered.length === 0 && beforeSearch > 0) {
       const sampleNames = items.slice(0, 10).map(i => i.name?.lines?.ru).join(', ')
       console.log(`[API] ⚠️ Примеры имен в кэше: ${sampleNames}`)
    }
  }

  // 3. Убираем дубликаты по названию
  const uniqueMap = new Map()
  for (const item of filtered) {
    const name = item.name?.lines?.ru
    if (name && !uniqueMap.has(name)) {
      uniqueMap.set(name, {
        id: item.id,
        name: name,
        color: item.color || 'DEFAULT',
        category: item.category,
        stats: item.parsedStats?.baseStats || {},
        allStats: item.allStats || {},
        enhancedVersions: item.enhancedVersions || [],
        hasEnhancements: item.hasEnhancements || false
      })
    }
  }

  const result = Array.from(uniqueMap.values()).slice(0, 50)
  console.log(`[API] 🚀 Возвращаю ${result.length} уникальных предметов\n`)

  return NextResponse.json({ items: result })
}