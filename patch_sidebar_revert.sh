#!/bin/bash
sed -i 's/const { user } = useAuth();//' src/components/layout/Sidebar.tsx
sed -i 's/import { useAuth } from "@\/context\/AuthContext";//' src/components/layout/Sidebar.tsx
perl -0777 -pi -e 's/>\{user\?\.name \? user\.name\.substring\(0, 2\)\.toUpperCase\(\) : "U"\}\</>AS</g' src/components/layout/Sidebar.tsx
perl -0777 -pi -e 's/>\{user\?\.name \|\| "Unknown User"\}</>Alice Smith</g' src/components/layout/Sidebar.tsx
perl -0777 -pi -e 's/>\{user\?\.role \|\| "Viewer"\}</>Workspace Admin</g' src/components/layout/Sidebar.tsx
