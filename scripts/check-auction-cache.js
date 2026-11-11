const fs = require('fs');
const path = require('path');

const AUCTION_PATH = path.join(process.cwd(), 'data', 'auction-cache.json');

if (!fs.existsSync(AUCTION_PATH)) {
  console.log('❌ auction-cache.json не найден');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(AUCTION_PATH, 'utf-8'));

console.log('=== СТРУКТУРА auction-cache.json ===');
console.log('Тип данных:', Array.isArray(data) ? 'Массив' : typeof data);

if (Array.isArray(data)) {
  console.log('Всего записей:', data.length);
  
  // Ищем Витока
  const vitokEntries = data.filter(item => 
    item.itemName === 'Виток' || 
    item.name === 'Виток' ||
    (item.item && (item.item.name === 'Виток' || item.item.name?.lines?.ru === 'Виток'))
  );
  
  console.log('\n=== НАЙДЕНО ВИТКОВ:', vitokEntries.length, '===\n');
  
  if (vitokEntries.length > 0) {
    console.log('Первые 3 записи Витока:');
    vitokEntries.slice(0, 3).forEach((entry, idx) => {
      console.log(`\n--- Запись #${idx + 1} ---`);
      console.log(JSON.stringify(entry, null, 2));
    });
  } else {
    console.log('Виток не найден. Показываю первые 2 записи:');
    data.slice(0, 2).forEach((entry, idx) => {
      console.log(`\n--- Запись #${idx + 1} ---`);
      console.log(JSON.stringify(entry, null, 2));
    });
  }
} else if (typeof data === 'object') {
  console.log('Ключи:', Object.keys(data).slice(0, 10));
  const firstKey = Object.keys(data)[0];
  console.log('\nПервая запись:');
  console.log(JSON.stringify(data[firstKey], null, 2));
}