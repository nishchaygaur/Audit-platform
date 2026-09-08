const fs = require('fs');
let content = fs.readFileSync('src/app/audits/[id]/findings/page.tsx', 'utf8');

content = content.replace(
  /setFindingsByWorkspace\(\(current\) => \(\{\s*\.\.\.current,\s*\[workspaceId\]: \(\s*current\[workspaceId\] \?\? \[\]\s*\)\.map\(/g,
  'setFindings((current) => current.map('
);

content = content.replace(
  /setFindingsByWorkspace\(\(current\) => \(\{\s*\.\.\.current,\s*\[workspaceId\]: \[\s*newFinding,\s*\.\.\.\(current\[workspaceId\] \?\? \[\]\),\s*\],\s*\}\)\);/g,
  'setFindings((current) => [newFinding, ...current]);'
);

content = content.replace(
  /setFindingsByWorkspace\(\(current\) => \(\{\s*\.\.\.current,\s*\[workspaceId\]: \(\s*current\[workspaceId\] \?\? \[\]\s*\)\.filter\(/g,
  'setFindings((current) => current.filter('
);

content = content.replace(
  /\)\,\s*\}\)\)/g,
  '))'
);

fs.writeFileSync('src/app/audits/[id]/findings/page.tsx', content);
