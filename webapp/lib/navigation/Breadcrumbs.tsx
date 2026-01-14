'use client';

/**
 * Breadcrumbs - Navigation breadcrumb component
 * 
 * Displays the current location in the page hierarchy.
 * Uses NavigationContext for breadcrumb data.
 */

import React from 'react';
import Link from 'next/link';
import { useNavigation } from './NavigationContext';

interface BreadcrumbsProps {
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

export function Breadcrumbs({
  className = '',
  separator = '>',
  showHome = true,
}: BreadcrumbsProps) {
  const { breadcrumbs, returnTo, createLink } = useNavigation();
  
  if (breadcrumbs.length === 0) return null;
  
  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;
        
        // Skip home if not showing it
        if (isFirst && !showHome && crumb.path === '/admin-v2') {
          return null;
        }
        
        return (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <span className="text-white/30 mx-1">{separator}</span>
            )}
            {isLast ? (
              <span className="text-white font-medium">{crumb.title}</span>
            ) : (
              <Link
                href={createLink(crumb.path, true)}
                className="text-white/60 hover:text-white transition"
              >
                {crumb.title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
      
      {/* Show origin indicator if returnTo exists */}
      {returnTo && (
        <span className="text-white/30 text-xs ml-2">
          (from: {returnTo.split('/').pop()})
        </span>
      )}
    </nav>
  );
}

export default Breadcrumbs;
