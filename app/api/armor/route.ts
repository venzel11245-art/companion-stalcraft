import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
    const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

    const armors = itemsData.filter(i => i.category?.startsWith('armor/'))

    const uniqueByName = new Map<string, any>()
    armors.forEach(a => {
      const name = a.name?.lines?.ru || 'N/A'
      if (!uniqueByName.has(name)) {
        uniqueByName.set(name, a)
      }
    })

    const armorList = Array.from(uniqueByName.values()).map(a => {
      const color = a.color?.toUpperCase() || ''
      let rarity = 'common'
      const map: Record<string, string> = {
        'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
        'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
      }
      rarity = map[color] || 'common'

      const stats: any[] = []
      a.infoBlocks?.forEach((block: any) => {
        block.elements?.forEach((elem: any) => {
          if (elem.type === 'range' || elem.type === 'numeric') {
            const statName = elem.name?.lines?.ru || ''
            stats.push({
              name: statName,
              value: elem.value,
              min: elem.min,
              max: elem.max,
            })
          }
        })
      })

      return {
        id: a.id,
        name: a.name?.lines?.ru || 'N/A',
        rarity,
        stats,
      }
    })

    // Сортировка: legendary (5) → exceptional (4) → rare (3) → uncommon (2) → common (1)
    const rarityRank: Record<string, number> = {
      'common': 1, 'uncommon': 2, 'rare': 3, 'exceptional': 4, 'legendary': 5,
    }
    armorList.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0))

    return NextResponse.json({
      total: armorList.length,
      armors: armorList,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load armor' }, { status: 500 })
  }
}