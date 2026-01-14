'use client';

/**
 * TimeSeriesChart - Shared presentational component
 * 
 * Displays time-series data with optional comparison line.
 * Used in Analytics and CRM for trends visualization.
 * 
 * Does not fetch data - parent provides series data.
 */

import { motion } from 'framer-motion';

export interface DataPoint {
  label: string;
  value: number;
  compareValue?: number;
}

export interface TimeSeriesChartProps {
  title?: string;
  data: DataPoint[];
  primaryColor?: string;
  compareColor?: string;
  primaryLabel?: string;
  compareLabel?: string;
  height?: number;
  showDots?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  testId?: string;
}

export function TimeSeriesChart({
  title,
  data,
  primaryColor = '#39FF14',
  compareColor = '#4A5568',
  primaryLabel = 'Current',
  compareLabel = 'Previous',
  height = 160,
  showDots = true,
  showGrid = true,
  animate = true,
  testId,
}: TimeSeriesChartProps) {
  if (data.length === 0) return null;
  
  const allValues = data.flatMap(d => [d.value, d.compareValue || 0]);
  const maxValue = Math.max(...allValues) || 1;
  
  const hasCompare = data.some(d => d.compareValue !== undefined);
  
  // Generate path points
  const generatePath = (getValue: (d: DataPoint) => number) => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 280 + 10;
      const y = 120 - (getValue(d) / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');
  };
  
  const primaryPath = generatePath(d => d.value);
  const comparePath = hasCompare ? generatePath(d => d.compareValue || 0) : '';
  
  return (
    <div data-testid={testId}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-white/70">{title}</h4>
          {hasCompare && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span className="text-white/50">{primaryLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: compareColor }} />
                <span className="text-white/50">{compareLabel}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="relative" style={{ height }}>
        <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
          {/* Grid lines */}
          {showGrid && [0, 30, 60, 90, 120].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="300"
              y2={y}
              stroke="#1E262E"
              strokeWidth="1"
            />
          ))}
          
          {/* Compare line (if exists) */}
          {hasCompare && (
            <motion.polyline
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              fill="none"
              stroke={compareColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={comparePath}
            />
          )}
          
          {/* Primary line */}
          <motion.polyline
            initial={animate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={primaryPath}
          />
          
          {/* Dots on primary line */}
          {showDots && data.map((d, i) => (
            <motion.circle
              key={i}
              initial={animate ? { opacity: 0, r: 0 } : false}
              animate={{ opacity: 1, r: 4 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              cx={(i / (data.length - 1)) * 280 + 10}
              cy={120 - (d.value / maxValue) * 100}
              fill={primaryColor}
            />
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-white/40">
          {data.map((d, i) => (
            <span key={i} className={i === 0 || i === data.length - 1 ? '' : 'hidden md:inline'}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesChart;
