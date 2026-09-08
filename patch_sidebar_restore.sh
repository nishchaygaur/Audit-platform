#!/bin/bash
sed -i 's/export default function Sidebar() {/export default function Sidebar() {  const { user } = useAuth();/' src/components/layout/Sidebar.tsx
sed -i 's/import { usePathname, useRouter } from "next\/navigation";/import { usePathname, useRouter } from "next\/navigation";\nimport { useAuth } from "@\/context\/AuthContext";/' src/components/layout/Sidebar.tsx
perl -0777 -pi -e 's/>AS</>{user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}</g' src/components/layout/Sidebar.tsx
perl -0777 -pi -e 's/>Alice Smith</>{user?.name || "Unknown User"}</g' src/components/layout/Sidebar.tsx
perl -0777 -pi -e 's/>Workspace Admin</>{user?.role || "Viewer"}</g' src/components/layout/Sidebar.tsx
