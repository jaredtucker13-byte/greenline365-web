'use client';

/**
 * Audit Log Viewer - GreenLine HQ
 * SOC2 Compliance Dashboard with Insights & Export
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CollapsibleSidebar from '@/app/admin-v2/components/CollapsibleSidebar';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  action_category: string;
  resource_type: string;
  resource_id: string;
  description: string;
  status: string;
  occurred_at: string;
  ip_address: string;
  user_agent: string;
  is_sensitive: boolean;
  error_message: string;
  changes: { old?: Record<string, any>; new?: Record<string, any> } | null;
  metadata: Record<string, any>;
  compliance_flags: string[];
}

interface Summary {
  totalEvents: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  topActions: Array<{ action: string; count: number }>;
}

interface SecurityReport {
  period: { from: string; to: string };
  suspiciousLogins: Array<{
    email: string;
    attempts: number;
    uniqueIPs: number;
    lastAttempt: string;
  }>;
  accessDeniedCount: number;
  accessDeniedEvents: AuditLog[];
  sensitiveAccessCount: number;
  sensitiveAccessEvents: AuditLog[];
}

type DateRange = '24h' | '7d' | '30d' | '90d';

export default function AuditPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [logsRes, summaryRes, securityRes] = await Promise.all([
          fetch('/api/audit?limit=100'),
          fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'summary', dateRange }),
          }),
          fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'security-report' }),
          }),
        ]);

        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
        setIsAdmin(logsData.isAdmin);

        const summaryData = await summaryRes.json();
        setSummary(summaryData);

        if (logsData.isAdmin) {
          const secData = await securityRes.json();
          if (!secData.error) setSecurityReport(secData);
        }
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
      data: 'bg-gold-500/20 text-gold-400',
      admin: 'bg-purple-500/20 text-purple-400',
      system: 'bg-gray-500/20 text-gray-400',
      security: 'bg-red-500/20 text-red-400',
    };
    return colors[category] || 'bg-white/10 text-white/60';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'text-gold-400',
      failure: 'text-red-400',
      denied: 'text-amber-400',
    };
    return colors[status] || 'text-white/60';
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-emerald-400',
      failure: 'bg-red-400',
      denied: 'bg-amber-400',
    };
    return colors[status] || 'bg-white/40';
  };

  const filteredLogs = logs.filter(log => {
    if (filter.category && log.action_category !== filter.category) return false;
    if (filter.status && log.status !== filter.status) return false;
    return true;
  });

  // Export functions
  const exportCSV = useCallback(() => {
    setExporting(true);
    try {
      const headers = ['Time', 'User', 'Action', 'Category', 'Status', 'Description', 'Resource', 'IP Address', 'Sensitive'];
      const rows = filteredLogs.map(log => [
        new Date(log.occurred_at).toISOString(),
        log.user_email || '',
        log.action,
        log.action_category,
        log.status,
        log.description || '',
        log.resource_type ? `${log.resource_type}:${log.resource_id || ''}` : '',
        log.ip_address || '',
        log.is_sensitive ? 'Yes' : 'No',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [filteredLogs, dateRange]);

  const exportJSON = useCallback(() => {
    setExporting(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        dateRange,
        totalRecords: filteredLogs.length,
        logs: filteredLogs,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${dateRange}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [filteredLogs, dateRange]);

  // Generate insights from data
  const getInsights = useCallback((): Array<{ type: 'warning' | 'info' | 'success' | 'action'; title: string; detail: string }> => {
    const insights: Array<{ type: 'warning' | 'info' | 'success' | 'action'; title: string; detail: string }> = [];

    if (!summary) return insights;

    // Failure rate analysis
    const failureCount = summary.byStatus?.failure || 0;
    const deniedCount = summary.byStatus?.denied || 0;
    const total = summary.totalEvents || 1;
    const failureRate = ((failureCount + deniedCount) / total) * 100;

    if (failureRate > 10) {
      insights.push({
        type: 'warning',
        title: `High failure rate: ${failureRate.toFixed(1)}%`,
        detail: `${failureCount} failures and ${deniedCount} denied events out of ${total} total. Investigate the most common failure actions and check for misconfigurations or unauthorized access attempts.`,
      });
    } else if (failureRate === 0 && total > 10) {
      insights.push({
        type: 'success',
        title: 'Zero failures detected',
        detail: `All ${total} events in the last ${dateRange} completed successfully. System is operating normally.`,
      });
    }

    // Security report insights
    if (securityReport) {
      if (securityReport.suspiciousLogins.length > 0) {
        const topSuspicious = securityReport.suspiciousLogins[0];
        insights.push({
          type: 'warning',
          title: `Suspicious login activity detected`,
          detail: `${topSuspicious.email} had ${topSuspicious.attempts} failed login attempts from ${topSuspicious.uniqueIPs} unique IP(s). Consider enforcing MFA or temporarily locking the account.`,
        });
      }

      if (securityReport.accessDeniedCount > 5) {
        insights.push({
          type: 'action',
          title: `${securityReport.accessDeniedCount} access denied events this week`,
          detail: 'Multiple access denied events may indicate users trying to access resources beyond their permissions. Review role assignments and ensure proper RBAC policies.',
        });
      }

      if (securityReport.sensitiveAccessCount > 0) {
        insights.push({
          type: 'info',
          title: `${securityReport.sensitiveAccessCount} sensitive data access events`,
          detail: 'Sensitive operations (exports, deletions, password resets) were logged. Verify these were performed by authorized personnel.',
        });
      }
    }

    // Category distribution insights
    const categories = summary.byCategory || {};
    const authEvents = categories.auth || 0;
    const dataEvents = categories.data || 0;
    const securityEvents = categories.security || 0;

    if (securityEvents > authEvents && securityEvents > 5) {
      insights.push({
        type: 'warning',
        title: 'Security events outnumber auth events',
        detail: `${securityEvents} security events vs ${authEvents} auth events. This may indicate elevated threat activity. Review security event details below.`,
      });
    }

    if (dataEvents > 20) {
      insights.push({
        type: 'info',
        title: `High data operation volume (${dataEvents} events)`,
        detail: 'Significant data operations detected. Ensure data exports and modifications are authorized and comply with data governance policies.',
      });
    }

    // Top action insights
    if (summary.topActions?.length > 0) {
      const topAction = summary.topActions[0];
      insights.push({
        type: 'info',
        title: `Most common action: ${topAction.action}`,
        detail: `"${topAction.action}" accounts for ${topAction.count} events (${((topAction.count / total) * 100).toFixed(0)}% of all activity). This is your platform's primary operation pattern.`,
      });
    }

    // If no events at all
    if (total === 0) {
      insights.push({
        type: 'action',
        title: 'No audit events recorded',
        detail: 'No events found in this time range. Verify that audit logging triggers are properly configured in your database and that the application is writing to the audit_logs table.',
      });
    }

    return insights;
  }, [summary, securityReport, dateRange]);

  const insights = loading ? [] : getInsights();

  const insightStyles: Record<string, { border: string; bg: string; icon: string; iconColor: string }> = {
    warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: '!', iconColor: 'bg-amber-500 text-black' },
    info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: 'i', iconColor: 'bg-blue-500 text-white' },
    success: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: '\u2713', iconColor: 'bg-emerald-500 text-white' },
    action: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', icon: '\u2192', iconColor: 'bg-purple-500 text-white' },
  };

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
        activeItem="audit"
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

          <div className="flex items-center gap-3">
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                disabled={exporting || filteredLogs.length === 0}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
              <button
                onClick={exportJSON}
                disabled={exporting || filteredLogs.length === 0}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                JSON
              </button>
            </div>

            {/* Date Range */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
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
        </div>

        {!isAdmin && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            You&apos;re viewing your own activity logs. Admin access required for full audit trail.
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
                  <div className="text-3xl font-bold text-gold-400">{summary.byStatus?.success || 0}</div>
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

            {/* Insights & Suggestions */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Insights &amp; Suggestions
                </h2>
                <div className="space-y-3">
                  {insights.map((insight, i) => {
                    const style = insightStyles[insight.type];
                    return (
                      <div key={i} className={`flex gap-3 p-4 rounded-xl border ${style.border} ${style.bg}`}>
                        <div className={`w-6 h-6 rounded-full ${style.iconColor} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                          {style.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium text-sm">{insight.title}</div>
                          <div className="text-white/60 text-sm mt-1">{insight.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Top Actions Breakdown */}
            {summary && summary.topActions && summary.topActions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {/* Top Actions */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Top Actions</h3>
                  <div className="space-y-3">
                    {summary.topActions.slice(0, 6).map((item, i) => {
                      const maxCount = summary.topActions[0].count;
                      const width = (item.count / maxCount) * 100;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-white/80 font-mono text-xs">{item.action}</span>
                            <span className="text-white/50">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">By Category</h3>
                  <div className="space-y-3">
                    {Object.entries(summary.byCategory)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([category, count]) => {
                        const maxCount = Math.max(...Object.values(summary.byCategory).map(Number));
                        const width = ((count as number) / maxCount) * 100;
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                                {category}
                              </span>
                              <span className="text-white/50">{count as number}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
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

            {/* Logs Table with Expandable Rows */}
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
                      <th className="w-8 px-2" />
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
                        <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <>
                          <tr
                            key={log.id}
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <td className="px-2 text-center">
                              <svg
                                className={`w-4 h-4 text-white/30 transition-transform ${expandedLogId === log.id ? 'rotate-90' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                              {new Date(log.occurred_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-white/70">
                              {log.user_email || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-white font-mono">
                              {log.action}
                              {log.is_sensitive && (
                                <span className="ml-2 text-xs text-amber-400">&#x1f512;</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(log.action_category)}`}>
                                {log.action_category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(log.status)}`} />
                                <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>{log.status}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/50">
                              {log.resource_type ? `${log.resource_type}${log.resource_id ? `:${log.resource_id.slice(0, 8)}...` : ''}` : '-'}
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          <AnimatePresence>
                            {expandedLogId === log.id && (
                              <tr key={`${log.id}-detail`}>
                                <td colSpan={7} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
                                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                        {log.description && (
                                          <div>
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Description</div>
                                            <div className="text-white/80">{log.description}</div>
                                          </div>
                                        )}
                                        {log.ip_address && (
                                          <div>
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">IP Address</div>
                                            <div className="text-white/80 font-mono">{log.ip_address}</div>
                                          </div>
                                        )}
                                        {log.user_agent && (
                                          <div>
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">User Agent</div>
                                            <div className="text-white/80 text-xs truncate">{log.user_agent}</div>
                                          </div>
                                        )}
                                        {log.resource_type && (
                                          <div>
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Full Resource ID</div>
                                            <div className="text-white/80 font-mono text-xs">{log.resource_type}:{log.resource_id || 'N/A'}</div>
                                          </div>
                                        )}
                                        {log.error_message && (
                                          <div>
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Error</div>
                                            <div className="text-red-400">{log.error_message}</div>
                                          </div>
                                        )}
                                        {log.compliance_flags && log.compliance_flags.length > 0 && (
                                          <div>
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Compliance</div>
                                            <div className="flex gap-1">
                                              {log.compliance_flags.map(flag => (
                                                <span key={flag} className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-300 uppercase">
                                                  {flag}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {log.changes && (
                                          <div className="md:col-span-2 lg:col-span-3">
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Changes</div>
                                            <div className="flex gap-4 text-xs">
                                              {log.changes.old && (
                                                <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                                  <div className="text-red-400 mb-1 font-medium">Before</div>
                                                  <pre className="text-white/60 whitespace-pre-wrap">{JSON.stringify(log.changes.old, null, 2)}</pre>
                                                </div>
                                              )}
                                              {log.changes.new && (
                                                <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                  <div className="text-emerald-400 mb-1 font-medium">After</div>
                                                  <pre className="text-white/60 whitespace-pre-wrap">{JSON.stringify(log.changes.new, null, 2)}</pre>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                          <div className="md:col-span-2 lg:col-span-3">
                                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Metadata</div>
                                            <pre className="text-white/60 text-xs p-3 rounded-lg bg-white/5 whitespace-pre-wrap overflow-auto max-h-40">
                                              {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </>
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
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SOC2 Compliance
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
