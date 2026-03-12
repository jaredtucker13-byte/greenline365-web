'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import UpgradeCTA from '@/components/portal/UpgradeCTA';

interface ValidationErrors {
  business_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  description?: string;
}

export default function EditListingPage() {
  const { activeListing, refresh } = usePortalContext();
  const descriptionGate = useFeatureGate('description_long');

  const [form, setForm] = useState({
    business_name: '',
    description: '',
    phone: '',
    website: '',
    email: '',
    address_line1: '',
    city: '',
    state: '',
    zip_code: '',
    industry: '',
    subcategories: [] as string[],
    tags: [] as string[],
    service_areas: [] as string[],
    video_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeListing) {
      setForm({
        business_name: activeListing.business_name || '',
        description: activeListing.description || '',
        phone: activeListing.phone || '',
        website: activeListing.website || '',
        email: activeListing.email || '',
        address_line1: activeListing.address_line1 || '',
        city: activeListing.city || '',
        state: activeListing.state || '',
        zip_code: activeListing.zip_code || '',
        industry: activeListing.industry || '',
        subcategories: activeListing.subcategories || [],
        tags: activeListing.tags || [],
        service_areas: (activeListing.metadata?.service_areas as string[]) || [],
        video_url: (activeListing.metadata?.video_url as string) || '',
      });
    }
  }, [activeListing]);

  const validate = useCallback((values: typeof form): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!values.business_name.trim()) errs.business_name = 'Business name is required';
    if (!values.phone.trim()) errs.phone = 'Phone number is required';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!values.city.trim()) errs.city = 'City is required';
    if (!values.state.trim()) errs.state = 'State is required';
    if (!values.zip_code.trim()) errs.zip_code = 'ZIP code is required';
    if (!values.description.trim()) errs.description = 'Add a description so customers can find you';
    return errs;
  }, []);

  // Re-validate on form changes
  useEffect(() => {
    setErrors(validate(form));
  }, [form, validate]);

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = async () => {
    // Mark all fields as touched to show all errors
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setMessage({ type: 'error', text: 'Please fix the required fields before saving.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/portal/listing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: activeListing.id,
        ...form,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage({ type: 'success', text: 'Listing updated successfully.' });
      refresh();
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to save.' });
    }
  };

  const descCharLimit = descriptionGate.isAvailable ? null : 140;
  const hasErrors = Object.keys(errors).length > 0;

  const fieldClass = (field: keyof ValidationErrors) =>
    `mt-1 w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 ${
      touched[field] && errors[field]
        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
        : 'border-white/10 focus:border-gold-500 focus:ring-gold-500'
    }`;

  const fieldError = (field: keyof ValidationErrors) =>
    touched[field] && errors[field] ? (
      <p className="mt-1 text-xs text-red-400">{errors[field]}</p>
    ) : null;

  // Completion percentage for onboarding progress
  const totalRequired = 6; // business_name, phone, city, state, zip, description
  const completedRequired = totalRequired - Object.keys(errors).filter(k => k !== 'email').length;
  const completionPct = Math.round((completedRequired / totalRequired) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Listing</h1>
        <p className="mt-1 text-sm text-white/50">
          Update your business information visible in the directory.
        </p>
      </div>

      {/* Onboarding progress bar */}
      {completionPct < 100 && (
        <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gold-500">Listing completeness</span>
            <span className="text-sm font-bold text-gold-500">{completionPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold-500 transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/40">
            Complete all required fields to make your listing visible in search results.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-white/70">
            Business Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            onBlur={() => handleBlur('business_name')}
            className={fieldClass('business_name')}
          />
          {fieldError('business_name')}
        </div>

        {/* Short Description */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-white/70">
              Description <span className="text-red-400">*</span>
            </label>
            {descCharLimit && (
              <span className="text-xs text-white/40">
                {form.description.length}/{descCharLimit}
                {!descriptionGate.isAvailable && (
                  <UpgradeCTA feature="Extended Description" variant="inline" />
                )}
              </span>
            )}
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onBlur={() => handleBlur('description')}
            maxLength={descCharLimit || undefined}
            rows={descriptionGate.isAvailable ? 6 : 3}
            placeholder={
              descriptionGate.isAvailable
                ? 'Tell visitors about your business...'
                : 'Short description (140 chars). Upgrade for unlimited.'
            }
            className={fieldClass('description')}
          />
          {fieldError('description')}
        </div>

        {/* Contact fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white/70">
              Phone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              onBlur={() => handleBlur('phone')}
              className={fieldClass('phone')}
            />
            {fieldError('phone')}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => handleBlur('email')}
              className={fieldClass('email')}
            />
            {fieldError('email')}
          </div>
        </div>

        {/* Address */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-white/70">Address</label>
            <input
              type="text"
              value={form.address_line1}
              onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              onBlur={() => handleBlur('city')}
              className={fieldClass('city')}
            />
            {fieldError('city')}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">
              State <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              onBlur={() => handleBlur('state')}
              className={fieldClass('state')}
            />
            {fieldError('state')}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">
              ZIP <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.zip_code}
              onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
              onBlur={() => handleBlur('zip_code')}
              className={fieldClass('zip_code')}
            />
            {fieldError('zip_code')}
          </div>
        </div>

        {/* Pro-only: Category & Tags */}
        {descriptionGate.isAvailable ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white/70">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70">Tags</label>
              <input
                type="text"
                value={(form.tags || []).join(', ')}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="Comma-separated tags"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl border border-white/10 bg-white/5 p-4 opacity-60">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/40">Industry</label>
                <div className="mt-1 h-10 rounded-lg bg-white/5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/40">Tags</label>
                <div className="mt-1 h-10 rounded-lg bg-white/5" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-os-dark-900/60">
              <UpgradeCTA feature="Category & Tags" variant="inline" />
            </div>
          </div>
        )}

        {/* Pro-only: Service Areas */}
        {descriptionGate.isAvailable ? (
          <div>
            <label className="block text-sm font-medium text-white/70">Service Areas</label>
            <p className="mt-0.5 text-xs text-white/40">
              List the cities and areas your business serves, separated by commas.
            </p>
            <input
              type="text"
              value={(form.service_areas || []).join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  service_areas: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                })
              }
              placeholder="Tampa, St. Petersburg, Clearwater..."
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
        ) : (
          <div className="relative rounded-xl border border-white/10 bg-white/5 p-4 opacity-60">
            <div>
              <label className="block text-sm font-medium text-white/40">Service Areas</label>
              <div className="mt-1 h-10 rounded-lg bg-white/5" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-os-dark-900/60">
              <UpgradeCTA feature="Service Areas" variant="inline" />
            </div>
          </div>
        )}

        {/* Premium-only: Video Embed */}
        {activeListing.tier === 'premium' ? (
          <div>
            <label className="block text-sm font-medium text-white/70">
              Video URL
            </label>
            <p className="mt-0.5 text-xs text-white/40">
              Paste a YouTube, Vimeo, or direct video link. It will appear on your listing page.
            </p>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none focus:ring-1 focus:ring-neon-green-500"
            />
            {form.video_url && (
              <p className="mt-1 text-xs text-neon-green-500/70">
                Video will be embedded on your listing detail page.
              </p>
            )}
          </div>
        ) : (
          <div className="relative rounded-xl border border-white/10 bg-white/5 p-4 opacity-60">
            <div>
              <label className="block text-sm font-medium text-white/40">Video URL</label>
              <div className="mt-1 h-10 rounded-lg bg-white/5" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-os-dark-900/60">
              <UpgradeCTA feature="Video Embed" variant="inline" />
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-end gap-4">
          {hasErrors && Object.keys(touched).length > 0 && (
            <p className="text-xs text-white/40">
              {Object.keys(errors).filter(k => k !== 'email').length} required field(s) remaining
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
