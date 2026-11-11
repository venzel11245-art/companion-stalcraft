import { NextResponse } from 'next/server'
import { getItemsCache } from '@/lib/items-cache'

export async function GET() {
  const items = getItemsCache()
  
  return NextResponse.json({
    totalItems: items.length,
    firstItem: items[0] || null,
    categories: [...new Set(items.map(i => i.category).filter(Boolean))].slice(0, 20)
  })
}