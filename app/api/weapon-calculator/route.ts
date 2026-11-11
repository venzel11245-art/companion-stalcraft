import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
    const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

    const weapons = itemsData.filter(i => i.category?.startsWith('weapon/'))

    const uniqueByName = new Map<string, any>()
    weapons.forEach(w => {
      const name = w.name?.lines?.ru || 'N/A'
      if (!uniqueByName.has(name)) {
        uniqueByName.set(name, w)
      }
    })

    const weaponList = Array.from(uniqueByName.values()).map((w: any) => {
      const color = w.color?.toUpperCase() || ''
      let rarity = 'common'
      const map: Record<string, string> = {
        'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
        'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
      }
      rarity = map[color] || 'common'
      
      // ИЗВЛЕКАЕМ ID ИЗ КЛЮЧА ЛОКАЛИЗАЦИИ (например, "item.wpn.9a91.name" -> "9a91")
      let localizationId = w.id 
      if (w.name?.key) {
        const match = w.name.key.match(/item\.wpn\.([a-zA-Z0-9_]+)\.name/)
        if (match && match[1]) {
          localizationId = match[1]
        }
      }

      const stats: any[] = []
      const damageBlock = w.infoBlocks?.find((b: any) => b.type === 'damage')
      if (damageBlock) {
        stats.push(
          { name: 'Начальный урон', value: damageBlock.startDamage },
          { name: 'Урон на дистанции', value: damageBlock.endDamage },
          { name: 'Дистанция падения урона', value: damageBlock.damageDecreaseStart },
          { name: 'Макс. дистанция', value: damageBlock.maxDistance }
        )
      }

      w.infoBlocks?.forEach((block: any) => {
        if (block.type === 'list' && block.elements) {
          block.elements.forEach((elem: any) => {
            if (elem.type === 'numeric' || elem.type === 'range') {
              const statName = elem.name?.lines?.ru || ''
              if (statName.includes('Отдача') || statName.includes('Разброс') || statName.includes('Скорость') || statName.includes('Вес') || statName.includes('Перезарядка') || statName.includes('Эргономика')) {
                const value = elem.value !== undefined ? elem.value : (elem.min !== undefined ? elem.min : 0)
                stats.push({ name: statName, value: Math.round(value * 10) / 10 })
              }
            }
          })
        }
      })
      
      return {
        id: w.id,
        localizationId, // <-- ЭТО КЛЮЧЕВОЕ ПОЛЕ ДЛЯ СРАВНЕНИЯ
        name: w.name?.lines?.ru || 'N/A',
        rarity,
        stats,
      }
    })

    const rarityRank: Record<string, number> = {
      'common': 1, 'uncommon': 2, 'rare': 3, 'exceptional': 4, 'legendary': 5,
    }
    weaponList.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0))

    return NextResponse.json({
      total: weaponList.length,
      weapons: weaponList,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load weapons' }, { status: 500 })
  }
}