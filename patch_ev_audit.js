const fs = require('fs');
let content = fs.readFileSync('src/app/audits/[id]/evidence/page.tsx', 'utf8');

content = content.replace(
  `  const [evidenceByWorkspace, setEvidenceByWorkspace] =
    useState<Record<string, Evidence[]>>(INITIAL_EVIDENCE);`,
  `  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  
  useEffect(() => {
    if (workspaceId && params.id) {
      getEvidences(workspaceId, params.id as string).then((res: any) => {
        if (res.success && res.data) {
          setEvidence(res.data.map((e: any) => ({...e, evidenceId: e.reference, uploadedBy: e.uploaded_by, uploaded: e.date})));
        }
        setLoading(false);
      });
    } else {
      setEvidence([]);
      setLoading(false);
    }
  }, [workspaceId, params.id]);`
);

content = content.replace(
  `  const evidence = evidenceByWorkspace[workspaceId] ?? [];`,
  `  if (loading) return <div className="p-8 text-center text-slate-500">Loading evidence...</div>;`
);

fs.writeFileSync('src/app/audits/[id]/evidence/page.tsx', content);
