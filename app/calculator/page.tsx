'use client'

import { useEffect, useState } from 'react'

interface Weapon {
  id: string
  name: string
  category: string
  stats: {
    damage: number
    accuracy: number
    recoil: number
  }
}

interface Modification {
  id: string
  name: string
  type: 'scope' | 'barrel' | 'magazine' | 'grip'
  stats: {
    damage?: number
    accuracy?: number
    recoil?: number
  }
}

export default function CalculatorPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
  const [selectedMods, setSelectedMods] = useState<Modification[]>([])
  const [upgradeLevel, setUpgradeLevel] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeapons()
  }, [])

  const fetchWeapons = async () => {
    try {
      const res = await fetch('/api/weapons')
      const data = await res.json()
      // API возвращает { weapons: [...] }, берём массив
      setWeapons(Array.isArray(data.weapons) ? data.weapons : [])
    } catch (e) {
      console.error('Ошибка загрузки оружия:', e)
      setWeapons([])
    } finally {
      setLoading(false)
    }
  }

  const modifications: Modification[] = [
    {
      id: 'collimator',
      name: 'Коллиматорный прицел',
      type: 'scope',
      stats: { damage: 0, accuracy: 15, recoil: 0 },
    },
    {
      id: 'scope-4x',
      name: 'Прицел 4x',
      type: 'scope',
      stats: { damage: 0, accuracy: 25, recoil: -5 },
    },
    {
      id: 'suppressor',
      name: 'Глушитель',
      type: 'barrel',
      stats: { damage: -5, accuracy: 10, recoil: -10 },
    },
    {
      id: 'extended-mag',
      name: 'Увеличенный магазин',
      type: 'magazine',
      stats: { damage: 0, accuracy: 0, recoil: 5 },
    },
    {
      id: 'grip',
      name: 'Рукоятка',
      type: 'grip',
      stats: { damage: 0, accuracy: 5, recoil: -15 },
    },
  ]

  const handleWeaponSelect = (weaponId: string) => {
    const weapon = weapons.find(w => w.id === weaponId)
    setSelectedWeapon(weapon || null)
  }

  const handleModToggle = (mod: Modification) => {
    const isSelected = selectedMods.find(m => m.id === mod.id)
    if (isSelected) {
      setSelectedMods(selectedMods.filter(m => m.id !== mod.id))
    } else {
      const sameType = selectedMods.find(m => m.type === mod.type)
      if (sameType) {
        setSelectedMods(selectedMods.map(m => m.type === mod.type ? mod : m))
      } else {
        setSelectedMods([...selectedMods, mod])
      }
    }
  }

  const calculateStats = () => {
    if (!selectedWeapon) return { damage: 0, accuracy: 0, recoil: 0 }
    
    let damage = selectedWeapon.stats.damage || 0
    let accuracy = selectedWeapon.stats.accuracy || 0
    let recoil = selectedWeapon.stats.recoil || 0
    
    selectedMods.forEach(mod => {
      damage += mod.stats.damage || 0
      accuracy += mod.stats.accuracy || 0
      recoil += mod.stats.recoil || 0
    })
    
    const upgradeBonus = upgradeLevel * 0.02
    damage = damage * (1 + upgradeBonus)
    accuracy = accuracy * (1 + upgradeBonus)
    recoil = recoil * (1 - upgradeBonus * 0.5)
    
    return { damage, accuracy, recoil }
  }

  const finalStats = calculateStats()

  return (
    <div className="p-8 pb-24 md:pb-8">
      <h1 className="text-4xl font-bold mb-8 text-orange-500">🔧 Калькулятор оружия</h1>

      {loading ? (
        <div className="text-center text-xl py-12">Загрузка оружия...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-4"> Выбор оружия</h2>
              
              <select
                value={selectedWeapon?.id || ''}
                onChange={(e) => handleWeaponSelect(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white mb-4"
              >
                <option value="">-- Выбери оружие --</option>
                {weapons.map(weapon => (
                  <option key={weapon.id} value={weapon.id}>
                    {weapon.name}
                  </option>
                ))}
              </select>

              {selectedWeapon && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="font-bold mb-2">{selectedWeapon.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Урон:</span>
                      <span className="text-white">{selectedWeapon.stats.damage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Точность:</span>
                      <span className="text-white">{selectedWeapon.stats.accuracy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Отдача:</span>
                      <span className="text-white">{selectedWeapon.stats.recoil}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-4">🔧 Модификации</h2>
              
              <div className="space-y-2 mb-6">
                {modifications.map(mod => {
                  const isSelected = selectedMods.find(m => m.id === mod.id)
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleModToggle(mod)}
                      className={`w-full p-3 rounded-lg border-2 transition text-left ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{mod.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{mod.type.toUpperCase()}</div>
                      <div className="text-xs mt-2 space-x-2">
                        {(mod.stats.damage || 0) !== 0 && (
                          <span className={(mod.stats.damage || 0) > 0 ? 'text-green-400' : 'text-red-400'}>
                            Урон: {(mod.stats.damage || 0) > 0 ? '+' : ''}{mod.stats.damage}
                          </span>
                        )}
                        {(mod.stats.accuracy || 0) !== 0 && (
                          <span className={(mod.stats.accuracy || 0) > 0 ? 'text-green-400' : 'text-red-400'}>
                            Точность: {(mod.stats.accuracy || 0) > 0 ? '+' : ''}{mod.stats.accuracy}
                          </span>
                        )}
                        {(mod.stats.recoil || 0) !== 0 && (
                          <span className={(mod.stats.recoil || 0) < 0 ? 'text-green-400' : 'text-red-400'}>
                            Отдача: {(mod.stats.recoil || 0) > 0 ? '+' : ''}{mod.stats.recoil}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-bold mb-4">⚡ Заточка</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={upgradeLevel}
                    onChange={(e) => setUpgradeLevel(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="text-2xl font-bold text-orange-500">+{upgradeLevel}</div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Бонус: +{(upgradeLevel * 2)}% к характеристикам
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-4"> Результат</h2>
              
              {selectedWeapon ? (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="font-bold mb-3 text-lg">{selectedWeapon.name}</h3>
                    {upgradeLevel > 0 && (
                      <div className="text-sm text-orange-400 mb-2">Заточка: +{upgradeLevel}</div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Урон:</span>
                          <span className="font-bold text-white">{finalStats.damage.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((finalStats.damage / 100) * 100, 100)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Точность:</span>
                          <span className="font-bold text-white">{finalStats.accuracy.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((finalStats.accuracy / 100) * 100, 100)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Отдача:</span>
                          <span className="font-bold text-white">{finalStats.recoil.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((finalStats.recoil / 100) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedMods.length > 0 && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Установленные модификации:</h4>
                      <div className="space-y-1">
                        {selectedMods.map(mod => (
                          <div key={mod.id} className="text-sm text-gray-300">• {mod.name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">Выбери оружие для расчёта</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}