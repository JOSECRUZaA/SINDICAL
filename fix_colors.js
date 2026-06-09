const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend', 'src', 'pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace amber/orange with secondary-color (Dorado)
  content = content.replace(/#f59e0b/g, 'var(--secondary-color)');
  content = content.replace(/rgba\(245,\s*158,\s*11/g, 'rgba(192, 141, 74');
  
  // Also check for 'rgba(16, 185, 129' (green) which was used as primary. Since primary is now Navy,
  // we might have some places where green was hardcoded as primary background, e.g. in badges it's ok,
  // but if used as an active state, it should be primary.
  // We will leave green for success states.
  
  // We saw 'color: #fff' and 'color: white' inside inline styles.
  // Instead of a blind replace, I'll let CSS variables handle most things, but just to be safe:
  content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text-main)'");
  content = content.replace(/color:\s*'white'/g, "color: 'var(--text-main)'");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// Also process css files
fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.jsx') || file.endsWith('.css')) {
    processFile(path.join(pagesDir, file));
  }
});
