import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const weaponsPath = path.join(process.cwd(), 'data', 'weapons.json')
    
    if (!fs.existsSync(weaponsPath)) {
      return NextResponse.json({ error: 'Weapons data not found' }, { status: 404 })
    }
    
    const weapons = JSON.parse(fs.readFileSync(weaponsPath, 'utf-8'))
    
    // Форматируем данные
    const formattedWeapons = weapons.map((weapon: any) => {
      const name = weapon.name?.lines?.ru || weapon.name?.ru || 'N/A'
      const category = weapon.category || ''
      
      // Извлекаем базовые характеристики
      let damage = 0
      let accuracy = 0
      let recoil = 0
      
      if (weapon.infoBlocks) {
        weapon.infoBlocks.forEach((block: any) => {
          if (block.type === 'list' && block.elements) {
            block.elements.forEach((elem: any) => {
              if (elem.type === 'key-value') {
                const key = elem.key?.key || ''
                const value = elem.value?.lines?.ru || elem.value?.text || '0'
                const numValue = parseFloat(value) || 0
                
                if (key.includes('damage')) damage = numValue
                if (key.includes('accuracy')) accuracy = numValue
                if (key.includes('recoil')) recoil = numValue
              }
            })
          }
        })
      }
      
      return {
        id: weapon.id,
        name,
        category,
        stats: {
          damage,
          accuracy,
          recoil,
        },
      }
    })
    
    return NextResponse.json({
      total: formattedWeapons.length,
      weapons: formattedWeapons,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load weapons' }, { status: 500 })
  }
}