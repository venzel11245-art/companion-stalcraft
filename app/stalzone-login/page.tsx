'use client'

import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  nickname: string
  avatar?: string
  isPremium: boolean
  premiumExpires?: string
}

export default function StalzoneLoginPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, есть ли сохранённый пользователь
    const savedUser = localStorage.getItem('stalcraft_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = () => {
    // Редирект на авторизацию через EXBO
    const clientId = '4714' // ID приложения в EXBO
    const redirectUri = window.location.origin + '/stalzone-callback'
    const authUrl = `https://exbo.ru/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
    window.location.href = authUrl
  }

  const handleLogout = () => {
    localStorage.removeItem('stalcraft_user')
    localStorage.removeItem('stalzone_token')
    setUser(null)
  }

  const handleUpgradeToPremium = () => {
    // Здесь будет редирект на страницу оплаты
    alert('Premium подписка: 299 ₽/месяц\n\nПреимущества:\n• Мгновенное обновление аукциона\n• Умные фильтры для перепродажи\n• Уведомления о выгодных лотах\n• Расширенная статистика')
  }

  if (loading) {
    return (
      <div className="p-8 pb-24 md:pb-8">
        <div className="text-center text-xl py-12">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    // Страница входа
    return (
      <div className="p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 p-12 text-center">
            <div className="text-6xl mb-6">👤</div>
            <h1 className="text-4xl font-bold mb-4">Добро пожаловать!</h1>
            <p className="text-xl text-gray-400 mb-8">
              Войди через Stalzone, чтобы получить доступ ко всем функциям приложения
            </p>

            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition transform hover:scale-105"
            >
              🔐 Войти через Stalzone
            </button>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="text-lg font-bold mb-4">Что ты получишь:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="font-semibold">Аукцион</div>
                  <div className="text-sm text-gray-400">Поиск и история цен</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-2xl mb-2">☢️</div>
                  <div className="font-semibold">Таймер выброса</div>
                  <div className="text-sm text-gray-400">Точное время до выброса</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-2xl mb-2"></div>
                  <div className="font-semibold">Конструктор</div>
                  <div className="text-sm text-gray-400">Сборка артефактов</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🔧</div>
                  <div className="font-semibold">Калькулятор</div>
                  <div className="text-sm text-gray-400">Расчёт урона оружия</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Страница профиля
  return (
    <div className="p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-orange-500">👤 Профиль</h1>

        {/* Карточка пользователя */}
        <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-4xl font-bold">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{user.nickname}</h2>
              <div className="text-gray-400 mt-1">ID: {user.id}</div>
              
              <div className="mt-4">
                {user.isPremium ? (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-bold">
                    ⭐ Premium до {user.premiumExpires}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">
                    🆓 Бесплатный аккаунт
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
            <div className="text-3xl mb-2"></div>
            <div className="text-sm text-gray-400">Просмотрено лотов</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
            <div className="text-3xl mb-2">🔬</div>
            <div className="text-sm text-gray-400">Сохранённых сборок</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
            <div className="text-3xl mb-2"></div>
            <div className="text-sm text-gray-400">Отслеживаемых предметов</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
        </div>

        {/* Premium блок */}
        {!user.isPremium && (
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 rounded-2xl p-8 text-center mb-6">
            <div className="text-5xl mb-4">⭐</div>
            <h2 className="text-3xl font-bold mb-2">Оформи Premium подписку</h2>
            <p className="text-lg mb-6">
              Получи максимум от приложения
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-bold mb-2"> Мгновенное обновление</div>
                <div className="text-sm text-gray-200">Лоты аукциона обновляются без задержек</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-bold mb-2">🎯 Умные фильтры</div>
                <div className="text-sm text-gray-200">Настрой фильтры для поиска выгодных лотов</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-bold mb-2">🔔 Уведомления</div>
                <div className="text-sm text-gray-200">Получай уведомления о выгодных предложениях</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-bold mb-2">📊 Расширенная статистика</div>
                <div className="text-sm text-gray-200">Детальная аналитика цен и трендов</div>
              </div>
            </div>

            <button
              onClick={handleUpgradeToPremium}
              className="bg-white text-orange-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition transform hover:scale-105"
            >
              Оформить за 299 ₽/месяц
            </button>
          </div>
        )}

        {/* Настройки (только для Premium) */}
        {user.isPremium && (
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-6">⚙️ Настройки фильтров</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="font-semibold mb-2">🎯 Фильтр по цене</div>
                <div className="text-sm text-gray-400">Показывать только лоты дешевле рыночной цены на X%</div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="font-semibold mb-2">⭐ Фильтр по редкости</div>
                <div className="text-sm text-gray-400">Уведомления о появлении предметов определённой редкости</div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="font-semibold mb-2"> Уведомления</div>
                <div className="text-sm text-gray-400">Настрой уведомления о выгодных предложениях</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}