'use client';

/**
 * KPICard - Shared presentational component
 * 
 * Used by both CRM Dashboard and Analytics pages.
 * Displays a single metric with optional trend, sparkline, and drill action.
 * 
 * Data source agnostic - parent provides data from either:
 * - coreApi (for per-user/record metrics)
 * - analyticsApi (for aggregate/cohort metrics)
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface KPICardProps {
  // Core display
  title: string;
  value: string | number;
  icon?: ReactNode | string;
  
  // Trend indicator
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  
  // Styling
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  
  // Sparkline data (optional)
  sparkline?: number[];
  
  // Metadata (from analytics API)
  meta?: {
    lastProcessedAt?: string;
    cacheTtlSec?: number;
    source?: string;
  };
  
  // Actions
  onDrill?: () => void;
  
  // Animation
  delay?: number;
  
  // Test ID
  testId?: string;
}

const colorConfig = {
  emerald: {
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    sparkline: '#10B981',
  },
  blue: {
    gradient: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    sparkline: '#3B82F6',
  },
  purple: {
    gradient: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    sparkline: '#A855F7',
  },
  amber: {
    gradient: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    sparkline: '#F59E0B',
  },
  red: {
    gradient: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-500/20',
    sparkline: '#EF4444',
  },
  cyan: {
    gradient: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    sparkline: '#06B6D4',
  },
};

const sizeConfig = {
  sm: { card: 'p-4', value: 'text-2xl', title: 'text-xs', icon: 'w-8 h-8 text-sm' },
  md: { card: 'p-5', value: 'text-3xl', title: 'text-sm', icon: 'w-10 h-10 text-lg' },
  lg: { card: 'p-6', value: 'text-4xl', title: 'text-base', icon: 'w-12 h-12 text-xl' },
};

export function KPICard({
  title,
  value,
  icon,
  trend,
  color = 'emerald',
  size = 'md',
  sparkline,
  meta,
  onDrill,
  delay = 0,
  testId,
}: KPICardProps) {
  const colors = colorConfig[color];
  const sizes = sizeConfig[size];
  
  const CardWrapper = onDrill ? motion.button : motion.div;
  
  return (
    <CardWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onDrill}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br ${colors.gradient} 
        border ${colors.border}
        ${sizes.card}
        ${onDrill ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}
        text-left w-full
      `}
      data-testid={testId}
    >
      {/* Icon */}
      <div className={`absolute top-3 right-3 ${sizes.icon} rounded-full ${colors.iconBg} flex items-center justify-center`}>
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>
      
      {/* Title */}
      <div className={`${colors.text} opacity-60 ${sizes.title} font-medium mb-1`}>
        {title}
      </div>
      
      {/* Value */}
      <div className={`${sizes.value} font-bold text-white mb-2`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span className={
            trend.direction === 'up' ? 'text-emerald-400' :
            trend.direction === 'down' ? 'text-red-400' : 'text-white/50'
          }>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
          </span>
          {trend.label && <span className="text-white/30">{trend.label}</span>}
        </div>
      )}
      
      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
          <Sparkline data={sparkline} color={colors.sparkline} />
        </div>
      )}
      
      {/* Meta indicator (shows data freshness) */}
      {meta?.lastProcessedAt && (
        <div className="absolute bottom-2 right-2">
          <div 
            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" 
            title={`Last updated: ${new Date(meta.lastProcessedAt).toLocaleString()}`}
          />
        </div>
      )}
      
      {/* Drill indicator */}
      {onDrill && (
        <div className="absolute bottom-3 right-3 text-white/30 text-xs">
          Click to drill →
        </div>
      )}
    </CardWrapper>
  );
}

// Simple SVG sparkline component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 30 - ((value - min) / range) * 25;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default KPICard;
