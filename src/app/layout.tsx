import type { Metadata } from "next";
import "./globals.css";
import { Suspense, type ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { AuditProvider } from "@/context/AuditContext";
import { AuthProvider } from "@/context/AuthContext";
import { getSession } from "@/lib/auth";
import { getUserWorkspaces } from "@/actions/workspace";
import TopProgressBar from "@/components/common/TopProgressBar";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('audit_theme');
                  var theme = stored || 'dark';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f6f8fc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <ThemeProvider>
          <AuthProvider initialUser={session ? session.user : null}>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
