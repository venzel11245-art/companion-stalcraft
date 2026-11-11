'use client'

import { useEffect, useState } from 'react'

interface Item {
  id: number
  name: string
  nameRu: string
  type: string
  rarity: string
  description: string
  stats: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
  }, [])

  const filteredItems = items.filter((item) => {
    if (!filter) return true
    return item.type === filter
  })

  const rarityColors: Record<string, string> = {
    common: 'border-gray-500',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500',
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-orange-500">📦 Каталог предметов</h1>

      {/* Фильтры */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded ${!filter ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('weapon')}
          className={`px-4 py-2 rounded ${filter === 'weapon' ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
           Оружие
        </button>
        <button
          onClick={() => setFilter('armor')}
          className={`px-4 py-2 rounded ${filter === 'armor' ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
          🛡️ Броня
        </button>
        <button
          onClick={() => setFilter('artifact')}
          className={`px-4 py-2 rounded ${filter === 'artifact' ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
           Артефакты
        </button>
        <button
          onClick={() => setFilter('consumable')}
          className={`px-4 py-2 rounded ${filter === 'consumable' ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
          💊 Расходники
        </button>
      </div>

      {/* Карточки предметов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-gray-800 p-6 rounded-lg border-2 ${rarityColors[item.rarity] || 'border-gray-500'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{item.nameRu}</h3>
              <span className="text-sm text-gray-400 uppercase">{item.rarity}</span>
            </div>
            <p className="text-gray-400 mb-4">{item.description}</p>
            <div className="text-sm text-gray-500">
              Тип: {item.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}