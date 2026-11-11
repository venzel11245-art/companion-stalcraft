import { startBackgroundUpdates } from './background-bot'
import { getItemsCache } from './items-cache' // <-- Добавляем импорт кэша

let initialized = false

export function initializeServer() {
  if (initialized) return
  
  initialized = true
  
  // Проверяем что мы на сервере (не в браузере)
  if (typeof window === 'undefined') {
    console.log('🚀 [ServerInit] Инициализация сервера...')
    
    // 🚀 ПРИНУДИТЕЛЬНО загружаем и парсим предметы при старте сервера
    console.log('📦 [ServerInit] Загрузка и парсинг статов предметов...')
    getItemsCache() // <-- Этот вызов гарантированно выведет наше сообщение
    
    // Запускаем фоновое обновление каждые 10 минут
    startBackgroundUpdates(10)
  }
}