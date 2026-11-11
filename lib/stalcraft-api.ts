// Production API
const API_BASE = 'https://eapi.stalzone.com'
const REGION = 'RU'

const CLIENT_ID = process.env.STALCRAFT_CLIENT_ID || '4714'
const CLIENT_SECRET = process.env.STALCRAFT_CLIENT_SECRET || ''

const QUALITY_MAP: Record<number, { name: string; text: string }> = {
  0: { name: 'common', text: 'Обычное' },
  1: { name: 'uncommon', text: 'Необычное' },
  2: { name: 'special', text: 'Особое' },
  3: { name: 'rare', text: 'Редкое' },
  4: { name: 'exceptional', text: 'Исключительное' },
  5: { name: 'legendary', text: 'Легендарное' },
  // Убрали уровень 6 (unique)
}

export interface StalcraftLot {
  itemId: string
  amount: number
  startPrice: number
  currentPrice?: number
  buyoutPrice: number
  startTime: string
  endTime: string
  additional?: {
    qlt?: number
    it_transf_count?: number
    upgrade_bonus?: number
    spawn_time?: number
    ptn?: number
    stats_random?: number
    bonus_properties?: string[] // <-- ВОТ ОНО! Массив свойств
  }
}

export interface AuctionLot {
  uniqueKey: string
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
  enhancementLevel: number
  enhancementText: string
  unitPrice: number
  bonusProperties?: string[]
}

export class StalcraftAuctionClient {
  private getHeaders(): Record<string, string> {
    return {
      'Accept': 'application/json',
      'Client-Id': CLIENT_ID,
      'Client-Secret': CLIENT_SECRET,
      'User-Agent': 'StalcraftCompanion/1.0',
    }
  }

  async getLots(itemId: string, limit: number = 100): Promise<StalcraftLot[]> {
    const url = `${API_BASE}/${REGION}/auction/${itemId}/lots?limit=${limit}&additional=true`
    console.log(`[API] GET ${url}`)
    
    try {
      const response = await fetch(url, { headers: this.getHeaders() })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[API] Error ${response.status}:`, errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const lots = data.lots || []
      console.log(`[API] Got ${lots.length} lots for ${itemId}`)
      return lots
    } catch (error) {
      console.error(`[API] Failed to fetch ${itemId}:`, error)
      throw error
    }
  }
}

// Helper: Вычисляем заточку по количеству свойств (1 свойство = +5, 3 свойства = +15)
export function getEnhancementFromProperties(bonusProperties?: string[]): number {
  if (!bonusProperties || bonusProperties.length === 0) return 0
  return bonusProperties.length * 5
}

export function getQualityText(qlt?: number): { name: string; text: string } {
  return QUALITY_MAP[qlt ?? 0] || QUALITY_MAP[0]
}

export function getEnhancementText(level: number): string {
  return level > 0 ? `+${level}` : ''
}

export const auctionClient = new StalcraftAuctionClient()