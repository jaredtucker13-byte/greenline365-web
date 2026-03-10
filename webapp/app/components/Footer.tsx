'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isDashboardRoute } from '@/lib/navigation/navConfig';

/**
 * Directory Footer — Public-facing, directory-first layout.
 * 4 columns: Destinations, Popular Categories, For Business Owners, Company.
 */
export default function Footer() {
  const pathname = usePathname();

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
        {/* Brand row */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-2xl font-display font-bold">
              <span className="text-white">Green</span>
              <span className="text-gold group-hover:text-shadow-gold transition-all duration-300">Line365</span>
            </span>
          </Link>
          <p className="mt-3 text-white/40 text-sm leading-relaxed max-w-md">
            Florida&apos;s trusted local business directory — helping visitors and residents discover the best businesses, destinations, and experiences across the state.
          </p>
        </div>

        {/* Main 4-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Destinations */}
          <div>
            <h4 className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-5">Destinations</h4>
            <ul className="space-y-3">
              {[
                { href: '/destination/st-pete-beach', label: 'St. Pete Beach' },
                { href: '/destination/key-west', label: 'Key West' },
                { href: '/destination/sarasota', label: 'Sarasota' },
                { href: '/destination/daytona', label: 'Daytona Beach' },
                { href: '/destination/ybor-city', label: 'Ybor City' },
                { href: '/destination/orlando', label: 'Orlando' },
                { href: '/destination/miami', label: 'Miami' },
                { href: '/destination/jacksonville', label: 'Jacksonville' },
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

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-5">Popular Categories</h4>
            <ul className="space-y-3">
              {[
                { href: '/#categories', label: 'Home Services' },
                { href: '/#categories', label: 'HVAC' },
                { href: '/#categories', label: 'Plumbing' },
                { href: '/#categories', label: 'Electrical' },
                { href: '/#categories', label: 'Roofing' },
                { href: '/#categories', label: 'Automotive' },
                { href: '/#categories', label: 'Professional Services' },
              ].map((link, i) => (
                <li key={`${link.label}-${i}`}>
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

          {/* For Business Owners */}
          <div>
            <h4 className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-5">For Business Owners</h4>
            <ul className="space-y-3">
              {[
                { href: '/register-business', label: 'Add Your Business' },
                { href: '/register-business', label: 'Claim Your Listing' },
                { href: '/dashboard', label: 'Business Dashboard' },
              ].map((link) => (
                <li key={link.label}>
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
                { href: '/contact', label: 'Contact' },
                { href: '/support', label: 'Support' },
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
        </div>

        {/* Section divider */}
        <div className="section-divider-gold mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} GreenLine365. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-gold transition-colors duration-300" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-gold transition-colors duration-300" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-gold transition-colors duration-300" aria-label="X (Twitter)">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>

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
