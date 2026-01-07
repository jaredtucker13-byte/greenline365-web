import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Allow production builds to complete even with type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Allow production builds to complete even with lint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
