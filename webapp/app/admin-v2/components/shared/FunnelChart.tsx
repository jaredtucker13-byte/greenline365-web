'use client';

/**
 * FunnelChart - Shared presentational component
 * 
 * Displays a conversion funnel with multiple stages.
 * Used in CRM (lead funnel, email funnel) and Analytics.
 */

import { motion } from 'framer-motion';

export interface FunnelStage {
  label: string;
  value: number;
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan';
}

export interface FunnelChartProps {
  title?: string;
  stages: FunnelStage[];
  showPercentages?: boolean;
  showConversionRate?: boolean;
  animate?: boolean;
  testId?: string;
}

const colorClasses = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
};

export function FunnelChart({
  title,
  stages,
  showPercentages = true,
  showConversionRate = true,
  animate = true,
  testId,
}: FunnelChartProps) {
  if (stages.length === 0) return null;
  
  const maxValue = stages[0]?.value || 1;
  
  // Calculate conversion rate (first to last stage)
  const conversionRate = maxValue > 0 
    ? ((stages[stages.length - 1]?.value || 0) / maxValue * 100).toFixed(1)
    : '0';
  
  return (
    <div className="space-y-3" data-testid={testId}>
      {title && (
        <h4 className="text-sm font-medium text-white/70 mb-3">{title}</h4>
      )}
      
      {stages.map((stage, idx) => {
        const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
        const color = stage.color || ['blue', 'purple', 'emerald'][idx % 3] as 'blue' | 'purple' | 'emerald';
        
        return (
          <div key={stage.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">{stage.label}</span>
              <span className="text-white/50">
                {stage.value.toLocaleString()}
                {showPercentages && idx > 0 && (
                  <span className="text-white/30 ml-1">({percentage.toFixed(0)}%)</span>
                )}
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={animate ? { width: 0 } : false}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5, ease: 'easeOut' }}
                className={`h-full ${colorClasses[color]} rounded-full`}
              />
            </div>
          </div>
        );
      })}
      
      {showConversionRate && stages.length >= 2 && (
        <div className="mt-4 text-center pt-3 border-t border-white/10">
          <span className="text-2xl font-bold text-emerald-400">{conversionRate}%</span>
          <span className="text-white/50 text-sm ml-2">Conversion Rate</span>
        </div>
      )}
    </div>
  );
}

export default FunnelChart;
