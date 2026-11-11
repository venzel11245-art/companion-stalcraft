const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

// Категории
const categories = {
  armour: ['armor/combat', 'armor/combined', 'armor/device', 'armor/scientist'],
  weapon: ['weapon/'],
  artefact: ['artefact/'],
  consumable: ['supply/', 'medicine', 'grenade', 'misc', 'other'],
  container: ['containers', 'backpacks'],
  attachment: ['attachment/'],
};

// Исключаем
const exclude = ['other/skins', 'other/armor_motif', 'weapon_modules/', 'armor/clothes'];

// Фильтруем предметы по категориям и статусу
const result = {};

for (const [key, cats] of Object.entries(categories)) {
  const found = items.filter(i => {
    if (exclude.some(e => i.category?.startsWith(e))) return false;
    return cats.some(c => i.category === c || i.category?.startsWith(c));
  });

  const unique = Array.from(new Map(found.map(i => [i.id, i])).values());
  
  // Берём только первые 30 предметов на категорию
  result[key] = unique.slice(0, 30).map(i => i.id);
  
  console.log(`\n=== ${key.toUpperCase()} (${unique.length} всего, берём 30) ===`);
  unique.slice(0, 30).forEach(i => {
    console.log(`  '${i.id}', // ${i.name?.lines?.ru} [${i.status?.state || 'unknown'}]`);
  });
}

// Сохраняем результат
const outputPath = path.join(__dirname, '..', 'lib', 'tradeable-items.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\n✅ Сохранено в ${outputPath}`);