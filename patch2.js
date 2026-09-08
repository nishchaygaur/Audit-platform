const fs = require('fs');

function replaceInFile(filePath, search, replace) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content);
}

const findMockStr = `  const [findings, setFindings] =
    useState<Finding[]>(INITIAL_FINDINGS);`;

const replaceStr = `  const { currentWorkspace } = require('@/context/WorkspaceContext').useWorkspace();
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  require('react').useEffect(() => {
    if (currentWorkspace?.id) {
      require('@/actions/findings').getFindings(currentWorkspace.id).then((res: any) => {
        if (res.success && res.data) setFindings(res.data.map((f: any) => ({ ...f, findingId: f.reference, identified: f.identified_date, dueDate: f.due_date })));
        setLoading(false);
      });
    } else {
      setFindings([]);
      setLoading(false);
    }
  }, [currentWorkspace?.id]);`;

replaceInFile('src/app/findings/page.tsx', findMockStr, replaceStr);

const endMockStr = `  const criticalFindings = findings.filter(`;
const endReplaceStr = `  if (loading) return <div className="p-8 text-center text-slate-500">Loading findings...</div>;

  const criticalFindings = findings.filter(`;

replaceInFile('src/app/findings/page.tsx', endMockStr, endReplaceStr);
console.log("Patched again.");
