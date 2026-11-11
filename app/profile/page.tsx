export default function ProfilePage() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-full max-w-5xl px-4">
        <h1 className="text-3xl font-bold mb-6 neon-orange text-center">Профиль</h1>
        
        <div className="glass-panel rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold mb-4">Профиль игрока</h2>
          <p className="text-gray-400 mb-6">
            Здесь будет информация о твоем персонаже, статистика и настройки Premium-подписки.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Статус подписки</div>
              <div className="text-xl font-bold text-orange-400">Free</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Активных фильтров</div>
              <div className="text-xl font-bold text-green-400">0</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Уведомлений получено</div>
              <div className="text-xl font-bold text-blue-400">0</div>
            </div>
          </div>
          
          <button className="mt-8 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition">
            Оформить Premium подписку
          </button>
        </div>
      </div>
    </div>
  )
}