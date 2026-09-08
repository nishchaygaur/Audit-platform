const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(/<AuthProvider[^>]*>/, '<>');
code = code.replace(/<\/AuthProvider>/, '</>');
code = code.replace(/<WorkspaceProvider[^>]*>/, '<>');
code = code.replace(/<\/WorkspaceProvider>/, '</>');
code = code.replace(/<AuditProvider>/, '<>');
code = code.replace(/<\/AuditProvider>/, '</>');
code = code.replace(/<Sidebar \/>/, '{null}');

fs.writeFileSync('src/app/layout.tsx', code);
