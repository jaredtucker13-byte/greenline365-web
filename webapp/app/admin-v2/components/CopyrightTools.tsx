'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopyrightCheckResult {
  status: 'safe' | 'warning' | 'caution';
  issues: string[];
  suggestions: string[];
  attribution?: string;
}

interface LicenseType {
  id: string;
  name: string;
  shortName: string;
  description: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  attributionRequired: boolean;
  commercialUse: boolean;
  modifications: boolean;
}

const LICENSE_TYPES: LicenseType[] = [
  {
    id: 'cc0',
    name: 'CC0 - Public Domain',
    shortName: 'CC0',
    description: 'No rights reserved. Free for any use without attribution.',
    permissions: ['Commercial use', 'Modifications', 'Distribution', 'Private use'],
    conditions: [],
    limitations: ['No trademark rights', 'No patent rights', 'No warranty'],
    attributionRequired: false,
    commercialUse: true,
    modifications: true,
  },
  {
    id: 'cc-by',
    name: 'CC BY - Attribution',
    shortName: 'CC BY',
    description: 'Free to share and adapt, must give credit.',
    permissions: ['Commercial use', 'Modifications', 'Distribution', 'Private use'],
    conditions: ['Attribution required'],
    limitations: ['No trademark rights', 'No patent rights', 'No warranty'],
    attributionRequired: true,
    commercialUse: true,
    modifications: true,
  },
  {
    id: 'cc-by-sa',
    name: 'CC BY-SA - Attribution ShareAlike',
    shortName: 'CC BY-SA',
    description: 'Share alike - derivatives must use same license.',
    permissions: ['Commercial use', 'Modifications', 'Distribution', 'Private use'],
    conditions: ['Attribution required', 'ShareAlike'],
    limitations: ['No trademark rights', 'No patent rights', 'No warranty'],
    attributionRequired: true,
    commercialUse: true,
    modifications: true,
  },
  {
    id: 'cc-by-nc',
    name: 'CC BY-NC - Attribution NonCommercial',
    shortName: 'CC BY-NC',
    description: 'Free for non-commercial use with attribution.',
    permissions: ['Modifications', 'Distribution', 'Private use'],
    conditions: ['Attribution required', 'Non-commercial only'],
    limitations: ['No commercial use', 'No trademark rights', 'No warranty'],
    attributionRequired: true,
    commercialUse: false,
    modifications: true,
  },
  {
    id: 'cc-by-nd',
    name: 'CC BY-ND - Attribution NoDerivs',
    shortName: 'CC BY-ND',
    description: 'Share only, no modifications allowed.',
    permissions: ['Commercial use', 'Distribution', 'Private use'],
    conditions: ['Attribution required', 'No derivatives'],
    limitations: ['No modifications', 'No trademark rights', 'No warranty'],
    attributionRequired: true,
    commercialUse: true,
    modifications: false,
  },
  {
    id: 'cc-by-nc-sa',
    name: 'CC BY-NC-SA - Attribution NonCommercial ShareAlike',
    shortName: 'CC BY-NC-SA',
    description: 'Non-commercial, share alike with attribution.',
    permissions: ['Modifications', 'Distribution', 'Private use'],
    conditions: ['Attribution required', 'Non-commercial only', 'ShareAlike'],
    limitations: ['No commercial use', 'No trademark rights', 'No warranty'],
    attributionRequired: true,
    commercialUse: false,
    modifications: true,
  },
  {
    id: 'cc-by-nc-nd',
    name: 'CC BY-NC-ND - Attribution NonCommercial NoDerivs',
    shortName: 'CC BY-NC-ND',
    description: 'Most restrictive - non-commercial, no modifications.',
    permissions: ['Distribution', 'Private use'],
    conditions: ['Attribution required', 'Non-commercial only', 'No derivatives'],
    limitations: ['No commercial use', 'No modifications', 'No trademark rights'],
    attributionRequired: true,
    commercialUse: false,
    modifications: false,
  },
  {
    id: 'all-rights',
    name: 'All Rights Reserved',
    shortName: '© All Rights',
    description: 'Traditional copyright - permission required for any use.',
    permissions: ['Private use (limited)'],
    conditions: ['Written permission required'],
    limitations: ['No commercial use', 'No modifications', 'No distribution'],
    attributionRequired: true,
    commercialUse: false,
    modifications: false,
  },
];

