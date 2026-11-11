import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

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

const COLOR_TO_QLT: Record<string, number> = {
  'DEFAULT': 0,
  'RANK_NEWBIE': 1,
  'RANK_STALKER': 2,
  'RANK_VETERAN': 3,
  'RANK_MASTER': 4,
  'RANK_LEGEND': 5,
}

const QLT_TO_QUALITY: Record<number, string> = {
  0: 'common', 1: 'uncommon', 2: 'special',
  3: 'rare', 4: 'exceptional', 5: 'legendary',
}

const QUALITY_TO_QLT: Record<string, number> = {
  'common': 0, 'uncommon': 1, 'special': 2,
  'rare': 3, 'exceptional': 4, 'legendary': 5,
}

import { getItemsCache } from '@/lib/items-cache'

function loadItemsDb(): Map<string, any> {
  const itemsMap = new Map<string, any>()
  const itemsData = getItemsCache()
  itemsData.forEach((item: any) => itemsMap.set(item.id, item))
  return itemsMap
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  const limit = searchParams.get('limit') || '500'
  const quality = searchParams.get('quality') || 'all'

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
  }

  try {
    const key = getNextKey()
    const itemsDb = loadItemsDb()
    const itemInfo = itemsDb.get(itemId) || {}
    
    // Определяем, имеет ли предмет фиксированное качество
    const itemColor = itemInfo.color || 'DEFAULT'
    const fixedQlt = COLOR_TO_QLT[itemColor] // Если не 0, значит качество фиксировано

    // 1. Запрашиваем историю с additional=true
    const historyRes = await fetch(`https://eapi.stalzone.com/RU/auction/${itemId}/history?limit=${limit}&additional=true`, {
      headers: {
        'Accept': 'application/json',
        'Client-Id': key.id,
        'Client-Secret': key.secret,
        'User-Agent': 'TradeZon/1.0',
      },
      next: { revalidate: 60 },
    })

    if (!historyRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: historyRes.status })
    }

    const historyData = await historyRes.json()
    const rawPrices = historyData.prices || []

    // 2. Запрашиваем текущие лоты ТОЛЬКО для отображения диапазонов в UI
    let qualityRanges: Record<string, { min: number; max: number; median: number; count: number }> = {}
    try {
      const lotsRes = await fetch(`https://eapi.stalzone.com/RU/auction/${itemId}/lots?limit=50&additional=true`, {
        headers: {
          'Accept': 'application/json',
          'Client-Id': key.id,
          'Client-Secret': key.secret,
          'User-Agent': 'TradeZon/1.0',
        },
        next: { revalidate: 60 },
      })
      
      if (lotsRes.ok) {
        const lotsData = await lotsRes.json()
        const lotsByQlt = new Map<number, number[]>()

        lotsData.lots.forEach((lot: any) => {
          const qlt = lot.additional?.qlt ?? fixedQlt ?? 0
          const price = lot.buyoutPrice
          if (price > 0) {
            if (!lotsByQlt.has(qlt)) lotsByQlt.set(qlt, [])
            lotsByQlt.get(qlt)!.push(price)
          }
        })

        lotsByQlt.forEach((prices, qlt) => {
          const qualityName = QLT_TO_QUALITY[qlt] || 'common'
          prices.sort((a, b) => a - b)
          const median = prices[Math.floor(prices.length / 2)]
          
          qualityRanges[qualityName] = {
            min: prices[0],
            max: prices[prices.length - 1],
            median: Math.round(median),
            count: prices.length,
          }
        })
      }
    } catch (e) {
      console.error('Failed to fetch lots for ranges:', e)
    }

    // 3. ФИЛЬТРАЦИЯ ИСТОРИИ (ИСПРАВЛЕННАЯ ЛОГИКА)
    let filteredRawPrices = rawPrices
    
    if (quality !== 'all') {
      const targetQlt = QUALITY_TO_QLT[quality] ?? 0
      
      // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ:
      // Если предмет имеет фиксированное качество, И пользователь выбрал именно его,
      // мы НЕ фильтруем по p.additional?.qlt, потому что API истории часто его не возвращает!
      // Мы просто возвращаем ВСЕ продажи этого предмета.
      if (fixedQlt !== 0 && fixedQlt === targetQlt) {
        filteredRawPrices = rawPrices
      } else {
        // Для предметов с несколькими качествами фильтруем строго по qlt из истории
        filteredRawPrices = rawPrices.filter((p: any) => (p.additional?.qlt ?? 0) === targetQlt)
      }
    }

    // 4. Форматируем даты и цены
    const formattedPrices = filteredRawPrices.map((p: any) => ({
      date: new Date(p.time).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      price: p.price,
      amount: p.amount || 1,
      fullDate: p.time,
    }))

    // 5. Считаем статистику
    const prices = formattedPrices.map((p: any) => p.price).sort((a: number, b: number) => a - b)
    
    const stats = {
      total: formattedPrices.length,
      min: prices.length > 0 ? prices[0] : 0,
      max: prices.length > 0 ? prices[prices.length - 1] : 0,
      avg: prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
      median: prices.length > 0 ? (prices.length % 2 === 0 ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2 : prices[Math.floor(prices.length / 2)]) : 0,
      last: formattedPrices.length > 0 ? formattedPrices[0].price : 0,
      quality,
      qualityRanges,
    }

    return NextResponse.json({
      itemId,
      prices: formattedPrices.reverse(),
      stats,
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}