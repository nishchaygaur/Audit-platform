const fs = require('fs');

const path = 'src/app/audits/[id]/findings/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace state
content = content.replace(
  `  const [findingsByWorkspace, setFindingsByWorkspace] =
    useState<Record<string, Finding[]>>(INITIAL_FINDINGS);`,
  `  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = require('next/navigation').useParams();
  
  require('react').useEffect(() => {
    if (workspaceId && params.id) {
      require('@/actions/findings').getFindings(workspaceId, params.id as string).then((res: any) => {
        if (res.success && res.data) {
          setFindings(res.data.map((f: any) => ({ ...f, reference: f.reference, identifiedDate: f.identified_date, dueDate: f.due_date })));
        }
        setLoading(false);
      });
    } else {
      setFindings([]);
      setLoading(false);
    }
  }, [workspaceId, params.id]);`
);

// Replace derived findings
content = content.replace(
  `  const findings = findingsByWorkspace[workspaceId] ?? [];`,
  `  if (loading) return <div className="p-8 text-center text-slate-500">Loading findings...</div>;`
);

fs.writeFileSync(path, content);
console.log("Patched audits findings page");
