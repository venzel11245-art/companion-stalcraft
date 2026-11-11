'use client'

import { useEffect } from 'react'

export default function ErudaConsole() {
  useEffect(() => {
    // Проверяем что это клиент и экран маленький
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Проверяем что eruda ещё не загружена
      if (!(window as any).eruda) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/eruda'
        script.async = true
        script.onload = () => {
          console.log('Eruda loaded')
          setTimeout(() => {
            (window as any).eruda?.init()
          }, 500)
        }
        document.body.appendChild(script)
      }
    }
  }, [])

  return null
}