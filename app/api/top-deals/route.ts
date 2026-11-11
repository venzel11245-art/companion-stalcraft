import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getAuctionCache } from '@/lib/auction-bot'

function loadItemsDb(): Map<string, any> {
  const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
  const itemsMap = new Map<string, any>()
  if (fs.existsSync(itemsPath)) {
    try {
      const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
      itemsData.forEach((item: any) => itemsMap.set(item.id, item))
    } catch (e) { console.error(e) }
  }
  return itemsMap
}

const itemsDb = loadItemsDb()

function getItemName(item: any): string {
  if (!item) return 'Неизвестный предмет'
  if (typeof item.name === 'string') return item.name
  if (item.name?.lines?.ru) return item.name.lines.ru
  if (item.name?.ru) return item.name.ru
  return 'Неизвестный предмет'
}

function getRarityFromQlt(qlt: number): string {
  const map: Record<number, string> = {
    0: 'common', 1: 'uncommon', 2: 'special',
    3: 'rare', 4: 'exceptional', 5: 'legendary',
  }
  return map[qlt] || 'common'
}

function getRarityText(rarity: string): string {
  const texts: Record<string, string> = {
    'common': 'Обычное', 'uncommon': 'Необычное', 'special': 'Особое',
    'rare': 'Редкое', 'exceptional': 'Исключительное', 'legendary': 'Легендарное',
  }
  return texts[rarity] || 'Обычное'
}

const API_KEYS = [
  { id: '4714', secret: process.env.STALCRAFT_CLIENT_SECRET || '' },
  { id: '4816', secret: process.env.STALCRAFT_CLIENT_SECRET_2 || '' },
  { id: '5030', secret: process.env.STALCRAFT_CLIENT_SECRET_3 || '' },
]

let currentKeyIndex = 0

function getNextKey() {
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

async function getItemHistory(itemId: string): Promise<any[]> {
  const key = getNextKey()
  
  try {
    const url = `https://eapi.stalzone.com/RU/auction/${itemId}/history?limit=500&additional=true`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Client-Id': key.id,
        'Client-Secret': key.secret,
        'User-Agent': 'TradeZon/1.0',
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) return []
    const data = await response.json()
    return data.prices || []
  } catch (error) {
    console.error(`Ошибка истории для ${itemId}:`, error)
    return []
  }
}

function calculateMedian(prices: number[]): number {
  if (prices.length === 0) return 0
  if (prices.length === 1) return prices[0]
  
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export async function GET() {
  try {
    const cache = getAuctionCache()
    if (!cache) {
      return NextResponse.json({ total: 0, deals: [], message: 'Кэш ещё не готов' })
    }

    const allLots: any[] = Object.values(cache.data).flat()
    const now = Date.now()

    const activeLots = allLots.filter(lot => {
      const endTime = new Date(lot.endTime).getTime()
      return endTime > now && lot.buyoutPrice && lot.buyoutPrice > 0
    })

    const itemsMap = new Map<string, any[]>()
    for (const lot of activeLots) {
      if (!itemsMap.has(lot.itemId)) {
        itemsMap.set(lot.itemId, [])
      }
      itemsMap.get(lot.itemId)!.push(lot)
    }

    const profitableDeals: any[] = []
    const itemIds = Array.from(itemsMap.keys())
    const startTime = Date.now()

    console.log(`📊 Анализируем ${itemIds.length} предметов...`)

    const BATCH_SIZE = 15
    let processed = 0

    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
      const batch = itemIds.slice(i, i + BATCH_SIZE)
      
      const results = await Promise.allSettled(
        batch.map(async (itemId) => {
          const lots = itemsMap.get(itemId)!
          
          // Получаем ИСТОРИЮ ПРОДАЖ (limit=500)
          const historyPrices = await getItemHistory(itemId)
          
          if (historyPrices.length < 5) return null

          // Группируем историю по качеству (qlt из additional)
          const historyByQuality = new Map<number, number[]>()
          
          for (const sale of historyPrices) {
            const qlt = sale.additional?.qlt ?? 0
            const price = sale.price
            
            if (price <= 0) continue
            
            if (!historyByQuality.has(qlt)) {
              historyByQuality.set(qlt, [])
            }
            historyByQuality.get(qlt)!.push(price)
          }

          const deals: any[] = []

          // Для каждого лота ищем медиану его качества из истории
          for (const lot of lots) {
            const buyPrice = lot.buyoutPrice
            const lotQlt = lot.qlt ?? 0
            
            // Берём продажи ТОГО ЖЕ качества из истории
            const qualityPrices = historyByQuality.get(lotQlt)
            
            if (!qualityPrices || qualityPrices.length < 5) continue
            
            // Считаем медиану для этого качества
            const medianPrice = calculateMedian(qualityPrices)
            if (medianPrice <= 0) continue

            // Ищем лоты дешевле медианы минимум на 10%
            if (buyPrice >= medianPrice * 0.90) continue

            const estimatedSellPrice = Math.round(medianPrice * 0.95)
            const commission = Math.round(medianPrice * 0.05)
            const profit = estimatedSellPrice - buyPrice
            const profitPercent = buyPrice > 0 ? (profit / buyPrice) * 100 : 0

            if (profit > 1000 && profitPercent >= 5) {
              const itemInfo = itemsDb.get(itemId) || {}
              const rarity = getRarityFromQlt(lotQlt)

              deals.push({
                uniqueKey: lot.uniqueKey || `${lot.itemId}-${lot.startTime}`,
                itemId: lot.itemId,
                itemName: getItemName(itemInfo),
                itemRarity: rarity,
                rarityText: getRarityText(rarity),
                enhancementLevel: lot.enhancementLevel || 0,
                enhancementText: lot.enhancementText || '',
                buyoutPrice: buyPrice,
                estimatedSellPrice: estimatedSellPrice,
                commission: commission,
                profit: Math.round(profit),
                profitPercent: Math.round(profitPercent * 100) / 100,
                amount: lot.amount,
                endTime: lot.endTime,
                averagePrice: Math.round(medianPrice),
                discountPercent: Math.round((1 - buyPrice / medianPrice) * 100),
                historySalesCount: qualityPrices.length,
              })
            }
          }

          return deals.length > 0 ? deals : null
        })
      )

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          profitableDeals.push(...result.value)
        }
      })

      processed += batch.length
      if (processed % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`📊 Обработано ${processed}/${itemIds.length} (${elapsed}с) | Найдено ${profitableDeals.length} лотов`)
      }
    }

    profitableDeals.sort((a, b) => {
      if (b.profit !== a.profit) return b.profit - a.profit
      return b.profitPercent - a.profitPercent
    })

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ Готово за ${totalTime}с! Найдено ${profitableDeals.length} выгодных лотов`)
    console.log('🔥 ТОП-10:')
    profitableDeals.slice(0, 10).forEach((deal, i) => {
      console.log(`${i+1}. ${deal.itemName} (${deal.rarityText} ${deal.enhancementText}) | История: ${deal.historySalesCount} продаж | Медиана: ${deal.averagePrice} | Лот: ${deal.buyoutPrice} | Скидка: -${deal.discountPercent}% | Профит: ${deal.profit}`)
    })

    return NextResponse.json({
      total: profitableDeals.length,
      deals: profitableDeals.slice(0, 100),
    })

  } catch (error) {
    console.error('Top deals error:', error)
    return NextResponse.json({ error: 'Failed', total: 0, deals: [] }, { status: 500 })
  }
}