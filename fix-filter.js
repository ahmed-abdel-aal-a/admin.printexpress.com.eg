const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\bFilter\b/g, 'ListFilter');
  fs.writeFileSync(file, content);
}
fix('app/orders/page.tsx');
fix('app/customers/page.tsx');
