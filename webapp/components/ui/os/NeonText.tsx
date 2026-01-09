'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonTextProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
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
  ...props
}: NeonTextProps) {
  const variantStyles = {
    green: 'text-neon-green-500',
    teal: 'text-neon-teal-500',
    gradient: 'text-gradient-neon',
  };
  
  const glowStyles = glow ? 'glow-text' : '';
  
  const Component = animate ? motion.span : 'span';
  const motionProps = animate ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  } : {};
  
  return (
    <Component
      className={cn(
        'font-display font-bold',
        variantStyles[variant],
        glowStyles,
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
}
