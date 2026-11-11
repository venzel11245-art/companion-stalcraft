'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="p-8 pb-24 md:pb-8">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Добро пожаловать в <span className="text-orange-500">TradeZon</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Твой надёжный помощник в Зоне. Аукцион, выбросы, крафт — всё в одном месте.
        </p>
      </div>

      {/* Карточки разделов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Таймер выброса */}
        <Link href="/emission" className="group">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6 hover:border-orange-500 transition">
            <div className="text-4xl mb-3">☢️</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition">Таймер выброса</h2>
            <p className="text-gray-400 text-sm mb-4">
              Точное время до следующего выброса. Не пропусти артефакты!
            </p>
            <span className="text-orange-500 text-sm font-semibold">Открыть →</span>
          </div>
        </Link>

        {/* Аукцион */}
        <Link href="/auction" className="group">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6 hover:border-orange-500 transition">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition">Аукцион</h2>
            <p className="text-gray-400 text-sm mb-4">
              Поиск по 9999 предметам. История цен. Фильтры по категориям.
            </p>
            <span className="text-orange-500 text-sm font-semibold">Открыть →</span>
          </div>
        </Link>

        {/* Конструктор сборки */}
        <Link href="/builder" className="group">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6 hover:border-orange-500 transition">
            <div className="text-4xl mb-3">🔬</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition">Конструктор сборки</h2>
            <p className="text-gray-400 text-sm mb-4">
              Собери идеальную сборку артефактов для своего контейнера.
            </p>
            <span className="text-orange-500 text-sm font-semibold">Открыть →</span>
          </div>
        </Link>

        {/* Калькулятор оружия */}
        <Link href="/weapon-calculator" className="group">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6 hover:border-orange-500 transition">
            <div className="text-4xl mb-3">🔧</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition">Калькулятор оружия</h2>
            <p className="text-gray-400 text-sm mb-4">
              Рассчитай урон с учётом заточки и модификаций.
            </p>
            <span className="text-orange-500 text-sm font-semibold">Открыть →</span>
          </div>
        </Link>
      </div>

      {/* Premium баннер */}
      <div className="bg-gradient-to-r from-orange-600 to-purple-600 rounded-lg p-8 text-center">
        <div className="text-4xl mb-3">⭐</div>
        <h2 className="text-2xl font-bold mb-2">Premium подписка</h2>
        <p className="text-white/90 mb-6">
          Получи доступ к умным фильтрам, мгновенным уведомлениям и отсутствию задержек
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="px-4 py-2 bg-white/20 rounded-lg text-sm">⚡ Без задержек</span>
          <span className="px-4 py-2 bg-white/20 rounded-lg text-sm">🎯 Умные фильтры</span>
          <span className="px-4 py-2 bg-white/20 rounded-lg text-sm">🔔 Уведомления</span>
          <span className="px-4 py-2 bg-white/20 rounded-lg text-sm">📊 Расширенная статистика</span>
        </div>
      </div>
    </div>
  )
}