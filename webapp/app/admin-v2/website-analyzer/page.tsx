'use client';

/**
 * AI Website Builder - Premium Feature v2
 * 
 * Features:
 * - Multi-section workflow (Header, Body, Footer - minimum 3 sections)
 * - Drag-and-drop grid for organizing sections
 * - "Approve & Build Next Section" button
 * - Preview mode for assembled sections
 * - Connection to Code Studio for live preview
 * - Proper image display with fallbacks
 * - Auto-save with proper restore
 * - data-testid attributes for testing
 * 
 * Uses: Gemini 3 Pro (vision), Claude 4.5 Sonnet (code), Nano Banana Pro (images)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Link from 'next/link';

// Types
type AnalysisMode = 'analyze' | 'scratch';
type VisionModel = 'gemini-3-pro' | 'gemini-2.0-pro' | 'gpt-4o';
type GenerationMode = 'recreate' | 'redesign' | 'landing_page';
type SectionType = 'header' | 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'footer' | 'custom';

interface Section {
  id: string;
  type: SectionType;
  label: string;
  mockupImageUrl?: string;
  mockupImageBase64?: string;
  analysisText?: string;
  status: 'pending' | 'generating' | 'generated' | 'approved';
  order: number;
}

interface Project {
  id: string;
  name: string;
  mode: AnalysisMode;
  sourceImagePreview?: string;
  sections: Section[];
  generatedCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Default section templates
const DEFAULT_SECTIONS: Omit<Section, 'id' | 'order'>[] = [
  { type: 'header', label: 'Header / Navigation', status: 'pending' },
  { type: 'hero', label: 'Hero Section', status: 'pending' },
  { type: 'footer', label: 'Footer', status: 'pending' },
];

const SECTION_OPTIONS: { type: SectionType; label: string }[] = [
  { type: 'header', label: 'Header / Navigation' },
  { type: 'hero', label: 'Hero Section' },
  { type: 'features', label: 'Features Grid' },
  { type: 'testimonials', label: 'Testimonials' },
  { type: 'pricing', label: 'Pricing Table' },
  { type: 'cta', label: 'Call to Action' },
  { type: 'footer', label: 'Footer' },
  { type: 'custom', label: 'Custom Section' },
];

export default function WebsiteAnalyzerPage() {
  // Mode & input states
  const [mode, setMode] = useState<AnalysisMode>('analyze');
  const [inputMethod, setInputMethod] = useState<'upload' | 'url'>('upload');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [capturingUrl, setCapturingUrl] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [visionModel, setVisionModel] = useState<VisionModel>('gemini-3-pro');
  const [analysisType, setAnalysisType] = useState<'full' | 'hero' | 'conversion' | 'visual'>('full');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('recreate');
  
  // Scratch mode states
  const [description, setDescription] = useState('');
  const [brandColors, setBrandColors] = useState('');
  const [stylePreference, setStylePreference] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  
  // Project & sections state
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  
  // Workflow states
  const [currentStep, setCurrentStep] = useState<'input' | 'setup-sections' | 'generating' | 'preview' | 'assemble' | 'code'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');
  
  // Preview states
  const [selectedPreviewSection, setSelectedPreviewSection] = useState<Section | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [hasSavedProject, setHasSavedProject] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize default sections
  useEffect(() => {
    if (sections.length === 0) {
      const defaultSections = DEFAULT_SECTIONS.map((s, index) => ({
        ...s,
        id: `section-${Date.now()}-${index}`,
        order: index,
      }));
      setSections(defaultSections);
    }
  }, [sections.length]);

  // Auto-save project to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (project && sections.length > 0) {
      const saveData = {
        project,
        sections,
        imagePreview,
        analysisText,
        currentStep,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('websiteBuilder_project', JSON.stringify(saveData));
    }
  }, [project, sections, imagePreview, analysisText, currentStep]);

  // Restore project from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('websiteBuilder_project');
    if (saved) {
      setHasSavedProject(true);
      try {
        const data = JSON.parse(saved);
        if (data.project) setProject(data.project);
        if (data.sections?.length > 0) setSections(data.sections);
        if (data.imagePreview) setImagePreview(data.imagePreview);
        if (data.analysisText) setAnalysisText(data.analysisText);
        // Don't restore currentStep to avoid confusion
      } catch (e) {
        console.error('Failed to restore project:', e);
      }
    }
  }, []);

  // File upload handler
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

  // URL screenshot capture
  const captureUrlScreenshot = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setCapturingUrl(true);
    setError(null);

    try {
      const response = await fetch('/api/capture-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await response.json();

      if (data.success && data.screenshot) {
        setImageBase64(data.screenshot);
        setImagePreview(`data:image/png;base64,${data.screenshot}`);
      } else {
        setError(data.error || 'Failed to capture screenshot. Try uploading manually.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to capture screenshot');
    }

    setCapturingUrl(false);
  };

  // Clear uploaded image
  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start the workflow - analyze first
  const startAnalysis = async () => {
    if (mode === 'analyze' && !imageBase64) {
      setError('Please upload a screenshot first');
      return;
    }
    
    if (mode === 'scratch' && !description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/design-workflow/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          imageBase64: mode === 'analyze' ? imageBase64 : undefined,
          visionModel: mode === 'analyze' ? visionModel : undefined,
          analysisType: mode === 'analyze' ? analysisType : undefined,
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
        return;
      }

      setAnalysisText(data.analysisText);
      
      // Create project
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: 'New Website Project',
        mode,
        sourceImagePreview: imagePreview || undefined,
        sections: sections,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProject(newProject);
      
      // Move to section setup
      setCurrentStep('setup-sections');
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setLoading(false);
    }
  };

  // Generate mockup for a specific section
  const generateSectionMockup = async (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return;

    // Update section status
    setSections(prev => prev.map((s, i) => 
      i === sectionIndex ? { ...s, status: 'generating' } : s
    ));
    setLoading(true);
    setError(null);

    try {
      // Create a section-specific prompt
      const sectionPrompt = `Generate a ${section.label} section for a website.
      
Analysis context:
${analysisText?.slice(0, 500) || 'Modern professional website'}

Section requirements:
- Type: ${section.type}
- Style: ${stylePreference || 'Modern, professional'}
- Colors: ${brandColors || 'Professional color scheme'}

Generate a high-quality mockup specifically for this ${section.label} section only.`;

      const response = await fetch('/api/design-workflow/generate-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisText: sectionPrompt,
          mode: generationMode,
          pageType: section.type,
          aspectRatio: section.type === 'header' || section.type === 'footer' ? '21:9' : '16:9',
          resolution: '2K',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Mockup generation failed');
        setSections(prev => prev.map((s, i) => 
          i === sectionIndex ? { ...s, status: 'pending' } : s
        ));
        setLoading(false);
        return;
      }

      // Update section with mockup
      setSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { 
          ...s, 
          mockupImageUrl: data.mockupImageUrl,
          analysisText: analysisText,
          status: 'generated' 
        } : s
      ));

      setCurrentStep('preview');
      setCurrentSectionIndex(sectionIndex);
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Generation failed');
      setSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, status: 'pending' } : s
      ));
      setLoading(false);
    }
  };

  // Approve current section and move to next
  const approveAndNext = () => {
    // Mark current section as approved
    setSections(prev => prev.map((s, i) => 
      i === currentSectionIndex ? { ...s, status: 'approved' } : s
    ));

    // Find next pending section
    const nextPending = sections.findIndex((s, i) => i > currentSectionIndex && s.status === 'pending');
    
    if (nextPending !== -1) {
      setCurrentSectionIndex(nextPending);
      setCurrentStep('setup-sections');
    } else {
      // All sections done, go to assembly
      setCurrentStep('assemble');
    }
  };

  // Regenerate current section
  const regenerateSection = () => {
    generateSectionMockup(currentSectionIndex);
  };

  // Add a new section
  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      label: SECTION_OPTIONS.find(o => o.type === type)?.label || 'Custom Section',
      status: 'pending',
      order: sections.length,
    };
    setSections(prev => [...prev, newSection]);
    setShowSectionPicker(false);
  };

  // Remove a section
  const removeSection = (id: string) => {
    if (sections.length <= 3) {
      setError('Minimum 3 sections required');
      return;
    }
    setSections(prev => prev.filter(s => s.id !== id));
  };

  // Reorder sections (for drag and drop)
  const handleReorder = (newOrder: Section[]) => {
    setSections(newOrder.map((s, i) => ({ ...s, order: i })));
  };

  // Generate final code
  const generateFinalCode = async () => {
    const approvedSections = sections.filter(s => s.status === 'approved');
    if (approvedSections.length < 3) {
      setError('Please approve at least 3 sections before generating code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sectionDescriptions = approvedSections.map(s => 
        `${s.label}: ${s.analysisText?.slice(0, 200) || 'Standard section'}`
      ).join('\n\n');

      const response = await fetch('/api/design-workflow/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisText: `Generate a complete landing page with these sections:\n\n${sectionDescriptions}`,
          designSpec: { sections: approvedSections },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Code generation failed');
        setLoading(false);
        return;
      }

      setProject(prev => prev ? { ...prev, generatedCode: data.code } : null);
      setCurrentStep('code');
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Code generation failed');
      setLoading(false);
    }
  };

  // Reset workflow
  const resetWorkflow = () => {
    setCurrentStep('input');
    setProject(null);
    setSections(DEFAULT_SECTIONS.map((s, index) => ({
      ...s,
      id: `section-${Date.now()}-${index}`,
      order: index,
    })));
    setCurrentSectionIndex(0);
    setAnalysisText('');
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('websiteBuilder_project');
    }
  };

  // Clear saved project
  const clearSavedProject = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('websiteBuilder_project');
    }
    resetWorkflow();
  };

  // Open in Code Studio
  const openInCodeStudio = () => {
    if (project?.generatedCode && typeof window !== 'undefined') {
      // Save code to localStorage for Code Studio to pick up
      localStorage.setItem('codeStudio_importCode', project.generatedCode);
      window.open('/admin-v2/code-studio', '_blank');
    }
  };

  // Copy code to clipboard
  const copyCode = () => {
    if (project?.generatedCode) {
      navigator.clipboard.writeText(project.generatedCode);
    }
  };

  // Format analysis text for display
  const formatAnalysis = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/#{1,3}\s*(.*?)(?=\n|$)/g, '<h4 class="font-semibold mt-3 mb-1">$1</h4>');
  };

  // Get progress stats
  const getProgressStats = () => {
    const total = sections.length;
    const approved = sections.filter(s => s.status === 'approved').length;
    const generated = sections.filter(s => s.status === 'generated' || s.status === 'approved').length;
    return { total, approved, generated, progress: Math.round((approved / total) * 100) };
  };

  const stats = getProgressStats();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin-v2" 
                className="text-white/50 hover:text-white transition"
                data-testid="back-to-dashboard"
              >
                ← Back
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎨</span> AI Website Builder
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Premium
                </span>
              </h1>
            </div>
            
            {/* Progress indicator */}
            {currentStep !== 'input' && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-white/60">
                  {stats.approved}/{stats.total} sections approved
                </div>
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
                <button
                  onClick={resetWorkflow}
                  className="text-sm text-white/50 hover:text-white transition"
                  data-testid="reset-workflow-btn"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-between"
              data-testid="error-message"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Input */}
        {currentStep === 'input' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Mode & Input */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit" data-testid="mode-toggle">
                <button
                  onClick={() => setMode('analyze')}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    mode === 'analyze'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="mode-analyze-btn"
                >
                  🔍 Analyze Existing
                </button>
                <button
                  onClick={() => setMode('scratch')}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    mode === 'scratch'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="mode-scratch-btn"
                >
                  ✨ Build From Scratch
                </button>
              </div>

              {/* Analyze Mode */}
              {mode === 'analyze' && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                  {/* Input Method Tabs */}
                  <div className="flex border-b border-white/10" data-testid="input-method-toggle">
                    <button
                      onClick={() => setInputMethod('upload')}
                      className={`px-4 py-2 font-medium transition border-b-2 ${
                        inputMethod === 'upload'
                          ? 'border-cyan-500 text-cyan-400'
                          : 'border-transparent text-white/50 hover:text-white'
                      }`}
                      data-testid="input-upload-btn"
                    >
                      📤 Upload Screenshot
                    </button>
                    <button
                      onClick={() => setInputMethod('url')}
                      className={`px-4 py-2 font-medium transition border-b-2 ${
                        inputMethod === 'url'
                          ? 'border-cyan-500 text-cyan-400'
                          : 'border-transparent text-white/50 hover:text-white'
                      }`}
                      data-testid="input-url-btn"
                    >
                      🔗 Enter URL
                    </button>
                  </div>

                  {/* Upload Method */}
                  {inputMethod === 'upload' && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                        data-testid="file-input"
                      />
                      
                      {imagePreview ? (
                        <div className="relative group">
                          <img
                            src={imagePreview}
                            alt="Uploaded screenshot"
                            className="w-full rounded-xl border border-white/20"
                            data-testid="image-preview"
                          />
                          {/* X button to remove image */}
                          <button
                            onClick={clearImage}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg"
                            data-testid="remove-image-btn"
                          >
                            ✕
                          </button>
                          {/* Hover overlay to change image */}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium rounded-xl"
                            data-testid="change-image-btn"
                          >
                            📷 Click to change image
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full aspect-video border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition"
                          data-testid="upload-area"
                        >
                          <span className="text-4xl">📸</span>
                          <span className="text-white/70">Click to upload a screenshot</span>
                          <span className="text-white/40 text-sm">PNG, JPG, WebP</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* URL Method */}
                  {inputMethod === 'url' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          data-testid="url-input"
                        />
                        <button
                          onClick={captureUrlScreenshot}
                          disabled={capturingUrl || !websiteUrl.trim()}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                          data-testid="capture-url-btn"
                        >
                          {capturingUrl ? (
                            <>
                              <span className="animate-spin">⏳</span> Capturing...
                            </>
                          ) : (
                            <>📷 Capture</>
                          )}
                        </button>
                      </div>
                      
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Captured screenshot"
                          className="w-full rounded-xl border border-white/20"
                          data-testid="captured-preview"
                        />
                      )}
                    </div>
                  )}

                  {/* Vision Model Selector */}
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Vision Model</label>
                    <select
                      value={visionModel}
                      onChange={(e) => setVisionModel(e.target.value as VisionModel)}
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      data-testid="vision-model-select"
                    >
                      <option value="gemini-3-pro">🧠 Gemini 3 Pro (Recommended)</option>
                      <option value="gemini-2.0-pro">🧠 Gemini 2.0 Pro</option>
                      <option value="gpt-4o">🤖 GPT-4o Vision</option>
                    </select>
                  </div>

                  {/* Analysis Type */}
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-3">Analysis Type</label>
                    <div className="grid grid-cols-2 gap-2" data-testid="analysis-type-group">
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
                          data-testid={`analysis-type-${type.value}`}
                        >
                          <div className="text-sm font-medium">{type.label}</div>
                          <div className="text-xs text-white/40">{type.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generation Mode */}
                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-3">Mockup Generation Mode</label>
                    <div className="grid grid-cols-1 gap-2" data-testid="generation-mode-group">
                      {[
                        { value: 'recreate', label: '🔄 Recreate This Page', desc: 'Keep page type, improve design' },
                        { value: 'redesign', label: '✨ Redesign This Page', desc: 'Fresh creative approach' },
                        { value: 'landing_page', label: '🚀 Convert to Landing Page', desc: 'Transform into landing page' },
                      ].map((gm) => (
                        <button
                          key={gm.value}
                          onClick={() => setGenerationMode(gm.value as GenerationMode)}
                          className={`p-3 rounded-xl text-left transition ${
                            generationMode === gm.value
                              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                          data-testid={`generation-mode-${gm.value}`}
                        >
                          <div className="text-sm font-medium">{gm.label}</div>
                          <div className="text-xs text-white/40">{gm.desc}</div>
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
                      placeholder="E.g., A modern HVAC company website with professional design..."
                      className="w-full h-32 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      data-testid="description-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Brand Colors</label>
                    <input
                      value={brandColors}
                      onChange={(e) => setBrandColors(e.target.value)}
                      placeholder="E.g., Green and white"
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      data-testid="brand-colors-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Style Preference</label>
                    <input
                      value={stylePreference}
                      onChange={(e) => setStylePreference(e.target.value)}
                      placeholder="E.g., Modern, minimal, professional"
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      data-testid="style-pref-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 block mb-2">Target Audience</label>
                    <input
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="E.g., Homeowners, small businesses"
                      className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      data-testid="target-audience-input"
                    />
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startAnalysis}
                disabled={loading || (mode === 'analyze' && !imageBase64) || (mode === 'scratch' && !description.trim())}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
                data-testid="start-analysis-btn"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Analyzing...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Start Analysis
                  </>
                )}
              </button>
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">How It Works</h3>
                <div className="space-y-3 text-sm text-white/70">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <div>
                      <p className="font-medium text-white">AI Analysis</p>
                      <p>Vision model analyzes your design</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <div>
                      <p className="font-medium text-white">Section Setup</p>
                      <p>Choose sections: Header, Body, Footer (min 3)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <div>
                      <p className="font-medium text-white">Generate & Approve</p>
                      <p>Generate mockup for each section</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold">4.</span>
                    <div>
                      <p className="font-medium text-white">Assemble & Code</p>
                      <p>Drag to reorder, then generate code</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved Project Notice */}
              {hasSavedProject && currentStep === 'input' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <h3 className="text-sm font-semibold text-amber-300 mb-2">💾 Saved Project Found</h3>
                  <p className="text-xs text-amber-200/70 mb-3">
                    You have an unfinished project. Continue where you left off?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentStep('setup-sections')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                    >
                      Continue
                    </button>
                    <button
                      onClick={clearSavedProject}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10"
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Section Setup */}
        {currentStep === 'setup-sections' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sections List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Setup Sections</h2>
                <button
                  onClick={() => setShowSectionPicker(true)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition flex items-center gap-2"
                  data-testid="add-section-btn"
                >
                  <span>➕</span> Add Section
                </button>
              </div>

              <p className="text-white/60">
                Minimum 3 sections required. Drag to reorder. Click "Generate" to create a mockup for each section.
              </p>

              {/* Draggable Sections List */}
              <Reorder.Group
                axis="y"
                values={sections}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {sections.map((section, index) => (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={`p-4 rounded-xl border transition cursor-grab active:cursor-grabbing ${
                      section.status === 'approved'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : section.status === 'generated'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : section.status === 'generating'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                    data-testid={`section-item-${section.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-white/30 cursor-grab">⋮⋮</span>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {section.label}
                            {section.status === 'approved' && <span className="text-emerald-400">✓</span>}
                            {section.status === 'generated' && <span className="text-blue-400">◉</span>}
                            {section.status === 'generating' && <span className="animate-spin">⏳</span>}
                          </div>
                          <div className="text-xs text-white/40">
                            {section.status === 'approved' && 'Approved'}
                            {section.status === 'generated' && 'Ready for review'}
                            {section.status === 'generating' && 'Generating...'}
                            {section.status === 'pending' && 'Not started'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {section.status === 'pending' && (
                          <button
                            onClick={() => generateSectionMockup(index)}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                            data-testid={`generate-section-${index}-btn`}
                          >
                            Generate
                          </button>
                        )}
                        {section.status === 'generated' && (
                          <button
                            onClick={() => {
                              setCurrentSectionIndex(index);
                              setCurrentStep('preview');
                            }}
                            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30"
                            data-testid={`review-section-${index}-btn`}
                          >
                            Review
                          </button>
                        )}
                        {sections.length > 3 && section.status === 'pending' && (
                          <button
                            onClick={() => removeSection(section.id)}
                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10"
                            data-testid={`remove-section-${index}-btn`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail preview if generated */}
                    {section.mockupImageUrl && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <img
                          src={section.mockupImageUrl}
                          alt={section.label}
                          className="h-20 w-auto rounded-lg object-cover"
                          onError={(e) => {
                            // Fallback for broken images
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {/* Generate All / Assemble Button */}
              {stats.approved >= 3 && (
                <button
                  onClick={() => setCurrentStep('assemble')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-3"
                  data-testid="go-to-assemble-btn"
                >
                  <span>🧩</span> Assemble & Preview ({stats.approved} sections ready)
                </button>
              )}
            </div>

            {/* Analysis Preview */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">📊 AI Analysis</h3>
                <div 
                  className="prose prose-invert prose-sm max-w-none text-white/70 max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: formatAnalysis(analysisText) }}
                />
              </div>

              {imagePreview && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-2">Source Image</h3>
                  <img src={imagePreview} alt="Source" className="w-full rounded-lg" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Preview Section */}
        {currentStep === 'preview' && sections[currentSectionIndex] && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Mockup Preview */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🎨</span> {sections[currentSectionIndex].label} Mockup
              </h3>
              
              {sections[currentSectionIndex].mockupImageUrl ? (
                <div className="relative">
                  <img
                    src={sections[currentSectionIndex].mockupImageUrl}
                    alt="Section Mockup"
                    className="w-full rounded-xl shadow-2xl border border-white/20"
                    data-testid="mockup-preview-image"
                    onError={(e) => {
                      // Show placeholder on error
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="%23333"><rect width="800" height="450"/><text x="400" y="225" text-anchor="middle" fill="%23666" font-size="24">Image loading error</text></svg>';
                    }}
                  />
                  <button
                    onClick={() => setShowFullPreview(true)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition"
                    data-testid="fullscreen-preview-btn"
                  >
                    🔍 Expand
                  </button>
                </div>
              ) : (
                <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
                  <p className="text-white/50">Generating mockup...</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Review & Approve</h3>
                <p className="text-white/60 text-sm mb-6">
                  Does this mockup look good? Approve it to add to your assembly grid, or regenerate for a different result.
                </p>
                
                <div className="space-y-3">
                  {/* Approve & Next */}
                  <button
                    onClick={approveAndNext}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                    data-testid="approve-next-btn"
                  >
                    <span>✅</span> Approve & Build Next Section
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={regenerateSection}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="regenerate-btn"
                  >
                    <span>🔄</span> Regenerate This Section
                  </button>

                  {/* Back to sections */}
                  <button
                    onClick={() => setCurrentStep('setup-sections')}
                    className="w-full py-3 rounded-xl text-white/50 hover:text-white transition"
                    data-testid="back-to-sections-btn"
                  >
                    ← Back to Sections
                  </button>
                </div>
              </div>

              {/* Section info */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-sm">
                  <span className="text-cyan-300 font-medium">Section {currentSectionIndex + 1}</span>
                  <span className="text-white/50"> of {sections.length}</span>
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {stats.approved} approved, {sections.length - stats.approved - 1} remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Assembly */}
        {currentStep === 'assemble' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Assembly Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Assemble Your Page</h2>
                <button
                  onClick={() => setCurrentStep('setup-sections')}
                  className="text-white/50 hover:text-white transition"
                >
                  ← Back to Sections
                </button>
              </div>

              <p className="text-white/60">
                Drag sections to reorder them. Click Preview to see the full page, or Generate Code when ready.
              </p>

              {/* Draggable Assembly Grid */}
              <Reorder.Group
                axis="y"
                values={sections.filter(s => s.status === 'approved')}
                onReorder={(newOrder) => {
                  // Update the order while preserving non-approved sections
                  const nonApproved = sections.filter(s => s.status !== 'approved');
                  setSections([...newOrder, ...nonApproved]);
                }}
                className="space-y-4"
              >
                {sections.filter(s => s.status === 'approved').map((section, index) => (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 cursor-grab active:cursor-grabbing"
                    data-testid={`assembly-section-${index}`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-white/30 cursor-grab mt-2">⋮⋮</span>
                      
                      {section.mockupImageUrl && (
                        <img
                          src={section.mockupImageUrl}
                          alt={section.label}
                          className="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium">{section.label}</div>
                        <div className="text-xs text-white/40">Order: {index + 1}</div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedPreviewSection(section);
                          setShowFullPreview(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20"
                      >
                        🔍 View
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {/* Generate Code Button */}
              <button
                onClick={generateFinalCode}
                disabled={loading || stats.approved < 3}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
                data-testid="generate-code-btn"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Generating Code...
                  </>
                ) : (
                  <>
                    <span>💻</span> Generate Code ({stats.approved} sections)
                  </>
                )}
              </button>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Page Preview</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sections.filter(s => s.status === 'approved').map((section) => (
                    section.mockupImageUrl && (
                      <img
                        key={section.id}
                        src={section.mockupImageUrl}
                        alt={section.label}
                        className="w-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Code */}
        {currentStep === 'code' && project?.generatedCode && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Generated Code</h2>
              <div className="flex gap-3">
                <button
                  onClick={copyCode}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition flex items-center gap-2"
                  data-testid="copy-code-btn"
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={openInCodeStudio}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition flex items-center gap-2"
                  data-testid="open-code-studio-btn"
                >
                  🎯 Open in Code Studio
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/10">
              <pre className="text-sm text-white/80 overflow-x-auto max-h-[600px] overflow-y-auto">
                <code>{project.generatedCode}</code>
              </pre>
            </div>

            <button
              onClick={resetWorkflow}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition"
              data-testid="start-new-project-btn"
            >
              ← Start New Project
            </button>
          </div>
        )}

        {/* Section Picker Modal */}
        <AnimatePresence>
          {showSectionPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
              onClick={() => setShowSectionPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Add Section</h3>
                <div className="grid grid-cols-2 gap-3">
                  {SECTION_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => addSection(option.type)}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-cyan-500/50 transition"
                      data-testid={`add-section-${option.type}`}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowSectionPicker(false)}
                  className="mt-4 w-full py-2 text-white/50 hover:text-white transition"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen Preview Modal */}
        <AnimatePresence>
          {showFullPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8"
              onClick={() => setShowFullPreview(false)}
            >
              <button
                onClick={() => setShowFullPreview(false)}
                className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
              >
                ✕ Close
              </button>
              
              {selectedPreviewSection?.mockupImageUrl ? (
                <img
                  src={selectedPreviewSection.mockupImageUrl}
                  alt="Full Preview"
                  className="max-w-full max-h-full rounded-xl shadow-2xl"
                />
              ) : sections[currentSectionIndex]?.mockupImageUrl ? (
                <img
                  src={sections[currentSectionIndex].mockupImageUrl}
                  alt="Full Preview"
                  className="max-w-full max-h-full rounded-xl shadow-2xl"
                />
              ) : (
                <div className="text-white/50">No image to preview</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
