const fs = require('fs');
const files = [
  'app/page.tsx', 
  'components/Sidebar.tsx', 
  'app/orders/page.tsx', 
  'app/products/page.tsx', 
  'app/customers/page.tsx', 
  'app/customers/[id]/page.tsx'
];
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/;/g, ';\n');
  fs.writeFileSync(file, code);
}
