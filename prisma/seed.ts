import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Очищаем базу данных...')
  
  // Удаляем в правильном порядке (из-за связей)
  await prisma.weaponModule.deleteMany()
  await prisma.weapon.deleteMany()
  await prisma.item.deleteMany()

  console.log('📦 Создаём предметы...')

  // Создаём предметы
  const ak74 = await prisma.item.create({
    data: {
      name: 'AK-74',
      nameRu: 'АК-74',
      type: 'weapon',
      rarity: 'common',
      description: 'Стандартный автомат Калашникова. Надёжное оружие для начинающих сталкеров.',
      stats: JSON.stringify({ damage: 45, accuracy: 70, range: 60, fireRate: 650, recoil: 30 }),
    },
  })

  const vintorez = await prisma.item.create({
    data: {
      name: 'Vintorez',
      nameRu: 'Винторез',
      type: 'weapon',
      rarity: 'rare',
      description: 'Бесшумная снайперская винтовка. Идеальна для скрытных операций.',
      stats: JSON.stringify({ damage: 75, accuracy: 90, range: 85, fireRate: 300, recoil: 20 }),
    },
  })

  await prisma.item.create({
    data: {
      name: 'Exoskeleton',
      nameRu: 'Экзоскелет',
      type: 'armor',
      rarity: 'epic',
      description: 'Бронированный экзоскелет. Значительно увеличивает грузоподъёмность и защиту.',
      stats: JSON.stringify({ defense: 80, weight: 25, stamina: -20 }),
    },
  })

  await prisma.item.create({
    data: {
      name: 'Fireball',
      nameRu: 'Огненный шар',
      type: 'artifact',
      rarity: 'rare',
      description: 'Артефакт, повышающий сопротивление огню. Светится в темноте.',
      stats: JSON.stringify({ fireResist: 50, healthRegen: 5, radiation: 10 }),
    },
  })

  await prisma.item.create({
    data: {
      name: 'Medkit',
      nameRu: 'Аптечка',
      type: 'consumable',
      rarity: 'common',
      description: 'Стандартная аптечка. Восстанавливает 50% здоровья.',
      stats: JSON.stringify({ healthRestore: 50, useTime: 3 }),
    },
  })

  await prisma.item.create({
    data: {
      name: 'Bulb',
      nameRu: 'Лампочка',
      type: 'artifact',
      rarity: 'uncommon',
      description: 'Светящийся артефакт. Используется в крафте более сложных артефактов.',
      stats: JSON.stringify({ radiation: 5, weight: 0.5 }),
    },
  })

  console.log(' Создаём оружие...')

  // Создаём оружие со статами
  await prisma.weapon.create({
    data: {
      itemId: ak74.id,
      damage: 45,
      accuracy: 70,
      range: 60,
      fireRate: 650,
      recoil: 30,
    },
  })

  await prisma.weapon.create({
    data: {
      itemId: vintorez.id,
      damage: 75,
      accuracy: 90,
      range: 85,
      fireRate: 300,
      recoil: 20,
    },
  })

  console.log(' Создаём модули...')

  // Создаём модули для оружия
  await prisma.weaponModule.create({
    data: {
      name: 'Red Dot Sight',
      nameRu: 'Коллиматорный прицел',
      type: 'scope',
      damageMod: 0,
      accuracyMod: 15,
      recoilMod: 0,
    },
  })

  await prisma.weaponModule.create({
    data: {
      name: '4x Scope',
      nameRu: 'Прицел 4x',
      type: 'scope',
      damageMod: 0,
      accuracyMod: 25,
      recoilMod: -5,
    },
  })

  await prisma.weaponModule.create({
    data: {
      name: 'Suppressor',
      nameRu: 'Глушитель',
      type: 'barrel',
      damageMod: -5,
      accuracyMod: 10,
      recoilMod: -10,
    },
  })

  await prisma.weaponModule.create({
    data: {
      name: 'Extended Magazine',
      nameRu: 'Увеличенный магазин',
      type: 'magazine',
      damageMod: 0,
      accuracyMod: 0,
      recoilMod: 5,
    },
  })

  await prisma.weaponModule.create({
    data: {
      name: 'Foregrip',
      nameRu: 'Рукоятка',
      type: 'grip',
      damageMod: 0,
      accuracyMod: 5,
      recoilMod: -15,
    },
  })

  console.log('✅ База данных заполнена!')
  console.log('   - 6 предметов')
  console.log('   - 2 единицы оружия')
  console.log('   - 5 модулей')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })