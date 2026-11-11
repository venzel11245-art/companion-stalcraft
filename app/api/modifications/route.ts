import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const itemsPath = path.join(process.cwd(), 'data', 'items', 'items.json')
    const itemsData: any[] = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

    const modifications = itemsData.filter(i => i.category?.startsWith('attachment/'))

    const modList = modifications.map((m: any) => {
      const color = m.color?.toUpperCase() || ''
      let rarity = 'common'
      const map: Record<string, string> = {
        'DEFAULT': 'common', 'RANK_NEWBIE': 'common', 'RANK_STALKER': 'uncommon',
        'RANK_VETERAN': 'rare', 'RANK_MASTER': 'exceptional', 'RANK_LEGEND': 'legendary',
      }
      rarity = map[color] || 'common'
      
      const stats: any[] = []
      const compatibleWeapons: string[] = []

      m.infoBlocks?.forEach((block: any) => {
        // 1. Парсим статы
        if (block.type === 'list' && block.elements) {
          block.elements.forEach((elem: any) => {
            if (elem.type === 'numeric' || elem.type === 'range') {
              const statName = elem.name?.lines?.ru || ''
              if (statName.includes('Отдача') || statName.includes('Разброс') || statName.includes('Скорость') || statName.includes('Вес') || statName.includes('Эргономика') || statName.includes('Перезарядка') || statName.includes('Размер магазина')) {
                const value = elem.value !== undefined ? elem.value : (elem.min !== undefined ? elem.min : 0)
                stats.push({ name: statName, value: Math.round(value * 10) / 10 })
              }
            }
            
            // 2. Парсим совместимость ("Подходит для")
            if (elem.type === 'item' && elem.name?.key) {
              // Ключ выглядит как "item.wpn.svd.name" -> извлекаем "svd"
              const match = elem.name.key.match(/item\.wpn\.([a-zA-Z0-9_]+)\.name/)
              if (match && match[1]) {
                compatibleWeapons.push(match[1])
              }
            }
          })
        }
      })
      
      return {
        id: m.id,
        name: m.name?.lines?.ru || 'N/A',
        rarity,
        category: m.category,
        stats,
        compatibleWeapons, // Массив ID подходящего оружия
      }
    })

    const rarityRank: Record<string, number> = {
      'common': 1, 'uncommon': 2, 'rare': 3, 'exceptional': 4, 'legendary': 5,
    }
    modList.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0))

    return NextResponse.json({
      total: modList.length,
      modifications: modList,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load modifications' }, { status: 500 })
  }
}