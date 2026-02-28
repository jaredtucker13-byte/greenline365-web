'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'dots' | 'ring';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-6 h-6', text: 'text-xs', dot: 'w-1.5 h-1.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-2 h-2' },
  lg: { container: 'w-16 h-16', text: 'text-base', dot: 'w-2.5 h-2.5' },
  xl: { container: 'w-24 h-24', text: 'text-lg', dot: 'w-3 h-3' },
};

export function LoadingSpinner({ size = 'md', variant = 'spinner', label, className = '' }: LoadingSpinnerProps) {
  const s = sizeMap[size];

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${s.dot} rounded-full bg-gold`}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
        {label && <p className={`${s.text} text-silver font-body`}>{label}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <motion.div
          className={`${s.container} rounded-full bg-gold/20 border border-gold/40`}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6], boxShadow: ['0 0 0px rgba(201,168,76,0.2)', '0 0 24px rgba(201,168,76,0.4)', '0 0 0px rgba(201,168,76,0.2)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {label && <p className={`${s.text} text-silver font-body`}>{label}</p>}
      </div>
    );
  }

  if (variant === 'ring') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className={`${s.container} relative`}>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold/20"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold/20"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gold shadow-gold-sm" />
          </div>
        </div>
        {label && <p className={`${s.text} text-silver font-body`}>{label}</p>}
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`${s.container} relative`}>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold/10"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(201, 168, 76, 0.4))' }}
        />
      </div>
      {label && <p className={`${s.text} text-silver font-body`}>{label}</p>}
    </div>
  );
}
