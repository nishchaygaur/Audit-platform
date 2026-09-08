const fs = require('fs');
let content = fs.readFileSync('src/app/workspaces/page.tsx', 'utf8');

content = content.replace(
  /function logout\(\) \{\s*localStorage\.removeItem\("audit_authenticated"\);\s*localStorage\.removeItem\("audit_user"\);\s*router\.push\("\/signin"\);\s*\}/,
  `async function logout() {
    await signOut();
  }`
);

fs.writeFileSync('src/app/workspaces/page.tsx', content);
