const fs = require('fs');
let code = fs.readFileSync('src/app/audits/[id]/page.tsx', 'utf8');

code = code.replace(/    const audit = getAudit\(auditId\);/, `  const audit = getAudit(auditId);`);
// Check if the getAudit call was indented with 4 spaces instead of 2.

fs.writeFileSync('src/app/audits/[id]/page.tsx', code);
