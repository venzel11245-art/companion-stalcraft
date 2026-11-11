'use client'

import { useEffect, useState } from 'react'
import { calculateEnhancedStat } from '@/lib/enhancement-calculator'

interface Artifact {
  id: string
  name: string
  category: string
  weight: number
  stats: {
    key: string
    name: string
    min: number
    max: number
    avg?: number
    value?: number
  }[]
}

interface Container {
  id: string
  name: string
  rarity: string
  slots: number
  stats: { name: string; value?: number; min?: number; max?: number }[]
}

interface Armor {
  id: string
  name: string
  rarity: string
  category?: string
  stats: { name: string; value?: number; min?: number; max?: number }[]
}

interface SelectedArtifact {
  artifact: Artifact
  quality: number
  upgradeLevel: number
  percentage: number
}

const qualityNames: Record<number, string> = {
  1: 'Обычное', 2: 'Необычное', 3: 'Особое',
  4: 'Редкое', 5: 'Исключительное', 6: 'Легендарное',
}

const qualityColors: Record<number, string> = {
  1: 'border-gray-500 bg-gray-500/10',
  2: 'border-green-500 bg-green-500/10',
  3: 'border-blue-500 bg-blue-500/10',
  4: 'border-purple-500 bg-purple-500/10',
  5: 'border-red-500 bg-red-500/10',
  6: 'border-yellow-500 bg-yellow-500/10',
}

const rarityColors: Record<string, string> = {
  'common': 'text-gray-400', 'uncommon': 'text-green-400',
  'rare': 'text-purple-400', 'exceptional': 'text-red-400', 'legendary': 'text-yellow-400',
}

const rarityBorders: Record<string, string> = {
  'common': 'border-gray-500', 'uncommon': 'border-green-500',
  'rare': 'border-purple-500', 'exceptional': 'border-red-500', 'legendary': 'border-yellow-500',
}

const ENHANCEMENT_LEVELS = [0, 5, 10, 15]
const PERCENTAGE_LEVELS = [100, 115, 130, 145, 160, 175]

function getQualityFromPercentage(percentage: number): number {
  if (percentage >= 161) return 6
  if (percentage >= 146) return 5
  if (percentage >= 131) return 4
  if (percentage >= 116) return 3
  if (percentage >= 100) return 2
  return 1
}

// Список "накоплений" — статов, где ПЛЮС = плохо, МИНУС = хорошо
const ACCUMULATION_STATS = [
  'biological_accumulation', 'Биологическое заражение',
  'bleeding_accumulation', 'Кровотечение',
  'radiation_accumulation', 'Радиация',
  'psycho_accumulation', 'Пси-излучение',
  'thermal_accumulation', 'Термическое воздействие',
]