interface CopyrightToolsProps {
  content: string;
  title: string;
  onAttributionGenerated?: (attribution: string) => void;
}

export default function CopyrightTools({ content, title, onAttributionGenerated }: CopyrightToolsProps) {
  const [activeTab, setActiveTab] = useState<'check' | 'license' | 'attribution'>('check');
  const [checkResult, setCheckResult] = useState<CopyrightCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<string>('cc-by');
  
  // Attribution generator state
  const [attrAuthor, setAttrAuthor] = useState('');
  const [attrTitle, setAttrTitle] = useState('');
  const [attrSource, setAttrSource] = useState('');
  const [attrLicense, setAttrLicense] = useState('cc-by');
  const [generatedAttribution, setGeneratedAttribution] = useState('');

  const checkCopyright = async () => {
    if (!content || content.length < 50) return;
    
    setChecking(true);
    try {
      const response = await fetch('/api/copyright/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });
      
      const data = await response.json();
      if (data.success) {
        setCheckResult(data.result);
      }
    } catch (error) {
      console.error('Copyright check failed:', error);
    }
    setChecking(false);
  };

  const generateAttribution = () => {
    const license = LICENSE_TYPES.find(l => l.id === attrLicense);
    if (!license) return;

    let attribution = '';
    
    if (attrTitle) {
      attribution += `"${attrTitle}"`;
    }
    
    if (attrAuthor) {
      attribution += attribution ? ` by ${attrAuthor}` : attrAuthor;
    }
    
    if (attrSource) {
      attribution += ` — Source: ${attrSource}`;
    }
    
    if (license.id !== 'all-rights') {
      attribution += ` — Licensed under ${license.name}`;
      if (license.id.startsWith('cc-')) {
        attribution += ` (https://creativecommons.org/licenses/${license.id.replace('cc-', '')}/4.0/)`;
      }
    } else {
      attribution += ` — © All Rights Reserved. Used with permission.`;
    }

    setGeneratedAttribution(attribution);
    if (onAttributionGenerated) {
      onAttributionGenerated(attribution);
    }
  };

  const selectedLicenseDetails = LICENSE_TYPES.find(l => l.id === selectedLicense);

  return (
    <div className="backdrop-blur-2xl bg-blue-500/10 rounded-2xl border border-blue-500/30 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
          ⚖️ Copyright Tools
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('check')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'check'
              ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          🔍 Check Content
        </button>
        <button
          onClick={() => setActiveTab('license')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'license'
              ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          📜 License Guide
        </button>
        <button
          onClick={() => setActiveTab('attribution')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'attribution'
              ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          ✏️ Attribution Generator
        </button>
      </div>

      {/* Check Content Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'check' && (
          <motion.div
            key="check"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-xs text-white/50 mb-3">
              Analyze your content for potential copyright concerns and get suggestions.
            </p>
            
            <button
              onClick={checkCopyright}
              disabled={checking || content.length < 50}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 mb-4"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : '🔍 Check for Copyright Issues'}
            </button>

            {checkResult && (
              <div className={`p-3 rounded-xl border ${
                checkResult.status === 'safe' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : checkResult.status === 'warning'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {checkResult.status === 'safe' ? '✅' : checkResult.status === 'warning' ? '⚠️' : '🔶'}
                  </span>
                  <span className={`font-medium text-sm ${
                    checkResult.status === 'safe' ? 'text-green-300' : 
                    checkResult.status === 'warning' ? 'text-red-300' : 'text-amber-300'
                  }`}>
                    {checkResult.status === 'safe' ? 'Content Appears Safe' : 
                     checkResult.status === 'warning' ? 'Potential Issues Found' : 'Review Recommended'}
                  </span>
                </div>
                
                {checkResult.issues.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-white/40 mb-1">Issues:</p>
                    <ul className="text-xs text-white/70 space-y-1">
                      {checkResult.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-400">•</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {checkResult.suggestions.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/40 mb-1">Suggestions:</p>
                    <ul className="text-xs text-white/70 space-y-1">
                      {checkResult.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-400">💡</span> {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* AI Content Disclaimer */}
            <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs text-purple-300 font-medium mb-1">🤖 AI-Generated Content Notice</p>
              <p className="text-[10px] text-white/50">
                Content created with AI assistance may have unique copyright considerations. 
                In most jurisdictions, AI-generated content may have limited or no copyright protection. 
                Always review AI outputs for potential issues and consider adding human creative input.
              </p>
            </div>
          </motion.div>
        )}

        {/* License Guide Tab */}
        {activeTab === 'license' && (
          <motion.div
            key="license"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-xs text-white/50 mb-3">
              Understand different license types and what they allow.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {LICENSE_TYPES.map(license => (
                <button
                  key={license.id}
                  onClick={() => setSelectedLicense(license.id)}
                  className={`p-2 rounded-lg text-left transition ${
                    selectedLicense === license.id
                      ? 'bg-blue-500/30 border border-blue-400/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-medium text-white/90">{license.shortName}</p>
                  <p className="text-[10px] text-white/50 truncate">{license.description.slice(0, 40)}...</p>
                </button>
              ))}
            </div>

            {selectedLicenseDetails && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <h4 className="font-medium text-white text-sm mb-2">{selectedLicenseDetails.name}</h4>
                <p className="text-xs text-white/60 mb-3">{selectedLicenseDetails.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <p className="text-green-400 font-medium mb-1">✅ Permissions</p>
                    {selectedLicenseDetails.permissions.map((p, i) => (
                      <p key={i} className="text-white/60">{p}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-amber-400 font-medium mb-1">📋 Conditions</p>
                    {selectedLicenseDetails.conditions.length > 0 ? (
                      selectedLicenseDetails.conditions.map((c, i) => (
                        <p key={i} className="text-white/60">{c}</p>
                      ))
                    ) : (
                      <p className="text-white/40">None</p>
                    )}
                  </div>
                  <div>
                    <p className="text-red-400 font-medium mb-1">🚫 Limitations</p>
                    {selectedLicenseDetails.limitations.map((l, i) => (
                      <p key={i} className="text-white/60">{l}</p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                  <span className={`text-[10px] ${selectedLicenseDetails.commercialUse ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedLicenseDetails.commercialUse ? '✅' : '❌'} Commercial Use
                  </span>
                  <span className={`text-[10px] ${selectedLicenseDetails.modifications ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedLicenseDetails.modifications ? '✅' : '❌'} Modifications
                  </span>
                  <span className={`text-[10px] ${selectedLicenseDetails.attributionRequired ? 'text-amber-400' : 'text-green-400'}`}>
                    {selectedLicenseDetails.attributionRequired ? '⚠️' : '✅'} Attribution {selectedLicenseDetails.attributionRequired ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Attribution Generator Tab */}
        {activeTab === 'attribution' && (
          <motion.div
            key="attribution"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-xs text-white/50 mb-3">
              Generate proper attribution for content you're using.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">Work Title</label>
                <input
                  type="text"
                  value={attrTitle}
                  onChange={(e) => setAttrTitle(e.target.value)}
                  placeholder="Title of the work"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">Author/Creator</label>
                <input
                  type="text"
                  value={attrAuthor}
                  onChange={(e) => setAttrAuthor(e.target.value)}
                  placeholder="Creator's name"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">Source URL</label>
                <input
                  type="text"
                  value={attrSource}
                  onChange={(e) => setAttrSource(e.target.value)}
                  placeholder="https://example.com/source"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 mb-1 block">License Type</label>
                <select
                  value={attrLicense}
                  onChange={(e) => setAttrLicense(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  {LICENSE_TYPES.map(license => (
                    <option key={license.id} value={license.id}>{license.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateAttribution}
                disabled={!attrTitle && !attrAuthor}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                Generate Attribution
              </button>

              {generatedAttribution && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/40 mb-1">Generated Attribution:</p>
                  <p className="text-xs text-white/80 italic">{generatedAttribution}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAttribution);
                    }}
                    className="mt-2 px-3 py-1 rounded bg-white/10 text-white/60 text-[10px] hover:bg-white/20 transition"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
