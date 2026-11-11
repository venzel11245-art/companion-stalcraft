import { updateAuctionCache } from './auction-bot'
import * as fs from 'fs'
import * as path from 'path'

const UPDATE_INTERVAL = 5 * 60 * 1000 // 5 минут

export function startAutoCacheUpdate() {
  try {
    const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
    const allItemsPath = path.join(process.cwd(), 'lib', 'all-items-by-category.json')
    
    const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
    const allItems = JSON.parse(fs.readFileSync(allItemsPath, 'utf-8'))
    
    console.log('[AUTO-CACHE] Запуск автообновления кэша...')
    
    // Обновляем сразу
    updateAuctionCache(items, allItems)
    
    // Потом каждые 5 минут
    setInterval(() => {
      console.log('[AUTO-CACHE] Запланированное обновление...')
      updateAuctionCache(items, allItems)
    }, UPDATE_INTERVAL)
  } catch (error) {
    console.error('[AUTO-CACHE] Ошибка:', error)
  }
}