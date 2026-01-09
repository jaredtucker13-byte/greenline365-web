'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonTextProps {
  children: ReactNode;
  variant?: 'green' | 'teal' | 'gradient';
  glow?: boolean;
  animate?: boolean;
  className?: string;
}

export function NeonText({
  children,
  variant = 'green',
  glow = false,
  animate = true,
  className,
}: NeonTextProps) {
  const variantStyles = {
    green: 'text-neon-green-500',
    teal: 'text-neon-teal-500',
    gradient: 'text-gradient-neon',
  };
  
  const glowStyles = glow ? 'glow-text' : '';
  
  const classes = cn(
    'font-display font-bold',
    variantStyles[variant],
    glowStyles,
    className
  );
  
  if (!animate) {
    return <span className={classes}>{children}</span>;
  }
  
  return (
    <motion.span
      className={classes}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.span>
  );
}
