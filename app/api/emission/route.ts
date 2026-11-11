import { NextResponse } from 'next/server'

export async function GET() {
  // Выброс каждые 4 часа: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
  const now = new Date()
  const currentHour = now.getHours()
  
  // Находим следующий час выброса
  const emissionHours = [0, 4, 8, 12, 16, 20]
  let nextEmissionHour = emissionHours.find(h => h > currentHour)
  
  if (nextEmissionHour === undefined) {
    // Если все часы прошли, следующий выброс завтра в 00:00
    nextEmissionHour = 0
  }
  
  const nextEmission = new Date(now)
  nextEmission.setHours(nextEmissionHour, 0, 0, 0)
  
  if (nextEmissionHour === 0) {
    nextEmission.setDate(nextEmission.getDate() + 1)
  }
  
  return NextResponse.json({
    nextEmission: nextEmission.toISOString(),
    message: 'Выброс происходит каждые 4 часа',
  })
}