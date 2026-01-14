'use client';

/**
 * PageHeader - Consistent header for admin pages
 * 
 * Includes:
 * - Back button (using navigation context)
 * - Breadcrumbs
 * - Page title
 * - Optional actions
 */

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { BackButton, Breadcrumbs, useNavigation } from '@/lib/navigation';

interface PageHeaderProps {
  title: string;
  icon?: string | ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  showBack?: boolean;
  showBreadcrumbs?: boolean;
  backLabel?: string;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({
  title,
  icon,
  subtitle,
  actions,
  showBack = true,
  showBreadcrumbs = true,
  backLabel,
  className = '',
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={`
        border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl z-40
        ${sticky ? 'sticky top-0' : ''}
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Top row: Back + Breadcrumbs */}
        <div className="flex items-center gap-4 mb-3">
          {showBack && (
            <>
              <BackButton variant="text" showTarget />
              <div className="h-4 w-px bg-white/20" />
            </>
          )}
          
          {showBreadcrumbs && (
            <Breadcrumbs showHome={!showBack} />
          )}
        </div>
        
        {/* Main row: Title + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              typeof icon === 'string' 
                ? <span className="text-2xl">{icon}</span>
                : icon
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Simple back link for pages that don't use the full header
 */
export function SimpleBackLink({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <BackButton variant="text" showTarget />
    </div>
  );
}

export default PageHeader;
