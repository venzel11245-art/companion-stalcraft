import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const rarity = searchParams.get('rarity')

  const where: any = {}
  if (type) where.type = type
  if (rarity) where.rarity = rarity

  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(items)
}