'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-white/40 flex items-center gap-2 flex-wrap">
      <Link href="/" className="hover:text-gold transition-colors duration-300">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-white/20">/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-gold transition-colors duration-300">{item.label}</Link>
          ) : (
            <span className="text-white/60">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
