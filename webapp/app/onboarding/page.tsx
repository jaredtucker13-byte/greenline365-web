'use client';

/**
 * Onboarding Wizard - The Welcome Experience
 * 
 * Two modes:
 * 1. Wizard (guided step-by-step)
 * 2. Long-form (fill everything at once)
 * 
 * Goal: Make this the most painless, memorable onboarding experience
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

// Wizard steps
const WIZARD_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to GreenLine365',
    subtitle: "Let's set up your AI assistant in just a few minutes",
    icon: '🚀',
  },
  {
    id: 'identity',
    title: 'Tell Us About You',
    subtitle: 'This helps your AI sound authentic',
    icon: '👤',
  },
  {
    id: 'personality',
    title: 'Your Brand Voice',
    subtitle: 'If your business was a person, how would it speak?',
    icon: '🎭',
  },
  {
    id: 'knowledge',
    title: 'Quick Facts',
    subtitle: 'Give your AI some starter knowledge',
    icon: '📚',
  },
  {
    id: 'anti-knowledge',
    title: 'The No-Go Zone',
    subtitle: 'What should your AI NEVER say?',
    icon: '🚫',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    subtitle: 'Your AI is ready to work for you',
    icon: '🎉',
  },
];

const PERSONALITY_PRESETS = [
  { id: 'neighbor', label: 'Helpful Neighbor', desc: 'Friendly, knows their stuff, casual', tone: 'friendly-expert', formality: 'casual' },
  { id: 'consultant', label: 'Premium Consultant', desc: 'Polished, professional, confident', tone: 'professional', formality: 'formal' },
  { id: 'coach', label: 'Enthusiastic Coach', desc: 'High energy, motivating, direct', tone: 'enthusiastic', formality: 'casual-professional' },
  { id: 'educator', label: 'Patient Educator', desc: 'Clear, thorough, supportive', tone: 'authoritative', formality: 'casual-professional' },
  { id: 'custom', label: 'Custom', desc: 'Define your own style', tone: 'friendly-expert', formality: 'casual-professional' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choice' | 'wizard' | 'longform'>('choice');
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    // Identity
    displayName: '',
    businessName: '',
    location: '',
    industry: '',
    
    // Personality
    personalityPreset: '',
    tone: 'friendly-expert',
    formality: 'casual-professional',
    energy: 'balanced',
    quirks: [] as string[],
    
    // Background
    background: '',
    whyStory: '',
    
    // Quick knowledge
    mainService: '',
    uniqueValue: '',
    typicalProcess: '',
    
    // Anti-knowledge
    neverSay: [] as string[],
  });

  const [quirksInput, setQuirksInput] = useState('');
  const [neverSayInput, setNeverSayInput] = useState('');

  // Check if user already completed onboarding
  useEffect(() => {
    async function checkOnboarding() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('memory_core_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        // If they have a profile, they've done onboarding
        // But let them redo it if they want
      }
    }
    checkOnboarding();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in first');
        router.push('/login');
        return;
      }

      // Save core profile (Layer 1)
      const { error: profileError } = await supabase
        .from('memory_core_profiles')
        .upsert({
          user_id: user.id,
          display_name: formData.displayName,
          business_name: formData.businessName,
          location: formData.location,
          industry: formData.industry,
          personality: {
            tone: formData.tone,
            formality: formData.formality,
            energy: formData.energy,
            quirks: formData.quirks,
          },
          biography: {
            background: formData.background,
            whyStory: formData.whyStory,
          },
          forbidden_phrases: formData.neverSay,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Save quick knowledge (Layer 2)
      const knowledgeChunks = [];
      
      if (formData.mainService) {
        knowledgeChunks.push({
          user_id: user.id,
          category: 'services',
          title: 'Main Service',
          content: formData.mainService,
          source: 'onboarding',
          priority: 10,
          is_active: true,
        });
      }
      
      if (formData.uniqueValue) {
        knowledgeChunks.push({
          user_id: user.id,
          category: 'faq',
          title: 'Unique Value',
          content: formData.uniqueValue,
          source: 'onboarding',
          priority: 10,
          is_active: true,
        });
      }
      
      if (formData.typicalProcess) {
        knowledgeChunks.push({
          user_id: user.id,
          category: 'processes',
          title: 'Typical Job Process',
          content: formData.typicalProcess,
          source: 'onboarding',
          priority: 8,
          is_active: true,
        });
      }

      if (knowledgeChunks.length > 0) {
        await supabase.from('memory_knowledge_chunks').insert(knowledgeChunks);
      }

      // Log onboarding completion
      await supabase.from('memory_event_journal').insert({
        user_id: user.id,
        event_type: 'onboarding_completed',
        event_category: 'system',
        title: 'Completed onboarding',
        metadata: { 
          mode,
          stepsCompleted: mode === 'wizard' ? WIZARD_STEPS.length : 1,
        },
      });

      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#8B5CF6'],
      });

      // Move to completion step or redirect
      if (mode === 'wizard') {
        setCurrentStep(WIZARD_STEPS.length - 1);
      } else {
        setTimeout(() => router.push('/admin-v2'), 2000);
      }
    } catch (e) {
      console.error('Onboarding error:', e);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addQuirk = () => {
    if (quirksInput.trim()) {
      setFormData(prev => ({ ...prev, quirks: [...prev.quirks, quirksInput.trim()] }));
      setQuirksInput('');
    }
  };

  const addNeverSay = () => {
    if (neverSayInput.trim()) {
      setFormData(prev => ({ ...prev, neverSay: [...prev.neverSay, neverSayInput.trim()] }));
      setNeverSayInput('');
    }
  };

  const selectPreset = (preset: typeof PERSONALITY_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      personalityPreset: preset.id,
      tone: preset.tone,
      formality: preset.formality,
    }));
  };

  // Mode selection screen
  if (mode === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-6xl mb-4"
            >
              🎯
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to GreenLine365</h1>
            <p className="text-xl text-white/60">Let's teach your AI who you are</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.button
              onClick={() => setMode('wizard')}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-left hover:border-emerald-500/50 transition-colors group"
              data-testid="choose-wizard"
            >
              <div className="text-4xl mb-4">🧙‍♂️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Guided Wizard</h2>
              <p className="text-white/60 mb-4">Step-by-step setup with helpful prompts. Takes about 5 minutes.</p>
              <div className="flex items-center text-emerald-400 font-medium">
                <span>Recommended for first-timers</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setMode('longform')}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 text-left hover:border-blue-500/50 transition-colors group"
              data-testid="choose-longform"
            >
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-white mb-2">Full Form</h2>
              <p className="text-white/60 mb-4">See everything at once. Fill out what you want, skip what you don't.</p>
              <div className="flex items-center text-blue-400 font-medium">
                <span>For power users</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </motion.button>
          </div>

          <p className="text-center text-white/40 text-sm mt-8">
            Don't worry, you can always update these settings later
          </p>
        </motion.div>
      </div>
    );
  }

  // Wizard mode
  if (mode === 'wizard') {
    const step = WIZARD_STEPS[currentStep];
    const isLastStep = currentStep === WIZARD_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step indicator */}
        <div className="pt-8 px-4">
          <div className="max-w-2xl mx-auto flex justify-center gap-2">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= currentStep ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl w-full"
            >
              {/* Step header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                  className="text-5xl mb-4"
                >
                  {step.icon}
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
                <p className="text-white/60">{step.subtitle}</p>
              </div>

              {/* Step content */}
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8">
                {step.id === 'welcome' && (
                  <div className="text-center space-y-6">
                    <p className="text-white/80 text-lg">
                      In the next few steps, we'll teach your AI assistant who you are, 
                      how you speak, and what your business does.
                    </p>
                    <p className="text-white/60">
                      This takes about 5 minutes and makes a huge difference in how 
                      authentic your AI sounds.
                    </p>
                    <div className="pt-4">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-lg hover:from-emerald-600 hover:to-blue-600 transition-all"
                      >
                        Let's Get Started
                      </button>
                    </div>
                  </div>
                )}

                {step.id === 'identity' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Your Name</label>
                        <input
                          type="text"
                          value={formData.displayName}
                          onChange={(e) => updateForm('displayName', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none"
                          placeholder="Jared Tucker"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Business Name</label>
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => updateForm('businessName', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none"
                          placeholder="GreenLine365"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => updateForm('location', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none"
                          placeholder="Tampa, FL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Industry</label>
                        <input
                          type="text"
                          value={formData.industry}
                          onChange={(e) => updateForm('industry', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none"
                          placeholder="Marketing, HVAC, Restaurant..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step.id === 'personality' && (
                  <div className="space-y-6">
                    <p className="text-white/60 text-sm mb-4">Choose a preset or customize your own:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PERSONALITY_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => selectPreset(preset)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            formData.personalityPreset === preset.id
                              ? 'bg-emerald-500/20 border-emerald-500'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="font-medium text-white text-sm">{preset.label}</div>
                          <div className="text-xs text-white/50 mt-1">{preset.desc}</div>
                        </button>
                      ))}
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Style Quirks (optional)</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={quirksInput}
                          onChange={(e) => setQuirksInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addQuirk()}
                          className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none text-sm"
                          placeholder="e.g., Uses sports metaphors"
                        />
                        <button onClick={addQuirk} className="px-4 py-2 rounded-xl bg-emerald-500 text-white">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.quirks.map((q, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
                            {q}
                            <button onClick={() => setFormData(p => ({ ...p, quirks: p.quirks.filter((_, j) => j !== i) }))} className="ml-2">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step.id === 'knowledge' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">What's your main service/product?</label>
                      <textarea
                        value={formData.mainService}
                        onChange={(e) => updateForm('mainService', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Describe your core offering..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">What makes you different?</label>
                      <textarea
                        value={formData.uniqueValue}
                        onChange={(e) => updateForm('uniqueValue', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none resize-none"
                        rows={2}
                        placeholder="What should every customer know about your quality?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Walk through a typical job</label>
                      <textarea
                        value={formData.typicalProcess}
                        onChange={(e) => updateForm('typicalProcess', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Step 1: Customer calls... Step 2: We diagnose... Step 3: ..."
                      />
                    </div>
                  </div>
                )}

                {step.id === 'anti-knowledge' && (
                  <div className="space-y-6">
                    <p className="text-white/60 text-sm">
                      Tell us what your AI should <strong className="text-red-400">NEVER</strong> say or do:
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={neverSayInput}
                        onChange={(e) => setNeverSayInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNeverSay()}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none"
                        placeholder="e.g., Never mention competitor X"
                      />
                      <button onClick={addNeverSay} className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium">Add</button>
                    </div>
                    <div className="space-y-2">
                      {formData.neverSay.map((item, i) => (
                        <div key={i} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex justify-between items-center">
                          <span>{item}</span>
                          <button onClick={() => setFormData(p => ({ ...p, neverSay: p.neverSay.filter((_, j) => j !== i) }))} className="hover:text-white">×</button>
                        </div>
                      ))}
                    </div>
                    {formData.neverSay.length === 0 && (
                      <p className="text-white/40 text-sm text-center py-4">No restrictions added yet (optional)</p>
                    )}
                  </div>
                )}

                {step.id === 'complete' && (
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.3 }}
                      className="text-6xl"
                    >
                      ✨
                    </motion.div>
                    <p className="text-white/80 text-lg">
                      Your AI assistant is now configured with your brand voice and knowledge base.
                    </p>
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400">{formData.quirks.length}</div>
                        <div className="text-xs text-white/50">Style Quirks</div>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="text-2xl font-bold text-blue-400">3</div>
                        <div className="text-xs text-white/50">Knowledge Items</div>
                      </div>
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">{formData.neverSay.length}</div>
                        <div className="text-xs text-white/50">No-Go Rules</div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/admin-v2')}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-lg hover:from-emerald-600 hover:to-blue-600 transition-all"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation */}
              {step.id !== 'welcome' && step.id !== 'complete' && (
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  {currentStep === WIZARD_STEPS.length - 2 ? (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Complete Setup'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Long-form mode (simplified - full form all at once)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-white/60">Fill in what you know, skip what you don't</p>
          <button
            onClick={() => setMode('choice')}
            className="text-sm text-white/40 hover:text-white/60 mt-2"
          >
            ← Switch to guided wizard
          </button>
        </div>

        <div className="space-y-6">
          {/* Identity */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">👤 Identity</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" value={formData.displayName} onChange={(e) => updateForm('displayName', e.target.value)} placeholder="Your Name" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30" />
              <input type="text" value={formData.businessName} onChange={(e) => updateForm('businessName', e.target.value)} placeholder="Business Name" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30" />
              <input type="text" value={formData.location} onChange={(e) => updateForm('location', e.target.value)} placeholder="Location" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30" />
              <input type="text" value={formData.industry} onChange={(e) => updateForm('industry', e.target.value)} placeholder="Industry" className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30" />
            </div>
          </div>

          {/* Knowledge */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">📚 Quick Knowledge</h2>
            <div className="space-y-4">
              <textarea value={formData.mainService} onChange={(e) => updateForm('mainService', e.target.value)} placeholder="Main service/product..." rows={2} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none" />
              <textarea value={formData.uniqueValue} onChange={(e) => updateForm('uniqueValue', e.target.value)} placeholder="What makes you different..." rows={2} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none" />
              <textarea value={formData.typicalProcess} onChange={(e) => updateForm('typicalProcess', e.target.value)} placeholder="Typical job process..." rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none" />
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-lg hover:from-emerald-600 hover:to-blue-600 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
