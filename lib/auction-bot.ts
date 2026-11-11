import * as fs from 'fs'
import * as path from 'path'
import { 
  auctionClient, 
  StalcraftLot, 
  AuctionLot, 
  getQualityText, 
  getEnhancementFromProperties,
  getEnhancementText 
} from './stalcraft-api'

const BATCH_SIZE = 10
const REQUEST_DELAY = 100
const CACHE_PATH = path.join(process.cwd(), 'data', 'cache', 'auction-cache.json')
const CACHE_META_PATH = path.join(process.cwd(), 'data', 'cache', 'auction-meta.json')

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

function parseColorToQlt(color: string): number {
  const map: Record<string, number> = {
    'DEFAULT': 0,
    'RANK_NEWBIE': 1,
    'RANK_STALKER': 2,
    'RANK_VETERAN': 3,
    'RANK_MASTER': 4,
    'RANK_LEGEND': 5,
  }
  return map[color] ?? 0
}

// КРИТИЧНО: Для артефактов берём реальное качество из лота, а не базовое из базы
function getItemQuality(lot: StalcraftLot, item: any): { name: string; text: string } {
  if (lot.additional?.qlt !== undefined) {
    return getQualityText(lot.additional.qlt)
  }
  const color = item.color || 'DEFAULT'
  return getQualityText(parseColorToQlt(color))
}

async function getLotsWithKeyRotation(itemId: string, limit: number = 20): Promise<StalcraftLot[]> {
  const key = getNextKey()
  const url = `https://eapi.stalzone.com/RU/auction/${itemId}/lots?limit=${limit}&additional=true`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Client-Id': key.id,
        'Client-Secret': key.secret,
        'User-Agent': 'StalcraftCompanion/1.0',
      },
    })

    if (!response.ok) return []
    const data = await response.json()
    return data.lots || []
  } catch (error) {
    return []
  }
}

async function fetchLotsBatch(itemIds: string[], itemsData: any[], category: string): Promise<AuctionLot[]> {
  const allLots: AuctionLot[] = []
  let processed = 0
  
  for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
    const batch = itemIds.slice(i, i + BATCH_SIZE)
    
    const results = await Promise.allSettled(
      batch.map(async (itemId) => {
        const item = itemsData.find(i => i.id === itemId)
        if (!item) return []
        
        const rawLots = await getLotsWithKeyRotation(itemId, 20)
        if (rawLots.length === 0) return []
        
        return rawLots.map((lot: StalcraftLot, index: number) => {
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
      })
    )
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allLots.push(...result.value)
      }
    })
    
    processed += batch.length
    if (processed % 50 === 0) {
      console.log(`  [${category}] Прогресс: ${processed}/${itemIds.length} (${Math.round(processed/itemIds.length*100)}%)`)
    }
    
    if (i + BATCH_SIZE < itemIds.length) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
    }
  }
  
  return allLots
}

export async function updateAuctionCache(itemsData: any[], allItemsByCategory: Record<string, string[]>) {
  console.log('[BOT] Начинаем обновление кэша аукциона...')
  const startTime = Date.now()
  
  const cache: Record<string, AuctionLot[]> = {}
  
  for (const [category, itemIds] of Object.entries(allItemsByCategory) as [string, string[]][]) {
    console.log(`[BOT] Категория ${category}: ${itemIds.length} предметов...`)
    const lots = await fetchLotsBatch(itemIds, itemsData, category)
    lots.sort((a, b) => a.buyoutPrice - b.buyoutPrice)
    cache[category] = lots
    console.log(`[BOT] ${category}: найдено ${lots.length} лотов`)
  }
  
  const cacheDir = path.dirname(CACHE_PATH)
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  
  fs.writeFileSync(CACHE_PATH, JSON.stringify({
    timestamp: Date.now(),
    data: cache
  }, null, 2))
  
  fs.writeFileSync(CACHE_META_PATH, JSON.stringify({
    lastUpdate: Date.now(),
    lastUpdateFormatted: new Date().toLocaleString('ru-RU'),
    totalLots: Object.values(cache).reduce((sum, lots) => sum + lots.length, 0),
    categories: Object.keys(cache).length,
  }, null, 2))
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[BOT] Кэш обновлён за ${elapsed} секунд`)
}

export function getAuctionCache(): { timestamp: number; data: Record<string, AuctionLot[]> } | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getCacheMeta(): { lastUpdate: number; lastUpdateFormatted: string; totalLots: number } | null {
  try {
    if (!fs.existsSync(CACHE_META_PATH)) return null
    const raw = fs.readFileSync(CACHE_META_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}