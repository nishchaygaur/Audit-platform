const fs = require('fs');
let code = fs.readFileSync('src/app/audits/[id]/page.tsx', 'utf8');

// Fix variable declarations and hooks order
code = code.replace(/    const audit = getAudit\(auditId\);\n\n    const \[activeTab, setActiveTab\] = useState\("Overview"\);/, `  const audit = getAudit(auditId);\n  const [activeTab, setActiveTab] = useState("Overview");`);

fs.writeFileSync('src/app/audits/[id]/page.tsx', code);
