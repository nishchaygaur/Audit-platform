const fs = require('fs');
let content = fs.readFileSync('src/app/audits/[id]/evidence/page.tsx', 'utf8');

content = content.replace(
  /setEvidence\(\(current\) => \(\{\s*\.\.\.current,\s*current\.map\(/g,
  'setEvidence((current) => current.map('
).replace(
  /\)\,\s*\}\)\)/g,
  '))'
);

content = content.replace(
  /setEvidence\(\(current\) => \(\{\s*\.\.\.current,\s*\[workspaceId\]: \[\s*newEvidence,\s*\.\.\.\(current\[workspaceId\] \?\? \[\]\),\s*\],\s*\}\)\);/g,
  'setEvidence((current) => [newEvidence, ...current]);'
);

content = content.replace(
  /setEvidence\(\(current\) => \(\{\s*\.\.\.current,\s*\[workspaceId\]: \(\s*current\[workspaceId\] \?\? \[\]\s*\)\.filter\(/g,
  'setEvidence((current) => current.filter('
);

content = content.replace(
  /setEvidence\(\(current\) => \(\{\s*\.\.\.current,\s*\[workspaceId\]: \(\s*current\[workspaceId\] \?\? \[\]\s*\)\.map\(/g,
  'setEvidence((current) => current.map('
);

fs.writeFileSync('src/app/audits/[id]/evidence/page.tsx', content);
