const fs = require('fs');

const content = `
import "./globals.css";
import type { ReactNode } from "react";

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
