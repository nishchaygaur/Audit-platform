const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(/export default async function RootLayout/, 'export default function RootLayout');
code = code.replace(/const session = await getSession\(\);/, 'const session = null;');
code = code.replace(/const initialWorkspaces = session \? await getUserWorkspaces\(\) : \[\];/, 'const initialWorkspaces = [];');

fs.writeFileSync('src/app/layout.tsx', code);
