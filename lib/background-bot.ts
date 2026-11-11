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

const API_BASE = 'https://eapi.stalzone.com'
const REGION = 'RU'
const BATCH_SIZE = 40
const REQUEST_DELAY = 100
const CACHE_PATH = path.join(process.cwd(), 'data', 'cache', 'auction-cache.json')

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

function getQualityText(qlt: number) {
  return QUALITY_MAP[qlt] || QUALITY_MAP[0]
}

function parseColorToQlt(color: string) {
  return COLOR_TO_QLT[color] ?? 0
}

function getItemQuality(lot: any, item: any) {
  if (lot.additional?.qlt !== undefined && lot.additional?.qlt !== null) {
    return getQualityText(lot.additional.qlt)
  }
  return getQualityText(parseColorToQlt(item.color || 'DEFAULT'))
}

function getEnhancementFromProperties(bonusProperties?: string[]) {
  if (!bonusProperties || bonusProperties.length === 0) return 0
  return bonusProperties.length * 5
}

function getEnhancementText(level: number) {
  return level > 0 ? `+${level}` : ''
}

async function getLots(itemId: string, limit = 20) {
  const key = getNextKey()
  const url = `${API_BASE}/${REGION}/auction/${itemId}/lots?limit=${limit}&additional=true`
  
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
    console.error(`[BackgroundBot] Ошибка для ${itemId}:`, error)
    return []
  }
}

async function fetchLotsBatch(itemIds: string[], itemsData: any[], category: string) {
  const allLots: any[] = []
  let processed = 0
  
  for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
    const batch = itemIds.slice(i, i + BATCH_SIZE)
    
    const results = await Promise.allSettled(
      batch.map(async (itemId) => {
        const item = itemsData.find(i => i.id === itemId)
        if (!item) return []
        
        try {
          const rawLots = await getLots(itemId, 20)
          if (rawLots.length === 0) return []
          
          return rawLots.map((lot: any, index: number) => {
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
        } catch (error) {
          return []
        }
      })
    )
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allLots.push(...result.value)
      }
    })
    
    processed += batch.length
    if (processed % 100 === 0) {
      console.log(`[BackgroundBot] ${category}: ${processed}/${itemIds.length} (${Math.round(processed/itemIds.length*100)}%)`)
    }
    
    if (i + BATCH_SIZE < itemIds.length) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
    }
  }
  
  return allLots
}

export async function runBackgroundBot() {
  console.log('\n🤖 [BackgroundBot] Запуск фонового обновления кэша...')
  const startTime = Date.now()
  
  try {
    const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
    if (!fs.existsSync(itemsPath)) {
      console.error('[BackgroundBot] items.json не найден!')
      return
    }
    const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
    
    const allItemsPath = path.join(process.cwd(), 'lib', 'all-items-by-category.json')
    if (!fs.existsSync(allItemsPath)) {
      console.error('[BackgroundBot] all-items-by-category.json не найден!')
      return
    }
    const allItems = JSON.parse(fs.readFileSync(allItemsPath, 'utf-8'))
    
    const cache: Record<string, any[]> = {}
    
    for (const [category, itemIds] of Object.entries(allItems)) {
      console.log(`[BackgroundBot] Категория ${category}: ${(itemIds as string[]).length} предметов...`)
      const lots = await fetchLotsBatch(itemIds as string[], itemsData, category)
      lots.sort((a, b) => a.buyoutPrice - b.buyoutPrice)
      cache[category] = lots
      console.log(`[BackgroundBot] ✅ ${category}: ${lots.length} лотов`)
    }
    
    const cacheDir = path.dirname(CACHE_PATH)
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    
    const totalLots = Object.values(cache).reduce((sum, lots) => sum + lots.length, 0)
    
    fs.writeFileSync(CACHE_PATH, JSON.stringify({
      timestamp: Date.now(),
      data: cache
    }, null, 2))
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ [BackgroundBot] Кэш обновлён за ${elapsed}с | Всего лотов: ${totalLots}\n`)
  } catch (error) {
    console.error('❌ [BackgroundBot] Ошибка:', error)
  }
}

// Запуск фонового обновления каждые 10 минут
let backgroundInterval: NodeJS.Timeout | null = null

export function startBackgroundUpdates(intervalMinutes = 10) {
  if (backgroundInterval) {
    console.log('[BackgroundBot] Обновление уже запущено')
    return
  }
  
  console.log(`🔄 [BackgroundBot] Автообновление каждые ${intervalMinutes} минут запущено`)
  
  // Первый запуск сразу
  runBackgroundBot()
  
  // Затем каждые N минут
  backgroundInterval = setInterval(() => {
    runBackgroundBot()
  }, intervalMinutes * 60 * 1000)
}

export function stopBackgroundUpdates() {
  if (backgroundInterval) {
    clearInterval(backgroundInterval)
    backgroundInterval = null
    console.log('[BackgroundBot] Автообновление остановлено')
  }
}