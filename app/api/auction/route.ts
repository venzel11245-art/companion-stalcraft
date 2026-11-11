import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { getAuctionCache, getCacheMeta } from '@/lib/auction-bot'
import { getItemsCache, searchItemsFast } from '@/lib/items-cache'

const QUALITY_MAP: Record<number, { name: string; text: string }> = {
  0: { name: 'common', text: 'Обычное' },
  1: { name: 'uncommon', text: 'Необычное' },
  2: { name: 'special', text: 'Особое' },
  3: { name: 'rare', text: 'Редкое' },
  4: { name: 'exceptional', text: 'Исключительное' },
  5: { name: 'legendary', text: 'Легендарное' },
}

const COLOR_TO_QLT: Record<string, number> = {
  'DEFAULT': 0,
  'RANK_NEWBIE': 1,
  'RANK_STALKER': 2,
  'RANK_VETERAN': 3,
  'RANK_MASTER': 4,
  'RANK_LEGEND': 5,
}

function parseColorToQlt(color: string): number {
  return COLOR_TO_QLT[color] ?? 0
}

function getQualityText(qlt: number): { name: string; text: string } {
  return QUALITY_MAP[qlt] || QUALITY_MAP[0]
}

function getItemQuality(lot: any, item: any): { name: string; text: string } {
  if (lot.additional?.qlt !== undefined) {
    return getQualityText(lot.additional.qlt)
  }
  return getQualityText(parseColorToQlt(item.color || 'DEFAULT'))
}

function getEnhancementFromProperties(bonusProperties?: string[]): number {
  if (!bonusProperties || bonusProperties.length === 0) return 0
  return bonusProperties.length * 5
}

function getEnhancementText(level: number): string {
  return level > 0 ? `+${level}` : ''
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''
  const itemId = searchParams.get('itemId') || ''

  try {
    const itemsData = getItemsCache()

    // 1. Конкретный предмет — запрос к API
    if (itemId) {
      const item = itemsData.find(i => i.id === itemId)
      if (!item) return NextResponse.json({ lots: [], item: null, total: 0 })

      try {
        const CLIENT_ID = process.env.STALCRAFT_CLIENT_ID || '4714'
        const CLIENT_SECRET = process.env.STALCRAFT_CLIENT_SECRET || ''
        
        const url = `https://eapi.stalzone.com/RU/auction/${itemId}/lots?limit=100&additional=true`
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Client-Id': CLIENT_ID,
            'Client-Secret': CLIENT_SECRET,
          },
        })

        if (!response.ok) {
          return NextResponse.json({ lots: [], item: { id: item.id, name: item.name?.lines?.ru }, total: 0 })
        }

        const data = await response.json()
        const rawLots = data.lots || []

        const lots = rawLots.map((lot: any, index: number) => {
          const quality = getItemQuality(lot, item)
          const enhancementLevel = getEnhancementFromProperties(lot.additional?.bonus_properties)
          const enhancementText = getEnhancementText(enhancementLevel)
          const unitPrice = Math.floor(lot.buyoutPrice / lot.amount)

          return {
            uniqueKey: `${lot.itemId}-${lot.startTime}-${index}`,
            itemId: lot.itemId,
            itemName: item.name?.lines?.ru || 'N/A',
            itemRarity: quality.name,
            rarityText: quality.text,
            itemCategory: item.category,
            amount: lot.amount,
            startPrice: lot.startPrice,
            buyoutPrice: lot.buyoutPrice,
            startTime: lot.startTime,
            endTime: lot.endTime,
            enhancementLevel,
            enhancementText,
            unitPrice,
            bonusProperties: lot.additional?.bonus_properties,
            qlt: lot.additional?.qlt ?? parseColorToQlt(item.color || 'DEFAULT'),
          }
        })

        return NextResponse.json({ lots, item: { id: item.id, name: item.name?.lines?.ru }, total: lots.length })
      } catch (error) {
        return NextResponse.json({ lots: [], item: { id: item.id, name: item.name?.lines?.ru }, total: 0 })
      }
    }

    // 2. Категория — из кэша
    if (category !== 'all') {
      const cache = getAuctionCache()
      const meta = getCacheMeta()
      
      if (!cache) {
        return NextResponse.json({ 
          lots: [], 
          total: 0, 
          message: 'Кэш ещё не создан. Запустите бота: node scripts/start-bot.js',
          cacheReady: false,
          lastUpdate: null,
        })
      }

      const lots = cache.data[category] || []
      
      return NextResponse.json({ 
        lots, 
        total: lots.length, 
        cacheReady: true,
        lastUpdate: meta?.lastUpdate || cache.timestamp,
        lastUpdateFormatted: meta?.lastUpdateFormatted || new Date(cache.timestamp).toLocaleString('ru-RU'),
        totalLotsInCache: meta?.totalLots || 0,
      })
    }

    // 3. Поиск — с проверкой наличия в кэше аукциона
    if (search.length >= 2) {
      // Быстрый поиск через индекс
      const searchResults = searchItemsFast(search)
        .slice(0, 20)
        .map(i => ({
          id: i.id,
          name: i.name?.lines?.ru,
          rarity: i.color || 'DEFAULT',
          rarityText: getQualityText(parseColorToQlt(i.color || 'DEFAULT')).text,
          category: i.category,
          status: i.status,
        }))
      
      // 🔥 ВАЖНО: Получаем кэш аукциона чтобы проверить какие предметы реально продаются
      const cache = getAuctionCache()
      const activeItemIds = new Set<string>()
      
      if (cache) {
        Object.values(cache.data).forEach((lots: any[]) => {
          lots.forEach((lot: any) => {
            const endTime = new Date(lot.endTime).getTime()
            if (endTime > Date.now() && lot.buyoutPrice > 0) {
              activeItemIds.add(lot.itemId)
            }
          })
        })
      }
      
      // 🔥 ФИЛЬТР: оставляем только предметы которые есть на аукционе
      const filteredResults = searchResults.filter(item => activeItemIds.has(item.id))
      
      console.log(`[Search] Запрос: "${search}", найдено: ${searchResults.length}, после фильтра: ${filteredResults.length}`)
      return NextResponse.json({ items: filteredResults, lots: [] })
    }

    return NextResponse.json({ lots: [], total: 0, message: 'Выберите категорию' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: String(error), lots: [], total: 0 }, { status: 500 })
  }
}