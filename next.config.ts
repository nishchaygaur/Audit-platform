import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs", "pg"],
  reactCompiler: false,
};

export default nextConfig;
