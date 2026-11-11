const fs = require('fs');
const path = require('path');

// 1. Проверяем auction-cache.json
console.log('=== auction-cache.json ===');
try {
  const auctionPath = path.join(process.cwd(), 'data', 'cache', 'auction-cache.json');
  const auctionData = JSON.parse(fs.readFileSync(auctionPath, 'utf-8'));
  
  console.log('Тип:', Array.isArray(auctionData) ? 'Массив' : typeof auctionData);
  
  if (Array.isArray(auctionData)) {
    console.log('Всего записей:', auctionData.length);
    
    // Ищем Витока
    const vitokEntries = auctionData.filter(item => 
      item.itemName === 'Виток' || 
      item.name === 'Виток' ||
      (item.item && (item.item.name === 'Виток' || item.item.name?.lines?.ru === 'Виток'))
    );
    
    console.log('\nНайдено Витков:', vitokEntries.length);
    
    if (vitokEntries.length > 0) {
      console.log('\nПервые 3 записи Витока:');
      vitokEntries.slice(0, 3).forEach((entry, idx) => {
        console.log(`\n--- Запись #${idx + 1} ---`);
        console.log(JSON.stringify(entry, null, 2));
      });
    } else {
      console.log('\nВиток не найден. Показываю первые 2 записи:');
      auctionData.slice(0, 2).forEach((entry, idx) => {
        console.log(`\n--- Запись #${idx + 1} ---`);
        console.log(JSON.stringify(entry, null, 2));
      });
    }
  } else {
    console.log('Ключи:', Object.keys(auctionData).slice(0, 10));
  }
} catch(e) {
  console.log('Ошибка:', e.message);
}

// 2. Проверяем artifact_raw.json
console.log('\n\n=== artifact_raw.json ===');
try {
  const rawPath = path.join(process.cwd(), 'scripts', 'artifact_raw.json');
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  
  console.log('Тип:', Array.isArray(rawData) ? 'Массив' : typeof rawData);
  
  if (Array.isArray(rawData)) {
    console.log('Всего записей:', rawData.length);
    
    const vitok = rawData.find(item => 
      item.name === 'Виток' || 
      item.name?.lines?.ru === 'Виток'
    );
    
    if (vitok) {
      console.log('\nВиток найден!');
      console.log(JSON.stringify(vitok, null, 2));
    } else {
      console.log('\nВиток не найден. Первые 2 записи:');
      rawData.slice(0, 2).forEach((item, idx) => {
        console.log(`\n--- #${idx + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    }
  } else {
    console.log('Ключи:', Object.keys(rawData).slice(0, 10));
  }
} catch(e) {
  console.log('Ошибка:', e.message);
}

// 3. Проверяем data/artifacts.json
console.log('\n\n=== data/artifacts.json ===');
try {
  const artifactsPath = path.join(process.cwd(), 'data', 'artifacts.json');
  const artifactsData = JSON.parse(fs.readFileSync(artifactsPath, 'utf-8'));
  
  console.log('Тип:', Array.isArray(artifactsData) ? 'Массив' : typeof artifactsData);
  
  if (Array.isArray(artifactsData)) {
    console.log('Всего записей:', artifactsData.length);
    
    const vitok = artifactsData.find(item => 
      item.name === 'Виток' || 
      item.name?.lines?.ru === 'Виток'
    );
    
    if (vitok) {
      console.log('\nВиток найден!');
      console.log(JSON.stringify(vitok, null, 2));
    } else {
      console.log('\nВиток не найден. Первые 2 записи:');
      artifactsData.slice(0, 2).forEach((item, idx) => {
        console.log(`\n--- #${idx + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    }
  } else {
    console.log('Ключи:', Object.keys(artifactsData).slice(0, 10));
  }
} catch(e) {
  console.log('Ошибка:', e.message);
}