const fs = require('fs');

const path = 'src/app/audits/[id]/evidence/page.tsx';
let content = fs.readFileSync(path, 'utf8');

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

fs.writeFileSync(path, content);
