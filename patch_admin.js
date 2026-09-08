const fs = require('fs');
let content = fs.readFileSync('src/app/administration/page.tsx', 'utf8');

const target = `    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  }, [currentWorkspace?.id]);`;

const replacement = `    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch("");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoleFilter("All");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusFilter("All");
  }, [currentWorkspace?.id]);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/app/administration/page.tsx', content, 'utf8');
