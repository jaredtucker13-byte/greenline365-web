'use client';

/**
 * DemoController Component
 * GreenLine365 Admin V2 - Hidden B2B Demo Controller
 * 
 * Features:
 * - Dynamic Business Name rebranding
 * - City/Location switching
 * - Color theme customization
 * - Hidden toggle (triple-click on version number)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface DemoConfig {
  businessName: string;
  city: string;
  primaryColor: string;
  accentColor: string;
}

interface DemoControllerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (config: DemoConfig) => void;
  currentConfig: DemoConfig;
}

const presetConfigs: { name: string; config: DemoConfig }[] = [
  {
    name: 'GreenLine365 (Default)',
    config: {
      businessName: 'GreenLine365',
      city: 'Tampa, FL',
      primaryColor: '#39FF14',
      accentColor: '#0CE293',
    },
  },
  {
    name: 'Tampa Bay Bakery',
    config: {
      businessName: 'Tampa Bay Bakery',
      city: 'Tampa, FL',
      primaryColor: '#FF6B35',
      accentColor: '#F7C59F',
    },
  },
  {
    name: 'Miami Auto Group',
    config: {
      businessName: 'Miami Auto Group',
      city: 'Miami, FL',
      primaryColor: '#00D4FF',
      accentColor: '#7B68EE',
    },
  },
  {
    name: 'Orlando Med Spa',
    config: {
      businessName: 'Orlando Med Spa',
      city: 'Orlando, FL',
      primaryColor: '#E91E8C',
      accentColor: '#9B59B6',
    },
  },
  {
    name: 'Jacksonville Fitness',
    config: {
      businessName: 'Jacksonville Fitness',
      city: 'Jacksonville, FL',
      primaryColor: '#FFD700',
      accentColor: '#FF4500',
    },
  },
];

export default function DemoController({ isOpen, onClose, onConfigChange, currentConfig }: DemoControllerProps) {
  const [config, setConfig] = useState<DemoConfig>(currentConfig);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handlePresetSelect = (preset: DemoConfig) => {
    setConfig(preset);
    onConfigChange(preset);
  };

  const handleFieldChange = (field: keyof DemoConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
  };

  const handleApply = () => {
    onConfigChange(config);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#1A1A1A] border-2 border-[#FF3B3B]/50 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,59,59,0.3)]"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#FF3B3B]/30 bg-[#FF3B3B]/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🎮</span> Demo Controller
                  </h2>
                  <p className="text-sm text-[#FF3B3B] mt-1 font-mono">// B2B PITCH MODE //</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-[#FF3B3B]/20 border border-[#FF3B3B]/30 hover:bg-[#FF3B3B]/30 flex items-center justify-center text-white transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {presetConfigs.map((preset) => (
                    <motion.button
                      key={preset.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePresetSelect(preset.config)}
                      className="p-3 rounded-lg border text-left transition-all text-sm"
                      style={{
                        borderColor: config.businessName === preset.config.businessName ? preset.config.primaryColor : '#2D3748',
                        backgroundColor: config.businessName === preset.config.businessName ? `${preset.config.primaryColor}20` : '#1E262E',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: preset.config.primaryColor }}
                        />
                        <span className="text-white font-medium truncate">{preset.name}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={config.businessName}
                    onChange={(e) => handleFieldChange('businessName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1E262E] border border-[#2D3748] text-white placeholder:text-gray-500 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City / Location</label>
                  <input
                    type="text"
                    value={config.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1E262E] border border-[#2D3748] text-white placeholder:text-gray-500 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#1E262E] border border-[#2D3748] text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#1E262E] border border-[#2D3748] text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-[#2D3748] bg-[#121212]">
                <p className="text-xs text-gray-500 mb-2">PREVIEW</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.businessName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold">{config.businessName}</p>
                    <p className="text-xs" style={{ color: config.accentColor }}>{config.city}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#FF3B3B]/30 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 rounded-xl border border-[#2D3748] text-gray-400 hover:text-white hover:border-gray-600 transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className="flex-1 py-3 px-6 rounded-xl bg-[#FF3B3B] text-white font-bold hover:bg-[#FF3B3B]/90 transition"
              >
                Apply Demo Config
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
