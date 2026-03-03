'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isDashboardRoute } from '@/lib/navigation/navConfig';

/**
 * Phase 6: Redesigned Footer
 * Dark background with circuit board pattern, glassmorphism sections,
 * and neon gold links with glow on hover.
 */
export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard routes (single-source config)
  if (isDashboardRoute(pathname)) {
    return null;
  }

  return (
    <footer className="relative bg-[#030812] border-t border-gold/10 overflow-hidden">
      {/* Circuit board pattern background */}
      <div className="circuit-bg absolute inset-0 opacity-[0.07]" />

      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="text-2xl font-display font-bold">
                <span className="text-white">Green</span>
                <span className="text-gold group-hover:text-shadow-gold transition-all duration-300">Line365</span>
              </span>
            </Link>
            <p className="mt-3 text-white/40 text-sm leading-relaxed">
              The operating system for the local economy. AI-powered tools to grow your business.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
              </span>
              <span className="text-[10px] text-gold/60 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-5">Product</h4>
            <ul className="space-y-3">
              {[
                { href: '/services', label: 'Services' },
                { href: '/loops', label: 'Local Experiences' },
                { href: '/home-ledger', label: 'Home Ledger' },
                { href: '/use-cases', label: 'Use Cases' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/demo-calendar', label: 'Book Demo' },
                { href: '/register-business', label: 'Add Your Business' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-gold text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { href: '/about', label: 'About' },
                { href: '/blog', label: 'Blog' },
                { href: '/support', label: 'Support' },
                { href: '/newsletter', label: 'Newsletter' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-gold text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-5">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:greenline365help@gmail.com"
                  className="text-white/40 hover:text-gold text-sm transition-all duration-300 hover:translate-x-1 inline-block"
                >
                  Contact Us
                </a>
              </li>
            </ul>

            {/* Mini CTA */}
            <div className="mt-8 glass rounded-xl p-4 border border-gold/10">
              <p className="text-white/60 text-xs mb-3">Ready to get started?</p>
              <Link
                href="/waitlist"
                className="btn-primary inline-flex items-center justify-center text-xs px-4 py-2 font-medium w-full"
              >
                Join the Waitlist
              </Link>
            </div>
          </div>
        </div>

        {/* Section divider */}
        <div className="section-divider-gold mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} GreenLine365. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/trust', label: 'Trust & Security' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/25 hover:text-gold/60 transition-all duration-300 text-xs"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
