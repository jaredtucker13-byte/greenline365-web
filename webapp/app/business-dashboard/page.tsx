'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { TIER_PRICES, TIER_NAMES } from '@/lib/feature-gates';
import type { DirectoryTier } from '@/lib/feature-gates';
import ReviewsPanel from './ReviewsPanel';
import PhotoLibraryPanel from './PhotoLibraryPanel';

interface Listing {
  id: string;
  business_name: string;
  slug: string;
  industry: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  tier: DirectoryTier;
  is_claimed: boolean;
  trust_score: number;
  avg_feedback_rating: number;
  total_feedback_count: number;
  tags: string[];
  metadata: Record<string, any>;
}

const TIER_FEATURES: Record<DirectoryTier, { features: string[]; locked: string[] }> = {
  free: {
    features: ['Basic listing in directory', '1 photo displayed'],
    locked: ['Verified badge', 'CTA buttons (Book/Call)', 'Priority search ranking', 'Analytics', 'Badge earning', 'Featured placement', 'Unlimited photos'],
  },
  pro: {
    features: ['Basic listing in directory', '2 custom photos', 'Verified Business badge', 'CTA buttons (Book/Call)', 'Priority search ranking', 'Marketplace add-on access'],
    locked: ['Analytics dashboard', 'Badge earning', 'Featured placement', 'Unlimited photos', 'QR Feedback collection'],
  },
  premium: {
    features: ['All features included', 'Unlimited photos synced', 'Verified Business badge', 'CTA buttons (Book/Call)', 'Featured homepage placement', 'Analytics dashboard', 'Badge earning eligible', 'QR Feedback collection', 'Priority support'],
    locked: [],
  },
};

