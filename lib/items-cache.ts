// lib/items-cache.ts

import * as fs from 'fs'
import * as path from 'path'
import { parseItemStats } from './item-stats-parser'

let cachedItems: any[] = []
let cacheTimestamp = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 час

let searchIndex: Map<string, any[]> | null = null

// Рекурсивная функция для сбора всех numeric значений из любой глубины JSON
function collectAllNumeric(node: any, results: any[] = []): any[] {
  if (!node) return results
  if (Array.isArray(node)) {
    node.forEach(n => collectAllNumeric(n, results))
    return results
  }
  if (typeof node !== 'object') return results
  
  if (node.type === 'numeric' && node.value !== undefined) {
    const nameRu = node.name?.lines?.ru || node.name?.key || 'unknown'
    results.push({ name: nameRu, value: node.value, key: node.name?.key })
  }
  
  for (const key of Object.keys(node)) {
    const val = node[key]
    if (val && typeof val === 'object') {
      collectAllNumeric(val, results)
    }
  }
  return results
}

// Определяем ключ для сортировки уровней заточки
function getSortKey(category: string | undefined): string {
  if (!category) return 'damage'
  if (category.startsWith('weapon')) return 'damage'
  if (category.startsWith('armor')) return 'Пулестойкость' // Ключевое исправление!
  return 'damage'
}

export function getItemsCache(): any[] {
  const now = Date.now()
  
  if (cachedItems.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedItems
  }
  
  const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
  if (!fs.existsSync(itemsPath)) {
    return []
  }
  
  try {
    const rawData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
    
    // Группируем предметы по ID
    const groupedById = new Map<string, any[]>()
    for (const item of rawData) {
      const id = item.id
      if (!groupedById.has(id)) {
        groupedById.set(id, [])
      }
      groupedById.get(id)!.push(item)
    }
    
    cachedItems = []
    for (const [id, versions] of groupedById.entries()) {
      if (versions.length === 0) continue
      
      const firstVersion = versions[0]
      const sortKey = getSortKey(firstVersion.category)
      
      // Собираем статы для каждой версии
      const versionsWithStats = versions.map(v => {
        const allStatsList = collectAllNumeric(v.infoBlocks)
        const statMap: Record<string, number> = {}
        
        // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: не перезаписываем статы, берем только первое найденное значение
        allStatsList.forEach(s => {
          if (statMap[s.name] === undefined) {
            statMap[s.name] = s.value
          }
        })
        
        // Определяем значение для сортировки
        let sortValue = 0
        if (sortKey === 'damage') {
          sortValue = statMap['Урон'] || statMap['damage'] || 0
        } else {
          // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем оба варианта написания
          sortValue = statMap['Пулестойкость'] || statMap['Пулезащита'] || statMap['bulletProof'] || 0
        }
        
        return {
          ...v,
          parsedStats: parseItemStats(v),
          allStats: statMap,
          sortValue: sortValue
        }
      })
      
      // Сортируем по возрастанию ключевого стата (+0 -> +15)
      versionsWithStats.sort((a, b) => a.sortValue - b.sortValue)
      
      // Убираем версии, где ключевой стат равен 0 (битые или неприменимые записи)
      const validVersions = versionsWithStats.filter(v => v.sortValue > 0)
      
      const enhancedVersions: (any | null)[] = Array(16).fill(null)
      
      if (validVersions.length > 0) {
        // Заполняем массив версий (максимум 16)
        validVersions.slice(0, 16).forEach((v, idx) => {
          enhancedVersions[idx] = {
            ...v,
            allStats: v.allStats
          }
        })
        
        // Базовый предмет для отображения в поиске — это версия +0
        cachedItems.push({
          ...validVersions[0],
          enhancedVersions,
          hasEnhancements: validVersions.length > 1
        })
      } else {
        // Фолбэк для предметов без урона/пулестойкости (рюкзаки, патроны и т.д.)
        const allStatsList = collectAllNumeric(firstVersion.infoBlocks)
        const statMap: Record<string, number> = {}
        allStatsList.forEach(s => {
          if (statMap[s.name] === undefined) {
            statMap[s.name] = s.value
          }
        })
        
        cachedItems.push({
          ...firstVersion,
          parsedStats: parseItemStats(firstVersion),
          allStats: statMap,
          enhancedVersions,
          hasEnhancements: false
        })
      }
    }
    
    cacheTimestamp = now
    searchIndex = null
    console.log(`[ItemsCache] ✅ Загружено ${cachedItems.length} уникальных предметов с версиями заточки`)
    return cachedItems
  } catch (e) {
    console.error('[ItemsCache] ❌ Ошибка чтения:', e)
    return []
  }
}

export function getSearchIndex(): Map<string, any[]> {
  if (searchIndex) return searchIndex
  
  searchIndex = new Map()
  const items = getItemsCache()
  
  if (items.length === 0) {
    console.warn('[SearchIndex] Предметы не загружены')
    return searchIndex
  }
  
  for (const item of items) {
    const name = item.name?.lines?.ru?.toLowerCase()
    if (!name) continue
    
    // Строим индекс по первым 3 символам для быстрого поиска
    for (let i = 0; i <= name.length - 3; i++) {
      const key = name.substring(i, i + 3)
      if (!searchIndex.has(key)) searchIndex.set(key, [])
      
      const existing = searchIndex.get(key)!
      if (!existing.some(existingItem => existingItem.id === item.id)) {
        existing.push(item)
      }
    }
  }
  
  console.log(`[SearchIndex] ✅ Построен индекс: ${searchIndex.size} ключей`)
  return searchIndex
}

export function searchItemsFast(query: string): any[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []
  
  const index = getSearchIndex()
  const key = q.substring(0, 3)
  const candidates = index.get(key) || []
  
  const seen = new Set<string>()
  return candidates.filter(item => {
    const name = item.name?.lines?.ru?.toLowerCase()
    if (!name?.includes(q)) return false
    
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function invalidateItemsCache(): void {
  cachedItems = []
  cacheTimestamp = 0
  searchIndex = null
}