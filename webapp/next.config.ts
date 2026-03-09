import type { NextConfig } from "next";

const securityHeaders = [
  {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
  },
  {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
  },
  {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
  },
  {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
  },
  {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(self), geolocation=()',
  },
  ];

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
                      hostname: 'static.prod-images.emergentagent.com',
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
            {
                      protocol: 'https',
                      hostname: 'images.unsplash.com',
                      pathname: '/**',
            },
            {
                      protocol: 'https',
                      hostname: 'places.googleapis.com',
                      pathname: '/**',
            },
                ],
          unoptimized: false,
    },
    // Performance optimizations
    compiler: {
          removeConsole: process.env.NODE_ENV === 'production',
    },
    async headers() {
          return [
            {
                      // Apply security headers to all routes
                    source: '/(.*)',
                      headers: securityHeaders,
            },
                ];
    },
};

export default nextConfig;
