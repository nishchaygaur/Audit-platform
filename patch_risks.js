const fs = require('fs');
let content = fs.readFileSync('src/app/risk-management/page.tsx', 'utf8');

// replace state
content = content.replace(
  `  const workspaceKey = currentWorkspace?.id || "abc-technologies";

  const risks = workspaceRisks[workspaceKey] || workspaceRisks["abc-technologies"];`,
  `  const [risks, setRisks] = require("react").useState<any[]>([]);
  const [loading, setLoading] = require("react").useState(true);

  require("react").useEffect(() => {
    if (currentWorkspace?.id) {
      require("@/actions/risks").getRisks(currentWorkspace.id).then((res: any) => {
        if (res.success && res.data) {
          setRisks(res.data.map((r: any) => ({...r, dueDate: r.due_date, residualScore: r.residual_score, residualLevel: r.residual_level})));
        }
        setLoading(false);
      });
    } else {
      setRisks([]);
      setLoading(false);
    }
  }, [currentWorkspace?.id]);`
);

content = content.replace(
  `  const critical = risks.filter((risk) => risk.level === "Critical").length;`,
  `  if (loading) return <div className="p-8 text-center text-slate-500">Loading risks...</div>;
  const critical = risks.filter((risk) => risk.level === "Critical").length;`
);

fs.writeFileSync('src/app/risk-management/page.tsx', content);

// Now patch audits/[id]/risks/page.tsx
let content2 = fs.readFileSync('src/app/audits/[id]/risks/page.tsx', 'utf8');
content2 = content2.replace(
  `  const [risks, setRisks] = useState<Risk[]>(INITIAL_RISKS);`,
  `  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = require('next/navigation').useParams();
  const { currentWorkspace } = require('@/context/WorkspaceContext').useWorkspace();
  
  require('react').useEffect(() => {
    if (currentWorkspace?.id && params.id) {
      require('@/actions/risks').getRisks(currentWorkspace.id, params.id as string).then((res: any) => {
        if (res.success && res.data) {
          setRisks(res.data.map((r: any) => ({...r, dueDate: r.due_date, residualScore: r.residual_score, residualLevel: r.residual_level})));
        }
        setLoading(false);
      });
    } else {
      setRisks([]);
      setLoading(false);
    }
  }, [currentWorkspace?.id, params.id]);`
);

content2 = content2.replace(
  `  const filteredRisks = useMemo(() => {`,
  `  if (loading) return <div className="p-8 text-center text-slate-500">Loading risks...</div>;
  const filteredRisks = useMemo(() => {`
);
fs.writeFileSync('src/app/audits/[id]/risks/page.tsx', content2);
console.log("Patched risks.");
