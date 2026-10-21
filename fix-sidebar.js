const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');
code = code.replace(/\{React\.createElement\(Icon, \{([\s\S]*?)\}\)\}/g, '<Icon $1 />');
fs.writeFileSync('components/Sidebar.tsx', code);
