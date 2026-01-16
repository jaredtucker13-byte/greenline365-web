'use client';

/**
 * Platform Costs - API Usage Tracking
 * 
 * PLATFORM OWNER ONLY - This page tracks all API costs across all tenants
 * for tax and accounting purposes.
 * 
 * Access: Only visible to platform super admins (not white-label tenants)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import { useCostTracking, API_COSTS } from '@/lib/cost-tracking';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import TacticalHeader from '../components/TacticalHeader';
import { 
  DollarSign, Download, Trash2, Calendar, TrendingUp, 
  FileText, AlertTriangle, Filter, RefreshCw
} from 'lucide-react';

// Platform owner user ID - only this user can access this page
const PLATFORM_OWNER_ID = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

export default function PlatformCostsPage() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const { costLog, totalSpent, clearLog, exportLog } = useCostTracking();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Auth check - ONLY platform owner can access
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/admin-v2/platform-costs');
        return;
      }
      
      // Check if user is platform owner
      if (session.user.id === PLATFORM_OWNER_ID) {
        setIsAuthorized(true);
      } else {
        // Not authorized - redirect to dashboard
        router.push('/admin-v2');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Filter logs by date
  const filteredLogs = costLog.filter(entry => {
    if (dateFilter === 'all') return true;
    
    const entryDate = new Date(entry.timestamp);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return entryDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return entryDate >= monthAgo;
    }
    return true;
  });

  // Calculate filtered total
  const filteredTotal = filteredLogs.reduce((sum, entry) => sum + entry.totalCost, 0);

  // Group by provider for breakdown
  const costByProvider = filteredLogs.reduce((acc, entry) => {
    const provider = entry.provider;
    if (!acc[provider]) {
      acc[provider] = { total: 0, count: 0 };
    }
    acc[provider].total += entry.totalCost;
    acc[provider].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60">This page is only accessible to platform administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      <CollapsibleSidebar
        activeItem="settings"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <main className="flex-1 overflow-auto">
        <TacticalHeader
          title="Platform API Costs"
          subtitle="Track all API usage across the platform for tax purposes"
          onToday={() => {}}
          onPrev={() => {}}
          onNext={() => {}}
          viewMode="month"
          onViewChange={() => {}}
        />

        <div className="p-6 max-w-6xl mx-auto space-y-6">
          {/* Warning Banner */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-500 font-medium">Platform Owner Only</h3>
              <p className="text-yellow-500/70 text-sm mt-1">
                This page tracks API costs across ALL tenants. Data is stored locally in your browser.
                Export regularly for your records.
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-white/60 text-sm">Total All-Time</span>
              </div>
              <p className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</p>
              <p className="text-xs text-white/40 mt-1">{costLog.length} API calls</p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-white/60 text-sm">Filtered Period</span>
              </div>
              <p className="text-3xl font-bold text-yellow-400">${filteredTotal.toFixed(2)}</p>
              <p className="text-xs text-white/40 mt-1">{filteredLogs.length} API calls</p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-white/60 text-sm">Providers Used</span>
              </div>
              <p className="text-3xl font-bold text-white">{Object.keys(costByProvider).length}</p>
              <p className="text-xs text-white/40 mt-1">Active integrations</p>
            </div>
          </div>

          {/* Actions & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Filter:</span>
              {(['all', 'today', 'week', 'month'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    dateFilter === filter
                      ? 'bg-[#39FF14] text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportLog}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={clearLog}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>

          {/* Provider Breakdown */}
          {Object.keys(costByProvider).length > 0 && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#39FF14]" />
                Cost Breakdown by Provider
              </h3>
              <div className="space-y-3">
                {Object.entries(costByProvider).map(([provider, data]) => (
                  <div key={provider} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <span className="text-white font-medium">{provider}</span>
                      <span className="text-white/40 text-sm ml-2">({data.count} calls)</span>
                    </div>
                    <span className="text-yellow-400 font-medium">${data.total.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Log Table */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#39FF14]" />
                API Call History
              </h3>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No API costs recorded yet</p>
                <p className="text-white/30 text-sm mt-1">
                  Costs will appear here when you use paid AI features
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left text-white/60 text-xs font-medium p-3">Date & Time</th>
                      <th className="text-left text-white/60 text-xs font-medium p-3">Provider</th>
                      <th className="text-left text-white/60 text-xs font-medium p-3">Service</th>
                      <th className="text-right text-white/60 text-xs font-medium p-3">Qty</th>
                      <th className="text-right text-white/60 text-xs font-medium p-3">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.map(entry => (
                      <tr key={entry.id} className="hover:bg-white/5 transition">
                        <td className="p-3 text-white/80 text-sm">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                            {entry.provider}
                          </span>
                        </td>
                        <td className="p-3 text-white text-sm">{entry.description}</td>
                        <td className="p-3 text-white/60 text-sm text-right">{entry.quantity}</td>
                        <td className="p-3 text-yellow-400 font-medium text-right">
                          ${entry.totalCost.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* API Pricing Reference */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">API Pricing Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(API_COSTS).map(api => (
                <div key={api.endpoint} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="text-white text-sm">{api.description}</span>
                    <span className="text-white/40 text-xs block">{api.provider}</span>
                  </div>
                  <span className="text-[#39FF14] font-mono text-sm">
                    ${api.estimatedCost.toFixed(3)} {api.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
