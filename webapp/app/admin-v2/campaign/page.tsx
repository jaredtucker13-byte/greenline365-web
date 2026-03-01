'use client';

/**
 * Campaign Dashboard - Email outreach pipeline & CRM overview
 * Shows: lead funnel, email stats, golden customers, manual triggers
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

interface CampaignStats {
  total_leads: number;
  email_1_sent: number;
  follow_up_sent: number;
  replied: number;
  verified: number;
  unsubscribed: number;
  not_yet_emailed: number;
}

interface Lead {
  id: string;
  email: string;
  name: string;
  company: string;
  status: string;
  source: string;
  tags: string[];
  notes: string;
  value: number;
  created_at: string;
  last_contact_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: '#666',
  emailed: '#00D4FF',
  responded: '#8B5CF6',
  verified: '#39FF14',
  converted: '#FFB800',
  lost: '#FF4444',
};

const PIPELINE_STAGES = [
  { key: 'new', label: 'New Leads', color: '#666', icon: 'M12 4v16m8-8H4' },
  { key: 'emailed', label: 'Emailed', color: '#00D4FF', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'replied', label: 'Replied', color: '#8B5CF6', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
  { key: 'verified', label: 'Verified', color: '#39FF14', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'converted', label: 'Customers', color: '#FFB800', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1' },
];

export default function CampaignDashboard() {
  const { activeBusiness } = useBusiness();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [goldenCustomers, setGoldenCustomers] = useState<Lead[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Get campaign stats
    const statsRes = await fetch('/api/email/campaign');
    const statsData = await statsRes.json();
    setStats(statsData);

    // Get leads
    const leadsRes = await fetch('/api/crm/leads?limit=100&source=gl365_directory&sortBy=updated_at&sortOrder=desc');
    const leadsData = await leadsRes.json();
    setLeads(leadsData.leads || []);

    // Golden customers
    const golden = (leadsData.leads || []).filter((l: Lead) => l.tags?.includes('golden_customer') || l.status === 'converted');
    setGoldenCustomers(golden);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLeads = activeFilter === 'all' ? leads
    : activeFilter === 'golden' ? goldenCustomers
    : leads.filter(l => {
      if (activeFilter === 'emailed') return l.tags?.includes('email_1_sent') && !l.tags?.includes('email_replied');
      if (activeFilter === 'replied') return l.tags?.includes('email_replied');
      if (activeFilter === 'verified') return l.status === 'verified';
      if (activeFilter === 'new') return l.status === 'new' && !l.tags?.includes('email_1_sent');
      return true;
    });

  const pipelineCounts = {
    new: leads.filter(l => l.status === 'new' && !l.tags?.includes('email_1_sent')).length,
    emailed: leads.filter(l => l.tags?.includes('email_1_sent') && !l.tags?.includes('email_replied')).length,
    replied: leads.filter(l => l.tags?.includes('email_replied') && l.status !== 'verified' && l.status !== 'converted').length,
    verified: leads.filter(l => l.status === 'verified').length,
    converted: leads.filter(l => l.status === 'converted' || l.tags?.includes('golden_customer')).length,
  };

  return (
    <div className="min-h-screen flex relative" style={{ background: '#0A0A0A' }}>
      <CollapsibleSidebar
        activeItem="campaign"
        onNewBooking={() => {}} onNewContent={() => {}} pendingCount={0}
        isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen} onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4444)', boxShadow: '0 0 20px rgba(255,140,0,0.3)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white" data-testid="campaign-title">Campaign HQ</h1>
              <p className="text-sm text-zinc-500">Email pipeline & lead management</p>
            </div>
          </div>
          <button onClick={loadData} className="text-xs px-3 py-2 rounded-lg text-zinc-400 hover:text-white transition" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            Refresh
          </button>
        </div>

        {/* Pipeline Funnel */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {PIPELINE_STAGES.map(stage => (
            <button
              key={stage.key}
              onClick={() => setActiveFilter(activeFilter === stage.key ? 'all' : stage.key)}
              className={`backdrop-blur-xl rounded-2xl border p-4 text-center transition hover:border-opacity-40 ${activeFilter === stage.key ? 'ring-1' : ''}`}
              style={{
                background: activeFilter === stage.key ? `${stage.color}10` : 'rgba(255,255,255,0.02)',
                borderColor: activeFilter === stage.key ? `${stage.color}40` : 'rgba(255,255,255,0.06)',
                ...(activeFilter === stage.key ? { ringColor: stage.color } : {}),
              }}
              data-testid={`pipeline-${stage.key}`}
            >
              <svg className="w-5 h-5 mx-auto mb-2" style={{ color: stage.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={stage.icon} />
              </svg>
              <p className="text-2xl font-bold" style={{ color: stage.color }}>{pipelineCounts[stage.key as keyof typeof pipelineCounts] || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{stage.label}</p>
            </button>
          ))}
        </div>

        {/* Golden Customers Highlight */}
        {goldenCustomers.length > 0 && (
          <div className="backdrop-blur-xl rounded-2xl border p-5 mb-6" style={{ background: 'rgba(255,184,0,0.03)', borderColor: 'rgba(255,184,0,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 className="text-sm font-semibold" style={{ color: '#FFB800' }}>Golden Customers ({goldenCustomers.length})</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto">
              {goldenCustomers.map(c => (
                <div key={c.id} className="flex-shrink-0 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.15)' }}>
                  <span className="font-semibold text-white">{c.company || c.name}</span>
                  {c.value > 0 && <span className="ml-2 text-yellow-400">${c.value}/mo</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Strip */}
        {stats && (
          <div className="grid grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total_leads, color: '#fff' },
              { label: 'Not Emailed', value: stats.not_yet_emailed, color: '#666' },
              { label: 'Email Sent', value: stats.email_1_sent, color: '#00D4FF' },
              { label: 'Follow-up', value: stats.follow_up_sent, color: '#8B5CF6' },
              { label: 'Replied', value: stats.replied, color: '#39FF14' },
              { label: 'Verified', value: stats.verified, color: '#0CE293' },
              { label: 'Unsubscribed', value: stats.unsubscribed, color: '#FF4444' },
            ].map(s => (
              <div key={s.label} className="backdrop-blur-xl rounded-xl border p-3 text-center" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lead List */}
        <div className="backdrop-blur-xl rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold text-white">
              {activeFilter === 'all' ? 'All Leads' : activeFilter === 'golden' ? 'Golden Customers' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Leads`}
              <span className="text-zinc-600 ml-2">({filteredLeads.length})</span>
            </h3>
            <div className="flex gap-2">
              {['all', 'new', 'emailed', 'replied', 'verified', 'golden'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`text-[10px] px-2 py-1 rounded-lg transition ${activeFilter === f ? 'text-white' : 'text-zinc-600'}`}
                  style={activeFilter === f ? { background: 'rgba(255,255,255,0.1)' } : {}}
                >{f === 'golden' ? 'Golden' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-zinc-600">Loading...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">No leads in this category</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {filteredLeads.slice(0, 50).map(lead => (
                <div key={lead.id} className="px-4 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition" data-testid={`lead-${lead.id}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[lead.status] || '#666' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.company || lead.name}</p>
                    <p className="text-xs text-zinc-600 truncate">{lead.email}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {lead.tags?.includes('golden_customer') && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>Golden</span>
                    )}
                    {lead.tags?.includes('email_1_sent') && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>Emailed</span>
                    )}
                    {lead.tags?.includes('email_replied') && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14' }}>Replied</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-700 flex-shrink-0">{lead.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
