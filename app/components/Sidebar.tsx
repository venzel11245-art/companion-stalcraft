'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const closeMenu = () => setIsOpen(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    closeMenu()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-[100] p-3 bg-gray-800 rounded-lg border-2 border-gray-600 text-white text-2xl shadow-lg"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
          onClick={closeMenu}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-[9999]
          w-64 bg-gray-900 border-r-2 border-gray-700
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col p-4 shadow-xl
        `}
        style={{ zIndex: 9999 }}
      >
        <div className="mb-6 mt-12 md:mt-0">
          <h1 className="text-2xl font-bold text-orange-500 tracking-wide">TradeZon</h1>
          <p className="text-xs text-gray-500 mt-1">Stalcraft Companion</p>
        </div>

        {/* 🔥 БЛОК ПОДДЕРЖКИ И PREMIUM (теперь вместе) */}
        <div className="mb-6 space-y-3">
          <a 
            href="https://www.donationalerts.com/r/hezox1x4" 
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm text-center transition shadow-md"
            onClick={closeMenu}
          >
            💝 Поддержать проект
          </a>
          
          <Link 
            href="/premium" 
            onClick={closeMenu} 
            className="block w-full px-4 py-2.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 font-semibold text-sm text-center transition border border-yellow-600/40 flex items-center justify-center gap-2"
          >
            <span>👑</span> Premium
          </Link>
        </div>

        {/* 🔥 НАВИГАЦИЯ (Сборка удалена) */}
        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/" onClick={closeMenu} className="px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3">
            <span>🏠</span> Главная
          </Link>
          <Link href="/emission" onClick={closeMenu} className="px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3">
            <span>☢️</span> Выброс
          </Link>
          <Link href="/auction" onClick={closeMenu} className="px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3">
            <span>🏪</span> Аукцион
          </Link>
          <Link href="/weapon-calculator" onClick={closeMenu} className="px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3">
            <span>🔫</span> Оружие
          </Link>
          <Link href="/profile" onClick={closeMenu} className="px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3">
            <span>👤</span> Профиль
          </Link>
          <Link href="/lfg" onClick={closeMenu} className="px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-3">
            <span>🤝</span> Поиск клана
          </Link>
        </nav>

        {/* 🔥 ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ */}
        <div className="pt-4 border-t border-gray-800 mt-4">
          {user ? (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.user_metadata?.username || 'Игрок'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Выйти
              </button>
            </div>
          ) : (
            <Link 
              href="/auth" 
              onClick={closeMenu} 
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Войти</span>
            </Link>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">v1.0 • Made with ❤️</p>
        </div>
      </aside>
    </>
  )
}