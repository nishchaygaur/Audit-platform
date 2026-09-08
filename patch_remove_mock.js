const fs = require('fs');
let code = fs.readFileSync('src/app/audits/[id]/page.tsx', 'utf8');

// Remove the mock auditData
const startIdx = code.indexOf('const auditData = {');
const endIdx = code.indexOf('const fallbackAudit =');

if (startIdx !== -1) {
  // Find where it ends
  const endMockDataIdx = code.indexOf('/* ============================================================', startIdx);
  if (endMockDataIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endMockDataIdx);
  }
}

fs.writeFileSync('src/app/audits/[id]/page.tsx', code);
