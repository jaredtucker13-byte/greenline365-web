'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Hide footer on dashboard routes
  const isDashboardRoute = pathname?.startsWith('/admin-v2') || 
                           pathname?.startsWith('/dashboard') || 
                           pathname?.startsWith('/god-mode');

  if (isDashboardRoute) {
    return null;
  }

  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-white">Green</span>
              <span className="text-emerald-400">Line365</span>
            </Link>
            <p className="mt-4 text-white/50 text-sm">
              Your AI-assisted planning and accountability partner.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-white/50 hover:text-white transition text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="text-white/50 hover:text-white transition text-sm">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/50 hover:text-white transition text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/demo-calendar" className="text-white/50 hover:text-white transition text-sm">
                  Book Demo
                </Link>
              </li>
              <li>
                <Link href="/register-business" className="text-white/50 hover:text-white transition text-sm">
                  Add Your Business
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-white/50 hover:text-white transition text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/50 hover:text-white transition text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-white/50 hover:text-white transition text-sm">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="text-white/50 hover:text-white transition text-sm">
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition text-sm">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition text-sm">
                  LinkedIn
                </a>
              </li>
              <li>
                <Link href="/support" className="text-white/50 hover:text-white transition text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} GreenLine365. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white/40 hover:text-white/60 transition text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-white/60 transition text-sm">
              Terms of Service
            </Link>
            <Link href="/trust" className="text-white/40 hover:text-white/60 transition text-sm">
              Trust & Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
