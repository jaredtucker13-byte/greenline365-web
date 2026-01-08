'use client';

/**
 * DemoController Component
 * GreenLine365 Admin V2 - Hidden B2B Demo Controller
 * 
 * Features:
 * - Reads demo_profiles from Supabase
 * - Dynamic Business Name rebranding
 * - City/Location switching
 * - Color theme customization
 * - Website URL input for future scraping
 * - Persists current demo profile to Supabase
 * - Hidden toggle (triple-click on version number)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface DemoConfig {
  businessName: string;
  city: string;
  primaryColor: string;
  accentColor: string;
}

interface DemoProfile {
  id: string;
  slug: string;
  business_name: string;
  city_location: string;
  industry: string;
  primary_color: string;
  accent_color: string;
  description?: string;
}

interface DemoControllerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (config: DemoConfig) => void;
  currentConfig: DemoConfig;
}

// Fallback presets if DB fetch fails
const fallbackPresets: DemoProfile[] = [
  {
    id: 'greenline365',
    slug: 'greenline365',
    business_name: 'GreenLine365',
    city_location: 'Tampa, FL',
    industry: 'technology',
    primary_color: '#39FF14',
    accent_color: '#0CE293',
    description: 'Default GreenLine365 branding',
  },
  {
    id: 'tampa-bay-bakery',
    slug: 'tampa-bay-bakery',
    business_name: 'Tampa Bay Bakery',
    city_location: 'Tampa, FL',
    industry: 'food_beverage',
    primary_color: '#FF6B35',
    accent_color: '#F7C59F',
  },
  {
    id: 'miami-auto-group',
    slug: 'miami-auto-group',
    business_name: 'Miami Auto Group',
    city_location: 'Miami, FL',
    industry: 'automotive',
    primary_color: '#00D4FF',
    accent_color: '#7B68EE',
  },
  {
    id: 'orlando-med-spa',
    slug: 'orlando-med-spa',
    business_name: 'Orlando Med Spa',
    city_location: 'Orlando, FL',
    industry: 'healthcare',
    primary_color: '#E91E8C',
    accent_color: '#9B59B6',
  },
  {
    id: 'jacksonville-fitness',
    slug: 'jacksonville-fitness',
    business_name: 'Jacksonville Fitness',
    city_location: 'Jacksonville, FL',
    industry: 'fitness',
    primary_color: '#FFD700',
    accent_color: '#FF4500',
  },
];

export default function DemoController({ isOpen, onClose, onConfigChange, currentConfig }: DemoControllerProps) {
  const [config, setConfig] = useState<DemoConfig>(currentConfig);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<DemoProfile[]>(fallbackPresets);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Load demo profiles from Supabase
  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      const { data, error } = await supabase
        .from('demo_profiles')
        .select('*')
        .order('is_default', { ascending: false });

      if (data && !error && data.length > 0) {
        setProfiles(data);
        // Find and set default profile
        const defaultProfile = data.find(p => p.is_default) || data[0];
        if (defaultProfile) {
          setSelectedProfileId(defaultProfile.id);
        }
      }
      setLoading(false);
    }

    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  // Update config when currentConfig changes
  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handlePresetSelect = (profile: DemoProfile) => {
    setSelectedProfileId(profile.id);
    setConfig({
      businessName: profile.business_name,
      city: profile.city_location,
      primaryColor: profile.primary_color,
      accentColor: profile.accent_color,
    });
  };

  const handleApply = async () => {
    setSaving(true);
    
    try {
      // Save current demo session to Supabase
      if (selectedProfileId) {
        await supabase
          .from('demo_sessions')
          .insert({
            demo_profile_id: selectedProfileId,
            status: 'active',
            website: websiteUrl || null,
            metadata: {
              applied_from: 'demo_controller',
              custom_config: config,
            },
            created_at: new Date().toISOString(),
          });
      }

      // If website URL provided, create a demo_request for future scraping
      if (websiteUrl) {
        await supabase
          .from('demo_requests')
          .insert({
            email: 'demo-controller@internal',
            website_url: websiteUrl,
            selected_demo_profile_id: selectedProfileId,
            scrape_status: 'pending',
            created_at: new Date().toISOString(),
          });
      }

      onConfigChange(config);
      onClose();
    } catch (error) {
      console.error('Error saving demo config:', error);
      // Still apply the config even if save fails
      onConfigChange(config);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1A1A1A] border border-[#39FF14]/30 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Demo Controller
                </h2>
                <p className="text-xs text-[#39FF14] font-mono mt-1">B2B PITCH MODE</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white/60 text-sm">Loading profiles...</p>
              </div>
            ) : (
              <>
                {/* Quick Presets */}
                <div className="mb-6">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Quick Presets</p>
                  <div className="grid grid-cols-2 gap-2">
                    {profiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handlePresetSelect(profile)}
                        className={`p-3 rounded-lg border text-left transition ${
                          selectedProfileId === profile.id
                            ? 'bg-[#39FF14]/10 border-[#39FF14]/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: profile.primary_color }}
                          />
                          <span className="text-sm text-white font-medium truncate">
                            {profile.business_name}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-1 truncate">{profile.city_location}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Configuration */}
                <div className="space-y-4 mb-6">
                  <p className="text-xs text-white/50 uppercase tracking-wider">Custom Configuration</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={config.businessName}
                        onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14]/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">City / Location</label>
                      <input
                        type="text"
                        value={config.city}
                        onChange={(e) => setConfig({ ...config, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14]/50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={config.primaryColor}
                          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:border-[#39FF14]/50 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Accent Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.accentColor}
                          onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={config.accentColor}
                          onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:border-[#39FF14]/50 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Website URL for Scraping (Phase 2) */}
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Business Website URL <span className="text-white/30">(for personalization)</span>
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#39FF14]/50 outline-none placeholder:text-white/30"
                    />
                    <p className="text-xs text-white/30 mt-1">
                      Optional: We'll use this to auto-tailor the demo content
                    </p>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mb-6">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Live Preview</p>
                  <div 
                    className="p-4 rounded-xl border"
                    style={{ 
                      backgroundColor: `${config.primaryColor}10`,
                      borderColor: `${config.primaryColor}30`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                        style={{ backgroundColor: config.primaryColor, color: '#000' }}
                      >
                        {config.businessName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{config.businessName}</p>
                        <p className="text-xs" style={{ color: config.accentColor }}>{config.city}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={saving}
                    className="flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                    style={{ backgroundColor: config.primaryColor, color: '#000' }}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Apply Demo Config'
                    )}
                  </button>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-white/30 text-center mt-4">
                  Config is synced to Supabase for consistent demos across sessions
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
