import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuctionCache } from '@/lib/auction-bot'

function calculateMedian(prices: number[]): number {
  if (prices.length === 0) return 0
  if (prices.length === 1) return prices[0]
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Сервер не настроен' }, { status: 500 })
    }

    // 1. Авторизация
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 })
    }

    // 2. Фильтры пользователя
    const { data: filters, error: filtersError } = await supabaseAdmin
      .from('premium_filters')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (filtersError || !filters || filters.length === 0) {
      return NextResponse.json({ 
        deals: [], 
        message: 'У вас нет активных фильтров. Создайте первый на странице Premium!' 
      })
    }

    // 3. Кэш аукциона
    const cache = getAuctionCache()
    if (!cache) {
      return NextResponse.json({ error: 'Кэш ещё не готов' }, { status: 503 })
    }

    const allLots: any[] = Object.values(cache.data).flat()
    const now = Date.now()

    const activeLots = allLots.filter(lot => {
      const endTime = new Date(lot.endTime).getTime()
      return endTime > now && lot.buyoutPrice && lot.buyoutPrice > 0
    })

    // 4. Считаем медиану по каждому качеству (как в top-deals)
    const pricesByQuality: Record<string, number[]> = {}
    for (const lot of activeLots) {
      const q = lot.itemRarity || 'common'
      if (!pricesByQuality[q]) pricesByQuality[q] = []
      if (lot.buyoutPrice > 0) pricesByQuality[q].push(lot.buyoutPrice)
    }

    const medianByQuality: Record<string, number> = {}
    for (const [q, prices] of Object.entries(pricesByQuality)) {
      medianByQuality[q] = calculateMedian(prices)
    }

    // 5. Применяем фильтры
    const matchedDeals: any[] = []

    for (const filter of filters) {
      const filterConfig = filter.filters as any
      
      const minProfit = filterConfig.minProfit || 0
      const minProfitPercent = filterConfig.minProfitPercent || 10
      const qualities: string[] = filterConfig.qualities || []
      const targetItems: string[] = (filterConfig.items || []).map((i: string) => i.toLowerCase())
      const maxDiscount = filterConfig.maxDiscount || 100 // Максимальная скидка (чтобы отсечь подозрительно дешёвые)

      for (const lot of activeLots) {
        // Фильтр по качеству
        if (qualities.length > 0 && !qualities.includes(lot.itemRarity)) {
          continue
        }

        // Фильтр по предметам
        if (targetItems.length > 0) {
          const lotName = lot.itemName.toLowerCase()
          const matchesItem = targetItems.some((item: string) => lotName.includes(item))
          if (!matchesItem) continue
        }

        // Берём медиану для этого качества
        const medianPrice = medianByQuality[lot.itemRarity] || lot.buyoutPrice
        if (medianPrice <= 0) continue

        // Расчёт как в top-deals
        const buyPrice = lot.buyoutPrice
        const estimatedSellPrice = Math.round(medianPrice * 0.95)
        const commission = Math.round(medianPrice * 0.05)
        const profit = estimatedSellPrice - buyPrice
        const profitPercent = buyPrice > 0 ? (profit / buyPrice) * 100 : 0
        const discountPercent = (1 - buyPrice / medianPrice) * 100

        // Отсекаем лоты дороже медианы (нет смысла)
        if (buyPrice >= medianPrice) continue
        
        // Отсекаем подозрительно дешёвые (скидка больше maxDiscount%)
        if (discountPercent > maxDiscount) continue

        // Фильтр по минимальной прибыли
        if (profit < minProfit) continue
        if (profitPercent < minProfitPercent) continue

        matchedDeals.push({
          ...lot,
          averagePrice: Math.round(medianPrice),
          estimatedSellPrice,
          commission,
          profit: Math.round(profit),
          profitPercent: Math.round(profitPercent * 100) / 100,
          discountPercent: Math.round(discountPercent),
          filterName: filter.name,
        })
      }
    }

    // Убираем дубликаты
    const uniqueDeals = matchedDeals.reduce((acc: any[], deal) => {
      if (!acc.find(d => d.uniqueKey === deal.uniqueKey)) {
        acc.push(deal)
      }
      return acc
    }, [])

    // Сортировка: сначала по прибыли, потом по рентабельности
    uniqueDeals.sort((a, b) => {
      if (b.profit !== a.profit) return b.profit - a.profit
      return b.profitPercent - a.profitPercent
    })

    return NextResponse.json({
      deals: uniqueDeals.slice(0, 100),
      total: uniqueDeals.length,
      filtersApplied: filters.length,
    })

  } catch (error) {
    console.error('Premium deals error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}