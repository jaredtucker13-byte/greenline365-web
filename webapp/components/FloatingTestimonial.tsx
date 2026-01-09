'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function FloatingTestimonial() {
  const [isMinimized, setIsMinimized] = useState(false);
  
  return (
    <motion.div
      className="fixed bottom-8 left-8 z-50 max-w-sm"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
    >
      <motion.div
        className="glass-strong rounded-2xl p-6 border border-neon-green-500/20 shadow-2xl"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {!isMinimized ? (
          <>
            {/* Close/Minimize Button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            {/* Rating */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-neon-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            {/* Quote */}
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              "GreenLine365 transformed our lead generation. We went from 10 qualified leads per month to over 50. The AI finds prospects we didn't even know existed."
            </p>
            
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                <span className="text-neon-green-500 font-semibold text-sm">MK</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Michael K.</div>
                <div className="text-white/50 text-xs">CEO, TechFlow Solutions</div>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-10 h-10 rounded-full bg-neon-green-500/20 flex items-center justify-center">
              <span className="text-neon-green-500 font-semibold text-sm">MK</span>
            </div>
            <div className="text-left flex-1">
              <div className="text-white font-semibold text-sm">Success Story</div>
              <div className="text-white/50 text-xs">Click to read</div>
            </div>
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
