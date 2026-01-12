'use client';

/**
 * AI Website Builder - Premium Feature
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
  const [inputMethod, setInputMethod] = useState<'upload' | 'url'>('upload');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [capturingUrl, setCapturingUrl] = useState(false);
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

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const startWorkflow = async () => {
    // Validate inputs based on mode
    if (mode === 'analyze' && !imageBase64) {
      setError('Please upload a screenshot first');
      return;
    }
    
    if (mode === 'scratch' && !description.trim()) {
      setError('Please provide a description of the website you want to build');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep('analyzing');

    try {
      // Step 1: Analyze or Generate Design Spec
      const response = await fetch('/api/design-workflow/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          // Analyze mode data
          imageBase64: mode === 'analyze' ? imageBase64 : undefined,
          visionModel: mode === 'analyze' ? visionModel : undefined,
          analysisType: mode === 'analyze' ? analysisType : undefined,
          // Scratch mode data
          description: mode === 'scratch' ? description : undefined,
          brandColors: mode === 'scratch' ? brandColors : undefined,
          stylePreference: mode === 'scratch' ? stylePreference : undefined,
          targetAudience: mode === 'scratch' ? targetAudience : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed');
        setLoading(false);
        setCurrentStep('input');
        return;
      }

      // Step 2: Generate Mockup with Nano Banana Pro
      setCurrentStep('generating');
      
      const mockupResponse = await fetch('/api/design-workflow/generate-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designSpec: data.designSpec,
          analysisText: data.analysisText,
        }),
      });

      const mockupData = await mockupResponse.json();

      if (!mockupData.success) {
        setError(mockupData.error || 'Mockup generation failed');
        setLoading(false);
        setCurrentStep('input');
        return;
      }

      // Create proposal object
      const newProposal: DesignProposal = {
        id: Date.now().toString(),
        mode,
        visionModel: mode === 'analyze' ? visionModel : undefined,
        analysisText: data.analysisText,
        designSpec: data.designSpec,
        mockupImageUrl: mockupData.mockupImageUrl,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      setProposal(newProposal);
      setCurrentStep('preview');
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Workflow failed');
      setLoading(false);
      setCurrentStep('input');
    }
  };

  const generateCode = async () => {
    if (!proposal) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/design-workflow/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designSpec: proposal.designSpec,
          analysisText: proposal.analysisText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProposal({
          ...proposal,
          generatedCode: data.code,
        });
        setCurrentStep('code');
      } else {
        setError(data.error || 'Code generation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Code generation failed');
    }

    setLoading(false);
  };

  const resetWorkflow = () => {
    setCurrentStep('input');
    setProposal(null);
    setImagePreview(null);
    setImageBase64(null);
    setDescription('');
    setBrandColors('');
    setStylePreference('');
    setTargetAudience('');
    setError(null);
  };

  const formatAnalysis = (text: string) => {
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
                  <span className="text-2xl">🎨</span>
                  AI Website Builder
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                    Premium
                  </span>
                </h1>
                <p className="text-sm text-white/50">Claude Opus 4.5 • Gemini 3 Pro • Nano Banana Pro</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selection */}
        {currentStep === 'input' && (
          <div className="mb-8">
            <div className="flex gap-3 p-1.5 rounded-xl bg-white/5 border border-white/10 max-w-md">
              <button
                onClick={() => setMode('analyze')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  mode === 'analyze'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                📸 Analyze Existing
              </button>
              <button
                onClick={() => setMode('scratch')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  mode === 'scratch'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                ✨ Build From Scratch
              </button>
            </div>
          </div>
        )}

        {/* Input Section */}
        {currentStep === 'input' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Analyze Mode */}
              {mode === 'analyze' && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>📸</span> Upload Screenshot
                  </h2>
                  
                  {/* File Upload */}
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
                        <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
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

                  {/* Vision Model Selection */}
                  <div className="mt-6">
                    <label className="text-sm font-medium text-white/70 block mb-3">Vision Model (Test All 3)</label>
                    <select
                      value={visionModel}
                      onChange={(e) => setVisionModel(e.target.value as VisionModel)}
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="gemini-3-pro">🔮 Gemini 3 Pro (Recommended)</option>
                      <option value="gemini-2.0-pro">🔮 Gemini 2.0 Pro</option>
                      <option value="gpt-4o">🤖 GPT-4o Vision</option>
                    </select>
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
                </div>
              )}

              {/* Scratch Mode */}
              {mode === 'scratch' && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span>✨</span> Describe Your Website
                  </h2>
                  
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Website Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="E.g., A professional law firm website with modern design, focusing on personal injury cases..."
                      className="w-full h-32 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Brand Colors</label>
                    <input
                      value={brandColors}
                      onChange={(e) => setBrandColors(e.target.value)}
                      placeholder="E.g., Green and white for GreenLine365"
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Style Preference</label>
                    <input
                      value={stylePreference}
                      onChange={(e) => setStylePreference(e.target.value)}
                      placeholder="E.g., Modern, minimal, corporate, playful"
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Target Audience</label>
                    <input
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="E.g., Small business owners, professionals"
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Start Button */}
              <button
                onClick={startWorkflow}
                disabled={loading || (mode === 'analyze' && !imageBase64) || (mode === 'scratch' && !description.trim())}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <span>🚀</span>
                {mode === 'analyze' ? 'Analyze & Build Mockup' : 'Generate Design & Mockup'}
              </button>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">How It Works</h3>
                <div className="space-y-3 text-sm text-white/70">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <div>
                      <p className="font-medium text-white">AI Analysis</p>
                      <p>Vision model analyzes design & UX</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <div>
                      <p className="font-medium text-white">Mockup Generation</p>
                      <p>Nano Banana Pro creates visual preview</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <div>
                      <p className="font-medium text-white">Human Approval</p>
                      <p>Review & approve the design</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">4.</span>
                    <div>
                      <p className="font-medium text-white">Code Generation</p>
                      <p>Claude Opus 4.5 generates React code</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h3 className="text-sm font-semibold text-amber-300 mb-2">💡 Test All 3 Vision Models</h3>
                <p className="text-xs text-amber-200/70">
                  Run the same screenshot through all 3 vision models to compare results. You'll see which one gives the best analysis for your needs!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {currentStep === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto p-12 rounded-2xl bg-white/5 border border-white/10 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Analyzing Your Design...</h3>
            <p className="text-white/50 text-lg mb-6">
              {mode === 'analyze' 
                ? `${visionModel === 'gemini-3-pro' ? 'Gemini 3 Pro' : visionModel === 'gemini-2.0-pro' ? 'Gemini 2.0 Pro' : 'GPT-4o'} is evaluating your website` 
                : 'Claude Opus 4.5 is crafting your design specification'}
            </p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        )}

        {/* Generating Mockup State */}
        {currentStep === 'generating' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto p-12 rounded-2xl bg-white/5 border border-white/10 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Creating Your Mockup...</h3>
            <p className="text-white/50 text-lg mb-6">Nano Banana Pro is generating a visual preview of your design</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-white/30 mt-8">This may take 30-60 seconds</p>
          </motion.div>
        )}

        {/* Preview & Approval State */}
        {currentStep === 'preview' && proposal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Review Your Design</h2>
              <button
                onClick={resetWorkflow}
                className="text-white/50 hover:text-white transition text-sm"
              >
                ← Start Over
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Mockup Preview */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>🎨</span> Generated Mockup
                </h3>
                {proposal.mockupImageUrl ? (
                  <img
                    src={proposal.mockupImageUrl}
                    alt="Generated Mockup"
                    className="w-full rounded-lg shadow-2xl border border-white/10"
                  />
                ) : (
                  <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                    <p className="text-white/50">Mockup loading...</p>
                  </div>
                )}
              </div>

              {/* Analysis & Actions */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                    <span>📊</span> AI Analysis
                  </h3>
                  <div 
                    className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formatAnalysis(proposal.analysisText) }}
                  />
                </div>

                {/* Approval Actions */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4">👤 Human Approval</h3>
                  <p className="text-white/60 text-sm mb-6">
                    Review the mockup above. If you approve, we'll generate production-ready React/Tailwind code.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={generateCode}
                      disabled={loading}
                      className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>✅</span>
                      Approve & Generate Code
                    </button>
                    <button
                      onClick={resetWorkflow}
                      className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition"
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Code Generation & Review State */}
        {currentStep === 'code' && proposal && proposal.generatedCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Generated Code</h2>
              <button
                onClick={resetWorkflow}
                className="text-white/50 hover:text-white transition text-sm"
              >
                ← Start Over
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>💻</span> React/Tailwind Code
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(proposal.generatedCode!)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Code
                </button>
              </div>
              <pre className="bg-black/50 rounded-xl p-6 overflow-x-auto max-h-96 text-sm">
                <code className="text-emerald-400">{proposal.generatedCode}</code>
              </pre>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <h3 className="text-lg font-semibold text-emerald-300 mb-3">✅ Success!</h3>
              <p className="text-white/70 text-sm mb-4">
                Your design has been generated. You can now copy the code and implement it on your website. This tool built the design you're looking at!
              </p>
              <button
                onClick={resetWorkflow}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition"
              >
                Create Another Design
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
