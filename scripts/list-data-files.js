const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

function listFiles(dir, indent = '') {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      listFiles(fullPath, indent + '  ');
    } else {
      const size = (stat.size / 1024).toFixed(1) + ' KB';
      console.log(`${indent}📄 ${item} (${size})`);
    }
  });
}

console.log('=== СТРУКТУРА ПАПКИ data/ ===\n');
listFiles(DATA_DIR);