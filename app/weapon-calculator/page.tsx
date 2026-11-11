'use client'

import { useEffect, useState } from 'react'

interface Weapon {
  id: string
  localizationId: string // <-- ДОБАВЛЕНО
  name: string
  rarity: string
  stats: { name: string; value: number }[]
}

interface Modification {
  id: string
  name: string
  rarity: string
  category: string
  stats: { name: string; value: number }[]
  compatibleWeapons: string[]
}

const rarityColors: Record<string, string> = {
  'common': 'text-gray-400',
  'uncommon': 'text-green-400',
  'rare': 'text-purple-400',
  'exceptional': 'text-red-400',
  'legendary': 'text-yellow-400',
}

const rarityBorders: Record<string, string> = {
  'common': 'border-gray-500',
  'uncommon': 'border-green-500',
  'rare': 'border-purple-500',
  'exceptional': 'border-red-500',
  'legendary': 'border-yellow-500',
}

const slotToCategory: Record<string, string> = {
  'attachment/collimator_sights': 'attachment/collimator_sights',
  'attachment/barrel': 'attachment/barrel',
  'attachment/mag': 'attachment/mag',
  'attachment/forend': 'attachment/forend',
  'attachment/handgrips': 'attachment/handgrips',
  'attachment/pistol_handle': 'attachment/pistol_handle',
  'attachment/other': 'attachment/other',
  'attachment/accessory': 'attachment/accessory',
}

const slotNames: Record<string, string> = {
  'attachment/collimator_sights': '🔭 Прицел',
  'attachment/barrel': '🔧 Ствол',
  'attachment/mag': '📦 Магазин',
  'attachment/forend': '✋ Цевьё',
  'attachment/handgrips': '🤚 Рукоятка',
  'attachment/pistol_handle': '🔫 Рукоятка пистолета',
  'attachment/other': '🔩 Другое',
  'attachment/accessory': '💍 Аксессуар',
}

const negativeIsGood = ['Разброс', 'Разброс от бедра', 'Вертикальная отдача', 'Горизонтальная отдача', 'Нарастание отдачи', 'Покачивание', 'Перезарядка', 'Тактическая перезарядка', 'Прицеливание', 'Доставание', 'Скорость доставания']

