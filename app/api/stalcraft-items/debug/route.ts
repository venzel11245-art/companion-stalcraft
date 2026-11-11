import { NextResponse } from 'next/server'
import { getItemsCache } from '@/lib/items-cache'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // По умолчанию ищем ту самую «Руну», о которой мы говорили
  const id = searchParams.get('id') || '0rq99' 

  const items = getItemsCache()
  const item = items.find(i => i.id === id)

  if (!item) {
    return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 })
  }

  console.log('\n==================================================')
  console.log(`🔍 ОТЛАДКА ПРЕДМЕТА: ${item.name?.lines?.ru} (${item.id})`)
  console.log('==================================================')

  if (item.infoBlocks) {
    let foundAnything = false
    for (const block of item.infoBlocks) {
      const titleKey = block.title?.key || ''
      const titleRu = block.title?.lines?.ru || ''

      // Ищем любые блоки, связанные с модификацией, обвесами или вместимостью
      if (
        titleKey.includes('upgrade') || 
        titleKey.includes('attachment') || 
        titleKey.includes('capacity') ||
        titleRu.toLowerCase().includes('модификац') || 
        titleRu.toLowerCase().includes('обвес') ||
        titleRu.toLowerCase().includes('вместим')
      ) {
        foundAnything = true
        console.log(`\n📌 НАЙДЕН ПОДОЗРИТЕЛЬНЫЙ БЛОК: "${titleRu}"`)
        console.log(`Ключ: ${titleKey}`)
        console.log(JSON.stringify(block, null, 2)) // Красивый вывод в терминал
      }
    }

    if (!foundAnything) {
      console.log('\n⚠️ ВНИМАНИЕ: Блоков с модификацией или вместимостью в infoBlocks НЕ НАЙДЕНО!')
    }
  }

  console.log('\n📦 ИТОГОВЫЙ parsedStats, который видит сайт:')
  console.log(JSON.stringify(item.parsedStats, null, 2))
  console.log('==================================================\n')

  return NextResponse.json({
    message: '✅ Данные выведены в ТЕРМИНАЛ VS Code! Посмотри туда.',
    itemName: item.name?.lines?.ru,
    hasParsedStats: !!item.parsedStats,
    upgradeStatsEmpty: Object.keys(item.parsedStats?.upgradeStats || {}).length === 0
  })
}