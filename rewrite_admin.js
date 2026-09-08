const fs = require('fs');

let content = fs.readFileSync('src/app/administration/page.tsx', 'utf8');

// Remove the `workspaceUsers` mock data entirely.
const mockDataStart = content.indexOf('const workspaceUsers: Record<string, PlatformUser[]> = {');
const mockDataEndStr = '  },\n};\n';
const mockDataEnd = content.indexOf(mockDataEndStr, mockDataStart) + mockDataEndStr.length;

if (mockDataStart !== -1 && mockDataEnd !== -1) {
  content = content.substring(0, mockDataStart) + content.substring(mockDataEnd);
}

// Replace the useEffect that sets users from workspaceUsers
content = content.replace(
  /useEffect\(\(\) => \{\s*\/\/[^\n]*\s*setUsers\([^)]*\)\s*\);\s*setSearch\(""\);\s*setRoleFilter\("All"\);\s*setStatusFilter\("All"\);\s*\}, \[currentWorkspace\.id\]\);/ms,
  `useEffect(() => {
    import('@/actions/workspace').then(({ getWorkspaceMembers }) => {
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

fs.writeFileSync('src/app/administration/page.tsx', content, 'utf8');
