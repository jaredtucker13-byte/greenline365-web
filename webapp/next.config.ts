import type { NextConfig } from "next";

// ── Security Headers ────────────────────────────────────────────────
// These work alongside Cloudflare's edge security features.
// Cloudflare handles DDoS, WAF, and SSL termination;
// these headers harden the response from our origin.

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
  {
    // Content-Security-Policy — prevents XSS, injection, and unauthorized resource loading
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + inline (Next.js requires it) + eval (dev only via nonce) + trusted CDNs
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://us.posthog.com",
      // Styles: self + inline (Tailwind/framer-motion inject styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: self + all trusted image sources + data URIs + blob for canvas
      "img-src 'self' data: blob: https://*.supabase.co https://static.aiquickdraw.com https://api.microlink.io https://image.thum.io https://api.qrserver.com https://static.prod-images.emergentagent.com https://*.kie.ai https://lh3.googleusercontent.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Connect: API calls to our backends + third party services
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.stripe.com https://api.retellai.com https://us.posthog.com https://api.sendgrid.com https://*.cloudflare.com https://api.cal.com",
      // Frames: Stripe checkout, Cloudflare challenges
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
      // Media: self + Supabase storage
      "media-src 'self' https://*.supabase.co blob:",
      // Workers: self (service workers)
      "worker-src 'self' blob:",
      // Base URI
      "base-uri 'self'",
      // Form targets
      "form-action 'self'",
      // Upgrade insecure requests behind Cloudflare
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Image optimization settings for Cloudflare CDN
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days — Cloudflare will cache at edge
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      {
        protocol: 'https',
        hostname: 'static.prod-images.emergentagent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  // Compress responses — Cloudflare will also apply Brotli at the edge
  compress: true,
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header (security)
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Cache static assets aggressively — Cloudflare will honor these
        source: '/(.*)\\.(js|css|woff2|woff|ttf|ico|svg)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images for 30 days
        source: '/(.*)\\.(png|jpg|jpeg|gif|webp|avif)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
