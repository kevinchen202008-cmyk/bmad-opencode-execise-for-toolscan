import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configures Next.js to compile as a standalone app, which is required for Docker deployments
  // It minimizes the output size by bundling only necessary node_modules
  output: 'standalone',
  // Disable type-checking and ESLint during build for faster CI/CD since they are run manually before merge
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
