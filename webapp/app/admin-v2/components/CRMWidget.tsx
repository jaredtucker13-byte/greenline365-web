'use client';

/**
 * CRMWidget - Hub Summary Component
 * 
 * Displays CRM metrics summary on the Command Center (Hub).
 * Click to navigate to the full CRM Dashboard (Spoke).
 * 
 * Uses analyticsApi for aggregate metrics.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CrmSummary {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  pipelineValue: number;
}

export default function CRMWidget() {
  const [data, setData] = useState<CrmSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch('/api/analytics/crm?type=kpis&range=7d');
        const result = await response.json();
        
        if (response.ok && result.data) {
          setData({
            totalLeads: result.data.totalLeads,
            newLeads: result.data.newLeads,
            convertedLeads: result.data.convertedLeads,
            conversionRate: result.data.conversionRate,
            pipelineValue: result.data.pipelineValue,
          });
          setLastUpdated(result.meta?.lastProcessedAt);
        }
      } catch (err) {
        console.error('Failed to fetch CRM summary:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSummary();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchSummary, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1A1A1A] rounded-2xl border border-[#39FF14]/20 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          <h3 className="text-white font-bold">CRM Overview</h3>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-white/30">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <Link 
            href="/admin-v2/crm-dashboard"
            className="text-xs text-[#39FF14] hover:underline"
          >
            View All →
          </Link>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-6 text-white/40">
            <p>No CRM data yet</p>
            <Link 
              href="/admin-v2/crm-dashboard"
              className="text-[#39FF14] hover:underline text-sm mt-2 inline-block"
            >
              Add your first lead →
            </Link>
          </div>
        ) : (
          <>
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-white">{data.totalLeads}</div>
                <div className="text-xs text-white/40">Total Leads</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                <div className="text-2xl font-bold text-emerald-400">+{data.newLeads}</div>
                <div className="text-xs text-white/40">New (7d)</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-500/10">
                <div className="text-2xl font-bold text-purple-400">{data.convertedLeads}</div>
                <div className="text-xs text-white/40">Converted</div>
              </div>
            </div>
            
            {/* Conversion Rate Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Conversion Rate</span>
                <span className="text-[#39FF14] font-medium">{data.conversionRate}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.conversionRate, 100)}%` }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#39FF14] to-emerald-500 rounded-full"
                />
              </div>
            </div>
            
            {/* Pipeline Value */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Pipeline Value</span>
                <span className="text-xl font-bold text-amber-400">
                  ${data.pipelineValue.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Footer Action */}
      <Link 
        href="/admin-v2/crm-dashboard"
        className="block px-4 py-3 bg-[#39FF14]/5 text-center text-sm text-[#39FF14] font-medium hover:bg-[#39FF14]/10 transition border-t border-white/10"
      >
        Open CRM Dashboard
      </Link>
    </motion.div>
  );
}
