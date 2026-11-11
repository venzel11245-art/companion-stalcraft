'use client'

import { useState, useEffect } from 'react'

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Проверяем, закрывал ли уже пользователь это уведомление
    const isDismissed = localStorage.getItem('disclaimer_dismissed')
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('disclaimer_dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-900/90 border-b-2 border-yellow-600 text-yellow-100 p-4 shadow-2xl backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 pr-10 relative">
        <div className="text-3xl md:text-4xl">⚠️</div>
        <div className="flex-1 text-sm md:text-base leading-relaxed">
          <p className="font-bold text-yellow-300 mb-1">Важное уведомление:</p>
          <p>
            Данный проект является <span className="underline">неофициальным фанатским инструментом</span> и никак не связан с компанией EXBO Studio или проектом Stalzone. 
            Мы не несем ответственности за возможные неточности в данных, изменения в игре или любые последствия использования этого сайта. 
            Все права на игру Stalcraft и связанные материалы принадлежат их законным владельцам.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 md:static md:ml-4 p-2 hover:bg-yellow-800 rounded-full transition shrink-0"
          title="Закрыть"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}