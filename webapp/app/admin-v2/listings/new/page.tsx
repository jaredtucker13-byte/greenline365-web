/**
 * Create New Listing — Full form with validation, duplicate detection,
 * address fields, hours, social links, tags
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CollapsibleSidebar from '../../components/CollapsibleSidebar';
import { DIRECTORY_CATEGORIES } from '@/lib/directory-config';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

interface FormData {
  business_name: string;
  description: string;
  industry: string;
  subcategories: string[];
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  tags: string;
  social_links: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; yelp?: string; google?: string };
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  service_areas: string;
}

const defaultHours = DAYS.reduce((acc, day) => {
  acc[day] = { open: '09:00', close: '17:00', closed: day === 'sunday' };
  return acc;
}, {} as Record<string, { open: string; close: string; closed: boolean }>);

export default function CreateListingPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showHours, setShowHours] = useState(false);

  const [form, setForm] = useState<FormData>({
    business_name: '',
    description: '',
    industry: '',
    subcategories: [],
    address_line1: '',
    city: '',
    state: 'FL',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    tags: '',
    social_links: {},
    hours: defaultHours,
    service_areas: '',
  });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors.length > 0) setErrors([]);
    if (duplicateWarning) setDuplicateWarning(null);
  };

  const updateSocial = (key: string, value: string) => {
    setForm(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: value } }));
  };

  const updateHour = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], [field]: value } },
    }));
  };

  const selectedCategory = DIRECTORY_CATEGORIES.find(c => c.id === form.industry);

  const toggleSubcategory = (sub: string) => {
    setForm(prev => ({
      ...prev,
      subcategories: prev.subcategories.includes(sub)
        ? prev.subcategories.filter(s => s !== sub)
        : [...prev.subcategories, sub],
    }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!form.business_name.trim()) errs.push('Business name is required');
    if (!form.industry) errs.push('Category is required');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Invalid email format');
    if (form.phone && !/^[\d\s()+-]{7,20}$/.test(form.phone)) errs.push('Invalid phone format');
    if (form.website && !/^https?:\/\/.+/.test(form.website)) errs.push('Website must start with http:// or https://');
    if (form.zip_code && !/^\d{5}(-\d{4})?$/.test(form.zip_code)) errs.push('Invalid ZIP code');
    return errs;
  };

  const handleSubmit = async (asDraft = true) => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      // Build hours object for DB
      const hoursPayload: Record<string, unknown> = {};
      for (const day of DAYS) {
        const h = form.hours[day];
        hoursPayload[day] = h.closed ? { closed: true } : { open: h.open, close: h.close };
      }

      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name.trim(),
          description: form.description.trim() || null,
          industry: form.industry,
          subcategories: form.subcategories,
          address_line1: form.address_line1.trim() || null,
          city: form.city.trim() || null,
          state: form.state || null,
          zip_code: form.zip_code.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          website: form.website.trim() || null,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          social_links: form.social_links,
          hours: showHours ? hoursPayload : null,
          service_areas: form.service_areas.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setDuplicateWarning(data.details?.[0] || 'Possible duplicate listing detected');
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setErrors(data.details || [data.error || 'Failed to create listing']);
        setSaving(false);
        return;
      }

      // If not saving as draft, publish immediately
      if (!asDraft) {
        await fetch(`/api/admin/listings/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', new_status: 'published' }),
        });
      }

      router.push(`/admin-v2/listings/${data.id}`);
    } catch {
      setErrors(['Network error. Please try again.']);
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <CollapsibleSidebar
        activeItem="listings"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">Create Listing</h1>
            <p className="text-sm text-white/40 mt-0.5">Add a new business to the directory</p>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            {errors.map((e, i) => <p key={i} className="text-sm text-red-400">{e}</p>)}
          </motion.div>
        )}

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <p className="text-sm text-amber-400 font-semibold">Possible Duplicate</p>
            <p className="text-sm text-amber-400/70 mt-1">{duplicateWarning}</p>
            <button onClick={() => { setDuplicateWarning(null); handleSubmit(); }} className="mt-2 text-xs text-amber-400 underline">Create anyway</button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── MAIN FORM ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Details */}
            <FormSection title="Business Details">
              <FormField label="Business Name" required>
                <input type="text" value={form.business_name} onChange={e => updateField('business_name', e.target.value)} placeholder="e.g. Tampa Bay Plumbing" className="form-input" />
              </FormField>

              <FormField label="Category" required>
                <select value={form.industry} onChange={e => { updateField('industry', e.target.value); updateField('subcategories', []); }} className="form-input">
                  <option value="">Select category...</option>
                  {DIRECTORY_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </FormField>

              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <FormField label="Subcategories">
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.subcategories.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubcategory(sub)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                          form.subcategories.includes(sub)
                            ? 'bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]'
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </FormField>
              )}

              <FormField label="Description">
                <textarea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Tell customers about this business..." rows={4} className="form-input resize-none" />
              </FormField>

              <FormField label="Tags" hint="Comma-separated">
                <input type="text" value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="e.g. emergency service, 24/7, licensed" className="form-input" />
              </FormField>
            </FormSection>

            {/* Contact */}
            <FormSection title="Contact Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Phone">
                  <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="(813) 555-0100" className="form-input" />
                </FormField>
                <FormField label="Email">
                  <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@business.com" className="form-input" />
                </FormField>
              </div>
              <FormField label="Website">
                <input type="url" value={form.website} onChange={e => updateField('website', e.target.value)} placeholder="https://www.business.com" className="form-input" />
              </FormField>
            </FormSection>

            {/* Address */}
            <FormSection title="Location">
              <FormField label="Street Address">
                <input type="text" value={form.address_line1} onChange={e => updateField('address_line1', e.target.value)} placeholder="123 Main Street" className="form-input" />
              </FormField>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField label="City" className="col-span-2 sm:col-span-1">
                  <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Tampa" className="form-input" />
                </FormField>
                <FormField label="State">
                  <select value={form.state} onChange={e => updateField('state', e.target.value)} className="form-input">
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="ZIP">
                  <input type="text" value={form.zip_code} onChange={e => updateField('zip_code', e.target.value)} placeholder="33619" className="form-input" maxLength={10} />
                </FormField>
              </div>
              <FormField label="Service Areas" hint="Comma-separated cities or regions">
                <input type="text" value={form.service_areas} onChange={e => updateField('service_areas', e.target.value)} placeholder="e.g. Tampa, St. Petersburg, Brandon" className="form-input" />
              </FormField>
            </FormSection>

            {/* Hours */}
            <FormSection title="Business Hours" extra={
              <button type="button" onClick={() => setShowHours(!showHours)} className="text-xs text-[#C9A84C] hover:underline">
                {showHours ? 'Hide hours' : 'Add hours'}
              </button>
            }>
              {showHours && (
                <div className="space-y-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <label className="w-24 text-xs text-white/50 capitalize">{day}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hours[day].closed}
                          onChange={e => updateHour(day, 'closed', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[#C9A84C]"
                        />
                        <span className="text-xs text-white/30">Closed</span>
                      </label>
                      {!form.hours[day].closed && (
                        <>
                          <input type="time" value={form.hours[day].open} onChange={e => updateHour(day, 'open', e.target.value)} className="form-input !w-auto !py-1 text-xs" />
                          <span className="text-white/30 text-xs">to</span>
                          <input type="time" value={form.hours[day].close} onChange={e => updateHour(day, 'close', e.target.value)} className="form-input !w-auto !py-1 text-xs" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </FormSection>

            {/* Social Links */}
            <FormSection title="Social Media">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['facebook', 'instagram', 'twitter', 'linkedin', 'yelp', 'google'] as const).map(platform => (
                  <FormField key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                    <input
                      type="url"
                      value={form.social_links[platform] || ''}
                      onChange={e => updateSocial(platform, e.target.value)}
                      placeholder={`https://${platform}.com/...`}
                      className="form-input"
                    />
                  </FormField>
                ))}
              </div>
            </FormSection>
          </div>

          {/* ─── SIDEBAR ─── */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="backdrop-blur-2xl rounded-2xl border border-white/10 p-5 sticky top-8" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white font-heading mb-4">Publish</h3>

              <div className="space-y-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-white/70 hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>

                <button
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0A] transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)' }}
                >
                  {saving ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-white/30">
                  Listings start as drafts. You can add photos, hours, and menu items after creating.
                </p>
              </div>
            </div>

            {/* Preview Card */}
            {form.business_name && (
              <div className="backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-24 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                  <span className="text-3xl text-white/10 font-heading font-bold">{form.business_name[0]}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-[#C9A84C] font-heading">{form.business_name}</p>
                  {form.city && <p className="text-xs text-white/30 mt-0.5">{form.city}, {form.state}</p>}
                  {form.industry && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/40">
                      {DIRECTORY_CATEGORIES.find(c => c.id === form.industry)?.label}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: rgba(201,168,76,0.5);
          box-shadow: 0 0 0 2px rgba(201,168,76,0.15);
        }
        .form-input::placeholder { color: rgba(255,255,255,0.25); }
        .form-input option { background: #1a1a1a; color: white; }
      `}</style>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function FormSection({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="backdrop-blur-2xl rounded-2xl border border-white/10 p-5 sm:p-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white font-heading">{title}</h2>
        {extra}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, required, hint, children, className }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs text-white/50 font-medium mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-white/25 ml-1.5">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
