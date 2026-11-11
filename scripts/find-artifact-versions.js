const fs = require('fs');
const path = require('path');

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items', 'items.json');
const data = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf-8'));

// Ищем ВСЕ предметы с ID "04yr" (это Виток)
const vitokVersions = data.filter(i => i.id === '04yr');

console.log('=== ПОИСК ВСЕХ ВЕРСИЙ ВИТКА (ID: 04yr) ===');
console.log(`Найдено версий: ${vitokVersions.length}`);

if (vitokVersions.length > 0) {
  console.log('\n--- ПРОВЕРЯЕМ ПЕРВЫЕ 5 ВЕРСИЙ ---\n');
  
  vitokVersions.slice(0, 5).forEach((item, idx) => {
    console.log(`Версия #${idx + 1}:`);
    console.log('  Цвет (качество):', item.color);
    console.log('  Статус:', JSON.stringify(item.status));
    
    // Собираем статы
    const stats = [];
    function collectStats(node) {
      if (!node) return;
      if (Array.isArray(node)) { node.forEach(collectStats); return; }
      if (node.type === 'numeric' && node.value !== undefined) {
        const name = node.name?.lines?.ru || node.name?.key || 'unknown';
        stats.push(`${name}: ${node.value}`);
      }
      for (const key of Object.keys(node)) {
        if (node[key] && typeof node[key] === 'object') collectStats(node[key]);
      }
    }
    collectStats(item.infoBlocks);
    
    console.log('  Статы:', stats.join(', '));
    console.log('');
  });
} else {
  console.log('Версий не найдено. Попробуем поиск по названию...');
  const byName = data.filter(i => i.name?.lines?.ru?.includes('Виток'));
  console.log(`Найдено по названию: ${byName.length}`);
}