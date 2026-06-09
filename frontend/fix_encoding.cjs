const fs = require('fs');
let css = fs.readFileSync('src/index.css');

// Find where the UTF-16 stuff starts (null bytes)
let cleanText = '';
for (let i = 0; i < css.length; i++) {
  if (css[i] === 0) {
    // null byte found, we stop here
    break;
  }
  cleanText += String.fromCharCode(css[i]);
}

// Ensure the clean text ends properly without the corrupted string
cleanText = cleanText.split('\n').slice(0, 186).join('\n');

const fix = `
/* Fix Global para Formularios en Modales */
.modal-content form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  max-height: inherit;
}
.modal-content .modal-body {
  overflow-y: auto;
  flex: 1;
}
`;

fs.writeFileSync('src/index.css', cleanText + fix, 'utf8');
console.log('Fixed index.css');
