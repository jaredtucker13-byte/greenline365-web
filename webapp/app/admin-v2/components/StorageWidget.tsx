'use client';

/**
 * StorageWidget Component
 * 
 * Displays storage usage for tenants on their dashboard.
 * Shows: usage bar, breakdown, alerts, upgrade prompts
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage, formatBytes } from '@/lib/storage';
import { 
  HardDrive, AlertTriangle, TrendingUp, Image, FileText, 
  Package, MoreHorizontal, ChevronRight, X, Zap
} from 'lucide-react';

interface StorageWidgetProps {
  compact?: boolean; // Smaller version for sidebar
}

export function StorageWidget({ compact = false }: StorageWidgetProps) {
  const { usage, alerts, isLoading, error, acknowledgeAlert } = useStorage();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  if (isLoading) {
    return (
      <div className={`bg-[#1a1a1a] border border-white/10 rounded-xl ${compact ? 'p-3' : 'p-5'}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-2 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return null; // Silently hide if no data
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const usageColor = usage.usagePercent >= 100 
    ? '#EF4444' // red
    : usage.usagePercent >= 80 
      ? '#F59E0B' // yellow
      : '#39FF14'; // green

  if (compact) {
    return (
      <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60">Storage</span>
          </div>
          {unacknowledgedAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          )}
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usage.usagePercent, 100)}%` }}
            className="h-full rounded-full"
            style={{ backgroundColor: usageColor }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px]">
          <span className="text-white/40">{formatBytes(usage.bytesUsed)}</span>
          <span className="text-white/40">{usage.includedGB}GB</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Storage Usage</h3>
            <p className="text-xs text-white/50">{usage.planName} Plan • {usage.includedGB}GB included</p>
          </div>
        </div>
        
        {/* Alert indicator */}
        {unacknowledgedAlerts.length > 0 && (
          <button
            onClick={() => setShowAlerts(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {unacknowledgedAlerts.length}
          </button>
        )}
      </div>

      {/* Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-white">{formatBytes(usage.bytesUsed)} used</span>
          <span className="text-sm text-white/60">{formatBytes(usage.bytesLimit)} limit</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usage.usagePercent, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full relative"
            style={{ backgroundColor: usageColor }}
          >
            {usage.usagePercent > 100 && (
              <div 
                className="absolute right-0 top-0 bottom-0 bg-red-600 animate-pulse"
                style={{ width: `${Math.min((usage.usagePercent - 100), 20)}%` }}
              />
            )}
          </motion.div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-white/40">{usage.usagePercent.toFixed(1)}% used</span>
          <span className="text-xs text-white/40">{formatBytes(usage.bytesAvailable)} available</span>
        </div>
      </div>

      {/* Blocked Warning */}
      {usage.isBlocked && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Storage Blocked</p>
              <p className="text-red-400/70 text-xs mt-0.5">{usage.blockReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overage Warning */}
      {usage.overageGB > 0 && !usage.isBlocked && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 text-sm font-medium">Overage: {usage.overageGB.toFixed(2)}GB</p>
              <p className="text-yellow-400/70 text-xs mt-0.5">
                Est. charge: ${usage.estimatedOverageCost.toFixed(2)} at ${usage.overageRatePerGB}/GB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-sm text-white/60 hover:bg-white/10 transition"
      >
        <span>Storage breakdown</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
      </button>

      {/* Breakdown */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-2">
              <BreakdownItem icon={Image} label="Images" bytes={usage.breakdown.images} total={usage.bytesUsed} />
              <BreakdownItem icon={Package} label="Mockups" bytes={usage.breakdown.mockups} total={usage.bytesUsed} />
              <BreakdownItem icon={FileText} label="Documents" bytes={usage.breakdown.documents} total={usage.bytesUsed} />
              <BreakdownItem icon={MoreHorizontal} label="Other" bytes={usage.breakdown.other} total={usage.bytesUsed} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade CTA */}
      {usage.usagePercent >= 70 && (
        <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Zap className="w-4 h-4" />
          Upgrade for more storage
        </button>
      )}

      {/* Alerts Modal */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowAlerts(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-medium">Storage Alerts</h3>
                <button onClick={() => setShowAlerts(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {unacknowledgedAlerts.map(alert => (
                  <div key={alert.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-white text-sm">{alert.message}</p>
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs text-white/40 hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Breakdown item helper
function BreakdownItem({ 
  icon: Icon, 
  label, 
  bytes, 
  total 
}: { 
  icon: any; 
  label: string; 
  bytes: number; 
  total: number;
}) {
  const percent = total > 0 ? (bytes / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-white/40" />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/60">{label}</span>
          <span className="text-white/40">{formatBytes(bytes)}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/30 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StorageWidget;
