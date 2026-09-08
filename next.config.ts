import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],
  reactCompiler: false,
};
export default nextConfig;