export default function BusinessDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'listing' | 'reviews' | 'photos'>('listing');
  const [editForm, setEditForm] = useState({
    business_name: '',
    description: '',
    phone: '',
    website: '',
    email: '',
    city: '',
    state: '',
    zip_code: '',
  });

  // Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login?redirect=/business-dashboard');
        return;
      }
      setUser(session.user);
      await loadListings();
      setLoading(false);
    };
    check();
  }, [router]);

  const loadListings = async () => {
    const res = await fetch('/api/directory/my-listing');
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
      if (data.listings?.length > 0) {
        setActiveListing(data.listings[0]);
        populateForm(data.listings[0]);
      }
    }
  };

  const populateForm = (listing: Listing) => {
    setEditForm({
      business_name: listing.business_name || '',
      description: listing.description || '',
      phone: listing.phone || '',
      website: listing.website || '',
      email: listing.email || '',
      city: listing.city || '',
      state: listing.state || '',
      zip_code: listing.zip_code || '',
    });
  };

  const handleSave = async () => {
    if (!activeListing) return;
    setSaving(true);
    setSaveMessage('');

    const res = await fetch('/api/directory/my-listing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: activeListing.id, ...editForm }),
    });

    if (res.ok) {
      const data = await res.json();
      setActiveListing(data.listing);
      setSaveMessage('Changes saved successfully');
      setEditing(false);
      await loadListings();
    } else {
      const err = await res.json();
      setSaveMessage(err.error || 'Failed to save');
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleUpgrade = async (tier: 'pro' | 'premium') => {
    if (!activeListing) return;
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier,
        listing_id: activeListing.id,
        origin_url: window.location.origin,
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center pt-20">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <span className="text-white/50 font-body text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // No listings — show claim or register prompt
  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-midnight-900 pt-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border border-gold/20 bg-gold/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-heading font-light text-white mb-3" data-testid="no-listing-title">
              No Listing <span className="font-semibold text-gradient-gold">Found</span>
            </h1>
            <p className="text-white/50 font-body mb-8 max-w-md mx-auto">
              You haven&apos;t claimed a listing yet. Search the directory to find and claim your business, or register a new one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 rounded-xl text-sm font-semibold font-heading text-midnight-900 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}
                data-testid="find-listing-btn"
              >
                Find My Business in Directory
              </Link>
              <Link
                href="/register-business"
                className="px-6 py-3 rounded-xl text-sm font-semibold font-heading text-gold border border-gold/30 hover:bg-gold/5 transition-all"
                data-testid="register-new-btn"
              >
                Register New Business
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const tier = activeListing?.tier || 'free';
  const tierFeatures = TIER_FEATURES[tier];

  return (
    <div className="min-h-screen bg-midnight-900 pt-24 pb-16 px-6" data-testid="business-dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-heading font-semibold uppercase tracking-[0.2em] text-gold mb-1">Business Dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-heading font-light text-white" data-testid="dashboard-title">
                {activeListing?.business_name}
              </h1>
              <p className="text-white/40 text-sm font-body mt-1">Manage your directory listing</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wider"
                style={{
                  background: tier === 'premium' ? 'linear-gradient(135deg, #C9A96E, #E6D8B5)' : tier === 'pro' ? 'linear-gradient(135deg, #3B82F6, #60A5FA)' : 'rgba(255,255,255,0.1)',
                  color: tier === 'free' ? '#A8A9AD' : '#0D1B2A',
                }}
                data-testid="current-tier-badge"
              >
                {TIER_NAMES[tier]} {tier !== 'free' && `— $${TIER_PRICES[tier]}/mo`}
              </span>
              <Link href={`/`} className="text-xs text-white/40 hover:text-gold transition-colors font-body">
                View public listing
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 px-4 py-3 rounded-xl text-sm font-body ${saveMessage.includes('success') ? 'bg-greenline/10 text-greenline border border-greenline/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
            data-testid="save-message"
          >
            {saveMessage}
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit" data-testid="dashboard-tabs">
          {[
            { id: 'listing' as const, label: 'My Listing' },
            { id: 'reviews' as const, label: 'Reviews' },
            { id: 'photos' as const, label: 'Photos & Menu' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'reviews' && activeListing ? (
          <ReviewsPanel listingId={activeListing.id} />
        ) : activeTab === 'photos' && activeListing ? (
          <PhotoLibraryPanel listingId={activeListing.id} />
        ) : (
        <>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Listing Preview / Edit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-midnight-800 to-charcoal-800">
                {activeListing?.cover_image_url ? (
                  <img src={activeListing.cover_image_url} alt={activeListing.business_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl font-heading font-light text-white/10">{activeListing?.business_name[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] px-2 py-1 rounded-full backdrop-blur-sm capitalize font-body bg-midnight-900/70 text-white/60">
                      {activeListing?.industry?.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/20 text-white/80 hover:border-gold/40 hover:text-gold transition-all"
                    data-testid="edit-toggle-btn"
                  >
                    {editing ? 'Cancel' : 'Edit Listing'}
                  </button>
                </div>
              </div>

              {/* Listing Details */}
              <div className="p-6">
                {editing ? (
                  <div className="space-y-4" data-testid="edit-form">
                    <div>
                      <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">Business Name</label>
                      <input
                        value={editForm.business_name}
                        onChange={e => setEditForm({ ...editForm, business_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                        data-testid="edit-name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body resize-none"
                        data-testid="edit-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">Phone</label>
                        <input
                          value={editForm.phone}
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                          data-testid="edit-phone"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">Website</label>
                        <input
                          value={editForm.website}
                          onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                          data-testid="edit-website"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">Email</label>
                      <input
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                        data-testid="edit-email"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">City</label>
                        <input
                          value={editForm.city}
                          onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                          data-testid="edit-city"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">State</label>
                        <input
                          value={editForm.state}
                          onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                          data-testid="edit-state"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 font-heading uppercase tracking-wider mb-1">ZIP</label>
                        <input
                          value={editForm.zip_code}
                          onChange={e => setEditForm({ ...editForm, zip_code: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:outline-none focus:border-gold/30 font-body"
                          data-testid="edit-zip"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 rounded-xl text-sm font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}
                        data-testid="save-btn"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => { setEditing(false); if (activeListing) populateForm(activeListing); }}
                        className="px-6 py-3 rounded-xl text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 transition-all font-body"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="listing-details">
                    <h2 className="text-xl font-heading font-semibold text-gold">{activeListing?.business_name}</h2>
                    {activeListing?.description && (
                      <p className="text-sm text-white/50 font-body leading-relaxed">{activeListing.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {activeListing?.phone && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm text-white/70 font-body">{activeListing.phone}</span>
                        </div>
                      )}
                      {activeListing?.website && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                          </svg>
                          <a href={activeListing.website} target="_blank" rel="noopener noreferrer" className="text-sm text-gold/70 hover:text-gold font-body truncate">
                            {activeListing.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {activeListing?.city && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="text-sm text-white/70 font-body">{activeListing.city}, {activeListing.state} {activeListing.zip_code}</span>
                        </div>
                      )}
                      {activeListing?.email && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          <span className="text-sm text-white/70 font-body">{activeListing.email}</span>
                        </div>
                      )}
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(201,169,110,0.12)', color: '#C9A96E' }}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        {activeListing?.avg_feedback_rating ? activeListing.avg_feedback_rating.toFixed(1) : 'New'}
                      </div>
                      <span className="text-xs text-white/30 font-body">
                        {activeListing?.metadata?.google_rating ? `Google: ${activeListing.metadata.google_rating}/5 (${activeListing.metadata.google_review_count} reviews)` : 'No Google reviews yet'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Photos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 p-6"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider">Photos</h3>
                <span className="text-xs text-white/30 font-body">
                  {activeListing?.gallery_images?.length || 0} photos
                  {tier === 'free' && ' (1 visible to public)'}
                  {tier === 'pro' && ' (2 visible to public)'}
                </span>
              </div>
              {activeListing?.gallery_images && activeListing.gallery_images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {activeListing.gallery_images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/5">
                      <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {((tier === 'free' && i >= 1) || (tier === 'pro' && i >= 2)) && (
                        <div className="absolute inset-0 bg-midnight-900/80 flex items-center justify-center backdrop-blur-sm">
                          <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm font-body">No photos yet</p>
                </div>
              )}
              {tier !== 'premium' && (
                <div className="mt-4 px-4 py-3 rounded-xl border border-gold/10 bg-gold/5">
                  <p className="text-xs text-gold/70 font-body">
                    Upgrade to {tier === 'free' ? 'Pro' : 'Premium'} to show {tier === 'free' ? 'more' : 'all'} photos to customers.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar — 1 col */}
          <div className="space-y-6">
            {/* Tier Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-white/10 p-6"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              data-testid="tier-panel"
            >
              <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-4">Your Plan</h3>
              {/* Current tier features */}
              <div className="space-y-2 mb-6">
                {tierFeatures.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-greenline flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-white/70 font-body">{f}</span>
                  </div>
                ))}
                {tierFeatures.locked.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 opacity-40">
                    <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-xs text-white/30 font-body">{f}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade buttons */}
              {tier !== 'premium' && (
                <div className="space-y-2">
                  {tier === 'free' && (
                    <button
                      onClick={() => handleUpgrade('pro')}
                      className="w-full px-4 py-3 rounded-xl text-sm font-bold font-heading text-white transition-all hover:scale-[1.02] border border-blue-500/30"
                      style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(96,165,250,0.1))' }}
                      data-testid="upgrade-pro-btn"
                    >
                      Upgrade to Pro — $39/mo
                    </button>
                  )}
                  <button
                    onClick={() => handleUpgrade('premium')}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}
                    data-testid="upgrade-premium-btn"
                  >
                    {tier === 'free' ? 'Upgrade to Premium — $59/mo' : 'Upgrade to Premium — $59/mo'}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-white/10 p-6"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-4">Listing Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-2xl font-heading font-bold text-white">{activeListing?.metadata?.google_review_count || 0}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-heading">Google Reviews</span>
                </div>
                <div>
                  <span className="block text-2xl font-heading font-bold text-white">{activeListing?.metadata?.google_rating || '—'}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-heading">Google Rating</span>
                </div>
                <div>
                  <span className="block text-2xl font-heading font-bold text-white">{activeListing?.gallery_images?.length || 0}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-heading">Photos</span>
                </div>
                <div>
                  <span className="block text-2xl font-heading font-bold text-white">{activeListing?.trust_score || 0}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-heading">Trust Score</span>
                </div>
              </div>
              {!TIER_FEATURES[tier].features.includes('Analytics dashboard') && (
                <div className="mt-4 px-4 py-3 rounded-xl border border-gold/10 bg-gold/5">
                  <p className="text-xs text-gold/70 font-body">Unlock detailed analytics with Premium.</p>
                </div>
              )}
            </motion.div>

            {/* Backend Services CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-greenline/20 p-6 relative overflow-hidden"
              style={{ background: 'rgba(91,138,114,0.05)' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-greenline/5 rounded-full -translate-y-8 translate-x-8" />
              <h3 className="text-sm font-heading font-semibold text-greenline uppercase tracking-wider mb-2">Property Intelligence</h3>
              <p className="text-xs text-white/40 font-body leading-relaxed mb-4">
                Get the full GreenLine365 CRM — AI booking agent, content creation, campaign management, and Property Intelligence badge on your listing.
              </p>
              <Link
                href="/services"
                className="inline-block px-4 py-2 rounded-lg text-xs font-semibold text-greenline border border-greenline/30 hover:bg-greenline/10 transition-all font-heading"
                data-testid="learn-more-crm-btn"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
