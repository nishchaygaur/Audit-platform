const fs = require('fs');
let code = fs.readFileSync('src/app/audits/[id]/page.tsx', 'utf8');

// The line is:
//   const statusClass =
//     audit.status === "Completed"
//       ? "bg-emerald-50 text-emerald-700"
//       : audit.status === "In Review"

code = code.replace(/audit\.status === "In Review"/g, 'audit.status === "Review"');
code = code.replace(/audit\.status === "Not Started"/g, 'audit.status === "Planning"');
code = code.replace(/audit\.status === "On Hold"/g, 'audit.status === "Reporting"');
code = code.replace(/bgmerald/g, 'bg-emerald');
code = code.replace(/textmerald/g, 'text-emerald');

fs.writeFileSync('src/app/audits/[id]/page.tsx', code);
