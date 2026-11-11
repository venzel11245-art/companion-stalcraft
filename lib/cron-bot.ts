import { updateAuctionCache } from './auction-bot'
import * as fs from 'fs'
import * as path from 'path'

const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
const allItemsPath = path.join(process.cwd(), 'lib', 'all-items-by-category.json')

export function startAutoUpdate() {
  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
  const allItems = JSON.parse(fs.readFileSync(allItemsPath, 'utf-8'))
  
  console.log('[CRON] Автообновление кэша запущено (каждые 5 минут)')
  
  // Обновляем сразу
  updateAuctionCache(items, allItems)
  
  // Потом каждые 5 минут
  setInterval(() => {
    updateAuctionCache(items, allItems)
  }, 5 * 60 * 1000)
}