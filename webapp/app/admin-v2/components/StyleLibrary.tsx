'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StyleGuide {
  themeName: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    headings?: string;
    links?: string;
  };
  texture?: { type: string; opacity: number };
  typography?: { headingStyle: string; headingSize: string };
  layout?: { contentWidth: string; spacing: string };
  mood?: string;
}

interface StylePreset {
  id: string;
  name: string;
  description?: string;
  style_guide: StyleGuide;
  tags?: string[];
  is_default?: boolean;
  times_used?: number;
  created_at?: string;
}

interface StyleLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStyle: (style: StyleGuide) => void;
  currentStyle?: StyleGuide | null;
}

export default function StyleLibrary({ isOpen, onClose, onApplyStyle, currentStyle }: StyleLibraryProps) {
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [tableExists, setTableExists] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch presets on mount
  useEffect(() => {
    if (isOpen) {
      fetchPresets();
    }
  }, [isOpen]);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/styles');
      const data = await res.json();
      setPresets(data.presets || []);
      setTableExists(data.tableExists !== false);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
    setLoading(false);
  };

  const saveCurrentStyle = async () => {
    if (!currentStyle || !saveName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for your style' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          description: currentStyle.description || currentStyle.mood,
          style_guide: currentStyle,
          tags: saveTags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `"${saveName}" saved to your library!` });
        setSaveName('');
        setSaveTags('');
        setShowSaveForm(false);
        fetchPresets();
      } else if (data.migrationRequired) {
        setTableExists(false);
        setMessage({ type: 'error', text: 'Database setup required. See instructions below.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save style' });
    }
    setSaving(false);
  };

  const deletePreset = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your library?`)) return;

    try {
      const res = await fetch(`/api/styles?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Style removed' });
        setPresets(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const setAsDefault = async (preset: StylePreset) => {
    try {
      const res = await fetch('/api/styles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: preset.id, is_default: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `"${preset.name}" set as default` });
        fetchPresets();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set default' });
    }
  };

  const applyPreset = (preset: StylePreset) => {
    onApplyStyle(preset.style_guide);
    // Increment usage count
    fetch('/api/styles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: preset.id, 
        times_used: (preset.times_used || 0) + 1,
        last_used_at: new Date().toISOString()
      }),
    });
    setMessage({ type: 'success', text: `Applied "${preset.name}"` });
    setTimeout(onClose, 500);
  };

  // Filter presets
  const filteredPresets = presets.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.style_guide.themeName?.toLowerCase().includes(q) ||
             p.tags?.some(t => t.toLowerCase().includes(q));
    }
    if (filter === 'favorites') return p.is_default;
    return true;
  }).sort((a, b) => {
    if (filter === 'recent') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    return (b.times_used || 0) - (a.times_used || 0);
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🎨</span>
                Style Library
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {presets.length} saved style{presets.length !== 1 ? 's' : ''} • Your creative arsenal
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message Toast */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm ${
                  message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  message.type === 'info' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save Current Style */}
          {currentStyle && (
            <div className="mx-6 mt-4">
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 font-medium hover:from-pink-500/30 hover:to-purple-500/30 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Save Current Style to Library
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Preview of current style colors */}
                    <div className="flex -space-x-1">
                      {Object.values(currentStyle.colors).slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-slate-900"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{currentStyle.themeName}</div>
                      <div className="text-xs text-white/50">{currentStyle.mood}</div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name your style (e.g., 'Ocean Breeze')"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    placeholder="Tags (comma separated): professional, blue, modern"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveForm(false)}
                      className="flex-1 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCurrentStyle}
                      disabled={saving || !saveName.trim()}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save to Library'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex rounded-lg bg-white/5 p-1">
              {(['all', 'favorites', 'recent'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    filter === f 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'favorites' ? '⭐ Default' : '🕐 Recent'}
                </button>
              ))}
            </div>
          </div>

          {/* Presets Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {!tableExists ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-white mb-2">Database Setup Required</h3>
                <p className="text-white/50 text-sm max-w-md mx-auto mb-4">
                  Run the migration file to enable the Style Library feature:
                </p>
                <code className="block bg-black/30 rounded-lg p-3 text-xs text-pink-300 font-mono max-w-lg mx-auto text-left">
                  /app/webapp/supabase/migrations/011_style_presets.sql
                </code>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-pink-500 rounded-full" />
              </div>
            ) : filteredPresets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">{searchQuery ? '🔍' : '✨'}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? 'No matching styles' : 'Your library is empty'}
                </h3>
                <p className="text-white/50 text-sm">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'Generate a style and save it to start building your collection'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all hover:shadow-lg hover:shadow-pink-500/5"
                  >
                    {/* Color Bar Preview */}
                    <div className="h-16 flex">
                      {Object.entries(preset.style_guide.colors || {}).slice(0, 7).map(([name, color], i) => (
                        <div
                          key={name}
                          className="flex-1 relative group/color"
                          style={{ backgroundColor: color as string }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color:opacity-100 transition bg-black/50 text-[8px] text-white font-mono">
                            {color as string}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                            {preset.name}
                            {preset.is_default && (
                              <span className="text-yellow-400 text-xs">⭐</span>
                            )}
                          </h3>
                          <p className="text-xs text-white/40 mt-0.5">
                            {preset.style_guide.themeName}
                          </p>
                        </div>
                        {preset.times_used ? (
                          <span className="text-[10px] text-white/30">
                            Used {preset.times_used}x
                          </span>
                        ) : null}
                      </div>

                      {/* Tags */}
                      {preset.tags && preset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {preset.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mood */}
                      {preset.style_guide.mood && (
                        <p className="text-xs text-white/30 italic mb-3 line-clamp-1">
                          "{preset.style_guide.mood}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => applyPreset(preset)}
                          className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium hover:opacity-90 transition"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => setAsDefault(preset)}
                          className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-yellow-400 hover:bg-white/10 transition"
                          title="Set as default"
                        >
                          <svg className="w-4 h-4" fill={preset.is_default ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deletePreset(preset.id, preset.name)}
                          className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-red-400 hover:bg-white/10 transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/30">
              💡 Tip: Set a default style to auto-apply it to new posts
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
