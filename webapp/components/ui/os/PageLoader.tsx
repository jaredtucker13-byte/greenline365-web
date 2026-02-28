'use client';

import { motion } from 'framer-motion';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading' }: PageLoaderProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      {/* Animated GL365 mark */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner spinning arc */}
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-gold border-r-gold"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(201, 168, 76, 0.5))' }}
        />
        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-gold shadow-gold-sm" />
        </motion.div>
      </div>

      {/* Animated text */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-silver/80 font-body tracking-wide">{message}</span>
        <motion.span
          className="text-sm text-gold"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ...
        </motion.span>
      </div>
    </div>
  );
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative w-5 h-5">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 4px rgba(201, 168, 76, 0.3))' }}
        />
      </div>
      {message && <span className="text-sm text-silver/70 font-body">{message}</span>}
    </div>
  );
}
