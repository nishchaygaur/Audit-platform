import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { AuditProvider } from "@/context/AuditContext";

export const metadata: Metadata = {
  title: "Audit Platform",
  description: "Cybersecurity Audit and GRC Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f8fc]">
        <WorkspaceProvider>
          <Sidebar />
          <AuditProvider>
          {children}
          </AuditProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}