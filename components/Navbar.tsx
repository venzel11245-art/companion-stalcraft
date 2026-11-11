'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { path: '/', label: 'Главная' },
    { path: '/emission', label: 'Выброс' },
    { path: '/auction', label: 'Аукцион' },
    { path: '/builder', label: 'Сборка' },
    { path: '/weapon-calculator', label: 'Оружие' },
    { path: '/profile', label: 'Профиль' },
  ]

  return (
    <nav className="glass-panel fixed left-0 top-0 h-full w-64 p-6 z-50 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold neon-orange">Stalcraft</h1>
        <p className="text-xs text-gray-500">Companion App</p>
      </div>

      <ul className="space-y-2 flex-1">
        {navItems.map(item => {
          const isActive = pathname === item.path
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block px-4 py-3 rounded-lg transition-all no-underline ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600/20 to-transparent border-l-4 border-orange-500 neon-orange font-bold'
                    : 'hover:bg-white/5 text-gray-400'
                }`}
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}