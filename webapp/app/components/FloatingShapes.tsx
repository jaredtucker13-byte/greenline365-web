'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function FloatingShapes() {
  const { scrollY } = useScroll();
  
  // Parallax transforms for different shapes
  const y1 = useTransform(scrollY, [0, 3000], [0, -600]);
  const y2 = useTransform(scrollY, [0, 3000], [0, -400]);
  const y3 = useTransform(scrollY, [0, 3000], [0, -800]);
  const rotate1 = useTransform(scrollY, [0, 3000], [0, 180]);
  const rotate2 = useTransform(scrollY, [0, 3000], [0, -120]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large Gradient Orb - Top Right */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px]"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-neon-green-500/10 via-emerald-500/5 to-transparent blur-3xl" />
      </motion.div>

      {/* 3D Cube Shape */}
      <motion.div
        style={{ y: y2, rotate: rotate1 }}
        className="absolute top-[20%] right-[15%]"
      >
        <div className="w-20 h-20 relative preserve-3d">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green-500/20 to-emerald-500/10 rounded-xl border border-neon-green-500/30 backdrop-blur-sm transform rotate-12" />
          <div className="absolute inset-2 bg-gradient-to-br from-neon-green-500/10 to-transparent rounded-lg border border-neon-green-500/20 transform -rotate-6" />
        </div>
      </motion.div>

      {/* Floating Ring */}
      <motion.div
        style={{ y: y3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[40%] left-[10%]"
      >
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-neon-green-500/20" />
      </motion.div>

      {/* Hexagon */}
      <motion.div
        style={{ y: y1, rotate: rotate2 }}
        className="absolute top-[60%] right-[8%]"
      >
        <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-20">
          <polygon
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff00" />
              <stop offset="100%" stopColor="#00aa00" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Small Dots Grid */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[30%] left-[5%] grid grid-cols-4 gap-3 opacity-30"
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-neon-green-500 rounded-full"
          />
        ))}
      </motion.div>

      {/* Triangle */}
      <motion.div
        style={{ y: y3, rotate: rotate1 }}
        className="absolute top-[70%] left-[20%]"
      >
        <svg width="60" height="60" viewBox="0 0 100 100" className="opacity-20">
          <polygon
            points="50,10 90,90 10,90"
            fill="none"
            stroke="#00ff00"
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      {/* Gradient Line */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[50%] right-[5%] w-px h-40 bg-gradient-to-b from-transparent via-neon-green-500/50 to-transparent"
      />

      {/* Circle Outline */}
      <motion.div
        style={{ y: y1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[80%] left-[15%]"
      >
        <div className="w-24 h-24 rounded-full border-2 border-neon-green-500/20" />
      </motion.div>

      {/* Cross Shape */}
      <motion.div
        style={{ y: y3, rotate: rotate2 }}
        className="absolute top-[45%] right-[25%]"
      >
        <div className="relative w-10 h-10">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neon-green-500/30 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-neon-green-500/30 -translate-x-1/2" />
        </div>
      </motion.div>

      {/* Large Circle - Bottom Left */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -bottom-60 -left-60 w-[500px] h-[500px]"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-transparent blur-3xl" />
      </motion.div>

      {/* Floating Code Bracket */}
      <motion.div
        style={{ y: y2 }}
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[25%] left-[25%] text-4xl text-neon-green-500/20 font-mono"
      >
        {'{ }'}
      </motion.div>

      {/* Data Points Path */}
      <motion.svg
        style={{ y: y3 }}
        className="absolute top-[55%] left-[30%] w-40 h-20 opacity-20"
        viewBox="0 0 160 80"
      >
        <motion.path
          d="M0,60 Q40,20 80,40 T160,20"
          fill="none"
          stroke="#00ff00"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
        <circle cx="0" cy="60" r="4" fill="#00ff00" />
        <circle cx="80" cy="40" r="4" fill="#00ff00" />
        <circle cx="160" cy="20" r="4" fill="#00ff00" />
      </motion.svg>

      {/* Pulse Ring */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-[35%] right-[35%] w-16 h-16 rounded-full border border-neon-green-500/50"
      />
    </div>
  );
}
