// lib/enhancement-calculator.ts

type ClassType = 'weapon' | 'combat_armor' | 'combined_armor' | 'science_armor'

// Коэффициенты, выведенные из реальных данных игры
const COEFFS: Record<ClassType, { a: number; b: number; c: number }> = {
  weapon: { a: 0.008897, b: 0.000276, c: 0.00001613 },           // +25.0% на +15
  combat_armor: { a: 0.01458, b: 0.00045, c: 0.00002667 },       // +41.0% на +15
  combined_armor: { a: 0.01573, b: 0.00049, c: 0.00002867 },     // +44.3% на +15
  science_armor: { a: 0.01671, b: 0.000514, c: 0.00003053 }      // +46.9% на +15
}

function getClassType(category: string | undefined): ClassType {
  if (!category) return 'weapon'

  if (category.startsWith('weapon')) return 'weapon'
  if (category === 'armor/combat') return 'combat_armor'
  if (category === 'armor/combined') return 'combined_armor'
  if (category === 'armor/scientist') return 'science_armor'

  // Запасной вариант для неизвестной брони
  if (category.startsWith('armor')) return 'combat_armor'

  return 'weapon'
}

export function getEnhancementMultiplier(level: number, category: string | undefined): number {
  const classType = getClassType(category)
  const { a, b, c } = COEFFS[classType]
  return 1 + a * level + b * Math.pow(level, 2) + c * Math.pow(level, 3)
}

export function calculateEnhancedStat(baseValue: number, level: number, category: string | undefined): number {
  if (!baseValue || level === 0) return baseValue
  const multiplier = getEnhancementMultiplier(level, category)
  return baseValue * multiplier
}