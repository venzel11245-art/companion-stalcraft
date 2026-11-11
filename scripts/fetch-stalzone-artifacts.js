const fs = require('fs');
const path = require('path');

// Берём список артефактов из нашего artifactStats.json
const STATS_PATH = path.join(process.cwd(), 'data', 'artifactStats.json');
const artifactStats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf-8'));

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'artifacts-real.json');

// Функция задержки чтобы не DDOS-ить Stalzone
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchArtifactData(artifactId, artifactName) {
  // Пробуем несколько вариантов API Stalzone Wiki
  const urls = [
    `https://stalzone.wiki/api/items/${artifactId}`,
    `https://stalzone.wiki/api/artifact/${artifactId}`,
    `https://stalzone.wiki/api/v1/items/${artifactId}`,
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'StalcraftCompanion/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${artifactName} (${artifactId}) — получен с ${url}`);
        return data;
      }
    } catch (e) {
      // пробуем следующий URL
    }
  }
  
  console.log(`❌ ${artifactName} (${artifactId}) — не удалось получить`);
  return null;
}

async function main() {
  console.log(`=== Получаем реальные данные для ${artifactStats.length} артефактов ===\n`);
  
  const realArtifacts = [];
  let success = 0;
  let fail = 0;
  
  for (let i = 0; i < artifactStats.length; i++) {
    const art = artifactStats[i];
    console.log(`[${i + 1}/${artifactStats.length}] Загружаю: ${art.name}...`);
    
    const data = await fetchArtifactData(art.id, art.name);
    
    if (data) {
      realArtifacts.push({
        id: art.id,
        name: art.name,
        category: art.category,
        weight: art.weight,
        baseStats: art.stats, // min/max/avg из нашего файла
        realData: data // реальные данные с Stalzone
      });
      success++;
    } else {
      fail++;
    }
    
    // Задержка 300мс между запросами
    await sleep(300);
  }
  
  console.log(`\n=== РЕЗУЛЬТАТ ===`);
  console.log(`✅ Успешно: ${success}`);
  console.log(`❌ Ошибок: ${fail}`);
  console.log(`📁 Сохранено в: ${OUTPUT_PATH}`);
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(realArtifacts, null, 2), 'utf-8');
  console.log('\n✅ Готово!');
}

main().catch(e => {
  console.error('Критическая ошибка:', e);
  process.exit(1);
});