'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LFGPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'player_seeking' | 'clan_seeking'>('player_seeking')
  const router = useRouter()

  // Поля игрока (ищу клан)
  const [nickname, setNickname] = useState('')
  const [rank, setRank] = useState('')
  const [faction, setFaction] = useState('')
  const [stats, setStats] = useState('')
  const [about, setAbout] = useState('')
  const [contacts, setContacts] = useState('')

  // Поля клана (ищет игроков)
  const [clanName, setClanName] = useState('')
  const [clanTag, setClanTag] = useState('')
  const [clanTier, setClanTier] = useState('C')
  const [minRank, setMinRank] = useState('')
  const [requiredFaction, setRequiredFaction] = useState('')
  const [requirements, setRequirements] = useState('')
  const [discordLink, setDiscordLink] = useState('')
  const [telegramLink, setTelegramLink] = useState('')

  useEffect(() => { 
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (activeTab === 'player_seeking') {
      // Игрок ищет клан
      const { error } = await supabase.from('player_applications').insert({
        user_id: user.id,
        stalcraft_nickname: nickname,
        rank,
        faction,
        player_stats: stats,
        about,
        contacts,
        status: 'active'
      })

      if (error) {
        alert('Ошибка: ' + error.message)
      } else {
        alert('✅ Заявка создана! Теперь ты можешь подавать заявки в кланы.')
      }
    } else {
      // Клан ищет игроков
      const { error } = await supabase.from('clan_listings').insert({
        user_id: user.id,
        clan_name: clanName,
        clan_tag: clanTag,
        clan_tier: clanTier,
        min_rank: minRank,
        required_faction: requiredFaction,
        requirements,
        contacts: clanName, // Основной контакт - название клана
        discord_link: discordLink,
        telegram_link: telegramLink,
        is_recruiting: true,
        status: 'active'
      })

      if (error) {
        alert('Ошибка: ' + error.message)
      } else {
        alert('✅ Объявление клана создано! Игроки могут подавать заявки.')
      }
    }
  }

  if (!user) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-orange-500">Загрузка...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-500">🤝 Поиск клана и бойцов (LFG)</h1>

      {/* Главная навигация */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('player_seeking')}
          className={`px-4 py-2 rounded-t-lg font-semibold transition ${activeTab === 'player_seeking' ? 'bg-gray-800 text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
        >
          📝 Создать заявку
        </button>
        <button
          onClick={() => setActiveTab('clan_seeking')}
          className={`px-4 py-2 rounded-t-lg font-semibold transition ${activeTab === 'clan_seeking' ? 'bg-gray-800 text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
        >
          🏰 Создать объявление клана
        </button>
        <button className="px-4 py-2 rounded-t-lg font-semibold text-gray-400 hover:text-white hover:bg-gray-900 transition">
          🏰 Список кланов
        </button>
        <button className="px-4 py-2 rounded-t-lg font-semibold text-gray-400 hover:text-white hover:bg-gray-900 transition">
          🎒 Список игроков
        </button>
        <button className="px-4 py-2 rounded-t-lg font-semibold text-gray-400 hover:text-white hover:bg-gray-900 transition">
          📋 Мои заявки
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {activeTab === 'player_seeking' ? (
              // 🔥 ФОРМА ИГРОКА (ищет клан)
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Никнейм в игре *</label>
                    <input 
                      type="text" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none" 
                      placeholder="Например: Сталкер_77"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ранг</label>
                    <select 
                      value={rank} 
                      onChange={(e) => setRank(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Выберите ранг</option>
                      <option value="Новичок">Новичок</option>
                      <option value="Опытный">Опытный</option>
                      <option value="Ветеран">Ветеран</option>
                      <option value="Мастер">Мастер</option>
                      <option value="Легенда">Легенда</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Фракция</label>
                  <select 
                    value={faction} 
                    onChange={(e) => setFaction(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Выберите фракцию</option>
                    <option value="Заря">Заря</option>
                    <option value="Долг">Долг</option>
                    <option value="Наёмники">Наёмники</option>
                    <option value="Завет">Завет</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Основное оружие</label>
                    <input 
                      type="text" 
                      placeholder="Например: Руна-А, ПКП Печенег, АШ-12"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Броня</label>
                    <input 
                      type="text" 
                      placeholder="Например: Центурион, Кожак, Экзоскелет"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ваши статы (из калькулятора)</label>
                  <textarea 
                    value={stats} 
                    onChange={(e) => setStats(e.target.value)} 
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    placeholder={`Пример заполнения:

📊 Основные статы:
• Приведённое здоровье: 347
• Скорость передвижения: 95%
• Выносливость: +56%
• Общая стойкость: 20%
• Пулестойкость: 247

💡 Используйте калькулятор на Stalzone Wiki или других сайтах`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">О себе</label>
                  <textarea 
                    value={about} 
                    onChange={(e) => setAbout(e.target.value)} 
                    rows={3} 
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    placeholder="Расскажите о своём опыте, что ищете в клане, часы игры и т.д."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Контакты *</label>
                  <input 
                    type="text" 
                    value={contacts} 
                    onChange={(e) => setContacts(e.target.value)} 
                    placeholder="Telegram: @username или Discord: username#1234"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none" 
                    required 
                  />
                </div>
              </>
            ) : (
              // 🔥 ФОРМА КЛАНА (ищет игроков)
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Название клана *</label>
                    <input 
                      type="text" 
                      value={clanName} 
                      onChange={(e) => setClanName(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none" 
                      placeholder="Например: Стальные Волки"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Тег клана</label>
                    <input 
                      type="text" 
                      value={clanTag} 
                      onChange={(e) => setClanTag(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none" 
                      placeholder="[SW]"
                      maxLength={10} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ранг клана</label>
                  <select 
                    value={clanTier} 
                    onChange={(e) => setClanTier(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="E">🟤 Ранг E (Новички)</option>
                    <option value="D">🟢 Ранг D</option>
                    <option value="C"> Ранг C</option>
                    <option value="B">🟣 Ранг B</option>
                    <option value="A"> Ранг A</option>
                    <option value="S">👑 Ранг S (Элита)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Минимальный ранг игрока</label>
                    <select 
                      value={minRank} 
                      onChange={(e) => setMinRank(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Любой</option>
                      <option value="Новичок">Новичок</option>
                      <option value="Опытный">Опытный</option>
                      <option value="Ветеран">Ветеран</option>
                      <option value="Мастер">Мастер</option>
                      <option value="Легенда">Легенда</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Требуемая фракция</label>
                    <select 
                      value={requiredFaction} 
                      onChange={(e) => setRequiredFaction(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Любая</option>
                      <option value="Заря">Заря</option>
                      <option value="Долг">Долг</option>
                      <option value="Наёмники">Наёмники</option>
                      <option value="Завет">Завет</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Требования к игрокам</label>
                  <textarea 
                    value={requirements} 
                    onChange={(e) => setRequirements(e.target.value)} 
                    rows={3} 
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    placeholder="Онлайн от 3 часов в день, возраст 18+, наличие микрофона, минимальные статы и т.д."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Discord сервер</label>
                    <input 
                      type="url" 
                      value={discordLink} 
                      onChange={(e) => setDiscordLink(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none" 
                      placeholder="https://discord.gg/..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telegram канал/чат</label>
                    <input 
                      type="url" 
                      value={telegramLink} 
                      onChange={(e) => setTelegramLink(e.target.value)} 
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none" 
                      placeholder="https://t.me/..." 
                    />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg font-bold transition shadow-lg"
            >
              {activeTab === 'player_seeking' ? '🚀 Опубликовать заявку' : '🏰 Создать объявление клана'}
            </button>
          </form>
        </div>

        {/* Правая колонка - подсказки */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit sticky top-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"> Полезная информация</h2>
          
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-orange-400 mb-2">📊 Где посчитать статы?</h3>
              <p className="text-gray-400 mb-2">Используйте калькуляторы:</p>
              <ul className="space-y-1 text-gray-500">
                <li>• <a href="https://stalzone.wiki" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Stalzone Wiki ↗</a></li>
                <li>• <a href="https://sctools.tech" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">SCTools ↗</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-orange-400 mb-2">📝 Что указать в статах?</h3>
              <ul className="space-y-1 text-gray-500">
                <li>• Приведённое здоровье</li>
                <li>• Скорость передвижения</li>
                <li>• Выносливость</li>
                <li>• Пулестойкость</li>
                <li>• Общая стойкость</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-orange-400 mb-2"> Советы</h3>
              <ul className="space-y-1 text-gray-500">
                <li>• Укажите актуальные контакты</li>
                <li>• Будьте честны в описании</li>
                <li>• Добавьте информацию о часовом поясе</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}