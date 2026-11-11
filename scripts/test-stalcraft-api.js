const fs = require('fs');
const path = require('path');

const CLIENT_ID = '4714';
const CLIENT_SECRET = 'magUOyMqaQlDYHYbKhbaxawoHWhQNXOSYBmGJuAX';

async function getAccessToken() {
  console.log('🔄 Получаем токен...');
  const response = await fetch('https://exbo.net/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ошибка токена: ${response.status}\n${await response.text()}`);
  }
  
  const data = await response.json();
  console.log('✅ Токен получен!\n');
  return data.access_token;
}

async function fetchArtifact(token, artifactId, categoryPath) {
  // Правильные эндпоинты с полным путём категории
  const urls = [
    `https://eapi.stalcraft.net/RU/items/${categoryPath}/${artifactId}`,
    `https://eapi.stalcraft.net/items/${categoryPath}/${artifactId}`,
    `https://eapi.stalcraft.net/RU/database/items/${categoryPath}/${artifactId}`,
  ];
  
  for (const url of urls) {
    try {
      console.log(`📡 Пробуем: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Успех! Данные получены.\n`);
        return data;
      } else {
        console.log(`❌ Статус: ${response.status}`);
      }
    } catch (e) {
      console.log(`❌ Ошибка: ${e.message}`);
    }
  }
  return null;
}

async function main() {
  console.log('=== Тестирование Stalcraft API ===\n');
  
  try {
    const token = await getAccessToken();
    
    console.log('=== Запрашиваем Виток (04yr) ===');
    // Категория Витока: artefact/biochemical
    const vitokData = await fetchArtifact(token, '04yr', 'artefact/biochemical');
    
    if (vitokData) {
      console.log('📊 Структура данных (первые 1500 символов):');
      console.log(JSON.stringify(vitokData, null, 2).substring(0, 1500) + '\n... (обрезано)');
      
      fs.writeFileSync('vitok-test.json', JSON.stringify(vitokData, null, 2), 'utf-8');
      console.log('\n💾 Полный ответ сохранён в vitok-test.json');
    } else {
      console.log('\n❌ Не удалось получить данные.');
    }
  } catch (e) {
    console.error('❌ Критическая ошибка:', e.message);
  }
}

main();