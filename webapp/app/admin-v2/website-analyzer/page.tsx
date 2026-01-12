'use client';

/**
 * Website Analyzer & Builder - Premium Feature
 * Two Modes:
 * 1. Analyze Existing: Screenshot → AI Analysis → Mockup → Code
 * 2. Build From Scratch: Description → Design → Mockup → Code
 * 
 * Uses best-in-class models: Claude Opus 4.5, Gemini 3 Pro Vision, Nano Banana Pro
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type AnalysisMode = 'analyze' | 'scratch';
type VisionModel = 'gemini-3-pro' | 'gemini-2.0-pro' | 'gpt-4o';

interface DesignProposal {
  id: string;
  mode: AnalysisMode;
  visionModel?: VisionModel;
  analysisText: string;
  designSpec: any;
  mockupImageUrl?: string;
  generatedCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export default function WebsiteAnalyzerPage() {
  // Mode selection
  const [mode, setMode] = useState<AnalysisMode>('analyze');
  
  // Analyze mode states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [visionModel, setVisionModel] = useState<VisionModel>('gemini-3-pro');
  const [analysisType, setAnalysisType] = useState<'full' | 'hero' | 'conversion' | 'visual'>('full');
  
  // Scratch mode states
  const [description, setDescription] = useState('');
  const [brandColors, setBrandColors] = useState('');
  const [stylePreference, setStylePreference] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  
  // Workflow states
  const [currentStep, setCurrentStep] = useState<'input' | 'analyzing' | 'generating' | 'preview' | 'code'>('input');
  const [proposal, setProposal] = useState<DesignProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Create preview and base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64 from data URL
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeWebsite = async () => {
    if (!imageBase64) {
      setError('Please upload a screenshot first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          analysisType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze website');
    }

    setLoading(false);
  };

  const formatAnalysis = (text: string) => {
    // Convert markdown-like formatting to styled HTML
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/^- /gm, '• ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">🔬</span>
                  Website Analyzer
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                    Premium
                  </span>
                </h1>
                <p className="text-sm text-white/50">GPT-5.2 Vision + Gemini Flash Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Restricted Access
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📸</span> Upload Screenshot
              </h2>
              
              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  imagePreview 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <p className="text-sm text-emerald-400">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white/70">Drop a screenshot here or click to browse</p>
                    <p className="text-xs text-white/40">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Analysis Type */}
              <div className="mt-6">
                <label className="text-sm font-medium text-white/70 block mb-3">Analysis Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'full', label: '🔍 Full Analysis', desc: 'Complete breakdown' },
                    { value: 'hero', label: '🎯 Hero Section', desc: 'Above the fold' },
                    { value: 'conversion', label: '📈 Conversion', desc: 'CTAs & friction' },
                    { value: 'visual', label: '🎨 Visual Design', desc: 'Colors & layout' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAnalysisType(type.value as any)}
                      className={`p-3 rounded-xl text-left transition ${
                        analysisType === type.value
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium">{type.label}</div>
                      <div className="text-xs text-white/40">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze Button */}
              <button
                onClick={analyzeWebsite}
                disabled={!imageBase64 || loading}
                className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <span>🔬</span>
                    Analyze Website
                  </>
                )}
              </button>

              <p className="text-xs text-white/30 text-center mt-3">
                Analysis typically takes 15-30 seconds
              </p>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">💡 Tips for Best Results</h3>
              <ul className="text-xs text-amber-200/70 space-y-1">
                <li>• Capture the full page or specific section you want analyzed</li>
                <li>• Use actual device screenshots for accurate mobile analysis</li>
                <li>• Run multiple analysis types for comprehensive insights</li>
                <li>• Compare before/after implementing changes</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {loading && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analyzing Your Website...</h3>
                  <p className="text-white/50 text-sm">
                    GPT-5.2 is evaluating design, UX, and conversion potential
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* GPT Analysis */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                        <span>🤖</span> GPT-5.2 Analysis
                      </h3>
                      <span className="text-xs text-cyan-300/50">Vision + UX Expert</span>
                    </div>
                    <div 
                      className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatAnalysis(result.gpt52Analysis) }}
                    />
                  </div>

                  {/* Gemini Creative Suggestions */}
                  {result.geminiCreativeSuggestions && (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                          <span>✨</span> Gemini Creative Ideas
                        </h3>
                        <span className="text-xs text-purple-300/50">Unconventional Suggestions</span>
                      </div>
                      <div 
                        className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatAnalysis(result.geminiCreativeSuggestions) }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const text = `GPT Analysis:\n${result.gpt52Analysis}\n\nGemini Suggestions:\n${result.geminiCreativeSuggestions}`;
                        navigator.clipboard.writeText(text);
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Report
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition"
                    >
                      Run Another Analysis
                    </button>
                  </div>

                  <p className="text-xs text-white/30 text-center">
                    Analyzed at {new Date(result.timestamp).toLocaleString()}
                  </p>
                </motion.div>
              )}

              {!loading && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center"
                >
                  <div className="text-5xl mb-4">🔬</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Ready to Analyze</h3>
                  <p className="text-white/50 text-sm max-w-sm mx-auto">
                    Upload a screenshot of any website or landing page to get AI-powered redesign recommendations
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
