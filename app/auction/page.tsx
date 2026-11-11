'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface Lot {
  uniqueKey?: string
  itemId: string
  itemName: string
  itemRarity: string
  rarityText: string
  itemCategory: string
  amount: number
  startPrice: number
  buyoutPrice: number
  startTime: string
  endTime: string
  enhancementLevel?: number
  enhancementText?: string
  unitPrice?: number
  bonusProperties?: string[]
  qlt?: number
}

interface SearchResult {
  id: string
  name: string
  rarity: string
  rarityText: string
  category: string
  color?: string
  status?: { state?: string }
}

interface PricePoint {
  date: string
  price: number
  amount: number
  fullDate: string
}

interface PriceStats {
  total: number
  min: number
  max: number
  avg: number
  median: number
  last: number
  quality: string
  qualityRanges?: Record<string, { min: number; max: number; median: number; count: number }>
}

interface TopDeal {
  uniqueKey: string
  itemId: string
  itemName: string
  itemRarity: string
  rarityText: string
  buyoutPrice: number
  commission: number
  estimatedSellPrice: number
  profit: number
  profitPercent: number
  amount: number
  endTime: string
  enhancementLevel?: number
  enhancementText?: string
  averagePrice?: number
  discountPercent?: number
}

type HistoryPeriod = 'day' | 'week' | 'month'
type QualityFilter = 'all' | 'common' | 'uncommon' | 'special' | 'rare' | 'exceptional' | 'legendary'

// Маппинг цветов API в наши качества
const COLOR_TO_RARITY: Record<string, string> = {
  'DEFAULT': 'common',
  'RANK_NEWBIE': 'uncommon',
  'RANK_STALKER': 'special',
  'RANK_VETERAN': 'rare',
  'RANK_MASTER': 'exceptional',
  'RANK_LEGEND': 'legendary',
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const price = payload[0].value as number
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-400 text-sm">Дата: {label}</p>
        <p className="text-white font-bold">
          Цена: {price.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    )
  }
  return null
}

