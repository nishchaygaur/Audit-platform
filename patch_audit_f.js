const fs = require('fs');

const path = 'src/app/audits/[id]/findings/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace state
content = content.replace(
  `  const [findingsByWorkspace, setFindingsByWorkspace] =
    useState<Record<string, Finding[]>>(INITIAL_FINDINGS);`,
  `  const [findings, setFindings] = useState<any[]>([]);
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

fs.writeFileSync(path, content);
