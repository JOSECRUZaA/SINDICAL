const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend', 'src', 'pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace border colors
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'var(--border-color)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--border-color)');
  
  // Replace backgrounds
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.03\)/g, 'rgba(0,0,0,0.03)');
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.2\)/g, 'var(--bg-color)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.02\)/g, 'rgba(0,0,0,0.02)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.2\)/g, 'var(--border-color)');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.jsx')) {
    processFile(path.join(pagesDir, file));
  }
});
