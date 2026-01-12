'use client';

/**
 * Brand Voice Settings - Memory Bucket Layer 1 (Core Profile)
 * Configure AI personality, brand voice, and user identity
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import { createClient } from '@/lib/supabase/client';
import type { CoreProfile } from '@/lib/memory-bucket-service';

const TONE_OPTIONS = [
  { value: 'friendly-expert', label: 'Friendly Expert', desc: 'Warm but knowledgeable' },
  { value: 'professional', label: 'Professional', desc: 'Polished and formal' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed and conversational' },
  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'High energy and excited' },
  { value: 'authoritative', label: 'Authoritative', desc: 'Confident and commanding' },
];

const FORMALITY_OPTIONS = [
  { value: 'formal', label: 'Formal', desc: 'Traditional business style' },
  { value: 'casual-professional', label: 'Casual Professional', desc: 'Relaxed but polished' },
  { value: 'casual', label: 'Casual', desc: 'Like talking to a friend' },
];

const ENERGY_OPTIONS = [
  { value: 'high', label: 'High Energy', emoji: '⚡' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
  { value: 'calm', label: 'Calm & Measured', emoji: '🧘' },
];

export default function BrandVoicePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Form state
  const [profile, setProfile] = useState<Partial<CoreProfile>>({
    displayName: '',
    location: '',
    industry: '',
    businessName: '',
    personality: {
      tone: 'friendly-expert',
      formality: 'casual-professional',
      humor: 'light',
      energy: 'balanced',
      quirks: [],
    },
    biography: {
      background: '',
      whyStory: '',
      expertise: [],
      struggles: [],
      wins: [],
    },
    voiceExamples: [],
    forbiddenPhrases: [],
    preferredPhrases: [],
    targetAudience: {
      demographics: '',
      painPoints: [],
      desires: [],
    },
  });

  // Input for list fields
  const [quirksInput, setQuirksInput] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [voiceExampleInput, setVoiceExampleInput] = useState('');
  const [forbiddenInput, setForbiddenInput] = useState('');
  const [preferredInput, setPreferredInput] = useState('');

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('memory_core_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setProfile({
            displayName: data.display_name || '',
            location: data.location || '',
            industry: data.industry || '',
            businessName: data.business_name || '',
            personality: data.personality || profile.personality,
            biography: data.biography || profile.biography,
            voiceExamples: data.brand_voice_examples || [],
            forbiddenPhrases: data.forbidden_phrases || [],
            preferredPhrases: data.preferred_phrases || [],
            targetAudience: data.target_audience || profile.targetAudience,
          });
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to save your brand voice settings');
        return;
      }

      const { error } = await supabase
        .from('memory_core_profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.displayName,
          location: profile.location,
          industry: profile.industry,
          business_name: profile.businessName,
          personality: profile.personality,
          biography: profile.biography,
          brand_voice_examples: profile.voiceExamples,
          forbidden_phrases: profile.forbiddenPhrases,
          preferred_phrases: profile.preferredPhrases,
          target_audience: profile.targetAudience,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save:', e);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to add items to list fields
  const addToList = (field: string, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    
    if (field === 'quirks') {
      setProfile(p => ({
        ...p,
        personality: {
          ...p.personality!,
          quirks: [...(p.personality?.quirks || []), value.trim()],
        },
      }));
    } else if (field === 'expertise') {
      setProfile(p => ({
        ...p,
        biography: {
          ...p.biography!,
          expertise: [...(p.biography?.expertise || []), value.trim()],
        },
      }));
    } else if (field === 'voiceExamples') {
      setProfile(p => ({
        ...p,
        voiceExamples: [...(p.voiceExamples || []), value.trim()],
      }));
    } else if (field === 'forbiddenPhrases') {
      setProfile(p => ({
        ...p,
        forbiddenPhrases: [...(p.forbiddenPhrases || []), value.trim()],
      }));
    } else if (field === 'preferredPhrases') {
      setProfile(p => ({
        ...p,
        preferredPhrases: [...(p.preferredPhrases || []), value.trim()],
      }));
    }
    
    setter('');
  };

  // Helper to remove items from list fields
  const removeFromList = (field: string, index: number) => {
    if (field === 'quirks') {
      setProfile(p => ({
        ...p,
        personality: {
          ...p.personality!,
          quirks: p.personality?.quirks?.filter((_, i) => i !== index) || [],
        },
      }));
    } else if (field === 'expertise') {
      setProfile(p => ({
        ...p,
        biography: {
          ...p.biography!,
          expertise: p.biography?.expertise?.filter((_, i) => i !== index) || [],
        },
      }));
    } else if (field === 'voiceExamples') {
      setProfile(p => ({
        ...p,
        voiceExamples: p.voiceExamples?.filter((_, i) => i !== index) || [],
      }));
    } else if (field === 'forbiddenPhrases') {
      setProfile(p => ({
        ...p,
        forbiddenPhrases: p.forbiddenPhrases?.filter((_, i) => i !== index) || [],
      }));
    } else if (field === 'preferredPhrases') {
      setProfile(p => ({
        ...p,
        preferredPhrases: p.preferredPhrases?.filter((_, i) => i !== index) || [],
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 min-w-0 relative z-10 p-4 md:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Brand Voice</h1>
              <p className="text-white/60 text-sm md:text-base">Configure your AI personality and communication style</p>
            </div>
          </div>
          <p className="text-white/40 text-sm mt-4 max-w-2xl">
            This is <strong>Layer 1 (The Core)</strong> of your AI memory system. Everything you configure here shapes how your AI assistant communicates - matching your unique voice and brand personality.
          </p>
        </div>

        {/* Form Sections */}
        <div className="space-y-6 max-w-4xl">
          
          {/* Identity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">👤</span> Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Your Name</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                  placeholder="Jared Tucker"
                  data-testid="input-display-name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Business Name</label>
                <input
                  type="text"
                  value={profile.businessName}
                  onChange={(e) => setProfile(p => ({ ...p, businessName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                  placeholder="GreenLine365"
                  data-testid="input-business-name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                  placeholder="Tampa, FL"
                  data-testid="input-location"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Industry</label>
                <input
                  type="text"
                  value={profile.industry}
                  onChange={(e) => setProfile(p => ({ ...p, industry: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                  placeholder="Marketing / Local Business Services"
                  data-testid="input-industry"
                />
              </div>
            </div>
          </motion.div>

          {/* Voice & Personality Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🎭</span> Voice & Personality
            </h2>
            
            {/* Tone */}
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Tone</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfile(p => ({ ...p, personality: { ...p.personality!, tone: option.value } }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profile.personality?.tone === option.value
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                    data-testid={`tone-${option.value}`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-60">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Formality */}
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Formality</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMALITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfile(p => ({ ...p, personality: { ...p.personality!, formality: option.value } }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profile.personality?.formality === option.value
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                    data-testid={`formality-${option.value}`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-60">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Energy Level</label>
              <div className="grid grid-cols-3 gap-2">
                {ENERGY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfile(p => ({ ...p, personality: { ...p.personality!, energy: option.value } }))}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      profile.personality?.energy === option.value
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                    data-testid={`energy-${option.value}`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quirks */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Style Quirks</label>
              <p className="text-xs text-white/40 mb-2">Unique traits that make your voice distinctive</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={quirksInput}
                  onChange={(e) => setQuirksInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToList('quirks', quirksInput, setQuirksInput)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none text-sm"
                  placeholder="e.g., Uses local Tampa references, Cooking metaphors"
                  data-testid="input-quirks"
                />
                <button
                  onClick={() => addToList('quirks', quirksInput, setQuirksInput)}
                  className="px-4 py-2 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.personality?.quirks?.map((quirk, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm flex items-center gap-2">
                    {quirk}
                    <button onClick={() => removeFromList('quirks', i)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Biography Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">📖</span> Your Story
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Background</label>
                <textarea
                  value={profile.biography?.background}
                  onChange={(e) => setProfile(p => ({ ...p, biography: { ...p.biography!, background: e.target.value } }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Former HVAC tech turned cook turned digital marketer..."
                  data-testid="input-background"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-1">Your "Why" Story</label>
                <textarea
                  value={profile.biography?.whyStory}
                  onChange={(e) => setProfile(p => ({ ...p, biography: { ...p.biography!, whyStory: e.target.value } }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Struggled on Etsy, learned marketing the hard way..."
                  data-testid="input-why-story"
                />
              </div>

              {/* Expertise Tags */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Areas of Expertise</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('expertise', expertiseInput, setExpertiseInput)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none text-sm"
                    placeholder="e.g., Local SEO, Service businesses"
                    data-testid="input-expertise"
                  />
                  <button
                    onClick={() => addToList('expertise', expertiseInput, setExpertiseInput)}
                    className="px-4 py-2 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.biography?.expertise?.map((exp, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
                      {exp}
                      <button onClick={() => removeFromList('expertise', i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Voice Examples & Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">💬</span> Voice Rules
            </h2>
            
            <div className="space-y-6">
              {/* Voice Examples */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Voice Examples</label>
                <p className="text-xs text-white/40 mb-2">Sentences that sound like you - the AI will learn from these</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={voiceExampleInput}
                    onChange={(e) => setVoiceExampleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('voiceExamples', voiceExampleInput, setVoiceExampleInput)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none text-sm"
                    placeholder="e.g., Let's get your business cooking on all burners!"
                    data-testid="input-voice-example"
                  />
                  <button
                    onClick={() => addToList('voiceExamples', voiceExampleInput, setVoiceExampleInput)}
                    className="px-4 py-2 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {profile.voiceExamples?.map((example, i) => (
                    <div key={i} className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm flex items-center justify-between">
                      <span>"{example}"</span>
                      <button onClick={() => removeFromList('voiceExamples', i)} className="ml-2 hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Phrases */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Preferred Phrases ✅</label>
                <p className="text-xs text-white/40 mb-2">Phrases you want the AI to use</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={preferredInput}
                    onChange={(e) => setPreferredInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('preferredPhrases', preferredInput, setPreferredInput)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none text-sm"
                    placeholder="e.g., Let's dive in, Here's the game plan"
                    data-testid="input-preferred"
                  />
                  <button
                    onClick={() => addToList('preferredPhrases', preferredInput, setPreferredInput)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredPhrases?.map((phrase, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
                      {phrase}
                      <button onClick={() => removeFromList('preferredPhrases', i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Forbidden Phrases */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Forbidden Phrases ❌</label>
                <p className="text-xs text-white/40 mb-2">Phrases the AI should NEVER use</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={forbiddenInput}
                    onChange={(e) => setForbiddenInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addToList('forbiddenPhrases', forbiddenInput, setForbiddenInput)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-violet-500 focus:outline-none text-sm"
                    placeholder="e.g., synergy, circle back, leverage"
                    data-testid="input-forbidden"
                  />
                  <button
                    onClick={() => addToList('forbiddenPhrases', forbiddenInput, setForbiddenInput)}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.forbiddenPhrases?.map((phrase, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-sm flex items-center gap-2">
                      {phrase}
                      <button onClick={() => removeFromList('forbiddenPhrases', i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-4"
          >
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 text-emerald-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
              data-testid="save-brand-voice"
            >
              {saving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Brand Voice
                </>
              )}
            </button>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">🧠</span>
              <div>
                <h3 className="text-white font-semibold mb-2">How This Works</h3>
                <p className="text-white/60 text-sm">
                  Your Brand Voice settings become the <strong>Core Memory</strong> for all AI interactions in GreenLine365. 
                  Whether you're chatting with the assistant, generating blog content, or creating images - the AI will 
                  speak in YOUR voice, using YOUR preferred phrases, and avoiding words you don't like.
                </p>
                <p className="text-white/40 text-sm mt-2">
                  This is part of the <strong>Dynamic Memory Bucket System</strong> - a 4-layer architecture that gives 
                  the AI deep context about who you are and what your business does.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