export default function BuilderPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [armors, setArmors] = useState<Armor[]>([])
  
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [selectedArmor, setSelectedArmor] = useState<Armor | null>(null)
  const [armorEnhancement, setArmorEnhancement] = useState<number>(0)
  
  const [selectedArtifacts, setSelectedArtifacts] = useState<(SelectedArtifact | null)[]>(Array(9).fill(null))
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([])
  const [armorSearch, setArmorSearch] = useState('')
  const [filteredArmors, setFilteredArmors] = useState<Armor[]>([])
  const [showContainerDropdown, setShowContainerDropdown] = useState(false)
  const [showArmorDropdown, setShowArmorDropdown] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [artRes, contRes, armorRes] = await Promise.all([
        fetch('/api/artifacts'),
        fetch('/api/containers'),
        fetch('/api/armor'),
      ])
      const artData = await artRes.json()
      const contData = await contRes.json()
      const armorData = await armorRes.json()
      setArtifacts(artData.artifacts || [])
      setFilteredArtifacts(artData.artifacts || [])
      setContainers(contData.containers || [])
      setArmors(armorData.armors || [])
      setFilteredArmors(armorData.armors || [])
    } catch (e) {
      console.error('Ошибка загрузки:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleArtifactSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setFilteredArtifacts(artifacts)
      return
    }
    const filtered = artifacts.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    setFilteredArtifacts(filtered.slice(0, 50))
  }

  const handleArmorSearch = (query: string) => {
    setArmorSearch(query)
    setShowArmorDropdown(true)
    if (query.length < 2) {
      setFilteredArmors(armors.slice(0, 20))
      return
    }
    const filtered = armors.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    setFilteredArmors(filtered.slice(0, 20))
  }

  const handleArtifactSelect = (artifact: Artifact) => {
    let targetIndex = activeSlotIndex
    if (targetIndex === null || targetIndex === undefined) {
      targetIndex = selectedArtifacts.findIndex(a => a === null)
    }
    
    if (targetIndex !== -1 && targetIndex !== undefined) {
      const newArtifacts = [...selectedArtifacts]
      newArtifacts[targetIndex] = { artifact, quality: 2, upgradeLevel: 0, percentage: 100 }
      setSelectedArtifacts(newArtifacts)
      setActiveSlotIndex(targetIndex)
    }
    setSearchQuery('')
    setFilteredArtifacts(artifacts)
  }

  const handleArtifactRemove = (index: number) => {
    const newArtifacts = [...selectedArtifacts]
    newArtifacts[index] = null
    setSelectedArtifacts(newArtifacts)
    if (activeSlotIndex === index) setActiveSlotIndex(null)
  }

  const handlePercentageChange = (index: number, percentage: number) => {
    const newArtifacts = [...selectedArtifacts]
    if (newArtifacts[index]) {
      newArtifacts[index]!.percentage = percentage
      newArtifacts[index]!.quality = getQualityFromPercentage(percentage)
    }
    setSelectedArtifacts(newArtifacts)
  }

  const handleUpgradeChange = (index: number, level: number) => {
    const newArtifacts = [...selectedArtifacts]
    if (newArtifacts[index]) newArtifacts[index]!.upgradeLevel = level
    setSelectedArtifacts(newArtifacts)
  }

  // Функция определения: хороший стат или плохой
  const isBadStat = (name: string, value: number): boolean => {
    const lowerName = name.toLowerCase()
    const isAccumulation = ACCUMULATION_STATS.some(keyword => 
      lowerName.includes(keyword.toLowerCase())
    )
    
    // Для накоплений: ПЛЮС = плохо, МИНУС = хорошо
    if (isAccumulation) {
      return value > 0
    }
    
    // Для всего остального: МИНУС = плохо, ПЛЮС = хорошо
    return value < 0
  }

  const calculateTotalStats = () => {
    const totals: Record<string, number> = {}

    // 1. Броня
    if (selectedArmor) {
      selectedArmor.stats.forEach(stat => {
        let value = stat.value || 0
        if (stat.name === 'Пулестойкость' || stat.name === 'Пулезащита') {
          value = calculateEnhancedStat(value, armorEnhancement, selectedArmor.category)
        }
        totals[stat.name] = (totals[stat.name] || 0) + value
      })
    }

    // 2. Контейнер (кроме "Вес")
    if (selectedContainer) {
      selectedContainer.stats.forEach(stat => {
        if (stat.name === 'Вес') return
        const value = stat.value || 0
        totals[stat.name] = (totals[stat.name] || 0) + value
      })
      totals['Вместимость'] = selectedContainer.slots
    }

    // 3. Артефакты с ПРАВИЛЬНОЙ формулой
    const containerEff = selectedContainer?.stats?.find(s => s.name === 'Эффективность')?.value || 100
    const containerProt = selectedContainer?.stats?.find(s => s.name === 'Внутренняя защита')?.value || 0

    // Универсальные множители заточки
    const enhancementMultipliers: Record<number, number> = {
      0: 1.00,
      5: 1.10,
      10: 1.20,
      15: 1.74
    }

    selectedArtifacts.forEach(selected => {
      if (!selected) return
      const { artifact, quality, upgradeLevel, percentage } = selected
      
      // Качество как прямой множитель
      const qualityMult = percentage / 100
      
      // Множитель заточки из таблицы
      const upgradeMult = enhancementMultipliers[upgradeLevel] || 1.0
      
      // Эффективность контейнера
      const effMult = containerEff / 100
      
      // Защита контейнера (снижает негативные статы)
      const protMult = (100 - containerProt) / 100

      artifact.stats.forEach(stat => {
        const baseValue = stat.avg ?? stat.value ?? 0
        
        // Определяем, негативный ли стат (для применения защиты контейнера)
        const isAccumulation = ACCUMULATION_STATS.some(keyword => 
          stat.name.toLowerCase().includes(keyword.toLowerCase()) ||
          stat.key.toLowerCase().includes(keyword.toLowerCase())
        )

        let finalValue = baseValue * qualityMult * upgradeMult * effMult

        // Защита контейнера снижает накопления
        if (isAccumulation) {
          finalValue = finalValue * protMult
        }

        totals[stat.name] = (totals[stat.name] || 0) + finalValue
      })
    })

    return totals
  }

  const totalStats = calculateTotalStats()
  const slotCount = selectedContainer?.slots || 6

  const containerEff = selectedContainer?.stats?.find(s => s.name === 'Эффективность')?.value || 100
  const containerProt = selectedContainer?.stats?.find(s => s.name === 'Внутренняя защита')?.value || 0

  if (loading) {
    return <div className="p-8 pb-24 md:pb-8"><div className="text-center text-xl py-12 text-orange-500">Загрузка данных...</div></div>
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-orange-500 text-center">🔬 Конструктор сборки</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-4 space-y-6">
          {/* Контейнер */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">📦 Контейнер</h2>
            <div className="relative">
              <button
                onClick={() => setShowContainerDropdown(!showContainerDropdown)}
                className={`w-full px-4 py-2.5 bg-gray-900 border-2 ${selectedContainer ? rarityBorders[selectedContainer.rarity] : 'border-gray-700'} rounded-lg text-white text-left flex justify-between items-center hover:border-gray-500 transition`}
              >
                {selectedContainer ? (
                  <div className="flex items-center gap-2">
                    <span className={rarityColors[selectedContainer.rarity]}>{selectedContainer.name}</span>
                    <span className="text-xs text-gray-400">({selectedContainer.slots} слотов)</span>
                  </div>
                ) : <span className="text-gray-500">-- Выбери контейнер --</span>}
                <span className="text-gray-400 text-xs">{showContainerDropdown ? '▲' : '▼'}</span>
              </button>

              {showContainerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                  <button onClick={() => { setSelectedContainer(null); setShowContainerDropdown(false) }} className="w-full px-4 py-2 text-left text-gray-500 hover:bg-gray-800 border-b border-gray-700 text-sm">-- Выбери контейнер --</button>
                  {containers.map(container => (
                    <button key={container.id} onClick={() => { setSelectedContainer(container); setShowContainerDropdown(false) }} className={`w-full px-4 py-2 text-left hover:bg-gray-800 border-b border-gray-700 last:border-b-0 text-sm ${rarityColors[container.rarity]}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{container.name}</span>
                        <span className="text-xs text-gray-400">{container.slots} сл.</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedContainer && (
              <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Эффективность:</span>
                  <span className="text-green-400 font-bold">{containerEff}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Внутренняя защита:</span>
                  <span className="text-blue-400 font-bold">{containerProt}%</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Артефакты ({slotCount} слотов)</h3>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: slotCount }).map((_, index) => {
                  const selected = selectedArtifacts[index]
                  const isActive = activeSlotIndex === index

                  return (
                    <div
                      key={index}
                      onClick={() => setActiveSlotIndex(index)}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 text-center relative group cursor-pointer transition-all ${
                        selected 
                          ? `${qualityColors[selected.quality]} ${isActive ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-gray-800' : ''}` 
                          : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                      }`}
                    >
                      {selected ? (
                        <>
                          <div className="text-xs font-bold leading-tight mb-1 line-clamp-2">{selected.artifact.name}</div>
                          <div className="text-[10px] text-gray-400 mb-1">{selected.percentage}% | +{selected.upgradeLevel}</div>
                          
                          <div className={`absolute inset-0 bg-gray-900/95 rounded-lg flex flex-col items-center justify-center gap-1 p-1 transition-opacity z-10 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <div className="flex flex-wrap justify-center gap-1">
                              {PERCENTAGE_LEVELS.map(pct => (
                                <button key={pct} onClick={(e) => { e.stopPropagation(); handlePercentageChange(index, pct) }} className={`text-[10px] px-1 py-0.5 rounded ${selected.percentage === pct ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{pct}%</button>
                              ))}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {ENHANCEMENT_LEVELS.map(lvl => (
                                <button key={lvl} onClick={(e) => { e.stopPropagation(); handleUpgradeChange(index, lvl) }} className={`text-[10px] px-1.5 py-0.5 rounded ${selected.upgradeLevel === lvl ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>+{lvl}</button>
                              ))}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleArtifactRemove(index) }} className="text-[10px] text-red-400 hover:text-red-300 mt-1 font-semibold">Удалить</button>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 text-xs">
                          <div className="text-2xl mb-1 opacity-50">+</div>
                          Слот {index + 1}
                          {isActive && <div className="text-orange-400 mt-1 text-[10px] font-bold">Активен</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Броня */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">🛡️ Броня</h2>
            <div className="relative mb-3">
              <input type="text" value={armorSearch} onChange={(e) => handleArmorSearch(e.target.value)} onFocus={() => setShowArmorDropdown(true)} placeholder="Поиск брони..." className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none text-sm" />
              {showArmorDropdown && filteredArmors.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                  {filteredArmors.map((armor, idx) => (
                    <button key={`${armor.id}-${idx}`} onClick={() => { setSelectedArmor(armor); setShowArmorDropdown(false); setArmorSearch(''); setArmorEnhancement(0) }} className={`w-full px-4 py-2 text-left hover:bg-gray-800 border-b border-gray-700 last:border-b-0 text-sm ${rarityColors[armor.rarity]}`}>
                      <div className="font-semibold">{armor.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedArmor && (
              <div className={`p-3 rounded-lg border-2 ${rarityBorders[selectedArmor.rarity]} bg-gray-900/50`}>
                <div className="flex justify-between items-center mb-3">
                  <div className={`font-semibold text-sm ${rarityColors[selectedArmor.rarity]}`}>{selectedArmor.name}</div>
                  <button onClick={() => { setSelectedArmor(null); setArmorEnhancement(0) }} className="text-red-500 hover:text-red-400 text-xs">✕</button>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Заточка:</label>
                  <div className="flex gap-1 flex-wrap">
                    {ENHANCEMENT_LEVELS.map(level => (
                      <button key={level} onClick={() => setArmorEnhancement(level)} className={`flex-1 min-w-[40px] px-2 py-1.5 rounded text-xs font-semibold transition ${armorEnhancement === level ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>+{level}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА */}
        <div className="lg:col-span-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 sticky top-4">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">🔍 Поиск артефакта</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleArtifactSearch(e.target.value)}
              onFocus={() => {
                if (activeSlotIndex === null) {
                  const emptyIndex = selectedArtifacts.findIndex(a => a === null)
                  if (emptyIndex !== -1) setActiveSlotIndex(emptyIndex)
                }
              }}
              placeholder={activeSlotIndex !== null ? `Добавить в слот ${activeSlotIndex + 1}...` : "Выберите слот или введите название..."}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white mb-4 focus:border-orange-500 focus:outline-none text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredArtifacts.map(artifact => (
                <button
                  key={artifact.id}
                  onClick={() => handleArtifactSelect(artifact)}
                  className="p-3 rounded-lg border border-gray-700 bg-gray-900 hover:border-orange-500 hover:bg-gray-800 transition text-left"
                >
                  <div className="font-semibold text-sm text-orange-400">{artifact.name}</div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {artifact.stats.slice(0, 3).map(s => `${s.name}: ${s.avg}`).join(', ')}
                  </div>
                </button>
              ))}
              {filteredArtifacts.length === 0 && <div className="col-span-2 text-center text-gray-500 py-8 text-sm">Ничего не найдено</div>}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Итоги */}
        <div className="lg:col-span-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 sticky top-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">📊 Итоговые статы</h2>
            
            {Object.keys(totalStats).length > 0 ? (
              <div className="space-y-1.5 mb-6 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(totalStats).map(([key, value]) => {
                  const displayValue = Math.round(value * 100) / 100
                  
                  // Правильная логика цвета
                  const bad = isBadStat(key, value)
                  const colorClass = bad ? 'text-red-400' : 'text-green-400'
                  
                  return (
                    <div key={key} className="flex justify-between items-center p-2.5 bg-gray-900 rounded border border-gray-700/50">
                      <span className="text-sm text-gray-300">{key}:</span>
                      <span className={`font-bold text-sm ${colorClass}`}>
                        {value > 0 ? '+' : ''}{displayValue}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12 mb-6 text-sm">Добавь предметы для расчёта</div>
            )}

            <div className="pt-6 border-t-2 border-orange-500">
              <button
                onClick={() => {
                  const buildData = { container: selectedContainer, armor: selectedArmor, armorEnhancement, artifacts: selectedArtifacts, totalStats, timestamp: Date.now() }
                  localStorage.setItem('stalcraft_active_build', JSON.stringify(buildData))
                  alert('✅ Сборка сохранена! Перейди на страницу LFG (/lfg).')
                }}
                disabled={Object.keys(totalStats).length === 0}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <span>📋</span> <span>Перенести сборку в LFG</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}