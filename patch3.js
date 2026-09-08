const fs = require('fs');
let content = fs.readFileSync('src/app/administration/page.tsx', 'utf8');
content = content.replace(/\r\n/g, '\n');

const newEffect = `  useEffect(() => {
    if (currentWorkspace?.id) {
      import('@/actions/workspace').then(({ getWorkspaceMembers }) => {
        getWorkspaceMembers(currentWorkspace.id).then(members => {
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
    }

    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  }, [currentWorkspace?.id]);`;

const start = content.indexOf('  useEffect(() => {\n    // eslint-disable-next-line react-hooks/set-state-in-effect');
const endStr = '  }, [currentWorkspace.id]);';
const end = content.indexOf(endStr, start) + endStr.length;

if (start !== -1 && end !== -1) {
  content = content.substring(0, start) + newEffect + content.substring(end);
  
  const startMock = content.indexOf('const workspaceUsers: Record<string, PlatformUser[]> = {');
  if (startMock !== -1) {
       const roleDesc = content.indexOf('const roleDescriptions: Record<Role, string> = {');
       if (roleDesc !== -1) {
          content = content.substring(0, startMock) + content.substring(roleDesc);
       }
  }

  fs.writeFileSync('src/app/administration/page.tsx', content, 'utf8');
  console.log("Patched!");
} else {
  console.log("Not found.");
}
