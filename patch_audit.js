const fs = require('fs');

function replace(path, searchRe, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(searchRe, replacement);
  fs.writeFileSync(path, content);
}

replace('src/app/audits/[id]/findings/page.tsx', 
  /const \[findingsByWorkspace, setFindingsByWorkspace\] =[\s\n]*useState<Record<string, Finding\[\]>>\(INITIAL_FINDINGS\);/m, 
  `const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  
  useEffect(() => {
    if (workspaceId && params.id) {
      getFindings(workspaceId, params.id as string).then((res: any) => {
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

replace('src/app/audits/[id]/evidence/page.tsx', 
  /const \[evidenceByWorkspace, setEvidenceByWorkspace\] =[\s\n]*useState<Record<string, Evidence\[\]>>\(INITIAL_EVIDENCE\);/m, 
  `const [evidence, setEvidence] = useState<any[]>([]);
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
