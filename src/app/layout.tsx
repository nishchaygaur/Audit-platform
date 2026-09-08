import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { AuditProvider } from "@/context/AuditContext";
import { AuthProvider } from "@/context/AuthContext";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Audit Platform",
  description: "Cybersecurity Audit and GRC Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getSession();
  
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-[#f6f8fc]">
        <AuthProvider initialUser={session?.user || null}>
          <WorkspaceProvider>
            <Sidebar />
            <AuditProvider>
            {children}
            </AuditProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
