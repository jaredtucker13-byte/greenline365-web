'use client';

/**
 * Audit Log Viewer - Admin Only
 * SOC2 Compliance Dashboard
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  action_category: string;
  resource_type: string;
  resource_id: string;
  description: string;
  status: string;
  occurred_at: string;
  ip_address: string;
  is_sensitive: boolean;
}

interface Summary {
  totalEvents: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  topActions: Array<{ action: string; count: number }>;
}

type DateRange = '24h' | '7d' | '30d' | '90d';

export default function AuditPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'security' | 'compliance'>('logs');
  const [filter, setFilter] = useState({ category: '', status: '' });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch logs
        const logsRes = await fetch(`/api/audit?limit=100`);
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
        setIsAdmin(logsData.isAdmin);

        // Fetch summary
        const summaryRes = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary', dateRange }),
        });
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      } catch (e) {
        console.error('Failed to fetch audit data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-500/20 text-blue-400',
      data: 'bg-emerald-500/20 text-emerald-400',
      admin: 'bg-purple-500/20 text-purple-400',
      system: 'bg-gray-500/20 text-gray-400',
      security: 'bg-red-500/20 text-red-400',
    };
    return colors[category] || 'bg-white/10 text-white/60';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'text-emerald-400',
      failure: 'text-red-400',
      denied: 'text-amber-400',
    };
    return colors[status] || 'text-white/60';
  };

  const filteredLogs = logs.filter(log => {
    if (filter.category && log.action_category !== filter.category) return false;
    if (filter.status && log.status !== filter.status) return false;
    return true;
  });

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

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

      <div className="flex-1 min-w-0 relative z-10 p-4 md:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <p className="text-white/60 text-sm">SOC2 Compliance Dashboard</p>
              </div>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1">
            {(['24h', '7d', '30d', '90d'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-red-500 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {!isAdmin && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            You're viewing your own activity logs. Admin access required for full audit trail.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/60">Loading audit logs...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                >
                  <div className="text-3xl font-bold text-white">{summary.totalEvents.toLocaleString()}</div>
                  <div className="text-sm text-white/50">Total Events</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                >
                  <div className="text-3xl font-bold text-emerald-400">{summary.byStatus?.success || 0}</div>
                  <div className="text-sm text-white/50">Successful</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                >
                  <div className="text-3xl font-bold text-red-400">{summary.byStatus?.failure || 0}</div>
                  <div className="text-sm text-white/50">Failed</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                >
                  <div className="text-3xl font-bold text-amber-400">{summary.byStatus?.denied || 0}</div>
                  <div className="text-sm text-white/50">Denied</div>
                </motion.div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={filter.category}
                onChange={(e) => setFilter(f => ({ ...f, category: e.target.value }))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="auth">Auth</option>
                <option value="data">Data</option>
                <option value="admin">Admin</option>
                <option value="security">Security</option>
                <option value="system">System</option>
              </select>

              <select
                value={filter.status}
                onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="denied">Denied</option>
              </select>

              <span className="text-white/40 text-sm ml-auto">
                Showing {filteredLogs.length} of {logs.length} events
              </span>
            </div>

            {/* Logs Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Resource</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                            {new Date(log.occurred_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/70">
                            {log.user_email || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-mono">
                            {log.action}
                            {log.is_sensitive && (
                              <span className="ml-2 text-xs text-amber-400">🔒</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(log.action_category)}`}>
                              {log.action_category}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/50">
                            {log.resource_type ? `${log.resource_type}${log.resource_id ? `:${log.resource_id.slice(0, 8)}...` : ''}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Compliance Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
            >
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>🛡️</span> SOC2 Compliance
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-white/60">
                <div>
                  <div className="font-medium text-white/80 mb-1">Retention Policy</div>
                  <p>Audit logs retained for 7 years per SOC2 requirements</p>
                </div>
                <div>
                  <div className="font-medium text-white/80 mb-1">Tamper Protection</div>
                  <p>Logs are append-only. Updates and deletions are blocked.</p>
                </div>
                <div>
                  <div className="font-medium text-white/80 mb-1">Automatic Tracking</div>
                  <p>Critical actions (CRM, Knowledge, Auth) logged automatically via triggers</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
