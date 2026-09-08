import type { Metadata } from "next";
import "./globals.css";
import { Suspense, type ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { AuditProvider } from "@/context/AuditContext";
import { AuthProvider } from "@/context/AuthContext";
import { getSession } from "@/lib/auth";
import { getUserWorkspaces } from "@/actions/workspace";

export const metadata: Metadata = {
  title: "Audit Platform",
  description: "Cybersecurity Audit and GRC Platform",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getSession();
  const initialWorkspaces = session ? await getUserWorkspaces() : [];
  
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f8fc]">
        <AuthProvider initialUser={session?.user as any || null}>
          <WorkspaceProvider initialWorkspaces={initialWorkspaces}>
            <AuditProvider>
              <div className="flex h-screen overflow-hidden">
                <Suspense fallback={null}>
                  <Sidebar />
                </Suspense>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </AuditProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
