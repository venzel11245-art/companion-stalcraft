const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

// Категории
const categories = {
  artefact: ['artefact/'],
  armor: ['armor/combat', 'armor/combined', 'armor/device', 'armor/scientist'],
  weapon: ['weapon/'],
  consumable: ['supply/', 'medicine', 'grenade', 'misc', 'other'],
  container: ['containers', 'backpacks'],
  attachment: ['attachment/'],
};

// Исключаем
const exclude = ['other/skins', 'other/armor_motif', 'weapon_modules/', 'armor/clothes'];

const result = {};

for (const [key, cats] of Object.entries(categories)) {
  const found = items.filter(i => {
    if (exclude.some(e => i.category?.startsWith(e))) return false;
    return cats.some(c => i.category === c || i.category?.startsWith(c));
  });

  const unique = Array.from(new Map(found.map(i => [i.id, i])).values());
  result[key] = unique.map(i => i.id);
  
  console.log(`${key}: ${unique.length} предметов`);
}

// Сохраняем
const outputPath = path.join(__dirname, '..', 'lib', 'all-items-by-category.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\n✅ Сохранено в ${outputPath}`);
