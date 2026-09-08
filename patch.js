const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/app/findings/page.tsx', [
  {
    search: `const [findings, setFindings] =\n    useState<Finding[]>(INITIAL_FINDINGS);`,
    replace: `const { currentWorkspace } = require('@/context/WorkspaceContext').useWorkspace();\n  const [findings, setFindings] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);\n  \n  require('react').useEffect(() => {\n    if (currentWorkspace?.id) {\n      require('@/actions/findings').getFindings(currentWorkspace.id).then(res => {\n        if (res.success && res.data) setFindings(res.data.map((f: any) => ({ ...f, findingId: f.reference, identified: f.identified_date, dueDate: f.due_date })));\n        setLoading(false);\n      });\n    } else {\n      setFindings([]);\n      setLoading(false);\n    }\n  }, [currentWorkspace?.id]);`
  },
  {
    search: `const criticalFindings = findings.filter(`,
    replace: `if (loading) return <div className="p-8 text-center text-slate-500">Loading findings...</div>;\n\n  const criticalFindings = findings.filter(`
  }
]);

console.log("Patched findings/page.tsx");
