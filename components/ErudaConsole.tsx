'use client'

import { useEffect } from 'react'

export default function ErudaConsole() {
  useEffect(() => {
    // Только для разработки и только если экран маленький (телефон)
    if (window.innerWidth < 768) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/eruda'
      script.onload = () => {
        ;(window as any).eruda?.init()
      }
      document.head.appendChild(script)
    }
  }, [])

  return null
}