'use client';

/**
 * BackButton - Consistent back navigation button
 * 
 * Uses NavigationContext to determine correct back target.
 * Shows visual indicator of where Back will go.
 */

import React from 'react';
import { useNavigation } from './NavigationContext';

interface BackButtonProps {
  className?: string;
  label?: string;
  showTarget?: boolean; // Show where Back will navigate to
  variant?: 'icon' | 'text' | 'full';
}

export function BackButton({
  className = '',
  label = 'Back',
  showTarget = false,
  variant = 'full',
}: BackButtonProps) {
  const { navigateBack, getReturnTarget, breadcrumbs } = useNavigation();
  
  const target = getReturnTarget();
  const targetName = target === '/admin-v2' 
    ? 'Command Center' 
    : breadcrumbs.find(b => b.path === target)?.title || target.split('/').pop() || 'Back';
  
  const handleClick = () => {
    navigateBack();
  };
  
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-lg hover:bg-white/10 transition ${className}`}
        title={`Back to ${targetName}`}
        aria-label={`Back to ${targetName}`}
      >
        <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
    );
  }
  
  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`text-white/50 hover:text-white transition ${className}`}
      >
        ← {showTarget ? targetName : label}
      </button>
    );
  }
  
  // Full variant
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-white/50 hover:text-white transition ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>{showTarget ? targetName : label}</span>
    </button>
  );
}

export default BackButton;