const qualityOptions: { id: QualityFilter; name: string; color: string; bg: string }[] = [
  { id: 'all', name: 'Все качества', color: 'text-gray-300', bg: 'bg-gray-800' },
  { id: 'common', name: 'Обычное', color: 'text-gray-400', bg: 'bg-gray-900/50' },
  { id: 'uncommon', name: 'Необычное', color: 'text-green-400', bg: 'bg-green-900/30' },
  { id: 'special', name: 'Особое', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  { id: 'rare', name: 'Редкое', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  { id: 'exceptional', name: 'Исключительное', color: 'text-red-400', bg: 'bg-red-900/30' },
  { id: 'legendary', name: 'Легендарное', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
]

export default function AuctionPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<PricePoint[]>([])
  const [historyStats, setHistoryStats] = useState<PriceStats | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItemName, setHistoryItemName] = useState('')
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>('week')
  const [historyQuality, setHistoryQuality] = useState<QualityFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('armor')
  const [topDeals, setTopDeals] = useState<TopDeal[]>([])
  const [showTopDeals, setShowTopDeals] = useState(false)
  const [topDealsLoading, setTopDealsLoading] = useState(false)
  const [visibleLots, setVisibleLots] = useState(30)
  const [cacheInfo, setCacheInfo] = useState<{ ready: boolean; lastUpdate?: string; totalLots?: number }>({ ready: true })

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchPopularLots('armor')
  }, [])

  const fetchPopularLots = async (selectedCategory: string = 'armor') => {
    setLoading(true)
    setSelectedItem(null)
    setShowHistory(false)
    setShowTopDeals(false)
    setVisibleLots(30)
    try {
      const res = await fetch(`/api/auction?category=${selectedCategory}`)
      const data = await res.json()
      
      setCacheInfo({
        ready: data.cacheReady !== false,
        lastUpdate: data.lastUpdateFormatted,
        totalLots: data.totalLotsInCache,
      })
      
      setLots(data.lots || [])
      setSearchResults([])
    } catch (e) {
      console.error('Ошибка:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchItemLots = async (itemId: string) => {
    setLoading(true)
    setSelectedItem(itemId)
    setShowDropdown(false)
    setSearchQuery('')
    setShowHistory(false)
    setShowTopDeals(false)
    setVisibleLots(30)
    try {
      const res = await fetch(`/api/auction?itemId=${itemId}`)
      const data = await res.json()
      
      setLots(data.lots || [])
      if (data.item) {
        setHistoryItemName(data.item.name)
      }
    } catch (e) {
      console.error('Ошибка:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (itemId: string, itemName: string, period: HistoryPeriod = historyPeriod, quality: QualityFilter = historyQuality) => {
    setHistoryLoading(true)
    setShowHistory(true)
    setHistoryItemName(itemName)
    setHistoryPeriod(period)
    setHistoryQuality(quality)

    const limits: Record<HistoryPeriod, number> = {
      day: 50,
      week: 200,
      month: 500,
    }

    try {
      const res = await fetch(`/api/auction-history?itemId=${itemId}&limit=${limits[period]}&quality=${quality}`)
      const data = await res.json()
      setHistoryData(data.prices || [])
      setHistoryStats(data.stats || null)
    } catch (e) {
      console.error('Ошибка:', e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchTopDeals = async () => {
    setTopDealsLoading(true)
    setShowTopDeals(true)
    setShowHistory(false)
    try {
      const res = await fetch('/api/top-deals')
      const data = await res.json()
      setTopDeals(data.deals || [])
    } catch (e) {
      console.error('Ошибка:', e)
    } finally {
      setTopDealsLoading(false)
    }
  }

  const searchItems = useCallback(async (query: string) => {
  // Очищаем предыдущий таймер
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current)
  }

  if (query.length < 2) {
    setSearchResults([])
    setShowDropdown(false)
    return
  }

  // Ждём 300мс после последнего нажатия клавиши (debounce)
  searchTimeoutRef.current = setTimeout(async () => {
    try {
      const res = await fetch(`/api/auction?search=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      console.log('[Search] Получено результатов:', data.items?.length)
      
      // УБРАЛИ фильтр по status - показываем все предметы из поиска
      setSearchResults(data.items || [])
      setShowDropdown(true)
    } catch (e) {
      console.error('Ошибка поиска:', e)
    }
  }, 300)
}, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    searchItems(value)
  }

  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-RU') + ' ₽'
  }

  const getTimeLeft = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now()
    if (diff <= 0) return 'Завершён'

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    return `${hours}ч ${minutes}м`
  }

  const getRarityColor = (rarity: string) => {
    const r = rarity?.toLowerCase()
    switch (r) {
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10'
      case 'exceptional': return 'border-red-500 bg-red-500/10'
      case 'rare': return 'border-purple-500 bg-purple-500/10'
      case 'special': return 'border-blue-500 bg-blue-500/10'
      case 'uncommon': return 'border-green-500 bg-green-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    const r = rarity?.toLowerCase()
    switch (r) {
      case 'legendary': return 'text-yellow-400'
      case 'exceptional': return 'text-red-400'
      case 'rare': return 'text-purple-400'
      case 'special': return 'text-blue-400'
      case 'uncommon': return 'text-green-400'
      case 'common': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getRarityBgColor = (rarity: string) => {
    const r = rarity?.toLowerCase()
    switch (r) {
      case 'legendary': return 'bg-yellow-900/30 border-yellow-700/50'
      case 'exceptional': return 'bg-red-900/30 border-red-700/50'
      case 'rare': return 'bg-purple-900/30 border-purple-700/50'
      case 'special': return 'bg-blue-900/30 border-blue-700/50'
      case 'uncommon': return 'bg-green-900/30 border-green-700/50'
      case 'common': return 'bg-gray-800 border-gray-700'
      default: return 'bg-gray-800 border-gray-700'
    }
  }

  // Конвертируем цвет API в наше качество
  const normalizeRarity = (colorOrRarity: string): string => {
    if (COLOR_TO_RARITY[colorOrRarity]) {
      return COLOR_TO_RARITY[colorOrRarity]
    }
    return colorOrRarity.toLowerCase()
  }

  // Определяем, какие качества реально присутствуют у текущего предмета на аукционе
  const availableQualities = useMemo(() => {
    if (lots.length === 0) return new Set<string>()
    return new Set(lots.map(l => l.itemRarity.toLowerCase()))
  }, [lots])

  const isSingleQualityItem = availableQualities.size === 1

  const categories = [
    { id: 'armor', name: 'Броня' },
    { id: 'weapon', name: 'Оружие' },
    { id: 'artefact', name: 'Артефакты' },
    { id: 'consumable', name: 'Расходники' },
    { id: 'container', name: 'Контейнеры' },
    { id: 'attachment', name: 'Обвесы' },
  ]

  const periodButtons: { id: HistoryPeriod; name: string }[] = [
    { id: 'day', name: '1 день' },
    { id: 'week', name: '1 неделя' },
    { id: 'month', name: '1 месяц' },
  ]

  return (
    <div className="flex justify-center py-6">
      <div className="w-full max-w-5xl px-4">
        <h1 className="text-3xl font-bold mb-6 neon-orange text-center">Аукцион Stalcraft</h1>

        {cacheInfo.lastUpdate && (
          <div className="text-center text-xs text-gray-500 mb-4">
             Данные обновлены: {cacheInfo.lastUpdate}
            {cacheInfo.totalLots && <span className="ml-2">| Всего лотов: {cacheInfo.totalLots.toLocaleString('ru-RU')}</span>}
          </div>
        )}

        <div className="relative max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск предмета по названию..."
            className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
          />

          {showDropdown && searchResults.length > 0 && (
  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto">
    {searchResults.map((item, index) => {
      const normalizedRarity = normalizeRarity(item.rarity || item.color || 'DEFAULT')
      const bgColor = getRarityBgColor(normalizedRarity)
      const textColor = getRarityTextColor(normalizedRarity)
      
      return (
        <button
          key={`${item.id}-${index}`}
          onClick={() => fetchItemLots(item.id)}
          className={`w-full px-4 py-2 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0 flex items-center gap-3 transition ${bgColor}`}
        >
                    <div className="w-8 h-8 flex-shrink-0 bg-gray-900/50 rounded border border-gray-600 overflow-hidden flex items-center justify-center">
                      <img
                        src={`/icons/${item.id}.png`}
                        alt={item.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`font-semibold truncate ${textColor}`}>
                        {item.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded bg-gray-900/50 border border-gray-600 flex-shrink-0 ${textColor}`}>
                        {item.rarityText}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(cat.id)
                  fetchPopularLots(cat.id)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  categoryFilter === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={fetchTopDeals}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
            >
              Топ наваристых лотов
            </button>
          </div>
        </div>

        {selectedItem && !showTopDeals && (
          <div className="text-center mb-4 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => fetchPopularLots(categoryFilter)}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
            >
              ← Назад к списку
            </button>
            {!showHistory && lots.length > 0 && (
              <button
                onClick={() => fetchHistory(selectedItem, historyItemName, 'week', 'all')}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
              >
                История продаж
              </button>
            )}
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
              >
                Закрыть график
              </button>
            )}
          </div>
        )}

        {showTopDeals && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-400">Топ наваристых лотов</h2>
              <button onClick={() => setShowTopDeals(false)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm">
                Закрыть
              </button>
            </div>

            {topDealsLoading ? (
              <div className="text-center py-12 text-gray-400">Анализируем рынок...</div>
            ) : topDeals.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Выгодных лотов не найдено</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topDeals.map((deal, index) => (
                  <div
                    key={`${deal.itemId}-${deal.buyoutPrice}-${index}`}
                    className={`p-3 rounded-lg border-2 ${getRarityColor(deal.itemRarity)} transition hover:border-orange-500/50 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                        <img
                          src={`/icons/${deal.itemId}.png`}
                          alt={deal.itemName}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white truncate">{deal.itemName}</h3>
                          {deal.enhancementText && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white font-bold flex-shrink-0">
                              {deal.enhancementText}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded bg-gray-800 ${getRarityTextColor(deal.itemRarity)}`}>
                          {deal.rarityText}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Покупка:</span>
                        <span className="text-white font-bold">{formatPrice(deal.buyoutPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Средняя цена:</span>
                        <span className="text-blue-400 font-bold">{formatPrice(deal.averagePrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Перепродать за:</span>
                        <span className="text-blue-400 font-bold">{formatPrice(deal.estimatedSellPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Комиссия (5%):</span>
                        <span className="text-red-400">-{formatPrice(deal.commission)}</span>
                      </div>
                      {deal.discountPercent && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Скидка от средней:</span>
                          <span className="text-green-400 font-bold">-{deal.discountPercent}%</span>
                        </div>
                      )}
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-semibold">Прибыль:</span>
                          <span className="text-green-400 font-bold text-base">+{formatPrice(deal.profit)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-400">Рентабельность:</span>
                          <span className="text-green-400 font-bold">+{deal.profitPercent}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchItemLots(deal.itemId)}
                      className="mt-3 w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition"
                    >
                      Смотреть лоты
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showHistory && (
          <div className="mb-8 glass-panel p-5 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-400">
              История продаж: {historyItemName}
            </h2>

            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Показать историю продаж для качества:</div>
              <div className="flex flex-wrap gap-2">
                {qualityOptions.map(q => {
                  const isDisabled = isSingleQualityItem && !availableQualities.has(q.id)
                  
                  return (
                    <button
                      key={q.id}
                      disabled={isDisabled}
                      onClick={() => selectedItem && fetchHistory(selectedItem, historyItemName, historyPeriod, q.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                        historyQuality === q.id
                          ? 'bg-blue-600 text-white'
                          : isDisabled 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className={q.color}>{q.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 mb-4 justify-center">
              {periodButtons.map(period => (
                <button
                  key={period.id}
                  onClick={() => selectedItem && fetchHistory(selectedItem, historyItemName, period.id, historyQuality)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    historyPeriod === period.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {period.name}
                </button>
              ))}
            </div>

            {historyLoading ? (
              <div className="text-center py-12 text-gray-400">Загрузка истории продаж...</div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {historyQuality === 'all' 
                  ? 'Нет данных об истории продаж' 
                  : `Нет продаж этого качества за выбранный период`}
              </div>
            ) : (
              <>
                {historyStats && (
                  <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">
                      Статистика: {historyQuality === 'all' ? 'Все качества' : qualityOptions.find(q => q.id === historyQuality)?.name} 
                      {historyStats.qualityRanges && historyStats.qualityRanges[historyQuality] && (
                        <span className="ml-2 text-gray-500">
                          (диапазон на аукционе: {formatPrice(historyStats.qualityRanges[historyQuality].min)} - {formatPrice(historyStats.qualityRanges[historyQuality].max)})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <div className="text-xs text-gray-400">Последняя цена</div>
                        <div className="text-base font-bold text-white">{formatPrice(historyStats.last)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Минимум</div>
                        <div className="text-base font-bold text-green-400">{formatPrice(historyStats.min)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Максимум</div>
                        <div className="text-base font-bold text-red-400">{formatPrice(historyStats.max)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Средняя</div>
                        <div className="text-base font-bold text-blue-400">{formatPrice(historyStats.avg)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Всего продаж</div>
                        <div className="text-base font-bold text-orange-400">{historyStats.total}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center text-lg py-12 neon-orange">Загрузка лотов...</div>
        ) : lots.length === 0 && !showTopDeals ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {categoryFilter === 'container' || categoryFilter === 'attachment' 
                ? 'В этой категории пока нет активных лотов' 
                : 'Лоты не найдены. Попробуй другую категорию или предмет.'}
            </div>
            {!cacheInfo.ready && (
              <div className="text-orange-400 text-sm">
                ⏳ Кэш ещё не готов. Запустите бота: node scripts/start-bot.js
              </div>
            )}
          </div>
        ) : !showTopDeals ? (
          <>
            <div className="mb-4 text-gray-400 text-center text-sm">
              Показано: {Math.min(visibleLots, lots.length)} из {lots.length} лотов
              {selectedItem && <span className="ml-2 text-orange-400">| {historyItemName}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lots.slice(0, visibleLots).map((lot, index) => {
                const marketPrice = lot.buyoutPrice > 0 ? lot.buyoutPrice : lot.startPrice
                const priceAfterCommission = Math.round(marketPrice * 0.95)
                const estimatedSellPrice = Math.round(priceAfterCommission * 1.10)
                const commission = Math.round(estimatedSellPrice * 0.05)
                const potentialProfit = estimatedSellPrice - marketPrice - commission

                return (
                  <div
                    key={`${lot.itemId}-${lot.endTime}-${index}`}
                    className={`p-3 rounded-lg border-2 ${getRarityColor(lot.itemRarity)} transition hover:border-orange-500/50 overflow-hidden`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                        <img
                          src={`/icons/${lot.itemId}.png`}
                          alt={lot.itemName}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white truncate">{lot.itemName}</h3>
                          {lot.enhancementText && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white font-bold flex-shrink-0">
                              {lot.enhancementText}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">x{lot.amount}</span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-gray-800 ${getRarityTextColor(lot.itemRarity)}`}>
                        {lot.rarityText}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Стартовая цена:</span>
                        <span className="text-white text-xs">{formatPrice(lot.startPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Цена выкупа:</span>
                        <span className="text-green-400 font-bold text-xs">{formatPrice(lot.buyoutPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Осталось:</span>
                        <span className="text-white text-xs">{getTimeLeft(lot.endTime)}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">Потенциальный навар:</div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Покупка:</span>
                          <span className="text-white">{formatPrice(marketPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Продажа:</span>
                          <span className="text-blue-400">{formatPrice(estimatedSellPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Комиссия:</span>
                          <span className="text-red-400">-{formatPrice(commission)}</span>
                        </div>
                        <div className="border-t border-gray-700 pt-1 mt-1 flex justify-between">
                          <span className="text-gray-300 font-semibold">Прибыль:</span>
                          <span className={`font-bold ${potentialProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {potentialProfit > 0 ? '+' : ''}{formatPrice(potentialProfit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchHistory(lot.itemId, lot.itemName, 'week', lot.itemRarity as QualityFilter)}
                      className="mt-2 w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition"
                    >
                      История продаж ({lot.rarityText})
                    </button>
                  </div>
                )
              })}
            </div>

            {visibleLots < lots.length && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setVisibleLots(prev => prev + 30)}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition font-semibold"
                >
                  Загрузить ещё ({lots.length - visibleLots} осталось)
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}