const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

// Категории которые нам нужны
const categories = {
  armor: ['armor/combat', 'armor/combined', 'armor/device', 'armor/scientist'],
  weapon: ['weapon/assault_rifle', 'weapon/sniper_rifle', 'weapon/pistol', 'weapon/shotgun_rifle', 'weapon/submachine_gun', 'weapon/machine_gun', 'weapon/heavy', 'weapon/melee', 'weapon/device'],
  consumable: ['supply/food', 'supply/drink', 'supply/medicine', 'medicine', 'grenade', 'misc', 'other'],
  container: ['containers', 'backpacks'],
  attachment: ['attachment/barrel', 'attachment/mag', 'attachment/forend', 'attachment/handgrips', 'attachment/pistol_handle', 'attachment/collimator_sights', 'attachment/accessory', 'attachment/other'],
};

// Исключаем
const exclude = ['other/skins', 'other/armor_motif', 'armor/clothes'];

for (const [key, cats] of Object.entries(categories)) {
  console.log(`\n=== ${key.toUpperCase()} ===`);
  const found = items.filter(i => {
    if (exclude.includes(i.category)) return false;
    return cats.some(c => i.category === c || i.category?.startsWith(c + '/'));
  });
  
  // Дедупликация
  const unique = Array.from(new Map(found.map(i => [i.id, i])).values());
  
  // Показываем первые 20
  unique.slice(0, 20).forEach(i => {
    console.log(`  '${i.id}', // ${i.name?.lines?.ru}`);
  });
  console.log(`  // Всего: ${unique.length}`);
}