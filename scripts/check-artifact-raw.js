const fs = require('fs');
const path = require('path');

const RAW_PATH = path.join(process.cwd(), 'data', 'artifact_raw.json');

if (!fs.existsSync(RAW_PATH)) {
  console.log('❌ artifact_raw.json не найден');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));

console.log('=== СТРУКТУРА artifact_raw.json ===');
console.log('Тип:', Array.isArray(data) ? 'Массив' : typeof data);

if (Array.isArray(data)) {
  console.log('Всего записей:', data.length);
  
  const vitok = data.find(item => 
    item.name === 'Виток' || 
    item.name?.lines?.ru === 'Виток'
  );
  
  if (vitok) {
    console.log('\n=== ВИТОК НАЙДЕН ===');
    console.log(JSON.stringify(vitok, null, 2));
  } else {
    console.log('Виток не найден. Первые 2 записи:');
    data.slice(0, 2).forEach((item, idx) => {
      console.log(`\n--- #${idx + 1} ---`);
      console.log(JSON.stringify(item, null, 2));
    });
  }
} else {
  console.log('Ключи:', Object.keys(data).slice(0, 10));
}