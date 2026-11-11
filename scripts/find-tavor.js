const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

const tavor = items.find(i => i.name?.lines?.ru?.includes('Tavor'));

if (tavor) {
  console.log('✅ Найден Tavor:');
  console.log('ID:', tavor.id);
  console.log('Название:', tavor.name.lines.ru);
  console.log('Категория:', tavor.category);
  console.log('Статус:', tavor.status?.state);
} else {
  console.log('❌ Tavor не найден');
}