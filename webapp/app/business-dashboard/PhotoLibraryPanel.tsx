'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface PhotoLibraryProps {
  listingId: string;
}

export default function PhotoLibraryPanel({ listingId }: PhotoLibraryProps) {
  const [library, setLibrary] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [cover, setCover] = useState('');
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [tier, setTier] = useState('free');
  const [maxDisplay, setMaxDisplay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery' | 'menu'>('gallery');

  const loadPhotos = useCallback(async () => {
    const res = await fetch(`/api/directory/photos?listing_id=${listingId}`);
    if (res.ok) {
      const data = await res.json();
      setLibrary(data.library || []);
      setSelected(data.selected || []);
      setCover(data.cover || '');
      setMenuImages(data.menu_images || []);
      setTier(data.tier);
      setMaxDisplay(data.max_display);
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const togglePhoto = (url: string) => {
    if (tier === 'free') {
      setMessage('Upgrade to Pro to select photos for your listing.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSelected(prev => {
      if (prev.includes(url)) return prev.filter(p => p !== url);
      if (prev.length >= maxDisplay) {
        setMessage(`Your ${tier} tier allows ${maxDisplay} photos. Upgrade for more.`);
        setTimeout(() => setMessage(''), 3000);
        return prev;
      }
      return [...prev, url];
    });
  };

  const saveSelection = async () => {
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/directory/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, action: 'select_photos', photo_urls: selected }),
    });
    if (res.ok) {
      setMessage('Photo selection saved!');
      await loadPhotos();
    } else {
      const err = await res.json();
      setMessage(err.error || 'Failed to save');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const setCoverPhoto = async (url: string) => {
    await fetch('/api/directory/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, action: 'set_cover', photo_url: url }),
    });
    setCover(url);
    setMessage('Cover photo updated!');
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="photo-library-panel">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {[
          { id: 'gallery' as const, label: `Photo Library (${library.length})` },
          { id: 'menu' as const, label: `Menu (${menuImages.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-semibold transition-all ${
              activeTab === tab.id ? 'bg-gold/15 text-gold border border-gold/20' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`px-3 py-2 rounded-lg text-xs font-body ${message.includes('save') || message.includes('update') ? 'bg-greenline/10 text-greenline border border-greenline/20' : message.includes('Upgrade') ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-greenline/10 text-greenline border border-greenline/20'}`}>
          {message}
        </div>
      )}

      {activeTab === 'gallery' ? (
        <>
          {/* Selection info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 font-body">
                {selected.length}/{maxDisplay} photos selected for display
                {tier === 'free' && ' — upgrade to Pro to select photos'}
              </p>
              {library.length > maxDisplay && tier !== 'free' && (
                <p className="text-[10px] text-gold/50 font-body mt-0.5">
                  {library.length - maxDisplay} additional photos available with upgrade
                </p>
              )}
            </div>
            {tier !== 'free' && (
              <button
                onClick={saveSelection}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-bold font-heading text-midnight-900 transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}
                data-testid="save-photo-selection"
              >
                {saving ? 'Saving...' : 'Save Selection'}
              </button>
            )}
          </div>

          {/* Photo Grid */}
          {library.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {library.map((url, i) => {
                const isSelected = selected.includes(url);
                const isCover = cover === url;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                      isSelected ? 'border-gold ring-1 ring-gold/30' : 'border-transparent opacity-50 hover:opacity-80'
                    } ${tier === 'free' ? 'opacity-40' : ''}`}
                    onClick={() => togglePhoto(url)}
                    data-testid={`photo-${i}`}
                  >
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-midnight-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Cover badge */}
                    {isCover && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-gold text-midnight-900 uppercase">Cover</div>
                    )}

                    {/* Set as cover (on hover) */}
                    {isSelected && !isCover && tier !== 'free' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCoverPhoto(url); }}
                        className="absolute bottom-2 left-2 right-2 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Set as Cover
                      </button>
                    )}

                    {/* Lock overlay for free tier */}
                    {tier === 'free' && (
                      <div className="absolute inset-0 bg-midnight-900/60 flex items-center justify-center backdrop-blur-[2px]">
                        <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm font-body">No photos in library yet.</p>
            </div>
          )}

          {/* Tier upgrade prompt */}
          {tier === 'free' && library.length > 0 && (
            <div className="rounded-xl border border-gold/15 p-5" style={{ background: 'rgba(201,169,110,0.04)' }}>
              <p className="text-sm font-heading font-semibold text-gold mb-1">
                {library.length} photos waiting for you
              </p>
              <p className="text-xs text-white/40 font-body mb-3">
                Upgrade to Pro ($39/mo) to choose any 2 photos, or Premium ($59/mo) for up to 10.
              </p>
              <button className="px-4 py-2 rounded-lg text-xs font-bold font-heading text-midnight-900" style={{ background: 'linear-gradient(135deg, #C9A96E, #E6D8B5)' }}>
                Upgrade Now
              </button>
            </div>
          )}
        </>
      ) : (
        /* Menu Tab */
        <>
          <p className="text-xs text-white/40 font-body">
            Upload menu images for customers to browse. Great for restaurants, cafes, and bars.
          </p>
          {menuImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {menuImages.map((url, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={url} alt={`Menu page ${i + 1}`} className="w-full object-contain" style={{ maxHeight: 400 }} />
                  <button
                    onClick={async () => {
                      await fetch('/api/directory/photos', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ listing_id: listingId, action: 'remove_menu', photo_url: url }),
                      });
                      setMenuImages(prev => prev.filter(p => p !== url));
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed border-white/10">
              <svg className="w-10 h-10 text-white/15 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-white/30 text-sm font-body">No menu uploaded yet</p>
              <p className="text-white/20 text-xs font-body mt-1">Upload images of your menu for customers to browse</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
