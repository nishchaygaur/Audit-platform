const fs = require('fs');

const content = `
import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";

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
      <body>
        {children}
      </body>
    </html>
  );
}
`;

fs.writeFileSync('src/app/layout.tsx', content);
