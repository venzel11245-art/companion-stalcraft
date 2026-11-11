// ЗАГРУЗКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Проверка ключей
console.log('\n=== ПРОВЕРКА API КЛЮЧЕЙ ===');
console.log('[DEBUG] Ключ 1 (4714):', process.env.STALCRAFT_CLIENT_SECRET ? '✓ Загружен' : '✗ ПУСТОЙ');
console.log('[DEBUG] Ключ 2 (4816):', process.env.STALCRAFT_CLIENT_SECRET_2 ? '✓ Загружен' : '✗ ПУСТОЙ');
console.log('[DEBUG] Ключ 3 (5030):', process.env.STALCRAFT_CLIENT_SECRET_3 ? '✓ Загружен' : '✗ ПУСТОЙ');
console.log('=========================\n');

if (!process.env.STALCRAFT_CLIENT_SECRET) {
  console.error('❌ ОШИБКА: STALCRAFT_CLIENT_SECRET не найден в .env.local!');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

// === КОНФИГ ===
const API_KEYS = [
  { id: '4714', secret: process.env.STALCRAFT_CLIENT_SECRET || '' },
  { id: '4816', secret: process.env.STALCRAFT_CLIENT_SECRET_2 || '' },
  { id: '5030', secret: process.env.STALCRAFT_CLIENT_SECRET_3 || '' },
]

let currentKeyIndex = 0

function getNextKey() {
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

const API_BASE = 'https://eapi.stalzone.com';
const REGION = 'RU';
const BATCH_SIZE = 40; // Увеличили с 10 до 40 для скорости
const REQUEST_DELAY = 100; // Задержка 100мс между пачками (безопасно с 3 ключами)
const CACHE_PATH = path.join(__dirname, '..', 'data', 'cache', 'auction-cache.json');

const QUALITY_MAP = {
  0: { name: 'common', text: 'Обычное' },
  1: { name: 'uncommon', text: 'Необычное' },
  2: { name: 'special', text: 'Особое' },
  3: { name: 'rare', text: 'Редкое' },
  4: { name: 'exceptional', text: 'Исключительное' },
  5: { name: 'legendary', text: 'Легендарное' },
};

const COLOR_TO_QLT = {
  'DEFAULT': 0,
  'RANK_NEWBIE': 1,
  'RANK_STALKER': 2,
  'RANK_VETERAN': 3,
  'RANK_MASTER': 4,
  'RANK_LEGEND': 5,
};

function getQualityText(qlt) {
  return QUALITY_MAP[qlt] || QUALITY_MAP[0];
}

function parseColorToQlt(color) {
  return COLOR_TO_QLT[color] ?? 0;
}

function getItemQuality(lot, item) {
  if (lot.additional && lot.additional.qlt !== undefined && lot.additional.qlt !== null) {
    return getQualityText(lot.additional.qlt);
  }
  const color = item.color || 'DEFAULT';
  return getQualityText(parseColorToQlt(color));
}

function getEnhancementFromProperties(bonusProperties) {
  if (!bonusProperties || bonusProperties.length === 0) return 0;
  return bonusProperties.length * 5;
}

function getEnhancementText(level) {
  return level > 0 ? `+${level}` : '';
}

let debugLogged = false;

async function getLots(itemId, limit = 20) {
  const key = getNextKey();
  const url = `${API_BASE}/${REGION}/auction/${itemId}/lots?limit=${limit}&additional=true`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Client-Id': key.id,
      'Client-Secret': key.secret,
      'User-Agent': 'StalcraftCompanion/1.0',
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  
  if (!debugLogged && data.lots && data.lots.length > 0) {
    console.log('\n🔍 === СТРУКТУРА ЛОТА ОТ API ===');
    console.log('Item ID:', itemId);
    console.log('Первый лот:', JSON.stringify(data.lots[0], null, 2));
    console.log('================================\n');
    debugLogged = true;
  }
  
  return data.lots || [];
}

async function fetchLotsBatch(itemIds, itemsData, category) {
  const allLots = [];
  let processed = 0;
  
  for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
    const batch = itemIds.slice(i, i + BATCH_SIZE);
    
    // Параллельный запрос для всей пачки
    const results = await Promise.allSettled(
      batch.map(async (itemId) => {
        const item = itemsData.find(i => i.id === itemId);
        if (!item) return [];
        
        try {
          const rawLots = await getLots(itemId, 20);
          if (rawLots.length === 0) return [];
          
          return rawLots.map((lot, index) => {
            const quality = getItemQuality(lot, item);
            const enhancementLevel = getEnhancementFromProperties(lot.additional?.bonus_properties);
            const enhancementText = getEnhancementText(enhancementLevel);
            const unitPrice = Math.floor(lot.buyoutPrice / lot.amount);

            return {
              uniqueKey: `${lot.itemId}-${lot.startTime}-${index}`,
              itemId: lot.itemId,
              itemName: item.name?.lines?.ru || 'N/A',
              itemRarity: quality.name,
              rarityText: quality.text,
              itemCategory: item.category,
              amount: lot.amount,
              startPrice: lot.startPrice,
              buyoutPrice: lot.buyoutPrice,
              startTime: lot.startTime,
              endTime: lot.endTime,
              enhancementLevel,
              enhancementText,
              unitPrice,
              bonusProperties: lot.additional?.bonus_properties,
              qlt: lot.additional?.qlt ?? parseColorToQlt(item.color || 'DEFAULT'),
            };
          });
        } catch (error) {
          return [];
        }
      })
    );
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allLots.push(...result.value);
      }
    });
    
    processed += batch.length;
    // Красивый прогресс-бар в консоли
    const percent = Math.round((processed / itemIds.length) * 100);
    const barLength = 20;
    const filled = Math.round((percent / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    process.stdout.write(`\r  [${category}] [${bar}] ${percent}% (${processed}/${itemIds.length})`);
    
    // Задержка только между пачками, а не между каждым запросом!
    if (i + BATCH_SIZE < itemIds.length) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }
  
  console.log(''); // Перенос строки после прогресс-бара
  return allLots;
}

