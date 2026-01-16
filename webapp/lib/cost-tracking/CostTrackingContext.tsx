'use client';

/**
 * Cost Tracking Context & Components
 * 
 * PLATFORM OWNER ONLY - Tracks all paid API calls across ALL tenants
 * for tax and accounting purposes.
 * 
 * - Confirmation modal before paid API calls
 * - Cost logging with export functionality
 * - Only visible to platform owner (not tenants)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, DollarSign, X, Check, FileText } from 'lucide-react';

// Platform owner user ID - only this user sees cost tracking
const PLATFORM_OWNER_ID = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

// ============================================
// COST DEFINITIONS
// ============================================

export interface APIEndpointCost {
  endpoint: string;
  provider: string;
  description: string;
  estimatedCost: number; // in USD
  unit: string; // "per image", "per call", etc.
}

export const API_COSTS: Record<string, APIEndpointCost> = {
  '/api/studio/generate-mockups': {
    endpoint: '/api/studio/generate-mockups',
    provider: 'kie.ai (Nano Banana)',
    description: 'AI Image Generation',
    estimatedCost: 0.05,
    unit: 'per image',
  },
  '/api/studio/analyze-product': {
    endpoint: '/api/studio/analyze-product',
    provider: 'OpenRouter (Gemini 3 Pro)',
    description: 'AI Product Analysis',
    estimatedCost: 0.005,
    unit: 'per analysis',
  },
  '/api/brain/capture': {
    endpoint: '/api/brain/capture',
    provider: 'OpenRouter (Gemini 3 Pro)',
    description: 'Thought Classification',
    estimatedCost: 0.002,
    unit: 'per thought',
  },
  '/api/content-forge': {
    endpoint: '/api/content-forge',
    provider: 'OpenRouter (Gemini 3 Pro)',
    description: 'AI Content Generation',
    estimatedCost: 0.01,
    unit: 'per generation',
  },
  '/api/content-forge-2': {
    endpoint: '/api/content-forge-2',
    provider: 'OpenRouter (Gemini 3 Pro)',
    description: 'AI Content Generation v2',
    estimatedCost: 0.01,
    unit: 'per generation',
  },
  '/api/blog/ai': {
    endpoint: '/api/blog/ai',
    provider: 'OpenRouter (Gemini 3 Pro)',
    description: 'Blog AI Assistant',
    estimatedCost: 0.008,
    unit: 'per request',
  },
  '/api/blog/analyze': {
    endpoint: '/api/blog/analyze',
    provider: 'OpenRouter (Gemini 3 Pro)',
    description: 'Blog SEO Analysis',
    estimatedCost: 0.005,
    unit: 'per analysis',
  },
};

// ============================================
// COST LOG ENTRY
// ============================================

export interface CostLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  provider: string;
  description: string;
  estimatedCost: number;
  quantity: number;
  totalCost: number;
  businessId?: string;
  businessName?: string;
  metadata?: Record<string, any>;
}

// ============================================
// CONTEXT
// ============================================

interface CostTrackingContextType {
  // State
  costLog: CostLogEntry[];
  totalSpent: number;
  isConfirmationOpen: boolean;
  
  // Actions
  requestConfirmation: (
    endpoint: string,
    quantity: number,
    onConfirm: () => void,
    metadata?: Record<string, any>
  ) => void;
  logCost: (entry: Omit<CostLogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
  exportLog: () => void;
}

const CostTrackingContext = createContext<CostTrackingContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface CostTrackingProviderProps {
  children: ReactNode;
}

export function CostTrackingProvider({ children }: CostTrackingProviderProps) {
  const [costLog, setCostLog] = useState<CostLogEntry[]>(() => {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('greenline365_cost_log');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    endpoint: string;
    quantity: number;
    onConfirm: () => void;
    metadata?: Record<string, any>;
  } | null>(null);

  // Calculate total spent
  const totalSpent = costLog.reduce((sum, entry) => sum + entry.totalCost, 0);

  // Save to localStorage whenever log changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('greenline365_cost_log', JSON.stringify(costLog));
    }
  }, [costLog]);

  // Request confirmation before API call
  const requestConfirmation = useCallback((
    endpoint: string,
    quantity: number,
    onConfirm: () => void,
    metadata?: Record<string, any>
  ) => {
    setPendingAction({ endpoint, quantity, onConfirm, metadata });
    setIsConfirmationOpen(true);
  }, []);

  // Log a cost entry
  const logCost = useCallback((entry: Omit<CostLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: CostLogEntry = {
      ...entry,
      id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setCostLog(prev => [newEntry, ...prev]);
  }, []);

  // Clear log
  const clearLog = useCallback(() => {
    if (confirm('Are you sure you want to clear all cost history? This cannot be undone.')) {
      setCostLog([]);
    }
  }, []);

  // Export log as CSV
  const exportLog = useCallback(() => {
    const headers = ['Date', 'Time', 'Provider', 'Description', 'Endpoint', 'Quantity', 'Unit Cost', 'Total Cost', 'Business'];
    const rows = costLog.map(entry => {
      const date = new Date(entry.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        entry.provider,
        entry.description,
        entry.endpoint,
        entry.quantity,
        `$${entry.estimatedCost.toFixed(4)}`,
        `$${entry.totalCost.toFixed(4)}`,
        entry.businessName || 'N/A',
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenline365_api_costs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [costLog]);

  // Handle confirmation
  const handleConfirm = () => {
    if (pendingAction) {
      const costInfo = API_COSTS[pendingAction.endpoint];
      if (costInfo) {
        logCost({
          endpoint: pendingAction.endpoint,
          provider: costInfo.provider,
          description: costInfo.description,
          estimatedCost: costInfo.estimatedCost,
          quantity: pendingAction.quantity,
          totalCost: costInfo.estimatedCost * pendingAction.quantity,
          metadata: pendingAction.metadata,
        });
      }
      pendingAction.onConfirm();
    }
    setIsConfirmationOpen(false);
    setPendingAction(null);
  };

  const handleCancel = () => {
    setIsConfirmationOpen(false);
    setPendingAction(null);
  };

  const value: CostTrackingContextType = {
    costLog,
    totalSpent,
    isConfirmationOpen,
    requestConfirmation,
    logCost,
    clearLog,
    exportLog,
  };

  return (
    <CostTrackingContext.Provider value={value}>
      {children}
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmationOpen && pendingAction && (
          <CostConfirmationModal
            endpoint={pendingAction.endpoint}
            quantity={pendingAction.quantity}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </CostTrackingContext.Provider>
  );
}

// ============================================
// CONFIRMATION MODAL
// ============================================

interface CostConfirmationModalProps {
  endpoint: string;
  quantity: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function CostConfirmationModal({ endpoint, quantity, onConfirm, onCancel }: CostConfirmationModalProps) {
  const costInfo = API_COSTS[endpoint];
  const totalCost = costInfo ? costInfo.estimatedCost * quantity : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#1a1a1a] border border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">API Cost Confirmation</h3>
            <p className="text-xs text-yellow-500/70">This action will incur charges</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {costInfo ? (
            <>
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Provider</span>
                  <span className="text-white font-medium">{costInfo.provider}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Service</span>
                  <span className="text-white">{costInfo.description}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Quantity</span>
                  <span className="text-white">{quantity} {costInfo.unit.replace('per ', '')}{quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Unit Cost</span>
                  <span className="text-white">${costInfo.estimatedCost.toFixed(3)} {costInfo.unit}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-medium">Estimated Total</span>
                  <span className="text-xl font-bold text-yellow-400">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-white/50 bg-white/5 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p>
                  This cost is an estimate. Actual charges may vary slightly based on API usage.
                  All costs are logged for your records.
                </p>
              </div>
            </>
          ) : (
            <p className="text-white/60">Unknown API endpoint: {endpoint}</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm & Proceed
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// HOOK
// ============================================

export function useCostTracking() {
  const context = useContext(CostTrackingContext);
  if (!context) {
    throw new Error('useCostTracking must be used within a CostTrackingProvider');
  }
  return context;
}

// ============================================
// COST LOG VIEWER COMPONENT
// ============================================

export function CostLogViewer() {
  const { costLog, totalSpent, clearLog, exportLog } = useCostTracking();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition shadow-lg"
      >
        <DollarSign className="w-4 h-4 text-yellow-500" />
        <span>${totalSpent.toFixed(2)}</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[80vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold text-white">API Cost Log</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportLog}
                    className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={clearLog}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-yellow-500/5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Estimated Spend</span>
                  <span className="text-2xl font-bold text-yellow-400">${totalSpent.toFixed(2)}</span>
                </div>
                <p className="text-xs text-white/40 mt-1">{costLog.length} API calls logged</p>
              </div>

              {/* Log Entries */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {costLog.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No API costs logged yet</p>
                  </div>
                ) : (
                  costLog.map(entry => (
                    <div
                      key={entry.id}
                      className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{entry.description}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/50">
                            {entry.provider}
                          </span>
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          {new Date(entry.timestamp).toLocaleString()} • {entry.quantity} {entry.quantity > 1 ? 'items' : 'item'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-400 font-medium">${entry.totalCost.toFixed(3)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CostTrackingProvider;
