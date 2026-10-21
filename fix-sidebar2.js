const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');
code = code.replace(/<Icon \s*className: (cn\([\s\S]*?\))\s*\/>/g, '<Icon className={$1} />');
fs.writeFileSync('components/Sidebar.tsx', code);
