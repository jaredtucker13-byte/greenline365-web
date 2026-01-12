'use client';

/**
 * Tenant CRM Dashboard
 * Track leads, customers, email performance, and revenue
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

interface DashboardData {
  leads: {
    total: number;
    converted: number;
    conversionRate: string;
  };
  customers: {
    total: number;
    new: number;
    totalLTV: number;
  };
  email: {
    sent: number;
    opened: number;
    clicked: number;
    openRate: string;
    clickRate: string;
  };
  revenue: {
    total: number;
    transactions: number;
  };
}

export default function CRMDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'customers' | 'email' | 'revenue'>('overview');

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/crm?range=${dateRange}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch CRM data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  const hasData = data && (data.leads.total > 0 || data.customers.total > 0 || data.revenue.total > 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <CollapsibleSidebar
        activeItem="analytics"
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
            <h1 className="text-3xl font-bold text-white">Your Business CRM</h1>
            <p className="text-white/60">Track your leads, customers, and revenue</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1">
            {(['7d', '30d', '90d', 'ytd', 'all'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-blue-500 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {range === 'all' ? 'All' : range === 'ytd' ? 'YTD' : range}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'leads', label: 'Leads', icon: '🎯' },
            { id: 'customers', label: 'Customers', icon: '👥' },
            { id: 'email', label: 'Email', icon: '📧' },
            { id: 'revenue', label: 'Revenue', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/60">Loading your CRM data...</div>
          </div>
        ) : !hasData ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center max-w-2xl mx-auto"
          >
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Tracking Your Business</h2>
            <p className="text-white/60 mb-6">
              Add your first lead or customer to start seeing your business metrics here.
              Track revenue, email performance, and ROI all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setActiveTab('leads')}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600"
              >
                + Add Your First Lead
              </button>
              <button 
                onClick={() => setActiveTab('revenue')}
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20"
              >
                Log Revenue
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    icon="🎯"
                    label="Total Leads"
                    value={data.leads.total.toString()}
                    subtext={`${data.leads.conversionRate}% conversion`}
                    color="blue"
                  />
                  <MetricCard
                    icon="👥"
                    label="Customers"
                    value={data.customers.total.toString()}
                    subtext={`${data.customers.new} new`}
                    color="emerald"
                  />
                  <MetricCard
                    icon="📧"
                    label="Email Open Rate"
                    value={`${data.email.openRate}%`}
                    subtext={`${data.email.sent} sent`}
                    color="purple"
                  />
                  <MetricCard
                    icon="💰"
                    label="Revenue"
                    value={formatCurrency(data.revenue.total)}
                    subtext={`${data.revenue.transactions} transactions`}
                    color="amber"
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Lead Funnel */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Lead Funnel</h3>
                    <div className="space-y-3">
                      <FunnelBar label="Total Leads" value={data.leads.total} max={data.leads.total} color="blue" />
                      <FunnelBar label="Converted" value={data.leads.converted} max={data.leads.total} color="emerald" />
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-2xl font-bold text-emerald-400">{data.leads.conversionRate}%</span>
                      <span className="text-white/50 text-sm ml-2">Conversion Rate</span>
                    </div>
                  </motion.div>

                  {/* Email Performance */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Email Performance</h3>
                    <div className="space-y-3">
                      <FunnelBar label="Sent" value={data.email.sent} max={data.email.sent} color="blue" />
                      <FunnelBar label="Opened" value={data.email.opened} max={data.email.sent} color="purple" />
                      <FunnelBar label="Clicked" value={data.email.clicked} max={data.email.sent} color="emerald" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <span className="text-xl font-bold text-purple-400">{data.email.openRate}%</span>
                        <span className="text-white/50 text-xs block">Open Rate</span>
                      </div>
                      <div>
                        <span className="text-xl font-bold text-emerald-400">{data.email.clickRate}%</span>
                        <span className="text-white/50 text-xs block">Click Rate</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Customer Value */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20 p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">💎 Customer Value</h3>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-emerald-400">{data.customers.total}</div>
                      <div className="text-white/50 text-sm">Total Customers</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-400">{formatCurrency(data.customers.totalLTV)}</div>
                      <div className="text-white/50 text-sm">Total Lifetime Value</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-400">
                        {data.customers.total > 0 
                          ? formatCurrency(data.customers.totalLTV / data.customers.total)
                          : '$0'
                        }
                      </div>
                      <div className="text-white/50 text-sm">Avg Customer Value</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Other tabs would go here - leads list, customers list, etc. */}
            {activeTab === 'leads' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Your Leads</h3>
                  <button className="px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600">
                    + Add Lead
                  </button>
                </div>
                <p className="text-white/50 text-center py-8">
                  Lead management coming soon. Use the API to add leads: POST /api/crm with action: "leads.add"
                </p>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Your Customers</h3>
                  <button className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600">
                    + Add Customer
                  </button>
                </div>
                <p className="text-white/50 text-center py-8">
                  Customer management coming soon. Use the API to add customers: POST /api/crm with action: "customers.add"
                </p>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Email Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-bold text-white">{data.email.sent}</div>
                    <div className="text-xs text-white/50">Sent</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-bold text-purple-400">{data.email.opened}</div>
                    <div className="text-xs text-white/50">Opened</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-400">{data.email.clicked}</div>
                    <div className="text-xs text-white/50">Clicked</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-bold text-blue-400">{data.email.openRate}%</div>
                    <div className="text-xs text-white/50">Open Rate</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-bold text-amber-400">{data.email.clickRate}%</div>
                    <div className="text-xs text-white/50">Click Rate</div>
                  </div>
                </div>
                <p className="text-white/40 text-sm text-center">
                  Email tracking is automatic when you send campaigns through GreenLine365
                </p>
              </motion.div>
            )}

            {activeTab === 'revenue' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Revenue Tracking</h3>
                  <button className="px-4 py-2 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-400">
                    + Log Revenue
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                    <div className="text-4xl font-bold text-amber-400">{formatCurrency(data.revenue.total)}</div>
                    <div className="text-white/50 mt-2">Total Revenue</div>
                  </div>
                  <div className="text-center p-8 bg-white/5 rounded-xl">
                    <div className="text-4xl font-bold text-white">{data.revenue.transactions}</div>
                    <div className="text-white/50 mt-2">Transactions</div>
                  </div>
                </div>
                <p className="text-white/40 text-sm text-center mt-6">
                  Log revenue to track ROI on your marketing campaigns
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ icon, label, value, subtext, color }: {
  icon: string;
  label: string;
  value: string;
  subtext: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  };
  const valueColors = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl bg-gradient-to-br ${colorClasses[color]} rounded-2xl border p-6`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${valueColors[color]}`}>{value}</div>
      <div className="text-sm text-white/50">{label}</div>
      <div className="text-xs text-white/40 mt-1">{subtext}</div>
    </motion.div>
  );
}

function FunnelBar({ label, value, max, color }: {
  label: string;
  value: number;
  max: number;
  color: 'blue' | 'emerald' | 'purple';
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colorClasses = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50">{value}</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
