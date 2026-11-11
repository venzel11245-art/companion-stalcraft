const fs = require('fs');
const path = require('path');
const https = require('https');

const itemsPath = path.join(__dirname, '..', 'data', 'items', 'items.json');
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Базовый URL для иконок (нужно найти правильный)
const BASE_URL = 'https://stalcraft.fandom.com/wiki/Special:FilePath/';

let downloaded = 0;
let failed = 0;

function downloadIcon(itemId, itemName) {
  // Формируем URL (может потребоваться корректировка)
  const encodedName = encodeURIComponent(itemName.replace(/ /g, '_'));
  const url = `${BASE_URL}${encodedName}.png`;
  
  const filePath = path.join(iconsDir, `${itemId}.png`);
  
  https.get(url, (response) => {
    if (response.statusCode === 200) {
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        downloaded++;
        if (downloaded + failed === items.length) {
          console.log(`✅ Загружено: ${downloaded}, Ошибок: ${failed}`);
        }
      });
    } else {
      failed++;
      if (downloaded + failed === items.length) {
        console.log(`✅ Загружено: ${downloaded}, Ошибок: ${failed}`);
      }
    }
  }).on('error', (err) => {
    failed++;
    if (downloaded + failed === items.length) {
      console.log(`✅ Загружено: ${downloaded}, Ошибок: ${failed}`);
    }
  });
}

console.log(`Начинаем загрузку ${items.length} иконок...`);

items.forEach(item => {
  const name = item.name?.lines?.ru || item.name?.ru || item.id;
  downloadIcon(item.id, name);
});