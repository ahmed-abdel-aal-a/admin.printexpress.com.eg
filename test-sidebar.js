const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');
code = code.replace(/<Icon className=\{cn\([\s\S]*?\)\} \/>/g, '');
fs.writeFileSync('components/Sidebar.tsx', code);
