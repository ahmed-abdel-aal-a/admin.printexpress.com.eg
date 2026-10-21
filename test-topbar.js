const fs = require('fs');
let code = fs.readFileSync('components/TopBar.tsx', 'utf8');
code = code.replace(/<(Menu|Search|Bell)[\s\S]*?\/>/g, '');
fs.writeFileSync('components/TopBar.tsx', code);
