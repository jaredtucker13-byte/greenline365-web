import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.aiquickdraw.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.kie.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.microlink.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.thum.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