async function main() {
  console.log('[BOT] Запуск обновления кэша аукциона...');
  console.log(`[BOT] Используется ${API_KEYS.length} API ключ(ей) с ротацией`);
  const startTime = Date.now();
  
  const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
  if (!fs.existsSync(itemsPath)) {
    console.error('❌ ОШИБКА: Файл data/items/items.json не найден!');
    process.exit(1);
  }
  const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
  
  const allItemsPath = path.join(__dirname, '..', 'lib', 'all-items-by-category.json');
  if (!fs.existsSync(allItemsPath)) {
    console.error('❌ ОШИБКА: Файл lib/all-items-by-category.json не найден!');
    process.exit(1);
  }
  const allItems = JSON.parse(fs.readFileSync(allItemsPath, 'utf-8'));
  
  const cache = {};
  
  for (const [category, itemIds] of Object.entries(allItems)) {
    console.log(`[BOT] Категория ${category}: ${itemIds.length} предметов...`);
    const lots = await fetchLotsBatch(itemIds, itemsData, category);
    
    // Сортируем лоты по цене выкупа (от дешевых к дорогим)
    lots.sort((a, b) => a.buyoutPrice - b.buyoutPrice);
    cache[category] = lots;
    console.log(`[BOT] ✅ ${category}: найдено ${lots.length} лотов`);
  }
  
  const cacheDir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const totalLots = Object.values(cache).reduce((sum, lots) => sum + lots.length, 0);
  
  fs.writeFileSync(CACHE_PATH, JSON.stringify({
    timestamp: Date.now(),
    data: cache
  }, null, 2));
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Кэш обновлён за ${elapsed} секунд!`);
  console.log(`📁 Сохранён в: ${CACHE_PATH}`);
  console.log(`📊 Всего лотов в кэше: ${totalLots}`);
  
  // Статистика по качествам
  const allLots = Object.values(cache).flat();
  const qualityStats = {};
  for (const lot of allLots) {
    const q = lot.itemRarity || 'unknown';
    qualityStats[q] = (qualityStats[q] || 0) + 1;
  }
  console.log('\n📊 Статистика по качествам в кэше:');
  for (const [q, count] of Object.entries(qualityStats)) {
    console.log(`  ${q}: ${count} лотов`);
  }
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});