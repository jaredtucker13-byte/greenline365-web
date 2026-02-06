'use client';

/**
 * Referral Network - Contractor Directory & Referral Tracking
 * The closed-loop economy between Greenline contractors.
 * Priority: Preferred → Top Greenline → Greenline → Highest Rated
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

interface Contractor {
  id: string;
  business_name: string;
  industry: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  avg_rating: number;
  total_reviews: number;
  total_referrals_received: number;
  total_referrals_completed: number;
  is_preferred: boolean;
  is_greenline_member: boolean;
  is_active: boolean;
  notes?: string;
  contractor_reviews?: { id: string; rating: number; review_text: string; created_at: string }[];
}

interface Referral {
  id: string;
  status: string;
  trigger_type: string;
  homeowner_name?: string;
  homeowner_phone?: string;
  job_value?: number;
  notes?: string;
  created_at: string;
  contractor_directory?: { business_name: string; industry: string; avg_rating: number };
}

const INDUSTRIES = [
  { value: 'all', label: 'All Industries' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'lawn_care', label: 'Lawn Care' },
  { value: 'security', label: 'Security' },
  { value: 'painting', label: 'Painting' },
  { value: 'general', label: 'General' },
];

const STATUS_COLORS: Record<string, string> = {
  suggested: '#FFB800',
  sent: '#00D4FF',
  viewed: '#8B5CF6',
  accepted: '#0CE293',
  completed: '#39FF14',
  declined: '#FF4444',
  expired: '#666',
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} width={size} height={size} viewBox="0 0 24 24" fill={star <= Math.round(rating) ? '#FFB800' : 'none'} stroke={star <= Math.round(rating) ? '#FFB800' : '#444'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="text-xs text-zinc-500 ml-1">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
    </div>
  );
}

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ReferralNetworkPage() {
  const { activeBusiness } = useBusiness();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'referrals'>('directory');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralStats, setReferralStats] = useState({ total: 0, suggested: 0, sent: 0, completed: 0, totalJobValue: 0 });
  const [loading, setLoading] = useState(true);
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [showAddContractor, setShowAddContractor] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  // Add contractor form
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('plumbing');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPreferred, setNewPreferred] = useState(false);

  useEffect(() => {
    if (activeBusiness?.id) {
      loadContractors();
      loadReferrals();
    }
  }, [activeBusiness?.id, filterIndustry]);

  async function loadContractors() {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const params = new URLSearchParams({ tenant_id: activeBusiness.id });
    if (filterIndustry !== 'all') params.set('industry', filterIndustry);

    const res = await fetch(`/api/contractors?${params}`);
    const data = await res.json();
    setContractors(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadReferrals() {
    if (!activeBusiness?.id) return;
    const res = await fetch(`/api/referrals?tenant_id=${activeBusiness.id}`);
    const data = await res.json();
    if (data.referrals) {
      setReferrals(data.referrals);
      setReferralStats(data.stats);
    }
  }

  async function handleAddContractor() {
    if (!activeBusiness?.id || !newName) return;
    await fetch('/api/contractors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: activeBusiness.id,
        business_name: newName, industry: newIndustry,
        contact_name: newContact || null, phone: newPhone || null,
        email: newEmail || null, is_preferred: newPreferred,
      }),
    });
    setShowAddContractor(false);
    setNewName(''); setNewContact(''); setNewPhone(''); setNewEmail(''); setNewPreferred(false);
    loadContractors();
  }

  async function handleCreateReferral(contractorId: string) {
    if (!activeBusiness?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referring_tenant_id: activeBusiness.id,
        referring_user_id: user?.id,
        referred_contractor_id: contractorId,
        trigger_type: 'manual',
      }),
    });
    loadReferrals();
    setSelectedContractor(null);
  }

  async function handleUpdateReferralStatus(referralId: string, status: string) {
    if (!activeBusiness?.id) return;
    await fetch('/api/referrals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: referralId, referring_tenant_id: activeBusiness.id, status }),
    });
    loadReferrals();
  }

  async function togglePreferred(contractor: Contractor) {
    if (!activeBusiness?.id) return;
    await fetch('/api/contractors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contractor.id, tenant_id: activeBusiness.id, is_preferred: !contractor.is_preferred }),
    });
    loadContractors();
  }

  return (
    <div className="min-h-screen flex relative" style={{ background: '#0A0A0A' }}>
      <CollapsibleSidebar
        activeItem="referral-network"
        onNewBooking={() => {}} onNewContent={() => {}} pendingCount={0}
        isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen} onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white" data-testid="referral-title">Referral Network</h1>
              <p className="text-sm text-zinc-500">Your closed-loop contractor economy</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddContractor(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-black transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
            data-testid="add-contractor-btn"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Contractor
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Network Size', value: contractors.length, color: '#8B5CF6' },
            { label: 'Active Referrals', value: referralStats.sent + referralStats.suggested, color: '#00D4FF' },
            { label: 'Completed', value: referralStats.completed, color: '#39FF14' },
            { label: 'Revenue Generated', value: `$${referralStats.totalJobValue.toLocaleString()}`, color: '#FFB800' },
          ].map(s => (
            <div key={s.label} className="backdrop-blur-xl rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900/50 rounded-xl p-1 w-fit">
          {(['directory', 'referrals'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}
              style={activeTab === tab ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA' } : {}}
              data-testid={`tab-${tab}`}
            >
              {tab === 'directory' ? 'Contractor Directory' : 'Referral Tracker'}
            </button>
          ))}
        </div>

        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
              {INDUSTRIES.map(ind => (
                <button key={ind.value} onClick={() => setFilterIndustry(ind.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filterIndustry === ind.value ? 'text-white' : 'text-zinc-500'}`}
                  style={filterIndustry === ind.value ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' } : { border: '1px solid transparent' }}
                  data-testid={`filter-${ind.value}`}
                >{ind.label}</button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
              </div>
            ) : contractors.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto mb-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h3 className="text-lg font-medium text-zinc-400 mb-2">No contractors yet</h3>
                <p className="text-sm text-zinc-600">Add trusted contractors to build your referral network</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contractors.map(c => (
                  <motion.div key={c.id} variants={fadeUp} initial="initial" animate="animate"
                    className="backdrop-blur-xl rounded-2xl border p-5 group"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: c.is_preferred ? 'rgba(255,184,0,0.2)' : 'rgba(255,255,255,0.06)' }}
                    data-testid={`contractor-${c.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{c.business_name}</h3>
                          {c.is_preferred && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>Preferred</span>}
                          {c.is_greenline_member && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14' }}>Greenline</span>}
                        </div>
                        <p className="text-xs text-zinc-500 capitalize mt-0.5">{c.industry.replace('_', ' ')}{c.contact_name ? ` - ${c.contact_name}` : ''}</p>
                      </div>
                      <button onClick={() => togglePreferred(c)} title={c.is_preferred ? 'Remove preferred' : 'Mark preferred'}
                        className="p-1.5 rounded-lg transition hover:bg-white/5" data-testid={`toggle-preferred-${c.id}`}>
                        <svg className="w-5 h-5" fill={c.is_preferred ? '#FFB800' : 'none'} viewBox="0 0 24 24" stroke={c.is_preferred ? '#FFB800' : '#555'} strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                    <StarRating rating={c.avg_rating} />
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-600">
                      <span>{c.total_reviews} reviews</span>
                      <span>{c.total_referrals_completed} completed referrals</span>
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleCreateReferral(c.id)}
                        className="text-xs px-3 py-1.5 rounded-lg transition"
                        style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}
                        data-testid={`refer-${c.id}`}
                      >Send Referral</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-3">
            {referrals.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-sm">No referrals yet</p>
                <p className="text-zinc-600 text-xs mt-1">Create referrals from the contractor directory</p>
              </div>
            ) : referrals.map(ref => (
              <motion.div key={ref.id} variants={fadeUp} initial="initial" animate="animate"
                className="backdrop-blur-xl rounded-xl border p-4 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                data-testid={`referral-${ref.id}`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${STATUS_COLORS[ref.status] || '#666'}15` }}>
                  <svg className="w-5 h-5" style={{ color: STATUS_COLORS[ref.status] || '#666' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{ref.contractor_directory?.business_name || 'Unknown'}</p>
                  <p className="text-xs text-zinc-500">{ref.contractor_directory?.industry} - {ref.trigger_type.replace('_', ' ')}</p>
                  {ref.homeowner_name && <p className="text-[10px] text-zinc-600 mt-0.5">For: {ref.homeowner_name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-1 rounded-full capitalize" style={{ background: `${STATUS_COLORS[ref.status]}15`, color: STATUS_COLORS[ref.status] }}>
                    {ref.status}
                  </span>
                  {ref.status === 'suggested' && (
                    <button onClick={() => handleUpdateReferralStatus(ref.id, 'sent')}
                      className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                      Mark Sent
                    </button>
                  )}
                  {ref.status === 'sent' && (
                    <button onClick={() => handleUpdateReferralStatus(ref.id, 'completed')}
                      className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14' }}>
                      Complete
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600">{new Date(ref.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contractor Modal */}
      <AnimatePresence>
        {showAddContractor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setShowAddContractor(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-2xl rounded-2xl border p-6"
              style={{ background: 'rgba(20,20,20,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}
              data-testid="add-contractor-modal"
            >
              <h2 className="text-lg font-semibold text-white mb-5">Add Contractor</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Business Name *" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="contractor-name" />
                <select value={newIndustry} onChange={e => setNewIndustry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="contractor-industry">
                  {INDUSTRIES.filter(i => i.value !== 'all').map(i => <option key={i.value} value={i.value} style={{ background: '#1A1A1A' }}>{i.label}</option>)}
                </select>
                <input type="text" placeholder="Contact Name" value={newContact} onChange={e => setNewContact(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <input type="tel" placeholder="Phone" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newPreferred} onChange={e => setNewPreferred(e.target.checked)} className="rounded" />
                  <span className="text-sm text-zinc-400">Mark as preferred contractor</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddContractor(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                <button onClick={handleAddContractor} disabled={!newName}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
                  data-testid="save-contractor">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
