import { auctionClient } from './stalcraft-api'

interface CachedData {
  data: {
    lots: any[]
    total: number
    fetchedAt: string
  }
  timestamp: number
  ttl: number
}

class AuctionCache {
  private cache = new Map<string, CachedData>()
  
  private readonly PREMIUM_TTL = 60 * 1000
  private readonly FREE_TTL = 2 * 60 * 1000

  async getLots(itemId: string, isPremium: boolean = false): Promise<CachedData['data']> {
    const cacheKey = `lots:${itemId}`
    const cached = this.cache.get(cacheKey)
    const ttl = isPremium ? this.PREMIUM_TTL : this.FREE_TTL

    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[CACHE HIT] ${cacheKey}`)
      return cached.data
    }

    console.log(`[CACHE MISS] ${cacheKey}`)
    
    try {
      const lots: any[] = await Promise.race([
        auctionClient.getLots(itemId, isPremium ? 100 : 50),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ])
      
      const cacheData: CachedData = {
        data: { 
          lots, 
          total: lots.length, 
          fetchedAt: new Date().toISOString() 
        },
        timestamp: Date.now(),
        ttl,
      }

      this.cache.set(cacheKey, cacheData)
      return cacheData.data
    } catch (error) {
      console.error('[API Error]', error)
      
      if (cached) {
        console.log('[Fallback] Returning stale cache')
        return cached.data
      }
      
      return { lots: [], total: 0, fetchedAt: new Date().toISOString() }
    }
  }

  clear() {
    this.cache.clear()
  }
}

export const auctionCache = new AuctionCache()