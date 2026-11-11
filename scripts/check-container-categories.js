const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

// Ищем все предметы с "контейнер" или "рюкзак" в названии
const containers = items.filter(i => 
  i.name?.lines?.ru?.toLowerCase().includes('контейнер') ||
  i.name?.lines?.ru?.toLowerCase().includes('рюкзак') ||
  i.name?.lines?.ru?.toLowerCase().includes('сумка') ||
  i.category?.includes('container') ||
  i.category?.includes('backpack')
);

console.log(`Найдено ${containers.length} предметов:`);
const categories = [...new Set(containers.map(i => i.category))];
console.log('\nКатегории:');
categories.forEach(cat => console.log(`  - ${cat}`));

console.log('\nПримеры:');
containers.slice(0, 10).forEach(i => {
  console.log(`  ${i.id}: ${i.name?.lines?.ru} [${i.category}]`);
});