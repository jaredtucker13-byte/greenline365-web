'use client';

/**
 * Knowledge Base Settings - Memory Bucket Layer 2 (Warehouse)
 * Add and manage your business facts, services, pricing, and FAQs
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

interface KnowledgeChunk {
  id?: string;
  category: string;
  subcategory?: string;
  title?: string;
  content: string;
  priority?: number;
  created_at?: string;
}

const CATEGORIES = [
  { value: 'services', label: 'Services', icon: '🔧', desc: 'What you offer' },
  { value: 'pricing', label: 'Pricing', icon: '💰', desc: 'Rates and packages' },
  { value: 'faq', label: 'FAQs', icon: '❓', desc: 'Common questions' },
  { value: 'processes', label: 'Processes', icon: '📋', desc: 'How you work' },
  { value: 'products', label: 'Products', icon: '📦', desc: 'Items you sell' },
  { value: 'policies', label: 'Policies', icon: '📜', desc: 'Terms and rules' },
  { value: 'anti-knowledge', label: 'Anti-Knowledge', icon: '🚫', desc: 'What AI should NEVER say' },
];

export default function KnowledgePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [knowledge, setKnowledge] = useState<Record<string, KnowledgeChunk[]>>({});
  const [activeCategory, setActiveCategory] = useState('services');
  
  // Form state for adding new knowledge
  const [newChunk, setNewChunk] = useState<Partial<KnowledgeChunk>>({
    category: 'services',
    title: '',
    content: '',
    priority: 5,
  });

  // Load existing knowledge
  useEffect(() => {
    async function loadKnowledge() {
      try {
        const res = await fetch('/api/knowledge');
        const data = await res.json();
        if (data.byCategory) {
          setKnowledge(data.byCategory);
        }
      } catch (e) {
        console.error('Failed to load knowledge:', e);
      } finally {
        setLoading(false);
      }
    }
    loadKnowledge();
  }, []);

  // Add new knowledge chunk
  const handleAdd = async () => {
    if (!newChunk.content?.trim()) {
      alert('Please enter content');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          chunk: {
            ...newChunk,
            category: activeCategory,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Refresh the list
        const refreshRes = await fetch('/api/knowledge');
        const refreshData = await refreshRes.json();
        setKnowledge(refreshData.byCategory || {});
        
        // Reset form
        setNewChunk({ category: activeCategory, title: '', content: '', priority: 5 });
      }
    } catch (e) {
      console.error('Failed to add:', e);
    } finally {
      setSaving(false);
    }
  };

  // Delete knowledge chunk
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this knowledge?')) return;

    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });

      // Refresh
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setKnowledge(data.byCategory || {});
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const currentCategoryItems = knowledge[activeCategory] || [];
  const currentCategoryInfo = CATEGORIES.find(c => c.value === activeCategory);

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      <CollapsibleSidebar
        activeItem="settings"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-4 md:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Knowledge Base</h1>
              <p className="text-white/60 text-sm md:text-base">Teach your AI the facts about your business</p>
            </div>
          </div>
          <p className="text-white/40 text-sm mt-4 max-w-2xl">
            This is <strong>Layer 2 (The Warehouse)</strong> of your AI memory. Add your services, pricing, FAQs, and processes. 
            The AI will use this to give accurate answers instead of hallucinating.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl">
          {/* Category Tabs */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-4">
              <h3 className="text-sm font-medium text-white/60 mb-3">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const count = (knowledge[cat.value] || []).length;
                  const isActive = activeCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                        isActive
                          ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                          : 'bg-white/5 border border-transparent text-white/70 hover:bg-white/10'
                      }`}
                      data-testid={`category-${cat.value}`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{cat.label}</div>
                        <div className="text-xs opacity-60">{cat.desc}</div>
                      </div>
                      {count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add New */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">{currentCategoryInfo?.icon}</span>
                Add {currentCategoryInfo?.label}
              </h2>

              {activeCategory === 'anti-knowledge' && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  <strong>Anti-Knowledge:</strong> Things the AI should NEVER say. Examples: "Never mention competitors," 
                  "Never offer discounts without approval," "Never discuss pricing over $10,000 without human handoff."
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Title (optional)</label>
                  <input
                    type="text"
                    value={newChunk.title || ''}
                    onChange={(e) => setNewChunk(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
                    placeholder={activeCategory === 'services' ? 'e.g., AC Repair Service' : 'Brief title...'}
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Content</label>
                  <textarea
                    value={newChunk.content || ''}
                    onChange={(e) => setNewChunk(p => ({ ...p, content: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none resize-none"
                    rows={4}
                    placeholder={
                      activeCategory === 'services' 
                        ? 'Describe this service in detail. What does it include? How long does it take? Who is it for?'
                        : activeCategory === 'pricing'
                        ? 'List your pricing structure. Include any conditions or variations.'
                        : activeCategory === 'anti-knowledge'
                        ? 'Describe what the AI should NEVER say or do.'
                        : 'Enter the information you want the AI to know...'
                    }
                    data-testid="input-content"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-white/60">Priority:</label>
                    <select
                      value={newChunk.priority || 5}
                      onChange={(e) => setNewChunk(p => ({ ...p, priority: parseInt(e.target.value) }))}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
                    >
                      <option value={10}>🔥 Critical (10)</option>
                      <option value={8}>High (8)</option>
                      <option value={5}>Normal (5)</option>
                      <option value={3}>Low (3)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newChunk.content?.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    data-testid="add-knowledge"
                  >
                    {saving ? 'Adding...' : '+ Add Knowledge'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Existing Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">
                {currentCategoryInfo?.label} ({currentCategoryItems.length})
              </h2>

              {loading ? (
                <div className="text-center py-8 text-white/40">Loading...</div>
              ) : currentCategoryItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">{currentCategoryInfo?.icon}</div>
                  <div className="text-white/40">No {currentCategoryInfo?.label?.toLowerCase()} added yet</div>
                  <div className="text-white/30 text-sm mt-1">Add your first one above</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCategoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {item.title && (
                            <h4 className="font-medium text-white mb-1">{item.title}</h4>
                          )}
                          <p className="text-white/70 text-sm whitespace-pre-wrap">{item.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                            <span>Priority: {item.priority || 5}</span>
                            {item.created_at && (
                              <span>Added: {new Date(item.created_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Prompts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
            >
              <h3 className="text-white font-semibold mb-3">💡 What to Add for "{currentCategoryInfo?.label}"</h3>
              <div className="text-white/60 text-sm space-y-2">
                {activeCategory === 'services' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Each service you offer with full description</li>
                    <li>What's included in each service</li>
                    <li>Time estimates (how long does it take?)</li>
                    <li>Who is this service best for?</li>
                  </ul>
                )}
                {activeCategory === 'pricing' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Base rates for each service</li>
                    <li>Package deals or bundles</li>
                    <li>Conditions that affect pricing (weekends, rush jobs)</li>
                    <li>Payment terms and methods accepted</li>
                  </ul>
                )}
                {activeCategory === 'faq' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Questions customers ask repeatedly</li>
                    <li>Common objections and your responses</li>
                    <li>Clarifications about your services</li>
                    <li>Warranty/guarantee information</li>
                  </ul>
                )}
                {activeCategory === 'processes' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Step-by-step: How does a typical job work?</li>
                    <li>What happens first, second, third?</li>
                    <li>How do you handle special situations?</li>
                    <li>Your quality assurance process</li>
                  </ul>
                )}
                {activeCategory === 'anti-knowledge' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>"Never mention competitor X"</li>
                    <li>"Never offer discounts without my approval"</li>
                    <li>"Never promise delivery in less than 3 days"</li>
                    <li>"Never discuss projects over $50k without handoff"</li>
                  </ul>
                )}
                {activeCategory === 'products' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Product names and descriptions</li>
                    <li>Features and specifications</li>
                    <li>Materials and dimensions</li>
                    <li>Care instructions</li>
                  </ul>
                )}
                {activeCategory === 'policies' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cancellation policy</li>
                    <li>Refund policy</li>
                    <li>Service area limitations</li>
                    <li>Working hours and availability</li>
                  </ul>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
