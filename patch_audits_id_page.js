const fs = require('fs');
let code = fs.readFileSync('src/app/audits/[id]/page.tsx', 'utf8');

// Replace Audit statuses in mapping
code = code.replace(/audit\.status === "In Review"/g, 'audit.status === "Review"');
code = code.replace(/audit\.status === "Not Started"/g, 'audit.status === "Planning"');
code = code.replace(/audit\.status === "On Hold"/g, 'audit.status === "Reporting"');
code = code.replace(/bg-amber-50 text-amber-700/g, 'bg-blue-50 text-blue-700'); // Fieldwork

// Also replace the fallback array mapping
code = code.replace(/const fallbackAudit =[\s\S]*?\}\) as Audit;/m, `  const audit = getAudit(auditId);`);

// Update if (!audit) check
code = code.replace(/const \[activeTab, setActiveTab\] = useState\("Overview"\);/, `  const [activeTab, setActiveTab] = useState("Overview");

  if (!audit) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">Audit Not Found</h2>
          <p className="mt-2 text-slate-500">The audit you are looking for does not exist or you do not have permission to view it.</p>
        </div>
      </div>
    );
  }`);

fs.writeFileSync('src/app/audits/[id]/page.tsx', code);
