const fs = require('fs');
let code = fs.readFileSync('src/context/AuditContext.tsx', 'utf8');

code = code.replace(/const refreshAudits = useCallback\(async \(\) => \{[\s\S]*?\}, \[currentWorkspace\?.id\]\);/, `  const refreshAudits = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setAudits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getAudits(currentWorkspace.id);
    if (res.success && res.data) {
      const mapped = (res.data as Record<string, unknown>[]).map(a => ({
        ...a,
        startDate: a.start_date,
        dueDate: a.due_date
      }));
      setAudits(mapped as Audit[]);
    }
    setLoading(false);
  }, [currentWorkspace?.id]);`);

// Fix missing deps in effect
code = code.replace(/useEffect\(\(\) => \{\n    refreshAudits\(\);\n  \}, \[refreshAudits\]\);/, `  useEffect(() => {
    refreshAudits();
  }, [refreshAudits]);`);

fs.writeFileSync('src/context/AuditContext.tsx', code);
