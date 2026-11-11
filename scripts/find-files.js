const fs = require('fs');
const path = require('path');

function findFile(dir, filename, results = []) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && item === filename) {
          results.push(fullPath);
        } else if (stat.isDirectory()) {
          findFile(fullPath, filename, results);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return results;
}

function findFilesByKeyword(dir, keyword, results = []) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && item.toLowerCase().includes(keyword) && item.endsWith('.json')) {
          results.push(fullPath);
        } else if (stat.isDirectory()) {
          findFilesByKeyword(fullPath, keyword, results);
        }
      } catch(e) {}
    }
  } catch(e) {}
  return results;
}

const root = path.join(process.cwd());

console.log('=== auction-cache.json ===');
findFile(root, 'auction-cache.json').forEach(f => console.log('📄', f));

console.log('\n=== artifact_raw.json ===');
findFile(root, 'artifact_raw.json').forEach(f => console.log('📄', f));

console.log('\n=== Файлы с "artifact" в имени ===');
findFilesByKeyword(root, 'artifact').forEach(f => console.log('📄', f));

console.log('\n=== Файлы с "roll" или "upgrade" или "quality" ===');
findFilesByKeyword(root, 'roll').forEach(f => console.log('📄', f));
findFilesByKeyword(root, 'upgrade').forEach(f => console.log('📄', f));
findFilesByKeyword(root, 'quality').forEach(f => console.log('📄', f));