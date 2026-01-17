'use client';

/**
 * Platform Costs & Storage - Admin Dashboard
 * 
 * PLATFORM OWNER ONLY - Tracks:
 * - API costs across all tenants (for tax)
 * - Storage usage across all tenants (for billing/enforcement)
 * 
 * Access: Only visible to platform super admin
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import { useCostTracking, API_COSTS } from '@/lib/cost-tracking';
import { formatBytes } from '@/lib/storage';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import TacticalHeader from '../components/TacticalHeader';
import { 
  DollarSign, Download, Trash2, Calendar, TrendingUp, 
  FileText, AlertTriangle, Filter, RefreshCw, HardDrive,
  Users, Zap, Image, Package, MoreHorizontal
} from 'lucide-react';

// Platform owner user ID
const PLATFORM_OWNER_ID = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

interface StorageTenant {
  id: string;
  name: string;
  isWhiteLabel: boolean;
  planName: string;
  bytesUsed: number;
  bytesLimit: number;
  usagePercent: number;
  includedGB: number;
  overageGB: number;
  overageCost: number;
  isBlocked: boolean;
}

interface StorageSummary {
  totalBytesUsed: number;
  totalBytesLimit: number;
  totalUsagePercent: number;
  totalOverageGB: number;
  totalOverageCost: number;
  tenantCount: number;
  blockedCount: number;
}

export default function PlatformCostsPage() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const { costLog, totalSpent, clearLog, exportLog } = useCostTracking();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'api' | 'storage'>('api');
  
  // API costs state
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Storage state
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);
  const [storageTenants, setStorageTenants] = useState<StorageTenant[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [breakdownByType, setBreakdownByType] = useState<Record<string, number>>({});

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/admin-v2/platform-costs');
        return;
      }
      
      if (session.user.id === PLATFORM_OWNER_ID) {
        setIsAuthorized(true);
      } else {
        router.push('/admin-v2');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Fetch storage data
  useEffect(() => {
    if (isAuthorized && activeTab === 'storage') {
      fetchStorageData();
    }
  }, [isAuthorized, activeTab]);

  const fetchStorageData = async () => {
    setStorageLoading(true);
    try {
      const response = await fetch('/api/storage/platform');
      if (response.ok) {
        const data = await response.json();
        setStorageSummary(data.summary);
        setStorageTenants(data.tenants);
        setBreakdownByType(data.breakdownByType || {});
      }
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
    } finally {
      setStorageLoading(false);
    }
  };

  // Filter API logs by date
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

  const filteredTotal = filteredLogs.reduce((sum, entry) => sum + entry.totalCost, 0);

  // Group by provider
  const costByProvider = filteredLogs.reduce((acc, entry) => {
    const provider = entry.provider;
    if (!acc[provider]) acc[provider] = { total: 0, count: 0 };
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
          <p className="text-white/60">Platform administrator only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      <CollapsibleSidebar
        activeItem="platform-costs"
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
          title="Platform Costs & Storage"
          subtitle="Track API usage and storage across all tenants"
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
                This dashboard tracks costs across ALL tenants for tax and billing purposes.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'api'
                  ? 'bg-[#39FF14]/20 text-[#39FF14]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-4 h-4" />
              API Costs
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'storage'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              Storage
            </button>
          </div>

          {/* API Costs Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
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
                    <span className="text-white/60 text-sm">Providers</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{Object.keys(costByProvider).length}</p>
                  <p className="text-xs text-white/40 mt-1">Active integrations</p>
                </div>
              </div>

              {/* Filters & Actions */}
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
                    Clear
                  </button>
                </div>
              </div>

              {/* Provider Breakdown */}
              {Object.keys(costByProvider).length > 0 && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#39FF14]" />
                    By Provider
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

              {/* API Log Table */}
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
                    <p className="text-white/40">No API costs recorded</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="bg-white/5 sticky top-0">
                        <tr>
                          <th className="text-left text-white/60 text-xs font-medium p-3">Date</th>
                          <th className="text-left text-white/60 text-xs font-medium p-3">Provider</th>
                          <th className="text-left text-white/60 text-xs font-medium p-3">Service</th>
                          <th className="text-right text-white/60 text-xs font-medium p-3">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredLogs.slice(0, 50).map(entry => (
                          <tr key={entry.id} className="hover:bg-white/5">
                            <td className="p-3 text-white/80 text-sm">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                {entry.provider}
                              </span>
                            </td>
                            <td className="p-3 text-white text-sm">{entry.description}</td>
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
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              {storageLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : storageSummary ? (
                <>
                  {/* Storage Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-white/60 text-sm">Total Used</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{formatBytes(storageSummary.totalBytesUsed)}</p>
                      <p className="text-xs text-white/40 mt-1">{storageSummary.totalUsagePercent}% of total</p>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-white/60 text-sm">Tenants</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{storageSummary.tenantCount}</p>
                      <p className="text-xs text-white/40 mt-1">{storageSummary.blockedCount} blocked</p>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-yellow-500" />
                        </div>
                        <span className="text-white/60 text-sm">Total Overage</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">{storageSummary.totalOverageGB.toFixed(2)} GB</p>
                      <p className="text-xs text-white/40 mt-1">billable overage</p>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-white/60 text-sm">Overage Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">${storageSummary.totalOverageCost.toFixed(2)}</p>
                      <p className="text-xs text-white/40 mt-1">this period</p>
                    </div>
                  </div>

                  {/* Storage by Type */}
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-400" />
                      Storage by Type
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <Image className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{formatBytes(breakdownByType.image || 0)}</p>
                        <p className="text-white/40 text-xs">Images</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <Package className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{formatBytes(breakdownByType.mockup || 0)}</p>
                        <p className="text-white/40 text-xs">Mockups</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <FileText className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{formatBytes(breakdownByType.document || 0)}</p>
                        <p className="text-white/40 text-xs">Documents</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <MoreHorizontal className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{formatBytes(breakdownByType.other || 0)}</p>
                        <p className="text-white/40 text-xs">Other</p>
                      </div>
                    </div>
                  </div>

                  {/* Tenant Storage Table */}
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        Storage by Tenant
                      </h3>
                      <button
                        onClick={fetchStorageData}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                      >
                        <RefreshCw className="w-4 h-4 text-white/60" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="text-left text-white/60 text-xs font-medium p-3">Tenant</th>
                            <th className="text-left text-white/60 text-xs font-medium p-3">Plan</th>
                            <th className="text-left text-white/60 text-xs font-medium p-3">Usage</th>
                            <th className="text-right text-white/60 text-xs font-medium p-3">Overage</th>
                            <th className="text-right text-white/60 text-xs font-medium p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {storageTenants.map(tenant => (
                            <tr key={tenant.id} className="hover:bg-white/5">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{tenant.name}</span>
                                  {tenant.isWhiteLabel && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                      WL
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-white/60 text-sm">{tenant.planName}</td>
                              <td className="p-3">
                                <div className="w-32">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white/60">{formatBytes(tenant.bytesUsed)}</span>
                                    <span className="text-white/40">{tenant.usagePercent.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(tenant.usagePercent, 100)}%`,
                                        backgroundColor: tenant.usagePercent >= 100 ? '#EF4444' : tenant.usagePercent >= 80 ? '#F59E0B' : '#39FF14'
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                {tenant.overageGB > 0 ? (
                                  <span className="text-yellow-400 font-medium">
                                    {tenant.overageGB.toFixed(2)} GB (${tenant.overageCost.toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="text-white/40">-</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {tenant.isBlocked ? (
                                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                                    Blocked
                                  </span>
                                ) : tenant.usagePercent >= 100 ? (
                                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                                    Over Limit
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                                    OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <HardDrive className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">No storage data available</p>
                  <p className="text-white/30 text-sm mt-1">Run the migration to enable storage tracking</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
