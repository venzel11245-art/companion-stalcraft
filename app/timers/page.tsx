'use client'

import { useEffect, useState } from 'react'

interface EmissionData {
  previousStart: string
  previousEnd: string
  nextPredicted: string
  lastUpdated: string
}

export default function TimersPage() {
  const [emission, setEmission] = useState<EmissionData | null>(null)
  const [now, setNow] = useState(Date.now()) // ← ДОБАВИЛИ: текущее время

  // Обновляем данные с сервера раз в минуту
  useEffect(() => {
    fetchEmission()
    const interval = setInterval(fetchEmission, 60000)
    return () => clearInterval(interval)
  }, [])

  // Обновляем "сейчас" каждую секунду — это заставляет таймер тикать
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchEmission = async () => {
    try {
      const res = await fetch('/api/emission')
      if (res.ok) {
        const data = await res.json()
        setEmission(data)
      }
    } catch (e) {
      console.error('Ошибка загрузки:', e)
    }
  }

  const getTimeLeft = (nextEvent: string) => {
    const diff = new Date(nextEvent).getTime() - now // ← используем now вместо Date.now()
    if (diff <= 0) return '️ ВЫБРОС ИДЁТ!'
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-orange-500">☢️ Таймер выброса</h1>

      {emission ? (
        <div className="bg-gray-800 p-8 rounded-lg border-2 border-red-500 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">️</div>
            <h2 className="text-2xl font-bold mb-2">Следующий выброс</h2>
          </div>
          
          <div className="text-5xl font-mono font-bold text-center py-6 text-red-500">
            {getTimeLeft(emission.nextPredicted)}
          </div>
          
          <div className="text-sm text-gray-400 text-center mb-6">
            до следующего выброса
          </div>

          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Предыдущий выброс начался:</span>
              <span>{new Date(emission.previousStart).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Предыдущий выброс закончился:</span>
              <span>{new Date(emission.previousEnd).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Длительность:</span>
              <span>{Math.round((new Date(emission.previousEnd).getTime() - new Date(emission.previousStart).getTime()) / 1000)} сек</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Данные обновлены:</span>
              <span>{new Date(emission.lastUpdated).toLocaleString('ru-RU')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400">Загрузка данных о выбросе...</div>
      )}
    </div>
  )
}