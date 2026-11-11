import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'all'

  try {
    const statsPath = path.join(process.cwd(), 'data', 'artifactStats.json')
    
    if (!fs.existsSync(statsPath)) {
      return NextResponse.json({ error: 'Artifact stats not found' }, { status: 404 })
    }

    const artifactStats: any[] = JSON.parse(fs.readFileSync(statsPath, 'utf-8'))

    // Фильтруем по категории
    let filtered = artifactStats
    if (category !== 'all') {
      filtered = artifactStats.filter(a => a.category === category)
    }

    // Группируем по названию (берём первый вариант)
    const uniqueByName = new Map<string, any>()
    filtered.forEach(art => {
      if (!uniqueByName.has(art.name)) {
        uniqueByName.set(art.name, art)
      }
    })

    return NextResponse.json({
      total: uniqueByName.size,
      artifacts: Array.from(uniqueByName.values()),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load artifacts' }, { status: 500 })
  }
}