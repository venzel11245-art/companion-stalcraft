const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Ограничиваем параллельные загрузки
const MAX_PARALLEL = 3;
const DELAY_BETWEEN = 200; // мс между запросами

let downloaded = 0;
let failed = 0;
let skipped = 0;

function downloadFile(url, filePath) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
      } else {
        resolve(false);
      }
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function downloadWithQueue(itemsQueue) {
  const queue = [...itemsQueue];
  
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_PARALLEL);
    
    await Promise.all(batch.map(async (item) => {
      const filePath = path.join(iconsDir, `${item.id}.png`);
      
      // Пропускаем если уже скачано
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        skipped++;
        return;
      }
      
      // Попробуем несколько источников
      const name = item.name?.lines?.ru || item.name?.ru || item.id;
      const encodedName = encodeURIComponent(name.replace(/ /g, '_'));
      
      // Источник 1: Stalcraft Wiki
      const url1 = `https://stalcraft.fandom.com/wiki/Special:FilePath/${encodedName}.png`;
      
      const success = await downloadFile(url1, filePath);
      
      if (success) {
        downloaded++;
      } else {
        failed++;
      }
      
      // Небольшая задержка чтобы не забивать канал
      await new Promise(r => setTimeout(r, DELAY_BETWEEN));
    }));
    
    // Прогресс
    const total = downloaded + failed + skipped;
    if (total % 100 === 0) {
      console.log(`Прогресс: ${total}/${items.length} (✅${downloaded} ❌${failed} ⏭️${skipped})`);
    }
  }
}

async function main() {
  console.log(`📥 Начинаем щадящую загрузку ${items.length} иконок...`);
  console.log(`⚙️  Параллельно: ${MAX_PARALLEL}, задержка: ${DELAY_BETWEEN}мс`);
  console.log(`⏱️  Примерное время: ${Math.round(items.length * DELAY_BETWEEN / 1000 / MAX_PARALLEL)} секунд\n`);
  
  await downloadWithQueue(items);
  
  console.log(`\n✅ Загрузка завершена!`);
  console.log(`   Скачано: ${downloaded}`);
  console.log(`   Пропущено (уже есть): ${skipped}`);
  console.log(`   Ошибок: ${failed}`);
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});