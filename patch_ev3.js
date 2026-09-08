const fs = require('fs');
let content = fs.readFileSync('src/app/evidence/page.tsx', 'utf8');
content = content.replace(
  `  const filteredEvidence = useMemo(() => {`,
  `  if (loading) return <div className="p-8 text-center text-slate-500">Loading evidence...</div>;
  const filteredEvidence = useMemo(() => {`
);
fs.writeFileSync('src/app/evidence/page.tsx', content);
