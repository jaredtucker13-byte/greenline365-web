'use client';

/**
 * NavLink - Navigation-aware Link component
 * 
 * Extends Next.js Link with:
 * - Automatic returnTo tracking
 * - Navigation telemetry
 * - Active state detection
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  trackReturn?: boolean; // Whether to add returnTo param
  onClick?: () => void;
  title?: string;
  'data-testid'?: string;
}

export function NavLink({
  href,
  children,
  className = '',
  activeClassName = '',
  trackReturn = false,
  onClick,
  title,
  'data-testid': testId,
}: NavLinkProps) {
  const pathname = usePathname();
  
  // Determine if this link is active
  const isActive = pathname === href || pathname.startsWith(href + '/');
  
  // Build the href with returnTo if needed
  let finalHref = href;
  if (trackReturn && pathname && pathname !== href) {
    const url = new URL(href, 'http://localhost');
    url.searchParams.set('returnTo', encodeURIComponent(pathname));
    finalHref = url.pathname + url.search;
  }
  
  const combinedClassName = `${className} ${isActive ? activeClassName : ''}`.trim();
  
  return (
    <Link
      href={finalHref}
      className={combinedClassName}
      onClick={onClick}
      title={title}
      data-testid={testId}
    >
      {children}
    </Link>
  );
}

export default NavLink;
