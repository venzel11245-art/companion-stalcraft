'use client'

import { useState, useEffect, useRef } from 'react'

export default function EmissionPage() {
  const [timeLeft, setTimeLeft] = useState('')
  const [nextEmission, setNextEmission] = useState<Date | null>(null)
  const nextEmissionRef = useRef<Date | null>(null)

  useEffect(() => {
    const calculateNextEmission = () => {
      const now = new Date()
      const hours = now.getHours()
      const nextEmissionHour = Math.ceil((hours + 1) / 4) * 4
      
      const next = new Date(now)
      next.setHours(nextEmissionHour, 0, 0, 0)
      
      if (next.getTime() - now.getTime() < 0) {
        next.setDate(next.getDate() + 1)
      }
      
      nextEmissionRef.current = next
      setNextEmission(next)
    }

    calculateNextEmission()

    const timer = setInterval(() => {
      if (nextEmissionRef.current) {
        const now = new Date()
        const diff = nextEmissionRef.current.getTime() - now.getTime()
        
        if (diff <= 0) {
          calculateNextEmission()
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}ч ${minutes.toString().padStart(2, '0')}м ${seconds.toString().padStart(2, '0')}с`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold neon-orange mb-8">Таймер выброса</h1>

      <div className="glass-panel rounded-2xl p-12 text-center mb-8">
        <div className="text-6xl mb-4 neon-orange">☢</div>
        <h2 className="text-2xl font-bold mb-4">До следующего выброса:</h2>
        <div className="text-5xl font-bold neon-green mb-4 font-mono">{timeLeft}</div>
        {nextEmission && (
          <p className="text-gray-400">
            Следующий выброс: {nextEmission.toLocaleString('ru-RU')}
          </p>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-4 neon-orange">Информация о выбросе</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">▸</span>
            <span>Выброс происходит каждые 4 часа</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">▸</span>
            <span>Длится примерно 30 минут</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">▸</span>
            <span>Во время выброса появляются редкие артефакты</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-500 font-bold">▸</span>
            <span>Будьте осторожны — повышенная радиация!</span>
          </li>
        </ul>
      </div>
    </div>
  )
}