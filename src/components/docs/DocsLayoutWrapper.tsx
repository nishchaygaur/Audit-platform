"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface DocsLayoutWrapperProps {
  children: ReactNode;
}

export default function DocsLayoutWrapper({ children }: DocsLayoutWrapperProps) {
  const { user } = useAuth();

  return (
    <div
      className={`min-h-screen bg-[#f8fafc] text-[#111827] transition-[margin] duration-150 ${
        user ? "ml-[250px]" : "ml-0"
      }`}
    >
      {children}
    </div>
  );
}
