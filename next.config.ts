import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "pg", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
  reactCompiler: false,
};

export default nextConfig;
