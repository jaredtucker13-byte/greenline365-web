'use client';

import { useState, useEffect } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import UpgradeCTA from '@/components/portal/UpgradeCTA';

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
    video_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        video_url: (activeListing.metadata?.video_url as string) || '',
      });
    }
  }, [activeListing]);

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  const handleSave = async () => {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Listing</h1>
        <p className="mt-1 text-sm text-white/50">
          Update your business information visible in the directory.
        </p>
      </div>

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
            Business Name
          </label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        {/* Short Description */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-white/70">
              Description
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
            maxLength={descCharLimit || undefined}
            rows={descriptionGate.isAvailable ? 6 : 3}
            placeholder={
              descriptionGate.isAvailable
                ? 'Tell visitors about your business...'
                : 'Short description (140 chars). Upgrade for unlimited.'
            }
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        {/* Contact fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white/70">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
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
            <label className="block text-sm font-medium text-white/70">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70">ZIP</label>
            <input
              type="text"
              value={form.zip_code}
              onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
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
        <div className="flex justify-end">
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
