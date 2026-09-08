const fs = require('fs');
let content = fs.readFileSync('src/app/evidence/page.tsx', 'utf8');

content = content.replace(
  `  const [evidence, setEvidence] =
    useState<Evidence[]>(INITIAL_EVIDENCE);`,
  `  const { currentWorkspace } = require('@/context/WorkspaceContext').useWorkspace();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  require("react").useEffect(() => {
    if (currentWorkspace?.id) {
      require("@/actions/evidence").getEvidences(currentWorkspace.id).then((res: any) => {
        if (res.success && res.data) {
          setEvidence(res.data.map((e: any) => ({...e, evidenceId: e.reference, uploadedBy: e.uploaded_by, uploaded: e.date})));
        }
        setLoading(false);
      });
    } else {
      setEvidence([]);
      setLoading(false);
    }
  }, [currentWorkspace?.id]);`
);

content = content.replace(
  `  const filteredEvidence = useMemo(() => {`,
  `  if (loading) return <div className="p-8 text-center text-slate-500">Loading evidence...</div>;
  const filteredEvidence = useMemo(() => {`
);

fs.writeFileSync('src/app/evidence/page.tsx', content);
