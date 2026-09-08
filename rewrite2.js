const fs = require('fs');

let content = fs.readFileSync('src/app/administration/page.tsx', 'utf8');

const start = content.indexOf('const workspaceUsers: Record<string, PlatformUser[]> = {');
const end = content.indexOf('const roleDescriptions: Record<Role, string> = {');

if (start !== -1 && end !== -1) {
  content = content.substring(0, start) + content.substring(end);
}

content = content.replace(
  /useEffect\(\(\) => \{\s*\/\/[^\n]*\s*setUsers\(\s*JSON\.parse\(\s*JSON\.stringify\(\s*workspaceUsers\[currentWorkspace\.id\] \?\? \[\]\s*\)\s*\)\s*\);\s*setSearch\(""\);\s*setRoleFilter\("All"\);\s*setStatusFilter\("All"\);\s*\}, \[currentWorkspace\.id\]\);/ms,
  `import('@/actions/workspace').then(({ getWorkspaceMembers }) => {
      getWorkspaceMembers(currentWorkspace?.id || '').then(members => {
        // Map DB members to PlatformUser format for the UI
        setUsers(members.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role as Role,
          department: "General",
          status: "Active",
          lastLogin: new Date().toISOString().split('T')[0]
        })));
      });
    });
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  }, [currentWorkspace?.id]);`
);
content = content.replace(/  useEffect\(\(\) => \{\s*import/, '  useEffect(() => {\n    import');

fs.writeFileSync('src/app/administration/page.tsx', content, 'utf8');
