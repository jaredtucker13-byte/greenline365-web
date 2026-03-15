'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface FavoriteListing {
  id: string;
  listing_id: string;
  created_at: string;
  listing: {
    id: string;
    business_name: string;
    slug: string;
    industry: string;
    city: string;
    state: string;
    logo_url: string | null;
  } | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('consumer_favorites')
      .select(`
        id, listing_id, created_at,
        listing:directory_listings!listing_id(id, business_name, slug, industry, city, state, logo_url)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setFavorites((data as unknown as FavoriteListing[]) || []);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('consumer_favorites').delete().eq('id', favoriteId);
    setFavorites(favorites.filter(f => f.id !== favoriteId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Favorites</h1>
        <p className="text-white/50 text-sm mb-6">Your saved businesses</p>
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/[0.03] border border-white/10 rounded-xl p-12 text-center"
        >
          <div className="text-4xl mb-4">❤️</div>
          <h3 className="text-lg font-bold text-white mb-2">No favorites yet</h3>
          <p className="text-white/40 text-sm mb-6">Browse the directory and save businesses you love!</p>
          <Link href="/directory" className="px-6 py-2.5 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition text-sm">
            Browse Directory
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((fav, i) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center text-lg font-bold text-gold-400 flex-shrink-0">
                {fav.listing?.business_name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/listing/${fav.listing?.slug || ''}`}
                  className="text-white font-medium hover:text-gold-400 transition truncate block"
                >
                  {fav.listing?.business_name || 'Unknown Business'}
                </Link>
                <p className="text-white/40 text-xs mt-0.5">
                  {fav.listing?.industry}{fav.listing?.city ? ` · ${fav.listing.city}, ${fav.listing.state}` : ''}
                </p>
              </div>
              <button
                onClick={() => removeFavorite(fav.id)}
                className="text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                aria-label="Remove from favorites"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
