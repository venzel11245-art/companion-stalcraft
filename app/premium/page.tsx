'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Filter {
  id: string
  name: string
  filters: any
  is_active: boolean
}

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filter[]>([])
  
  const [newFilterName, setNewFilterName] = useState('')
  const [minProfit, setMinProfit] = useState(100000)
  const [minProfitPercent, setMinProfitPercent] = useState(10)
  const [selectedQualities, setSelectedQualities] = useState<string[]>(['rare', 'exceptional', 'legendary'])
  const [targetItems, setTargetItems] = useState('')

  const [premiumDeals, setPremiumDeals] = useState<any[]>([])
  const [loadingDeals, setLoadingDeals] = useState(false)
  const [dealsMessage, setDealsMessage] = useState('')

  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    setUser(session.user)
    loadFilters(session.user.id)
    setLoading(false)
  }

  const loadFilters = async (userId: string) => {
    const { data, error } = await supabase
      .from('premium_filters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFilters(data)
    }
  }

  const toggleQuality = (quality: string) => {
    if (selectedQualities.includes(quality)) {
      setSelectedQualities(selectedQualities.filter(q => q !== quality))
    } else {
      setSelectedQualities([...selectedQualities, quality])
    }
  }

  const saveFilter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newFilterName) return

    const filterData = {
      minProfit,
      minProfitPercent,
      qualities: selectedQualities,
      items: targetItems.split(',').map(s => s.trim()).filter(s => s.length > 0),
    }

    const { error } = await supabase.from('premium_filters').insert({
      user_id: user.id,
      name: newFilterName,
      filters: filterData,
      is_active: true,
    })

    if (error) {
      alert('Ошибка сохранения: ' + error.message)
    } else {
      setNewFilterName('')
      setTargetItems('')
      loadFilters(user.id)
      alert('Фильтр успешно сохранен! 🎯')
    }
  }

  const deleteFilter = async (id: string) => {
    if (!user) return
    await supabase.from('premium_filters').delete().eq('id', id)
    loadFilters(user.id)
  }

  const loadPremiumDeals = async () => {
    if (!user) return
    
    setLoadingDeals(true)
    setDealsMessage('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setDealsMessage('Сессия истекла. Войдите заново.')
        return
      }

      const res = await fetch('/api/premium-deals', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await res.json()
      
      if (data.error) {
        setDealsMessage(data.error)
      } else if (data.message) {
        setDealsMessage(data.message)
      } else {
        setPremiumDeals(data.deals || [])
        if (data.deals.length === 0) {
          setDealsMessage('По вашим фильтрам ничего не найдено. Попробуйте изменить параметры.')
        }
      }
    } catch (error) {
      setDealsMessage('Ошибка загрузки лотов')
    } finally {
      setLoadingDeals(false)
    }
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (как в auction/page.tsx) ===
  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-RU') + ' ₽'
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

  const getTimeLeft = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now()
    if (diff <= 0) return 'Завершён'
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}ч ${minutes}м`
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-orange-500">Загрузка...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 max-w-6xl mx-auto">
      {/* ЗАГОЛОВОК */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
          👑 Premium Доступ
        </h1>
        <p className="text-gray-400">
          Привет, <span className="text-white font-semibold">{user.email}</span>! 
          Настраивай умные фильтры и получай только самые наваристые лоты.
        </p>
      </div>

      {/* ПРЕИМУЩЕСТВА */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-yellow-600/30 rounded-xl p-5">
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="font-bold text-yellow-400 mb-1">Мгновенные уведомления</h3>
          <p className="text-sm text-gray-400">Получай алерты в Telegram, как только появляется выгодный лот.</p>
        </div>
        <div className="bg-gray-900 border border-yellow-600/30 rounded-xl p-5">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-bold text-yellow-400 mb-1">Умные фильтры</h3>
          <p className="text-sm text-gray-400">Настраивай поиск по предметам, качеству и минимальной прибыли.</p>
        </div>
        <div className="bg-gray-900 border border-yellow-600/30 rounded-xl p-5">
          <div className="text-2xl mb-2">🏆</div>
          <h3 className="font-bold text-yellow-400 mb-1">Эксклюзивные бейджи</h3>
          <p className="text-sm text-gray-400">Получи уникальный бейдж "Основатель" в свой профиль.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ФОРМА СОЗДАНИЯ ФИЛЬТРА */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>⚙️</span> Создать новый фильтр
          </h2>
          <form onSubmit={saveFilter} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Название фильтра</label>
              <input
                type="text"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="Например: Артефакты для перепродажи"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Мин. прибыль (₽)</label>
                <input
                  type="number"
                  value={minProfit}
                  onChange={(e) => setMinProfit(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Мин. рентабельность (%)</label>
                <input
                  type="number"
                  value={minProfitPercent}
                  onChange={(e) => setMinProfitPercent(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Качество</label>
              <div className="flex flex-wrap gap-2">
                {['common', 'uncommon', 'special', 'rare', 'exceptional', 'legendary'].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleQuality(q)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      selectedQualities.includes(q)
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {q === 'common' ? 'Обычное' : 
                     q === 'uncommon' ? 'Необычное' : 
                     q === 'special' ? 'Особое' : 
                     q === 'rare' ? 'Редкое' : 
                     q === 'exceptional' ? 'Исключительное' : 'Легендарное'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Конкретные предметы (через запятую)</label>
              <input
                type="text"
                value={targetItems}
                onChange={(e) => setTargetItems(e.target.value)}
                placeholder="флегма, аномальная пыль, нерпа"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Оставь пустым, чтобы искать все предметы.</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg font-bold transition shadow-lg"
            >
              💾 Сохранить фильтр
            </button>
          </form>
        </div>

        {/* СПИСОК ФИЛЬТРОВ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Мои активные фильтры
          </h2>
          
          {filters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              У тебя пока нет сохраненных фильтров. Создай первый!
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter) => (
                <div key={filter.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-1">{filter.name}</h3>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>💰 Прибыль от: <span className="text-green-400">{filter.filters.minProfit?.toLocaleString()} ₽</span></p>
                      <p>📈 Рентабельность от: <span className="text-blue-400">{filter.filters.minProfitPercent || 10}%</span></p>
                      <p>⭐ Качества: <span className="text-orange-400">{filter.filters.qualities?.join(', ')}</span></p>
                      {filter.filters.items?.length > 0 && (
                        <p>🎯 Предметы: <span className="text-blue-400">{filter.filters.items.join(', ')}</span></p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFilter(filter.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg transition flex-shrink-0"
                    title="Удалить фильтр"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* РЕЗУЛЬТАТЫ — СТИЛЬ ТОП-ЛОТОВ */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🎯</span> Лоты по вашим фильтрам
            {premiumDeals.length > 0 && (
              <span className="text-sm text-gray-400 font-normal">
                ({premiumDeals.length} найдено)
              </span>
            )}
          </h2>
          <button
            onClick={loadPremiumDeals}
            disabled={loadingDeals}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 rounded-lg text-sm font-semibold transition"
          >
            {loadingDeals ? '⏳ Загрузка...' : '🔄 Обновить'}
          </button>
        </div>

        {premiumDeals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {dealsMessage || 'Нажмите "Обновить", чтобы найти лоты по вашим фильтрам'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {premiumDeals.map((deal: any, index: number) => (
              <div
                key={`${deal.uniqueKey}-${index}`}
                className={`p-3 rounded-lg border-2 ${getRarityColor(deal.itemRarity)} transition hover:border-orange-500/50 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden`}
              >
                {/* Шапка карточки */}
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

                {/* Цены */}
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
                  
                  {/* Прибыль */}
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

                  {/* Доп. инфо */}
                  <div className="border-t border-gray-700 pt-2 mt-2 text-xs text-gray-500 flex justify-between">
                    <span>⏱️ {getTimeLeft(deal.endTime)}</span>
                    <span>🔖 {deal.filterName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}