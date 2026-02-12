'use client';

/**
 * Campaign Manager - Unified Outreach & Pipeline Hub
 * 
 * Features:
 * - Campaign list with draft/active/completed filters
 * - Kanban pipeline (New → Contacted → Replied → Claimed → Upgraded → Gold)
 * - Campaign creation wizard (audience, sequence, templates)
 * - Save as draft / edit / delete
 * - Calendar integration (scheduled sends visible on calendar)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ============ TYPES ============

interface CampaignContact {
  listing_id?: string;
  email: string;
  business_name: string;
  phone?: string;
  city?: string;
  industry?: string;
  pipeline_stage: string;
  current_step: number;
  added_at: string;
  metadata?: any;
}

interface SequenceStep {
  step: number;
  delay_days: number;
  subject: string;
  type: string;
  html_content?: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  total_recipients: number;
  emails_sent: number;
  emails_opened: number;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  sequence: SequenceStep[];
  audience_filter: any;
  sender_config: any;
  contacts: CampaignContact[];
  pipeline_summary: Record<string, number>;
}

// ============ CONSTANTS ============

const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: '#3B82F6', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'contacted', label: 'Contacted', color: '#8B5CF6', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'replied', label: 'Replied', color: '#F59E0B', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  { id: 'claimed', label: 'Claimed', color: '#10B981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'upgraded', label: 'Upgraded', color: '#06B6D4', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'gold', label: 'Gold', color: '#EAB308', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
];

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'active', label: 'Active' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'sent', label: 'Sent' },
  { id: 'paused', label: 'Paused' },
];

const SEQUENCE_TYPES = [
  { id: 'initial_outreach', label: 'Initial Outreach', desc: 'First contact - introduce their listing' },
  { id: 'value_bomb', label: 'Value Bomb (Audit)', desc: 'Free audit delivery after 24h delay' },
  { id: 'demo_invite', label: 'Demo Invite', desc: 'Screenshot + phone number for AI agent demo' },
  { id: 'follow_up', label: 'Follow-up', desc: 'Gentle follow-up with social proof' },
  { id: 'final_offer', label: 'Final Offer', desc: 'Last chance with limited-time incentive' },
];

// ============ MAIN COMPONENT ============

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab ? `?status=${activeTab}` : '';
      const res = await fetch(`/api/campaigns${params}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
      if (selectedCampaign?.id === id) setSelectedCampaign(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const updateContactStage = async (campaignId: string, email: string, newStage: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pipeline_stage: newStage }),
      });
      // Refresh selected campaign
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      if (data.campaign) {
        const meta = data.campaign.custom_recipients || {};
        setSelectedCampaign({
          ...data.campaign,
          sequence: meta.sequence || [],
          contacts: meta.contacts || [],
          audience_filter: meta.audience_filter || {},
          sender_config: meta.sender_config || {},
          pipeline_summary: getPipelineSummary(meta.contacts || []),
        });
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="campaign-manager">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2" className="text-white/50 hover:text-white transition" data-testid="back-to-admin">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2" data-testid="campaign-title">
                  <svg className="w-6 h-6 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Campaign Manager
                </h1>
                <p className="text-sm text-white/40">Outreach pipelines, email sequences & lead tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-[#39FF14] text-black' : 'text-white/60 hover:text-white'}`} data-testid="view-list">List</button>
                <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-[#39FF14] text-black' : 'text-white/60 hover:text-white'}`} data-testid="view-kanban">Pipeline</button>
              </div>
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-[#39FF14] text-black font-semibold hover:bg-[#32E012] transition flex items-center gap-2" data-testid="create-campaign-btn">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Campaign
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4 border-b border-white/5">
        <div className="flex gap-2">
          {STATUS_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`} data-testid={`tab-${tab.id || 'all'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'list' ? (
          <CampaignList
            campaigns={campaigns}
            onSelect={setSelectedCampaign}
            onDelete={deleteCampaign}
            onRefresh={fetchCampaigns}
          />
        ) : (
          <KanbanView
            campaigns={campaigns}
            onSelect={setSelectedCampaign}
            onUpdateStage={updateContactStage}
          />
        )}
      </main>

      {/* Campaign Detail Drawer */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignDrawer
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            onUpdateStage={updateContactStage}
            onRefresh={fetchCampaigns}
            onShowImport={() => setShowImport(true)}
          />
        )}
      </AnimatePresence>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateCampaignModal
            onClose={() => setShowCreate(false)}
            onSuccess={(camp) => {
              setShowCreate(false);
              fetchCampaigns();
              setSelectedCampaign(camp);
            }}
          />
        )}
      </AnimatePresence>

      {/* Import Contacts Modal */}
      <AnimatePresence>
        {showImport && selectedCampaign && (
          <ImportContactsModal
            campaignId={selectedCampaign.id}
            onClose={() => setShowImport(false)}
            onSuccess={() => {
              setShowImport(false);
              // Refresh selected campaign
              fetch(`/api/campaigns/${selectedCampaign.id}`)
                .then(r => r.json())
                .then(d => {
                  if (d.campaign) {
                    const m = d.campaign.custom_recipients || {};
                    setSelectedCampaign({
                      ...d.campaign, sequence: m.sequence || [], contacts: m.contacts || [],
                      audience_filter: m.audience_filter || {}, sender_config: m.sender_config || {},
                      pipeline_summary: getPipelineSummary(m.contacts || []),
                    });
                  }
                });
              fetchCampaigns();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ CAMPAIGN LIST ============

function CampaignList({ campaigns, onSelect, onDelete, onRefresh }: {
  campaigns: Campaign[];
  onSelect: (c: Campaign) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <p className="text-white/40 text-lg mb-2">No campaigns yet</p>
        <p className="text-white/25 text-sm">Create your first outreach campaign to start building your pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="campaign-list">
      {campaigns.map((camp, i) => (
        <motion.div
          key={camp.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(camp)}
          className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#39FF14]/20 cursor-pointer transition group"
          data-testid={`campaign-row-${camp.id}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-semibold truncate group-hover:text-[#39FF14] transition">{camp.name}</h3>
                <StatusBadge status={camp.status} />
              </div>
              <p className="text-white/40 text-sm truncate">{camp.description || 'No description'}</p>
            </div>

            <div className="flex items-center gap-6 ml-6">
              {/* Pipeline mini-summary */}
              <div className="hidden md:flex items-center gap-1">
                {PIPELINE_STAGES.map(stage => {
                  const count = camp.pipeline_summary?.[stage.id] || 0;
                  if (count === 0) return null;
                  return (
                    <span key={stage.id} className={`px-2 py-0.5 rounded text-xs font-medium ${stage.bg} ${stage.text}`}>
                      {count}
                    </span>
                  );
                })}
              </div>

              <div className="text-right">
                <p className="text-white font-bold">{camp.total_recipients}</p>
                <p className="text-white/30 text-xs">contacts</p>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-[#39FF14] font-bold">{camp.emails_sent}</p>
                <p className="text-white/30 text-xs">sent</p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(camp.id); }}
                className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                data-testid={`delete-campaign-${camp.id}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          {/* Sequence preview */}
          {camp.sequence.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="text-white/25 text-xs">Sequence:</span>
              {camp.sequence.map((step, idx) => (
                <span key={idx} className="flex items-center gap-1 text-xs">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-[10px]">{step.step}</span>
                  <span className="text-white/40">{step.type.replace(/_/g, ' ')}</span>
                  {idx < camp.sequence.length - 1 && <span className="text-white/15 mx-1">→</span>}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ============ KANBAN VIEW ============

function KanbanView({ campaigns, onSelect, onUpdateStage }: {
  campaigns: Campaign[];
  onSelect: (c: Campaign) => void;
  onUpdateStage: (campaignId: string, email: string, stage: string) => void;
}) {
  // Merge all contacts from all campaigns with their campaign reference
  const allContacts: (CampaignContact & { campaign_id: string; campaign_name: string })[] = [];
  for (const camp of campaigns) {
    for (const contact of camp.contacts || []) {
      allContacts.push({ ...contact, campaign_id: camp.id, campaign_name: camp.name });
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
      {PIPELINE_STAGES.map(stage => {
        const stageContacts = allContacts.filter(c => c.pipeline_stage === stage.id);
        return (
          <div key={stage.id} className="flex-shrink-0 w-72" data-testid={`kanban-col-${stage.id}`}>
            <div className={`rounded-t-xl px-4 py-3 border-b-2 flex items-center justify-between`} style={{ borderColor: stage.color, background: `${stage.color}10` }}>
              <span className="text-sm font-semibold text-white">{stage.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stage.bg} ${stage.text}`}>{stageContacts.length}</span>
            </div>
            <div className="space-y-2 p-2 min-h-[200px] bg-white/[0.02] rounded-b-xl border border-white/5 border-t-0">
              {stageContacts.map(contact => (
                <div key={`${contact.campaign_id}-${contact.email}`} className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10 transition group" data-testid={`kanban-card-${contact.email}`}>
                  <p className="text-sm font-medium text-white truncate">{contact.business_name || contact.email}</p>
                  <p className="text-xs text-white/40 truncate">{contact.email}</p>
                  {contact.city && <p className="text-xs text-white/25 mt-1">{contact.city} &middot; {contact.industry}</p>}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                    {PIPELINE_STAGES.filter(s => s.id !== stage.id).slice(0, 3).map(nextStage => (
                      <button
                        key={nextStage.id}
                        onClick={() => onUpdateStage(contact.campaign_id, contact.email, nextStage.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${nextStage.bg} ${nextStage.text} hover:opacity-80`}
                        title={`Move to ${nextStage.label}`}
                      >
                        → {nextStage.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 mt-1 truncate">{contact.campaign_name}</p>
                </div>
              ))}
              {stageContacts.length === 0 && (
                <div className="text-center py-8 text-white/15 text-xs">No contacts</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ CAMPAIGN DRAWER ============

function CampaignDrawer({ campaign, onClose, onUpdateStage, onRefresh, onShowImport }: {
  campaign: Campaign;
  onClose: () => void;
  onUpdateStage: (campaignId: string, email: string, stage: string) => void;
  onRefresh: () => void;
  onShowImport: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'contacts' | 'sequence'>('overview');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [editDesc, setEditDesc] = useState(campaign.description);

  const saveEdits = async () => {
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc }),
    });
    setEditing(false);
    onRefresh();
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col" data-testid="campaign-drawer">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none" />
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none resize-none text-sm" />
                  <div className="flex gap-2">
                    <button onClick={saveEdits} className="px-3 py-1 rounded bg-[#39FF14] text-black text-sm font-medium">Save</button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1 rounded bg-white/10 text-white/60 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white truncate">{campaign.name}</h2>
                    <StatusBadge status={campaign.status} />
                    <button onClick={() => setEditing(true)} className="text-white/30 hover:text-white" data-testid="edit-campaign-btn">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                  <p className="text-white/40 text-sm mt-1">{campaign.description || 'No description'}</p>
                </>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white transition ml-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Status Actions */}
          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <button onClick={() => updateStatus('active')} className="px-4 py-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14] text-sm font-medium hover:bg-[#39FF14]/20 transition" data-testid="activate-campaign-btn">Activate Campaign</button>
            )}
            {campaign.status === 'active' && (
              <button onClick={() => updateStatus('paused')} className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition">Pause</button>
            )}
            {campaign.status === 'paused' && (
              <button onClick={() => updateStatus('active')} className="px-4 py-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14] text-sm font-medium hover:bg-[#39FF14]/20 transition">Resume</button>
            )}
            <button onClick={onShowImport} className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition" data-testid="import-contacts-btn">
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Import Contacts
            </button>
          </div>

          {/* Pipeline Summary */}
          <div className="flex gap-2 mt-4" data-testid="pipeline-summary">
            {PIPELINE_STAGES.map(stage => (
              <div key={stage.id} className={`flex-1 rounded-lg p-2 text-center ${stage.bg} border ${stage.border}`}>
                <p className={`text-lg font-bold ${stage.text}`}>{campaign.pipeline_summary?.[stage.id] || 0}</p>
                <p className="text-[10px] text-white/40">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['overview', 'contacts', 'sequence'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium capitalize transition ${tab === t ? 'text-[#39FF14] border-b-2 border-[#39FF14]' : 'text-white/40 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Total Contacts" value={campaign.total_recipients} />
                <Stat label="Emails Sent" value={campaign.emails_sent} color="green" />
                <Stat label="Opened" value={campaign.emails_opened} color="blue" />
                <Stat label="Created" value={new Date(campaign.created_at).toLocaleDateString()} />
              </div>
              {campaign.sequence.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">Email Sequence</h3>
                  <div className="space-y-2">
                    {campaign.sequence.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#39FF14]/10 flex items-center justify-center text-[#39FF14] text-sm font-bold">{step.step}</div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{step.subject || step.type}</p>
                          <p className="text-xs text-white/30">{step.type.replace(/_/g, ' ')} &middot; Day {step.delay_days}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-2">
              {(campaign.contacts || []).length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <p className="mb-2">No contacts yet</p>
                  <button onClick={onShowImport} className="text-[#39FF14] text-sm hover:underline">Import from Directory</button>
                </div>
              ) : (
                (campaign.contacts || []).map((contact, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{contact.business_name || contact.email}</p>
                      <p className="text-xs text-white/40 truncate">{contact.email} {contact.city && `· ${contact.city}`}</p>
                    </div>
                    <select
                      value={contact.pipeline_stage}
                      onChange={(e) => onUpdateStage(campaign.id, contact.email, e.target.value)}
                      className="ml-3 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs focus:border-[#39FF14] outline-none"
                      data-testid={`stage-select-${contact.email}`}
                    >
                      {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'sequence' && (
            <SequenceEditor
              campaignId={campaign.id}
              sequence={campaign.sequence}
              onRefresh={onRefresh}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}

// ============ SEQUENCE EDITOR ============

function SequenceEditor({ campaignId, sequence, onRefresh }: {
  campaignId: string;
  sequence: SequenceStep[];
  onRefresh: () => void;
}) {
  const [steps, setSteps] = useState<SequenceStep[]>(sequence.length > 0 ? sequence : []);
  const [saving, setSaving] = useState(false);

  const addStep = () => {
    const nextStep = steps.length + 1;
    setSteps([...steps, { step: nextStep, delay_days: nextStep === 1 ? 0 : 3, subject: '', type: 'follow_up' }]);
  };

  const removeStep = (idx: number) => {
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 }));
    setSteps(updated);
  };

  const updateStep = (idx: number, field: string, value: any) => {
    const updated = [...steps];
    (updated[idx] as any)[field] = value;
    setSteps(updated);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: steps }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to save sequence:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="sequence-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/60">Email Sequence Steps</h3>
        <button onClick={addStep} className="px-3 py-1.5 rounded-lg bg-[#39FF14]/10 text-[#39FF14] text-xs font-medium hover:bg-[#39FF14]/20 transition" data-testid="add-step-btn">+ Add Step</button>
      </div>

      {steps.map((step, idx) => (
        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] text-xs font-bold">{step.step}</span>
              <span className="text-sm text-white font-medium">Step {step.step}</span>
            </div>
            <button onClick={() => removeStep(idx)} className="text-red-400/50 hover:text-red-400 text-xs">Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Type</label>
              <select value={step.type} onChange={(e) => updateStep(idx, 'type', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none">
                {SEQUENCE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Delay (days)</label>
              <input type="number" value={step.delay_days} onChange={(e) => updateStep(idx, 'delay_days', parseInt(e.target.value) || 0)} min={0} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1">Subject Line</label>
            <input type="text" value={step.subject} onChange={(e) => updateStep(idx, 'subject', e.target.value)} placeholder="e.g. Your listing on GreenLine365" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none placeholder:text-white/20" />
          </div>

          <p className="text-[10px] text-white/25">{SEQUENCE_TYPES.find(t => t.id === step.type)?.desc}</p>
        </motion.div>
      ))}

      {steps.length === 0 && (
        <div className="text-center py-8 text-white/25 text-sm">
          <p>No steps defined. Click "Add Step" to build your sequence.</p>
        </div>
      )}

      {steps.length > 0 && (
        <button onClick={save} disabled={saving} className="w-full py-3 rounded-lg bg-[#39FF14] text-black font-semibold hover:bg-[#32E012] disabled:opacity-50 transition" data-testid="save-sequence-btn">
          {saving ? 'Saving...' : 'Save Sequence'}
        </button>
      )}
    </div>
  );
}

// ============ CREATE CAMPAIGN MODAL ============

function CreateCampaignModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: (campaign: Campaign) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', description: '', status: 'draft',
    audience_filter: { city: '', industry: '', after_hours_only: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const create = async () => {
    if (!form.name.trim()) { setError('Campaign name required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          status: form.status,
          audience_filter: form.audience_filter,
          sequence: [
            { step: 1, delay_days: 0, subject: 'Your listing on GreenLine365', type: 'initial_outreach' },
            { step: 2, delay_days: 3, subject: `Free audit for {{business_name}}`, type: 'value_bomb' },
            { step: 3, delay_days: 7, subject: 'Try our AI receptionist - live demo', type: 'demo_invite' },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        const meta = data.campaign.custom_recipients || {};
        onSuccess({
          ...data.campaign,
          sequence: meta.sequence || [],
          contacts: meta.contacts || [],
          audience_filter: meta.audience_filter || {},
          sender_config: meta.sender_config || {},
          pipeline_summary: {},
        });
      } else {
        setError(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6" data-testid="create-campaign-modal">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">New Campaign</h2>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Campaign Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. After-Hours Service Outreach - Tampa" className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none placeholder:text-white/20" data-testid="campaign-name-input" />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What's this campaign about?" className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none resize-none placeholder:text-white/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Target City</label>
                <select value={form.audience_filter.city} onChange={(e) => setForm({ ...form, audience_filter: { ...form.audience_filter, city: e.target.value } })} className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none">
                  <option value="">All Cities</option>
                  {['Tampa', 'Orlando', 'Miami', 'Jacksonville', 'Sarasota', 'Key West', 'Daytona Beach', 'St. Petersburg'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Target Industry</label>
                <select value={form.audience_filter.industry} onChange={(e) => setForm({ ...form, audience_filter: { ...form.audience_filter, industry: e.target.value } })} className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#39FF14] outline-none">
                  <option value="">All Industries</option>
                  {['services', 'dining', 'health_wellness', 'nightlife', 'family_entertainment', 'style_shopping', 'hotels_lodging', 'professional_services'].map(i => <option key={i} value={i}>{i.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 cursor-pointer">
              <input type="checkbox" checked={form.audience_filter.after_hours_only} onChange={(e) => setForm({ ...form, audience_filter: { ...form.audience_filter, after_hours_only: e.target.checked } })} className="rounded" />
              <div>
                <p className="text-sm text-amber-400 font-medium">After-Hours Targets Only</p>
                <p className="text-xs text-white/30">Businesses confirmed closed after hours (highest conversion potential)</p>
              </div>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition">Cancel</button>
              <button onClick={create} disabled={loading} className="flex-1 py-3 rounded-lg bg-[#39FF14] text-black font-semibold hover:bg-[#32E012] disabled:opacity-50 transition" data-testid="create-campaign-submit">
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============ IMPORT CONTACTS MODAL ============

function ImportContactsModal({ campaignId, onClose, onSuccess }: {
  campaignId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [filter, setFilter] = useState({ city: '', industry: '', after_hours_only: false });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const doImport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_from_directory', filter }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setResult({ error: 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6" data-testid="import-contacts-modal">
          <h2 className="text-lg font-bold text-white mb-4">Import Contacts from Directory</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">City</label>
                <select value={filter.city} onChange={(e) => setFilter({ ...filter, city: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none">
                  <option value="">All</option>
                  {['Tampa', 'Orlando', 'Miami', 'Jacksonville', 'Sarasota'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Industry</label>
                <select value={filter.industry} onChange={(e) => setFilter({ ...filter, industry: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14] outline-none">
                  <option value="">All</option>
                  {['services', 'dining', 'health_wellness', 'nightlife'].map(i => <option key={i} value={i}>{i.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filter.after_hours_only} onChange={(e) => setFilter({ ...filter, after_hours_only: e.target.checked })} />
              <span className="text-sm text-amber-400">After-hours targets only</span>
            </label>

            {result && (
              <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                {result.success ? `Added ${result.added} contacts (${result.skipped_duplicates} duplicates skipped). Total: ${result.total}` : result.error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/60 text-sm">Cancel</button>
              <button onClick={doImport} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-[#39FF14] text-black text-sm font-semibold disabled:opacity-50" data-testid="import-submit-btn">
                {loading ? 'Importing...' : 'Import Contacts'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============ HELPERS ============

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
    active: { bg: 'bg-[#39FF14]/15', text: 'text-[#39FF14]' },
    scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    sending: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    sent: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    paused: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    completed: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  };
  const cfg = configs[status] || configs.draft;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{status}</span>;
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  const colorClass = color === 'green' ? 'text-[#39FF14]' : color === 'blue' ? 'text-blue-400' : 'text-white';
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function getPipelineSummary(contacts: any[]) {
  const stages: Record<string, number> = { new: 0, contacted: 0, replied: 0, claimed: 0, upgraded: 0, gold: 0 };
  for (const c of contacts) {
    const stage = c.pipeline_stage || 'new';
    if (stage in stages) stages[stage]++;
  }
  return stages;
}
