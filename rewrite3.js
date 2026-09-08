const fs = require('fs');

let content = fs.readFileSync('src/app/administration/page.tsx', 'utf8');

// 1. Strip out the massive workspaceUsers block
const startMock = content.indexOf('const workspaceUsers: Record<string, PlatformUser[]> = {');
const endMock = content.indexOf('const roleDescriptions: Record<Role, string> = {');

if (startMock !== -1 && endMock !== -1) {
  content = content.substring(0, startMock) + content.substring(endMock);
}

// 2. Replace the exact useEffect block
const oldUseEffect = `  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers(
      JSON.parse(
        JSON.stringify(workspaceUsers[currentWorkspace.id] ?? [])
      )
    );
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  }, [currentWorkspace.id]);`;

const newUseEffect = `  useEffect(() => {
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

content = content.replace(oldUseEffect, newUseEffect);

fs.writeFileSync('src/app/administration/page.tsx', content, 'utf8');