export default function WeaponCalculatorPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [modifications, setModifications] = useState<Modification[]>([])
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
  const [selectedMods, setSelectedMods] = useState<Record<string, Modification | null>>({
    'attachment/collimator_sights': null,
    'attachment/barrel': null,
    'attachment/mag': null,
    'attachment/forend': null,
    'attachment/handgrips': null,
    'attachment/pistol_handle': null,
    'attachment/other': null,
    'attachment/accessory': null,
  })
  const [upgradeLevel, setUpgradeLevel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [weaponSearch, setWeaponSearch] = useState('')
  const [filteredWeapons, setFilteredWeapons] = useState<Weapon[]>([])
  const [modSearch, setModSearch] = useState('')
  const [filteredMods, setFilteredMods] = useState<Modification[]>([])
  const [activeSlot, setActiveSlot] = useState<string | null>(null)
  const [showWeaponDropdown, setShowWeaponDropdown] = useState(false)
  const [showModDropdown, setShowModDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [weaponRes, modRes] = await Promise.all([
        fetch('/api/weapon-calculator'),
        fetch('/api/modifications'),
      ])
      const weaponData = await weaponRes.json()
      const modData = await modRes.json()
      setWeapons(weaponData.weapons || [])
      setFilteredWeapons(weaponData.weapons || [])
      setModifications(modData.modifications || [])
      setFilteredMods(modData.modifications || [])
    } catch (e) {
      console.error('Ошибка загрузки:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleWeaponSearch = (query: string) => {
    setWeaponSearch(query)
    setShowWeaponDropdown(true)
    if (query.length < 2) {
      setFilteredWeapons(weapons)
      return
    }
    const filtered = weapons.filter(w => w.name.toLowerCase().includes(query.toLowerCase()))
    setFilteredWeapons(filtered.slice(0, 30))
  }

  const handleModSearch = (query: string) => {
    setModSearch(query)
    if (!activeSlot || !selectedWeapon) return
    
    const category = slotToCategory[activeSlot]
    let filtered = modifications.filter(m => 
      m.category === category && m.compatibleWeapons.includes(selectedWeapon.localizationId)
    )
    
    if (query.length >= 2) {
      filtered = filtered.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
    }
    setFilteredMods(filtered.slice(0, 50))
  }

  const handleWeaponSelect = (weapon: Weapon) => {
    setSelectedWeapon(weapon)
    setShowWeaponDropdown(false)
    setWeaponSearch('')
    
    // Сбрасываем несовместимые обвесы при смене оружия
    setSelectedMods(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(slot => {
        if (next[slot] && !next[slot]!.compatibleWeapons.includes(weapon.localizationId)) {
          next[slot] = null
        }
      })
      return next
    })
  }

  const handleModSelect = (mod: Modification) => {
    if (activeSlot) {
      setSelectedMods(prev => ({ ...prev, [activeSlot]: mod }))
    }
    setShowModDropdown(false)
    setModSearch('')
    setActiveSlot(null)
  }

  const handleModRemove = (slot: string) => {
    setSelectedMods(prev => ({ ...prev, [slot]: null }))
  }

  const openModSelector = (slot: string) => {
    if (!selectedWeapon) {
      alert('Сначала выбери оружие!')
      return
    }
    setActiveSlot(slot)
    setShowModDropdown(true)
    setModSearch('')
    
    const category = slotToCategory[slot]
    // СРАВНИВАЕМ С localizationId!
    const compatible = modifications.filter(m => 
      m.category === category && m.compatibleWeapons.includes(selectedWeapon.localizationId)
    )
    setFilteredMods(compatible.slice(0, 50))
  }

  const calculateStats = () => {
    const baseStats: Record<string, number> = {}
    
    if (selectedWeapon) {
      selectedWeapon.stats.forEach(stat => {
        baseStats[stat.name] = stat.value
      })
    }

    Object.values(selectedMods).forEach(mod => {
      if (mod) {
        mod.stats.forEach(stat => {
          baseStats[stat.name] = (baseStats[stat.name] || 0) + stat.value
        })
      }
    })

    const upgradeMult = 1 + (upgradeLevel * 0.02)
    const finalStats: Record<string, number> = {}
    Object.entries(baseStats).forEach(([key, value]) => {
      finalStats[key] = Math.round(value * upgradeMult * 10) / 10
    })

    return finalStats
  }

  const finalStats = calculateStats()

  const getStatColor = (name: string, value: number) => {
    const isNegGood = negativeIsGood.some(n => name.includes(n))
    if (isNegGood) return value < 0 ? 'text-green-400' : 'text-red-400'
    return value > 0 ? 'text-green-400' : 'text-red-400'
  }

  const getBarColor = (name: string, value: number) => {
    const isNegGood = negativeIsGood.some(n => name.includes(n))
    if (isNegGood) return value < 0 ? 'bg-green-500' : 'bg-red-500'
    return value > 0 ? 'bg-green-500' : 'bg-red-500'
  }

  if (loading) {
    return <div className="p-8 pb-24 md:pb-8"><div className="text-center text-xl py-12">Загрузка...</div></div>
  }

  return (
    <div className="p-8 pb-24 md:pb-8">
      <h1 className="text-4xl font-bold mb-8 text-orange-500">🔫 Калькулятор оружия</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: Оружие + Обвесы */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">🔫 Выбор оружия</h2>
            
            <div className="relative mb-4">
              <input
                type="text"
                value={weaponSearch}
                onChange={(e) => handleWeaponSearch(e.target.value)}
                onFocus={() => setShowWeaponDropdown(true)}
                placeholder="Поиск оружия..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
              {showWeaponDropdown && filteredWeapons.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                  {filteredWeapons.map((weapon, idx) => (
                    <button
                      key={`${weapon.id}-${idx}`}
                      onClick={() => handleWeaponSelect(weapon)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-800 border-b border-gray-700 last:border-b-0 ${rarityColors[weapon.rarity]}`}
                    >
                      <div className="font-semibold">{weapon.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedWeapon && (
              <div className={`p-3 rounded-lg border-2 ${rarityBorders[selectedWeapon.rarity]}`}>
                <div className="flex justify-between items-center">
                  <div className={`font-semibold ${rarityColors[selectedWeapon.rarity]}`}>{selectedWeapon.name}</div>
                  <button onClick={() => setSelectedWeapon(null)} className="text-red-500 hover:text-red-400">✕</button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="text-xs text-gray-400">Заточка: +{upgradeLevel}</label>
              <div className="flex gap-1 mt-1">
                {[0, 5, 10, 15].map(level => (
                  <button
                    key={level}
                    onClick={() => setUpgradeLevel(level)}
                    className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition ${
                      upgradeLevel === level ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    +{level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">🔧 Обвесы</h2>
            
            <div className="space-y-2">
              {Object.entries(slotNames).map(([slot, name]) => {
                const mod = selectedMods[slot]
                return (
                  <div key={slot} className="p-3 rounded-lg border-2 border-gray-700 bg-gray-900">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-300">{name}</span>
                      {mod && <button onClick={() => handleModRemove(slot)} className="text-red-500 hover:text-red-400 text-xs">✕</button>}
                    </div>
                    
                    {mod ? (
                      <div className={`p-2 rounded border ${rarityBorders[mod.rarity]}`}>
                        <div className={`text-sm font-semibold ${rarityColors[mod.rarity]}`}>{mod.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {mod.stats.map(s => `${s.name}: ${s.value > 0 ? '+' : ''}${s.value}`).join(', ')}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openModSelector(slot)}
                        className="w-full px-3 py-2 bg-gray-800 rounded text-xs text-gray-400 hover:bg-gray-700"
                      >
                        + Добавить обвес
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {showModDropdown && activeSlot && (
              <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{slotNames[activeSlot]}</h3>
                    <button onClick={() => { setShowModDropdown(false); setActiveSlot(null) }} className="text-red-500">✕</button>
                  </div>
                  
                  <input
                    type="text"
                    value={modSearch}
                    onChange={(e) => handleModSearch(e.target.value)}
                    placeholder="Поиск..."
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white mb-4"
                  />

                  <div className="space-y-2">
                    {filteredMods.map((mod, idx) => (
                      <button
                        key={`${mod.id}-${idx}`}
                        onClick={() => handleModSelect(mod)}
                        className={`w-full p-3 rounded-lg border-2 ${rarityBorders[mod.rarity]} bg-gray-900 hover:bg-gray-800 text-left ${rarityColors[mod.rarity]}`}
                      >
                        <div className="font-semibold">{mod.name}</div>
                        <div className="text-xs mt-1 text-gray-400">
                          {mod.stats.map(s => `${s.name}: ${s.value > 0 ? '+' : ''}${s.value}`).join(', ')}
                        </div>
                      </button>
                    ))}
                    {filteredMods.length === 0 && (
                      <div className="text-center text-gray-400 py-4">
                        {selectedWeapon ? 'Нет совместимых обвесов' : 'Сначала выбери оружие'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка: Результат */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-4">📊 Итоговые характеристики</h2>
            
            {selectedWeapon ? (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className={`font-bold mb-1 text-xl ${rarityColors[selectedWeapon.rarity]}`}>{selectedWeapon.name}</h3>
                  <div className="text-sm text-gray-400 mb-4">
                    {Object.values(selectedMods).filter(Boolean).length} обвесов
                    {upgradeLevel > 0 && ` • Заточка +${upgradeLevel}`}
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(finalStats).map(([key, value]) => {
                      const displayValue = Math.round(value * 10) / 10
                      const colorClass = getStatColor(key, value)
                      const barColor = getBarColor(key, value)
                      
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">{key}:</span>
                            <span className={`font-bold ${colorClass}`}>{displayValue}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(Math.abs(displayValue) * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {Object.values(selectedMods).some(Boolean) && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Установленные обвесы:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedMods).map(([slot, mod]) => {
                        if (!mod) return null
                        return (
                          <div key={slot} className={`bg-gray-800 rounded p-2 border ${rarityBorders[mod.rarity]}`}>
                            <div className={`font-semibold text-sm ${rarityColors[mod.rarity]}`}>{mod.name}</div>
                            <div className="text-xs text-gray-400">{slotNames[slot]}</div>
                          </div>
                        )
                      })}
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
    </div>
  )
}