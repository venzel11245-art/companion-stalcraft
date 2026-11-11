import { NextResponse } from 'next/server'
import { runBackgroundBot } from '@/lib/background-bot'

// Эндпоинт для ручного запуска обновления (например, из админки)
export async function GET() {
  try {
    // Запускаем в фоне (не ждём завершения)
    runBackgroundBot().catch(err => {
      console.error('[API] Ошибка фонового обновления:', err)
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Фоновое обновление запущено' 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}