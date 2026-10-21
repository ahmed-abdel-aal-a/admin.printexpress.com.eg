const fs = require('fs');
const glob = require('glob');
const { execSync } = require('child_process');

function fix(dir) {
  const files = execSync(`find ${dir} -name "*.tsx" -o -name "*.ts"`).toString().split('\n').filter(Boolean);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.startsWith('"use client";') && !content.startsWith('"use client";\n')) {
      content = content.replace(/^"use client";/, '"use client";\n');
      fs.writeFileSync(file, content);
      console.log(`Fixed ${file}`);
    } else if (content.startsWith("'use client';") && !content.startsWith("'use client';\n")) {
      content = content.replace(/^'use client';/, "'use client';\n");
      fs.writeFileSync(file, content);
      console.log(`Fixed ${file}`);
    }
  }
}
fix('app');
fix('components');
