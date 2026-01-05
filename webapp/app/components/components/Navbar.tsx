'use client';

import Link from 'next/link';

export function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href="/">GreenLine365</Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/about">About</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/use-cases">Use cases</Link>
        <Link href="/why-this-matters">Why this matters</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/support">Support</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </header>
  );
}