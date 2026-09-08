#!/bin/bash
sed -i 's/>AS</>{user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}</' src/components/layout/Sidebar.tsx
sed -i 's/>Alice Smith</>{user?.name || "Unknown User"}</' src/components/layout/Sidebar.tsx
sed -i 's/>Workspace Admin</>{user?.role || "Viewer"}</' src/components/layout/Sidebar.tsx
