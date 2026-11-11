const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(process.cwd(), 'data', 'artifactStats.json');
const data = JSON.parse(fs.readFileSync(STATS_PATH, 'utf-8'));

// Находим Виток
const vitok = data.find(a => a.name === 'Виток');

if (!vitok) {
  console.log('Виток не найден в artifactStats.json');
  process.exit(1);
}

console.log('=== ПОЛНАЯ СТРУКТУРА ВИТКА ===\n');
console.log(JSON.stringify(vitok, null, 2));

console.log('\n\n=== ПРОВЕРЯЕМ, ЕСТЬ ЛИ ДАННЫЕ ДЛЯ РАЗНОЙ ЗАТОЧКИ ===\n');
console.log('Ключи объекта:', Object.keys(vitok));

// Проверяем, есть ли вложенные массивы или объекты
for (const key of Object.keys(vitok)) {
  const value = vitok[key];
  if (Array.isArray(value)) {
    console.log(`\n${key}: массив из ${value.length} элементов`);
    console.log('Первый элемент:', JSON.stringify(value[0], null, 2));
  } else if (typeof value === 'object' && value !== null) {
    console.log(`\n${key}: объект с ключами:`, Object.keys(value));
  }
}