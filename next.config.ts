import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ["bcryptjs", "pg"],
  reactCompiler: false,
};

export default nextConfig;
