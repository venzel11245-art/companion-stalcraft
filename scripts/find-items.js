const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

// Ищем Фаренгейт
const fahrenheit = items.find(i => i.name?.lines?.ru?.includes('Фаренгейт'));

if (fahrenheit) {
  console.log('✅ Найден:');
  console.log('ID:', fahrenheit.id);
  console.log('Название:', fahrenheit.name.lines.ru);
  console.log('Категория:', fahrenheit.category);
} else {
  console.log('❌ Фаренгейт не найден');
  
  // Покажем все артефакты для поиска
  console.log('\n📋 Все артефакты в базе:');
  const artefacts = items.filter(i => i.category?.startsWith('artefact/'));
  artefacts.slice(0, 20).forEach(i => {
    console.log(`- ${i.id}: ${i.name?.lines?.ru}`);
  });
}