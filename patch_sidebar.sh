#!/bin/bash
sed -i 's/function handleLogout() {    if (typeof window !== "undefined") {      localStorage.removeItem("audit_authenticated");      localStorage.removeItem("audit_user");    }    setUserMenuOpen(false);    router.push("\/signin");  }/async function handleLogout() {    setUserMenuOpen(false);    await signOut();  }/' src/components/layout/Sidebar.tsx
