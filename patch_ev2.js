const fs = require('fs');

function replace(path, searchRe, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(searchRe, replacement);
  fs.writeFileSync(path, content);
}

replace('src/app/evidence/page.tsx', 
  /const \[evidence, setEvidence\] =[\s\n]*useState<Evidence\[\]>\(INITIAL_EVIDENCE\);/m, 
  `const { currentWorkspace } = useWorkspace();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace?.id) {
      getEvidences(currentWorkspace.id).then((res: any) => {
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
