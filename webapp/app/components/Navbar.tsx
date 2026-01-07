'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-white">Green</span>
            <span className="text-emerald-400">Line365</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white/70 hover:text-white transition">
              Home
            </Link>
            <Link href="/about" className="text-white/70 hover:text-white transition">
              About
            </Link>
            <Link href="/pricing" className="text-white/70 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/support" className="text-white/70 hover:text-white transition">
              Support
            </Link>
            <button
              onClick={scrollToBooking}
              className="px-5 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition"
            >
              Book Demo
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-3">
            <Link href="/" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/about" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/pricing" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/support" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Support
            </Link>
            <button
              onClick={scrollToBooking}
              className="w-full px-5 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition"
            >
              Book Demo
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
