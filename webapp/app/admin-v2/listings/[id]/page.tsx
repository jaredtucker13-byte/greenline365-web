/**
 * Edit Listing — Tabbed interface with full management
 * Tabs: Details | Hours | Photos | Menu/Services | Reviews | Analytics
 * Includes status workflow, photo management, review responses, and analytics
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import CollapsibleSidebar from '../../components/CollapsibleSidebar';
import { DIRECTORY_CATEGORIES } from '@/lib/directory-config';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  industry: string;
  subcategories: string[];
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  hours: Record<string, unknown> | null;
  tags: string[];
  tier: string;
  is_published: boolean;
  is_claimed: boolean;
  claimed_by: string | null;
  avg_feedback_rating: number;
  total_feedback_count: number;
  trust_score: number;
  created_at: string;
  updated_at: string;
  status: string;
  metadata: Record<string, unknown> | null;
  feedback: Review[];
  analytics: AnalyticsSummary;
}

interface Review {
  id: string;
  rating: number;
  feedback_text: string | null;
  feedback_type: string;
  submitter_name: string | null;
  submitter_email: string | null;
  status: string | null;
  admin_response: string | null;
  created_at: string;
}

interface AnalyticsSummary {
  total_views: number;
  total_clicks: number;
  total_calls: number;
  total_directions: number;
  total_website_clicks: number;
  views_30d: number;
  clicks_30d: number;
  calls_30d: number;
}

interface MenuSection {
  id: string;
  title: string;
  items: { name: string; description?: string; price?: string }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const TABS = ['details', 'hours', 'photos', 'menu', 'reviews', 'analytics'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  draft: { label: 'Draft', color: 'text-white/50', bg: 'bg-white/5 border-white/10' },
  pending_review: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  unpublished: { label: 'Unpublished', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  archived: { label: 'Archived', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

const STATUS_TRANSITIONS: Record<string, { label: string; target: string; color: string }[]> = {
  draft: [
    { label: 'Submit for Review', target: 'pending_review', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { label: 'Publish Now', target: 'published', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  ],
  pending_review: [
    { label: 'Approve & Publish', target: 'published', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { label: 'Return to Draft', target: 'draft', color: 'text-white/50 bg-white/5 border-white/10' },
  ],
  published: [
    { label: 'Unpublish', target: 'unpublished', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
    { label: 'Archive', target: 'archived', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
  ],
  unpublished: [
    { label: 'Re-publish', target: 'published', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { label: 'Return to Draft', target: 'draft', color: 'text-white/50 bg-white/5 border-white/10' },
    { label: 'Archive', target: 'archived', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
  ],
  archived: [
    { label: 'Restore to Draft', target: 'draft', color: 'text-white/50 bg-white/5 border-white/10' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('details');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for details tab
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}`);
      if (!res.ok) throw new Error('Failed to load listing');
      const data = await res.json();
      setListing(data);
      setFormData({
        business_name: data.business_name || '',
        description: data.description || '',
        industry: data.industry || '',
        subcategories: data.subcategories || [],
        address_line1: data.address_line1 || '',
        city: data.city || '',
        state: data.state || 'FL',
        zip_code: data.zip_code || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        tags: (data.tags || []).join(', '),
        social_links: data.metadata?.social_links || {},
        service_areas: (data.metadata?.service_areas || []).join(', '),
      });
    } catch {
      showToast('Failed to load listing', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  // ─── API Helpers ──────────────────────────────────────────────────────
  const patchListing = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      showToast('Saved successfully');
      setHasChanges(false);
      fetchListing();
      return data;
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Save failed', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    return patchListing({ action: 'update_status', new_status: newStatus });
  };

  // ─── Save Details ─────────────────────────────────────────────────────
  const saveDetails = () => {
    const payload: Record<string, unknown> = {
      business_name: (formData.business_name as string)?.trim(),
      description: (formData.description as string)?.trim() || null,
      industry: formData.industry,
      subcategories: formData.subcategories,
      address_line1: (formData.address_line1 as string)?.trim() || null,
      city: (formData.city as string)?.trim() || null,
      state: formData.state || null,
      zip_code: (formData.zip_code as string)?.trim() || null,
      phone: (formData.phone as string)?.trim() || null,
      email: (formData.email as string)?.trim() || null,
      website: (formData.website as string)?.trim() || null,
      tags: (formData.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean),
      social_links: formData.social_links,
      service_areas: (formData.service_areas as string).split(',').map((s: string) => s.trim()).filter(Boolean),
    };
    patchListing(payload);
  };

  const updateField = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
          <p className="text-sm text-white/40 mt-3">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <p className="text-lg text-white/30">Listing not found</p>
          <button onClick={() => router.push('/admin-v2/listings')} className="mt-2 text-sm text-[#C9A84C] hover:underline">Back to listings</button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.draft;
  const transitions = STATUS_TRANSITIONS[listing.status] || [];
  const selectedCategory = DIRECTORY_CATEGORIES.find(c => c.id === formData.industry);

  return (
    <div
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <CollapsibleSidebar
        activeItem="listings"
        onNewBooking={() => {}} onNewContent={() => {}} pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin-v2/listings')} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-heading truncate">{listing.business_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                <span className="text-xs text-white/20">{listing.tier.toUpperCase()}</span>
                {listing.slug && listing.is_published && (
                  <a href={`/listing/${listing.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">
                    View Live →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {transitions.map(t => (
              <button
                key={t.target}
                onClick={() => changeStatus(t.target)}
                disabled={saving}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-[1.02] disabled:opacity-50 ${t.color}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab === 'menu' ? 'Menu / Services' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reviews' && listing.feedback.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">{listing.feedback.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENT ─── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === 'details' && (
              <DetailsTab
                formData={formData}
                updateField={updateField}
                selectedCategory={selectedCategory}
                saving={saving}
                hasChanges={hasChanges}
                onSave={saveDetails}
              />
            )}
            {activeTab === 'hours' && (
              <HoursTab listing={listing} onSave={patchListing} saving={saving} />
            )}
            {activeTab === 'photos' && (
              <PhotosTab listing={listing} onUpdate={fetchListing} showToast={showToast} />
            )}
            {activeTab === 'menu' && (
              <MenuTab listing={listing} onSave={patchListing} saving={saving} />
            )}
            {activeTab === 'reviews' && (
              <ReviewsTab listing={listing} onAction={patchListing} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsTab listing={listing} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-medium backdrop-blur-xl ${
              toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .form-input {
          width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.75rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: white; font-size: 0.875rem; outline: none; transition: all 0.2s;
        }
        .form-input:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 2px rgba(201,168,76,0.15); }
        .form-input::placeholder { color: rgba(255,255,255,0.25); }
        .form-input option { background: #1a1a1a; color: white; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: DETAILS
// ═══════════════════════════════════════════════════════════════════════════

function DetailsTab({ formData, updateField, selectedCategory, saving, hasChanges, onSave }: {
  formData: Record<string, unknown>;
  updateField: (key: string, value: unknown) => void;
  selectedCategory: { subcategories: string[] } | undefined;
  saving: boolean;
  hasChanges: boolean;
  onSave: () => void;
}) {
  const toggleSubcategory = (sub: string) => {
    const current = (formData.subcategories as string[]) || [];
    updateField('subcategories', current.includes(sub) ? current.filter((s: string) => s !== sub) : [...current, sub]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <GlassSection title="Business Details">
          <div className="space-y-4">
            <Field label="Business Name" required>
              <input type="text" value={formData.business_name as string} onChange={e => updateField('business_name', e.target.value)} className="form-input" />
            </Field>
            <Field label="Category" required>
              <select value={formData.industry as string} onChange={e => { updateField('industry', e.target.value); updateField('subcategories', []); }} className="form-input">
                <option value="">Select...</option>
                {DIRECTORY_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <Field label="Subcategories">
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subcategories.map(sub => (
                    <button key={sub} type="button" onClick={() => toggleSubcategory(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                        (formData.subcategories as string[])?.includes(sub)
                          ? 'bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >{sub}</button>
                  ))}
                </div>
              </Field>
            )}
            <Field label="Description">
              <textarea value={formData.description as string} onChange={e => updateField('description', e.target.value)} rows={4} className="form-input resize-none" />
            </Field>
            <Field label="Tags" hint="comma-separated">
              <input type="text" value={formData.tags as string} onChange={e => updateField('tags', e.target.value)} className="form-input" placeholder="e.g. emergency, 24/7, licensed" />
            </Field>
          </div>
        </GlassSection>

        <GlassSection title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone"><input type="tel" value={formData.phone as string} onChange={e => updateField('phone', e.target.value)} className="form-input" /></Field>
            <Field label="Email"><input type="email" value={formData.email as string} onChange={e => updateField('email', e.target.value)} className="form-input" /></Field>
          </div>
          <Field label="Website"><input type="url" value={formData.website as string} onChange={e => updateField('website', e.target.value)} className="form-input" /></Field>
        </GlassSection>

        <GlassSection title="Location">
          <Field label="Street Address"><input type="text" value={formData.address_line1 as string} onChange={e => updateField('address_line1', e.target.value)} className="form-input" /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City"><input type="text" value={formData.city as string} onChange={e => updateField('city', e.target.value)} className="form-input" /></Field>
            <Field label="State">
              <select value={formData.state as string} onChange={e => updateField('state', e.target.value)} className="form-input">
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="ZIP"><input type="text" value={formData.zip_code as string} onChange={e => updateField('zip_code', e.target.value)} className="form-input" maxLength={10} /></Field>
          </div>
          <Field label="Service Areas" hint="comma-separated">
            <input type="text" value={formData.service_areas as string} onChange={e => updateField('service_areas', e.target.value)} className="form-input" placeholder="Tampa, St. Petersburg, Brandon" />
          </Field>
        </GlassSection>

        <GlassSection title="Social Media">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['facebook', 'instagram', 'twitter', 'linkedin', 'yelp', 'google'].map(platform => (
              <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                <input type="url" value={((formData.social_links as Record<string, string>) || {})[platform] || ''} onChange={e => {
                  const links = { ...(formData.social_links as Record<string, string> || {}) };
                  links[platform] = e.target.value;
                  updateField('social_links', links);
                }} className="form-input" placeholder={`https://${platform}.com/...`} />
              </Field>
            ))}
          </div>
        </GlassSection>
      </div>

      {/* Save sidebar */}
      <div>
        <div className="backdrop-blur-2xl rounded-2xl border border-white/10 p-5 sticky top-8" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <button onClick={onSave} disabled={saving || !hasChanges}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}
          >
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
          <p className="text-xs text-white/25 mt-3 text-center">
            Last updated: {new Date(formData.updated_at as string || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: HOURS
// ═══════════════════════════════════════════════════════════════════════════

function HoursTab({ listing, onSave, saving }: { listing: Listing; onSave: (b: Record<string, unknown>) => Promise<unknown>; saving: boolean }) {
  const existingHours = (listing.hours || {}) as Record<string, { open?: string; close?: string; closed?: boolean }>;
  const specialHours = ((listing.metadata?.special_hours || []) as Array<{ date: string; label: string; open?: string; close?: string; closed?: boolean }>);

  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    DAYS.reduce((acc, day) => {
      const h = existingHours[day];
      acc[day] = {
        open: h?.open || '09:00',
        close: h?.close || '17:00',
        closed: h?.closed ?? (day === 'sunday'),
      };
      return acc;
    }, {} as Record<string, { open: string; close: string; closed: boolean }>)
  );

  const [special, setSpecial] = useState<Array<{ date: string; label: string; open: string; close: string; closed: boolean }>>(
    specialHours.map(s => ({ date: s.date, label: s.label, open: s.open || '09:00', close: s.close || '17:00', closed: s.closed ?? false }))
  );

  const save = () => {
    const hoursPayload: Record<string, unknown> = {};
    for (const day of DAYS) {
      hoursPayload[day] = hours[day].closed ? { closed: true } : { open: hours[day].open, close: hours[day].close };
    }
    onSave({ action: 'update_hours', hours: hoursPayload, special_hours: special });
  };

  const addSpecialHour = () => {
    setSpecial(prev => [...prev, { date: '', label: '', open: '09:00', close: '17:00', closed: false }]);
  };

  const removeSpecialHour = (idx: number) => {
    setSpecial(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <GlassSection title="Regular Hours">
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-28 text-sm text-white/50 capitalize">{day}</span>
              <label className="flex items-center gap-1.5 cursor-pointer w-20">
                <input type="checkbox" checked={hours[day].closed} onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#C9A84C]" />
                <span className="text-xs text-white/30">Closed</span>
              </label>
              {!hours[day].closed && (
                <div className="flex items-center gap-2">
                  <input type="time" value={hours[day].open} onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))} className="form-input !w-auto !py-1.5 text-xs" />
                  <span className="text-white/30">—</span>
                  <input type="time" value={hours[day].close} onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))} className="form-input !w-auto !py-1.5 text-xs" />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassSection>

      <GlassSection title="Special / Holiday Hours" extra={
        <button onClick={addSpecialHour} className="text-xs text-[#C9A84C] hover:underline">+ Add</button>
      }>
        {special.length === 0 ? (
          <p className="text-sm text-white/25">No special hours set</p>
        ) : (
          <div className="space-y-3">
            {special.map((s, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <input type="date" value={s.date} onChange={e => { const n = [...special]; n[i].date = e.target.value; setSpecial(n); }} className="form-input !w-auto !py-1.5 text-xs" />
                <input type="text" value={s.label} onChange={e => { const n = [...special]; n[i].label = e.target.value; setSpecial(n); }} placeholder="e.g. Christmas" className="form-input !w-32 !py-1.5 text-xs" />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={s.closed} onChange={e => { const n = [...special]; n[i].closed = e.target.checked; setSpecial(n); }}
                    className="w-3 h-3 rounded border-white/20 bg-white/5 accent-[#C9A84C]" />
                  <span className="text-[10px] text-white/30">Closed</span>
                </label>
                {!s.closed && (
                  <>
                    <input type="time" value={s.open} onChange={e => { const n = [...special]; n[i].open = e.target.value; setSpecial(n); }} className="form-input !w-auto !py-1.5 text-xs" />
                    <span className="text-white/30 text-xs">—</span>
                    <input type="time" value={s.close} onChange={e => { const n = [...special]; n[i].close = e.target.value; setSpecial(n); }} className="form-input !w-auto !py-1.5 text-xs" />
                  </>
                )}
                <button onClick={() => removeSpecialHour(i)} className="p-1 rounded text-white/20 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassSection>

      <button onClick={save} disabled={saving}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] transition-all hover:scale-[1.02] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}
      >
        {saving ? 'Saving...' : 'Save Hours'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: PHOTOS
// ═══════════════════════════════════════════════════════════════════════════

function PhotosTab({ listing, onUpdate, showToast }: { listing: Listing; onUpdate: () => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gallery = listing.gallery_images || [];

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          showToast(`Skipped ${file.name}: unsupported format`, 'error');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showToast(`Skipped ${file.name}: too large (max 10MB)`, 'error');
          continue;
        }

        // Upload via existing upload API (with optimization)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', `listings/${listing.id}`);

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) { showToast(`Failed to upload ${file.name}`, 'error'); continue; }
        const { url } = await uploadRes.json();

        // Add to listing gallery
        await fetch(`/api/admin/listings/${listing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_photos', photo_action: 'add', photo_url: url }),
        });
      }
      showToast('Photos uploaded');
      onUpdate();
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (url: string) => {
    await fetch(`/api/admin/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_photos', photo_action: 'remove', photo_url: url }),
    });
    showToast('Photo removed');
    onUpdate();
  };

  const setCover = async (url: string) => {
    await fetch(`/api/admin/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_photos', photo_action: 'set_cover', photo_url: url }),
    });
    showToast('Cover photo updated');
    onUpdate();
  };

  const movePhoto = async (from: number, to: number) => {
    const reordered = [...gallery];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    await fetch(`/api/admin/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_photos', photo_action: 'reorder', photos: reordered }),
    });
    onUpdate();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-[#C9A84C] bg-[#C9A84C]/5'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        }`}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files && uploadFiles(e.target.files)} className="hidden" />
        {uploading ? (
          <div className="inline-block w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto text-white/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
            <p className="text-sm text-white/40">Drop photos here or click to upload</p>
            <p className="text-xs text-white/20 mt-1">JPEG, PNG, WebP — max 10MB each — auto-optimized to WebP</p>
          </>
        )}
      </div>

      {/* Photo Grid */}
      {gallery.length > 0 && (
        <GlassSection title={`Photos (${gallery.length})`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((url, idx) => {
              const isCover = url === listing.cover_image_url;
              return (
                <div key={url} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/3]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {isCover && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A84C] text-[#0A0A0A]">COVER</span>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!isCover && (
                      <button onClick={() => setCover(url)} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40 hover:bg-[#C9A84C]/30 transition-all" title="Set as cover">
                        Cover
                      </button>
                    )}
                    {idx > 0 && (
                      <button onClick={() => movePhoto(idx, idx - 1)} className="p-1.5 rounded-md bg-white/10 text-white/60 hover:text-white transition-all" title="Move left">
                        ←
                      </button>
                    )}
                    {idx < gallery.length - 1 && (
                      <button onClick={() => movePhoto(idx, idx + 1)} className="p-1.5 rounded-md bg-white/10 text-white/60 hover:text-white transition-all" title="Move right">
                        →
                      </button>
                    )}
                    <button onClick={() => removePhoto(url)} className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all" title="Remove">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassSection>
      )}

      {gallery.length === 0 && (
        <p className="text-center text-sm text-white/20 py-8">No photos yet. Upload some to showcase this business.</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: MENU / SERVICES
// ═══════════════════════════════════════════════════════════════════════════

function MenuTab({ listing, onSave, saving }: { listing: Listing; onSave: (b: Record<string, unknown>) => Promise<unknown>; saving: boolean }) {
  const [sections, setSections] = useState<MenuSection[]>(() => {
    const meta = listing.metadata as Record<string, unknown> | null;
    const menuData = meta?.menu_sections as MenuSection[] | undefined;
    if (menuData && menuData.length > 0) return menuData;
    return [{ id: crypto.randomUUID(), title: 'Services', items: [{ name: '', description: '', price: '' }] }];
  });

  const addSection = () => {
    setSections(prev => [...prev, { id: crypto.randomUUID(), title: '', items: [{ name: '', description: '', price: '' }] }]);
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSectionTitle = (idx: number, title: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, title } : s));
  };

  const addItem = (sectionIdx: number) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? { ...s, items: [...s.items, { name: '', description: '', price: '' }] } : s));
  };

  const removeItem = (sectionIdx: number, itemIdx: number) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) } : s));
  };

  const updateItem = (sectionIdx: number, itemIdx: number, field: 'name' | 'description' | 'price', value: string) => {
    setSections(prev => prev.map((s, i) => i === sectionIdx ? {
      ...s, items: s.items.map((item, j) => j === itemIdx ? { ...item, [field]: value } : item),
    } : s));
  };

  const save = () => {
    const cleaned = sections.filter(s => s.title.trim() || s.items.some(i => i.name.trim()));
    onSave({ action: 'update_menu', sections: cleaned });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {sections.map((section, sIdx) => (
        <GlassSection key={section.id} title="" extra={
          <button onClick={() => removeSection(sIdx)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Remove section</button>
        }>
          <Field label="Section Title">
            <input type="text" value={section.title} onChange={e => updateSectionTitle(sIdx, e.target.value)} placeholder="e.g. Services, Menu, Pricing" className="form-input" />
          </Field>

          <div className="mt-4 space-y-3">
            {section.items.map((item, iIdx) => (
              <div key={iIdx} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input type="text" value={item.name} onChange={e => updateItem(sIdx, iIdx, 'name', e.target.value)} placeholder="Item name" className="form-input text-xs !py-2 col-span-1" />
                  <input type="text" value={item.description || ''} onChange={e => updateItem(sIdx, iIdx, 'description', e.target.value)} placeholder="Description (optional)" className="form-input text-xs !py-2 col-span-1" />
                  <input type="text" value={item.price || ''} onChange={e => updateItem(sIdx, iIdx, 'price', e.target.value)} placeholder="Price" className="form-input text-xs !py-2 col-span-1" />
                </div>
                <button onClick={() => removeItem(sIdx, iIdx)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors mt-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={() => addItem(sIdx)} className="text-xs text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">
              + Add item
            </button>
          </div>
        </GlassSection>
      ))}

      <div className="flex gap-3">
        <button onClick={addSection} className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all">
          + Add Section
        </button>
        <button onClick={save} disabled={saving}
          className="px-6 py-2 rounded-xl text-sm font-semibold text-[#0A0A0A] transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}
        >
          {saving ? 'Saving...' : 'Save Menu / Services'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: REVIEWS
// ═══════════════════════════════════════════════════════════════════════════

function ReviewsTab({ listing, onAction }: { listing: Listing; onAction: (b: Record<string, unknown>) => Promise<unknown> }) {
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const respond = async (reviewId: string) => {
    const text = responseText[reviewId]?.trim();
    if (!text) return;
    await onAction({ action: 'respond_review', review_id: reviewId, response_text: text });
    setRespondingTo(null);
    setResponseText(prev => ({ ...prev, [reviewId]: '' }));
  };

  const flag = async (reviewId: string) => {
    await onAction({ action: 'flag_review', review_id: reviewId, reason: 'Flagged by business owner' });
  };

  const approve = async (reviewId: string) => {
    await onAction({ action: 'approve_review', review_id: reviewId });
  };

  if (listing.feedback.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-white/20">No reviews yet</p>
        <p className="text-sm text-white/30 mt-1">Reviews will appear here when customers submit feedback</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <GlassSection title={`Reviews (${listing.feedback.length})`}>
        <div className="space-y-4">
          {listing.feedback.map(review => (
            <div key={review.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-[#C9A84C]' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-white/30">{review.submitter_name || 'Anonymous'}</span>
                    <span className="text-[10px] text-white/15">{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.status === 'flagged' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">Flagged</span>
                    )}
                    {review.status === 'approved' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Approved</span>
                    )}
                  </div>
                  {review.feedback_text && <p className="text-sm text-white/60 mt-2">{review.feedback_text}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {review.status !== 'approved' && (
                    <button onClick={() => approve(review.id)} className="p-1.5 rounded-lg text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Approve">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                  )}
                  {review.status !== 'flagged' && (
                    <button onClick={() => flag(review.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Flag">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>
                    </button>
                  )}
                  <button onClick={() => setRespondingTo(respondingTo === review.id ? null : review.id)} className="p-1.5 rounded-lg text-white/20 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all" title="Respond">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                  </button>
                </div>
              </div>

              {/* Existing response */}
              {review.admin_response && (
                <div className="mt-3 pl-4 border-l-2 border-[#C9A84C]/30">
                  <p className="text-xs text-[#C9A84C]/60 font-semibold mb-0.5">Business Response</p>
                  <p className="text-sm text-white/50">{review.admin_response}</p>
                </div>
              )}

              {/* Response form */}
              {respondingTo === review.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={responseText[review.id] || ''}
                    onChange={e => setResponseText(prev => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder="Write a response..."
                    className="form-input text-xs !py-2 flex-1"
                    onKeyDown={e => e.key === 'Enter' && respond(review.id)}
                  />
                  <button onClick={() => respond(review.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/30 transition-all"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassSection>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsTab({ listing }: { listing: Listing }) {
  const a = listing.analytics;

  const metrics = [
    { label: 'Total Views', value: a.total_views, last30: a.views_30d, icon: '👁️' },
    { label: 'Total Clicks', value: a.total_clicks, last30: a.clicks_30d, icon: '🖱️' },
    { label: 'Phone Calls', value: a.total_calls, last30: a.calls_30d, icon: '📞' },
    { label: 'Directions', value: a.total_directions, last30: 0, icon: '🗺️' },
    { label: 'Website Clicks', value: a.total_website_clicks, last30: 0, icon: '🌐' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="backdrop-blur-2xl rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{m.icon}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="text-2xl font-bold text-white font-heading">{m.value}</p>
            {m.last30 > 0 && (
              <p className="text-[10px] text-white/25 mt-1">
                {m.last30} in last 30 days
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Listing Summary */}
      <GlassSection title="Listing Performance">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-white/40">Avg. Rating</p>
            <p className="text-lg font-bold text-white font-heading">
              {listing.avg_feedback_rating > 0 ? listing.avg_feedback_rating.toFixed(1) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40">Reviews</p>
            <p className="text-lg font-bold text-white font-heading">{listing.total_feedback_count}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Trust Score</p>
            <p className="text-lg font-bold text-white font-heading">{listing.trust_score || 0}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Tier</p>
            <p className="text-lg font-bold text-[#C9A84C] font-heading capitalize">{listing.tier}</p>
          </div>
        </div>
      </GlassSection>

      {(a.total_views === 0 && a.total_clicks === 0 && a.total_calls === 0) && (
        <p className="text-center text-sm text-white/20 py-8">
          Analytics data will appear as your listing receives views and interactions
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function GlassSection({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="backdrop-blur-2xl rounded-2xl border border-white/10 p-5 sm:p-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
      {(title || extra) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-base font-semibold text-white font-heading">{title}</h2>}
          {extra}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/50 font-medium mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-white/25 ml-1.5">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
