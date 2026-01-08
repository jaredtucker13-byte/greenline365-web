'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface ContentItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// Predefined content sections
const CONTENT_SECTIONS = [
  { key: 'terms_of_service', label: 'Terms of Service', description: 'Legal terms and conditions' },
  { key: 'privacy_policy', label: 'Privacy Policy', description: 'How we handle user data' },
  { key: 'trust_security', label: 'Trust & Security', description: 'Security whitepaper content' },
  { key: 'about_us', label: 'About Us', description: 'Company description and mission' },
  { key: 'homepage_hero', label: 'Homepage Hero', description: 'Main headline and subtext' },
  { key: 'pricing_info', label: 'Pricing Information', description: 'Pricing page content' },
  { key: 'support_faq', label: 'Support FAQ', description: 'Frequently asked questions' },
];

export default function ContentManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAuth();
    fetchContents();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    
    setUser(session.user);
    
    // Check if admin
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (!data?.is_admin) {
      router.push('/account');
      return;
    }
    
    setIsAdmin(true);
    setLoading(false);
  };

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/site-content');
      const { data } = await response.json();
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const handleSelectSection = (key: string) => {
    setSelectedKey(key);
    const existing = contents.find(c => c.key === key);
    setEditValue(existing?.value || '');
    setEditDescription(existing?.description || CONTENT_SECTIONS.find(s => s.key === key)?.description || '');
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedKey) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedKey,
          value: editValue,
          description: editDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      } else {
        setMessage({ type: 'success', text: 'Content saved successfully!' });
        fetchContents();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Content Manager</h1>
            <p className="text-white/60 text-sm">Edit website content without code changes</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-white/60 hover:text-white transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Content Sections */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-4">
              <h2 className="text-white font-semibold mb-4">Content Sections</h2>
              <div className="space-y-2">
                {CONTENT_SECTIONS.map((section) => {
                  const hasContent = contents.some(c => c.key === section.key);
                  return (
                    <button
                      key={section.key}
                      onClick={() => handleSelectSection(section.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${
                        selectedKey === section.key
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{section.label}</span>
                        {hasContent && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-1">{section.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            {selectedKey ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {CONTENT_SECTIONS.find(s => s.key === selectedKey)?.label}
                  </h2>
                  <span className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded">
                    {selectedKey}
                  </span>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
                      placeholder="Brief description of this content..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Content
                    </label>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={20}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 outline-none font-mono text-sm resize-y"
                      placeholder="Enter your content here... You can use HTML or Markdown."
                    />
                    <p className="text-xs text-white/40 mt-2">
                      Tip: You can use HTML tags for formatting. Changes are saved to the database.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      onClick={() => setSelectedKey(null)}
                      className="px-4 py-2 text-white/60 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-12 text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-white mb-2">Select a Section</h3>
                <p className="text-white/60">
                  Choose a content section from the sidebar to start editing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
