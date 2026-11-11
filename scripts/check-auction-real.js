const fs = require('fs');
const path = require('path');

const AUCTION_PATH = path.join(process.cwd(), 'data', 'cache', 'auction-cache.json');

try {
  const raw = fs.readFileSync(AUCTION_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  
  console.log('=== СТРУКТУРА auction-cache.json ===');
  console.log('Ключи верхнего уровня:', Object.keys(parsed));
  
  if (parsed.data && Array.isArray(parsed.data)) {
    console.log('\n✅ В массиве "data" найдено записей:', parsed.data.length);
    
    // Ищем Виток (проверяем разные возможные поля с именем)
    const vitoks = parsed.data.filter(item => {
      const name = item.itemName || item.name || item.item?.name || item.item?.name?.lines?.ru || '';
      return name.includes('Виток');
    });
    
    console.log('\n=== НАЙДЕНО ВИТКОВ НА АУКЦИОНЕ:', vitoks.length, '===\n');
    
    if (vitoks.length > 0) {
      console.log('🔥 Показываю первые 3 реальных артефакта с аукциона:');
      vitoks.slice(0, 3).forEach((item, idx) => {
        console.log(`\n--- Виток #${idx + 1} ---`);
        console.log('Имя:', item.itemName || item.name || item.item?.name?.lines?.ru);
        console.log('Качество/Процент:', item.quality || item.percentage || item.item?.quality || item.item?.percentage || 'Не указано');
        console.log('Заточка:', item.enhancement || item.upgradeLevel || item.item?.enhancement || item.item?.upgradeLevel || 'Не указано');
        console.log('Статы (infoBlocks или stats):');
        
        // Пытаемся найти статы в разных возможных местах
        const stats = item.infoBlocks || item.item?.infoBlocks || item.stats || item.item?.stats || [];
        console.log(JSON.stringify(stats, null, 2));
      });
    } else {
      console.log('❌ Витков не найдено. Показываю первые 2 любых артефакта из аукциона:');
      const anyArts = parsed.data.filter(item => {
        const cat = item.category || item.item?.category || '';
        return cat.includes('artefact') || (item.itemName && !item.itemName.includes('Оружие'));
      }).slice(0, 2);
      
      anyArts.forEach((item, idx) => {
        console.log(`\n--- Артефакт #${idx + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    }
  } else {
    console.log('❌ Ключ "data" не является массивом или отсутствует.');
  }
} catch (e) {
  console.log('❌ Ошибка:', e.message);
}