'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'strong' | 'green' | 'teal';
  hover?: boolean;
  glow?: 'green' | 'teal' | 'none';
  className?: string;
}

export function GlassCard({
  children,
  variant = 'default',
  hover = true,
  glow = 'none',
  className,
  ...props
}: GlassCardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300';
  
  const variantStyles = {
    default: 'glass',
    strong: 'glass-strong',
    green: 'glass-green',
    teal: 'glass-teal',
  };
  
  const glowStyles = {
    green: 'shadow-neon-green',
    teal: 'shadow-neon-teal',
    none: '',
  };
  
  const hoverStyles = hover ? 'card-hover' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        baseStyles,
        variantStyles[variant],
        glowStyles[glow],
        hoverStyles,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Specialized Glass Panel with OS styling
export function OSPanel({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'variant'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn('os-panel p-6', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
