const fs = require('fs');
let code = fs.readFileSync('src/app/audits/[id]/page.tsx', 'utf8');

code = code.replace(/    const \[activeTab, setActiveTab\] = useState\("Overview"\);/, `  const [activeTab, setActiveTab] = useState("Overview");`);

fs.writeFileSync('src/app/audits/[id]/page.tsx', code);
