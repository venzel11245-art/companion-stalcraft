import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
    const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

    const containers = itemsData.filter(i => i.category === 'containers' || i.category === 'backpacks')

    const containerList = containers.map(c => {
      const color = c.color?.toUpperCase() || ''
      let rarity = 'common'
      const map: Record<string, string> = {
        'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
        'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
      }
      rarity = map[color] || 'common'

      const stats: any[] = []
      let slots = 6
      c.infoBlocks?.forEach((block: any) => {
        block.elements?.forEach((elem: any) => {
          if (elem.type === 'range' || elem.type === 'numeric') {
            const statName = elem.name?.lines?.ru || ''
            stats.push({
              name: statName,
              value: elem.value,
              min: elem.min,
              max: elem.max,
            })
            if (statName.toLowerCase().includes('вместим')) {
              slots = Math.round(elem.value || 6)
            }
          }
        })
      })

      return {
        id: c.id,
        name: c.name?.lines?.ru || 'N/A',
        category: c.category,
        slots,
        rarity,
        stats,
      }
    })

    // Сортировка: legendary → exceptional → rare → uncommon → common
    const rarityRank: Record<string, number> = {
      'common': 1, 'uncommon': 2, 'rare': 3, 'exceptional': 4, 'legendary': 5,
    }
    containerList.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0))

    return NextResponse.json({
      total: containerList.length,
      containers: containerList,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load containers' }, { status: 500 })
  }
}