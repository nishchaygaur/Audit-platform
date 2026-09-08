const fs = require('fs');
let content = fs.readFileSync('src/app/workspaces/page.tsx', 'utf8');

content = content.replace(
  /const \[authenticated, setAuthenticated\] = useState\(\(\) => \{[\s\S]*?\}\);/,
  'const { user, loading } = useAuth();'
);

content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[router\]\);/,
  `useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);`
);

content = content.replace(
  /function logout\(\) \{[\s\S]*?router\.push\("\/signin"\);\n  \}/,
  `async function logout() {
    await signOut();
  }`
);

fs.writeFileSync('src/app/workspaces/page.tsx', content);
