'use client';

/**
 * Blog Auto-Polish - MVP
 * GreenLine365 Admin
 * 
 * Features:
 * - Create and edit blog posts
 * - SEO analysis and scoring
 * - AI-powered content enhancement
 * - Image upload and management
 * - Schedule or publish directly
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SEOFeedback {
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
}

interface SEOAnalysis {
  score: number;
  details: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    titleLength: number;
    titleWords: number;
    headingCount: number;
    readabilityScore: number;
    readTime: number;
    topKeywords: string[];
  };
  feedback: SEOFeedback[];
}

interface BlogPost {
  id?: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  featured_image?: string;
  images: string[];
  status: 'draft' | 'scheduled' | 'published';
  scheduled_for?: string;
  seo_score?: number;
}

const CATEGORIES = [
  'Business Growth',
  'Marketing Automation',
  'Local Business Tips',
  'AI & Technology',
  'Industry Insights',
];

export default function BlogPolishPage() {
  // Form state
  const [post, setPost] = useState<BlogPost>({
    title: '',
    content: '',
    category: '',
    tags: [],
    images: [],
    status: 'draft',
  });
  const [tagInput, setTagInput] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // AI Enhancement state
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    headlines?: string[];
    tags?: string[];
    meta?: { description: string; keywords: string[] };
    outline?: string;
    enhanced?: string;
  }>({});

  // Image Generation state
  interface ImageSuggestion {
    id: string;
    placement: 'header' | 'inline' | 'section-break';
    context: string;
    prompt: string;
    position: number;
    sectionTitle?: string;
    generatedImages?: { id: string; data: string; mime_type: string }[];
    selectedImage?: string;
    generating?: boolean;
  }
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'magazine' | 'minimal' | 'cards'>('classic');

  // Page Styling state
  interface PageStyleGuide {
    themeName: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      backgroundGradient?: string;
      text: string;
      textMuted: string;
      headings: string;
      links: string;
    };
    texture: {
      type: 'none' | 'grain' | 'dots' | 'lines' | 'geometric' | 'organic';
      opacity: number;
      description: string;
    };
    typography: {
      headingStyle: string;
      headingSize: string;
      bodyLineHeight: string;
      emphasis: string;
    };
    layout: {
      contentWidth: string;
      imageStyle: string;
      spacing: string;
      headerStyle: string;
    };
    mood: string;
  }
  const [pageStyle, setPageStyle] = useState<PageStyleGuide | null>(null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [styleApplied, setStyleApplied] = useState(false);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [styleVariation, setStyleVariation] = useState(0); // Track regeneration count for variation

  // Mood variations for regeneration
  const moodVariations = [
    'professional and trustworthy',
    'creative and inspiring', 
    'bold and energetic',
    'calm and sophisticated',
    'warm and friendly',
    'modern and minimalist',
    'luxurious and premium',
    'playful and fun'
  ];

  // Texture pattern generator
  const getTexturePattern = (type: string): string => {
    switch (type) {
      case 'grain':
        return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;
      case 'dots':
        return `radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)`;
      case 'lines':
        return `repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(0,0,0,0.05) 9px, rgba(0,0,0,0.05) 10px)`;
      case 'geometric':
        return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
      case 'organic':
        return `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.06' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      default:
        return 'none';
    }
  };

  // Calculate stats
  const wordCount = post.content.split(/\s+/).filter(w => w).length;
  const readTime = Math.ceil(wordCount / 200);

  // Auto-analyze when content changes (debounced)
  useEffect(() => {
    if (post.content.length > 100 && post.title.length > 10) {
      const timer = setTimeout(() => {
        analyzeSEO();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [post.content, post.title]);

  const analyzeSEO = async () => {
    if (!post.content || !post.title) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch('/api/blog/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          title: post.title,
        }),
      });
      
      const data = await response.json();
      setSeoAnalysis(data);
    } catch (error) {
      console.error('SEO analysis error:', error);
    }
    setAnalyzing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setImageFiles(files);
      
      // Create previews
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !post.tags.includes(tagInput.trim())) {
      setPost(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setPost(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const saveDraft = async () => {
    if (!post.title || !post.content) {
      setMessage({ type: 'error', text: 'Please enter a title and content' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          status: 'draft',
          style_guide: styleApplied && pageStyle ? pageStyle : null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Draft saved successfully!' });
        setPost(prev => ({ ...prev, id: data.post.id, slug: data.post.slug }));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save draft' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save draft' });
    }
    setSaving(false);
  };

  const publishPost = async (scheduled = false) => {
    if (!post.title || !post.content) {
      setMessage({ type: 'error', text: 'Please enter a title and content' });
      return;
    }

    if (!post.category) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }

    setPublishing(true);
    try {
      let scheduledFor = null;
      if (scheduled && scheduleDate && scheduleTime) {
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          status: scheduled ? 'scheduled' : 'published',
          scheduled_for: scheduledFor,
          style_guide: styleApplied && pageStyle ? pageStyle : null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: scheduled ? 'Post scheduled successfully!' : 'Post published successfully!' 
        });
        setShowScheduleModal(false);
        // Reset form or redirect
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to publish' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to publish' });
    }
    setPublishing(false);
  };

  // AI Enhancement functions
  const callAI = async (action: string) => {
    setAiLoading(action);
    try {
      const response = await fetch('/api/blog/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          title: post.title,
          content: post.content,
          category: post.category,
          keywords: post.tags,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        return data.result;
      } else {
        setMessage({ type: 'error', text: data.error || 'AI request failed' });
        return null;
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'AI service unavailable' });
      return null;
    } finally {
      setAiLoading(null);
    }
  };

  const generateOutline = async () => {
    if (!post.title) {
      setMessage({ type: 'error', text: 'Enter a title first to generate an outline' });
      return;
    }
    const result = await callAI('generate_outline');
    if (result) {
      setAiSuggestions(prev => ({ ...prev, outline: result }));
      setShowAiPanel(true);
    }
  };

  const enhanceContent = async () => {
    if (!post.content || post.content.length < 50) {
      setMessage({ type: 'error', text: 'Add more content before enhancing' });
      return;
    }
    const result = await callAI('enhance_content');
    if (result) {
      // Show in panel for review before applying
      setAiSuggestions(prev => ({ ...prev, enhanced: result }));
      setShowAiPanel(true);
    }
  };

  const suggestHeadlines = async () => {
    if (!post.title) {
      setMessage({ type: 'error', text: 'Enter a title first' });
      return;
    }
    const result = await callAI('suggest_headlines');
    if (result && Array.isArray(result)) {
      setAiSuggestions(prev => ({ ...prev, headlines: result }));
      setShowAiPanel(true);
    }
  };

  const suggestTags = async () => {
    const result = await callAI('suggest_tags');
    if (result && Array.isArray(result)) {
      setAiSuggestions(prev => ({ ...prev, tags: result }));
      setShowAiPanel(true);
    }
  };

  const generateMeta = async () => {
    if (!post.title || !post.content) {
      setMessage({ type: 'error', text: 'Title and content required for meta generation' });
      return;
    }
    const result = await callAI('generate_meta');
    if (result) {
      setAiSuggestions(prev => ({ ...prev, meta: result }));
      setShowAiPanel(true);
    }
  };

  const applyOutline = () => {
    if (aiSuggestions.outline) {
      setPost(prev => ({ ...prev, content: aiSuggestions.outline || '' }));
      setAiSuggestions(prev => ({ ...prev, outline: undefined }));
      setMessage({ type: 'success', text: 'Outline applied!' });
    }
  };

  const applyEnhanced = () => {
    if (aiSuggestions.enhanced) {
      setPost(prev => ({ ...prev, content: aiSuggestions.enhanced || '' }));
      setAiSuggestions(prev => ({ ...prev, enhanced: undefined }));
      setMessage({ type: 'success', text: 'Enhanced content applied!' });
    }
  };

  const applyHeadline = (headline: string) => {
    setPost(prev => ({ ...prev, title: headline }));
    setMessage({ type: 'success', text: 'Headline applied!' });
  };

  const applyTag = (tag: string) => {
    if (!post.tags.includes(tag)) {
      setPost(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  // Image Analysis & Generation functions
  const analyzeForImages = async () => {
    if (!post.content || post.content.length < 100) {
      setMessage({ type: 'error', text: 'Add more content before analyzing for images' });
      return;
    }

    setAnalyzingImages(true);
    try {
      const response = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          title: post.title,
          content: post.content,
        }),
      });

      const data = await response.json();
      if (response.ok && data.suggestions) {
        setImageSuggestions(data.suggestions);
        setShowImagePanel(true);
        setMessage({ type: 'success', text: `Found ${data.suggestions.length} image opportunities!` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Analysis failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to analyze content' });
    }
    setAnalyzingImages(false);
  };

  const generateImagesForSuggestion = async (suggestionId: string) => {
    const suggestion = imageSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Mark as generating
    setImageSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, generating: true } : s
    ));

    try {
      const response = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: suggestion.prompt,
          style: 'professional',
          count: 4,
        }),
      });

      const data = await response.json();
      if (response.ok && data.images?.length > 0) {
        setImageSuggestions(prev => prev.map(s => 
          s.id === suggestionId 
            ? { ...s, generatedImages: data.images, generating: false }
            : s
        ));
        setMessage({ type: 'success', text: `Generated ${data.images.length} images!` });
      } else {
        setImageSuggestions(prev => prev.map(s => 
          s.id === suggestionId ? { ...s, generating: false } : s
        ));
        setMessage({ type: 'error', text: data.message || 'Generation failed' });
      }
    } catch (error) {
      setImageSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, generating: false } : s
      ));
      setMessage({ type: 'error', text: 'Failed to generate images' });
    }
  };

  const selectImage = (suggestionId: string, imageId: string) => {
    setImageSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, selectedImage: imageId } : s
    ));
  };

  // Page Style Analysis
  const analyzePageStyle = async (moodHint?: string) => {
    if (!post.content || post.content.length < 100) {
      setMessage({ type: 'error', text: 'Add more content before analyzing style' });
      return;
    }

    setAnalyzingStyle(true);
    try {
      console.log('[Style] Starting style analysis...', { title: post.title, contentLength: post.content.length });
      const response = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-style',
          title: post.title,
          content: post.content,
          category: post.category,
          moodHint: moodHint, // Optional mood variation hint
        }),
      });

      console.log('[Style] Response status:', response.status, response.ok);
      const data = await response.json();
      console.log('[Style] Response data:', data.success, data.styleGuide?.themeName, data.error);
      
      if (response.ok && data.success && data.styleGuide) {
        setPageStyle(data.styleGuide);
        setShowStylePanel(true);
        setStyleApplied(false); // Reset applied state on new style
        setMessage({ type: 'success', text: `Style suggestion: "${data.styleGuide.themeName}"` });
      } else {
        console.error('[Style] Failed:', data.error);
        setMessage({ type: 'error', text: data.error || 'Style analysis failed' });
      }
    } catch (error) {
      console.error('[Style] Exception:', error);
      setMessage({ type: 'error', text: 'Failed to analyze style' });
    }
    setAnalyzingStyle(false);
  };

  // Regenerate with different mood variation
  const regenerateStyle = async () => {
    const nextVariation = (styleVariation + 1) % moodVariations.length;
    setStyleVariation(nextVariation);
    const moodHint = moodVariations[nextVariation];
    setMessage({ type: 'info', text: `Generating ${moodHint} style...` });
    await analyzePageStyle(moodHint);
  };

  // Update individual color in style
  const updateStyleColor = (colorKey: string, newColor: string) => {
    if (!pageStyle) return;
    setPageStyle({
      ...pageStyle,
      colors: {
        ...pageStyle.colors,
        [colorKey]: newColor,
      }
    });
    // Auto-apply if already applied
    if (styleApplied) {
      setMessage({ type: 'success', text: `Updated ${colorKey} color` });
    }
  };

  const applyPageStyle = () => {
    if (pageStyle) {
      setStyleApplied(true);
      setMessage({ type: 'success', text: 'Style applied to preview!' });
    }
  };

  const resetPageStyle = () => {
    setStyleApplied(false);
    setPageStyle(null);
    setShowStylePanel(false);
    setShowColorEditor(false);
    setStyleVariation(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-400';
    if (score >= 60) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2127&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-black/30 border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin-v2"
                className="p-2 rounded-xl backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] hover:bg-white/[0.15] text-white/60 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-light text-white tracking-tight flex items-center gap-2">
                  <span className="text-2xl">✍️</span>
                  Blog Auto-Polish
                </h1>
                <p className="text-sm text-white/40">Create, analyze, and publish your content</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-5 py-2.5 backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] text-white rounded-xl font-medium text-sm hover:bg-white/[0.15] transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-5 py-2.5 backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] text-white rounded-xl font-medium text-sm hover:bg-white/[0.15] transition"
              >
                Schedule
              </button>
              <button
                onClick={() => publishPost(false)}
                disabled={publishing}
                className="px-5 py-2.5 bg-gradient-to-r from-[#84A98C] to-[#52796F] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-[0_0_20px_rgba(132,169,140,0.3)] disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative z-30 mx-6 mt-4 p-4 rounded-xl backdrop-blur-xl flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : message.type === 'info'
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          
          {/* Editor Panel (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <label className="text-white/60 text-sm mb-2 block font-medium">Blog Title</label>
              <input
                type="text"
                value={post.title}
                onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a compelling title..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/30 focus:border-[#84A98C]/50 focus:outline-none transition"
                data-testid="blog-title-input"
              />
              <p className="text-xs text-white/40 mt-2">
                {post.title.length}/60 characters (50-60 optimal for SEO)
              </p>
            </div>

            {/* Tabs + AI Tools */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('write')}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${
                    activeTab === 'write'
                      ? 'bg-[#84A98C]/20 text-[#A7C957] border border-[#84A98C]/30'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  ✍️ Write
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition ${
                    activeTab === 'preview'
                      ? 'bg-[#84A98C]/20 text-[#A7C957] border border-[#84A98C]/30'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  👁️ Preview
                </button>
              </div>

              {/* AI Tools */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 mr-2">AI Tools:</span>
                <button
                  onClick={generateOutline}
                  disabled={aiLoading !== null || !post.title}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                  title="Generate outline from title"
                >
                  {aiLoading === 'generate_outline' ? '⏳' : '📋'} Outline
                </button>
                <button
                  onClick={enhanceContent}
                  disabled={aiLoading !== null || post.content.length < 50}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                  title="Enhance content with AI"
                >
                  {aiLoading === 'enhance_content' ? '⏳' : '✨'} Enhance
                </button>
                <button
                  onClick={suggestHeadlines}
                  disabled={aiLoading !== null || !post.title}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                  title="Get headline suggestions"
                >
                  {aiLoading === 'suggest_headlines' ? '⏳' : '💡'} Headlines
                </button>
                <button
                  onClick={suggestTags}
                  disabled={aiLoading !== null}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                  title="Suggest tags"
                >
                  {aiLoading === 'suggest_tags' ? '⏳' : '🏷️'} Tags
                </button>
                <button
                  onClick={generateMeta}
                  disabled={aiLoading !== null || !post.title || !post.content}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                  title="Generate SEO meta"
                >
                  {aiLoading === 'generate_meta' ? '⏳' : '🔎'} Meta
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                  onClick={analyzeForImages}
                  disabled={analyzingImages || post.content.length < 100}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                  title="Analyze content for image opportunities"
                >
                  {analyzingImages ? '⏳' : '🖼️'} Images
                </button>
                <button
                  onClick={analyzePageStyle}
                  disabled={analyzingStyle || post.content.length < 100}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 disabled:opacity-50"
                  title="Suggest page colors, textures & styling"
                >
                  {analyzingStyle ? '⏳' : '🎨'} Style
                </button>
              </div>
            </div>

            {/* AI Suggestions Panel */}
            <AnimatePresence>
              {showAiPanel && Object.keys(aiSuggestions).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="backdrop-blur-2xl bg-purple-500/10 rounded-2xl border border-purple-500/30 p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                      🤖 AI Suggestions
                    </h3>
                    <button
                      onClick={() => setShowAiPanel(false)}
                      className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Headlines */}
                  {aiSuggestions.headlines && (
                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-2">💡 Headline Options (click to apply)</p>
                      <div className="space-y-2">
                        {aiSuggestions.headlines.map((headline, i) => (
                          <button
                            key={i}
                            onClick={() => applyHeadline(headline)}
                            className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition"
                          >
                            {headline}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {aiSuggestions.tags && (
                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-2">🏷️ Suggested Tags (click to add)</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.tags.map((tag, i) => (
                          <button
                            key={i}
                            onClick={() => applyTag(tag)}
                            disabled={post.tags.includes(tag)}
                            className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/30 transition disabled:opacity-50"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  {aiSuggestions.meta && (
                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-2">🔎 SEO Meta</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-white/70"><span className="text-white/50">Description:</span> {aiSuggestions.meta.description}</p>
                        <p className="text-white/70">
                          <span className="text-white/50">Keywords:</span>{' '}
                          {aiSuggestions.meta.keywords?.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Outline */}
                  {aiSuggestions.outline && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">📋 Generated Outline</p>
                        <button
                          onClick={applyOutline}
                          className="px-3 py-1 rounded-lg bg-purple-500/30 text-purple-200 text-xs hover:bg-purple-500/40 transition"
                        >
                          Apply to Content
                        </button>
                      </div>
                      <pre className="text-xs text-white/70 bg-white/5 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                        {aiSuggestions.outline}
                      </pre>
                    </div>
                  )}

                  {/* Enhanced Content */}
                  {aiSuggestions.enhanced && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">✨ Enhanced Content</p>
                        <button
                          onClick={applyEnhanced}
                          className="px-3 py-1 rounded-lg bg-purple-500/30 text-purple-200 text-xs hover:bg-purple-500/40 transition"
                        >
                          Apply Changes
                        </button>
                      </div>
                      <pre className="text-xs text-white/70 bg-white/5 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                        {aiSuggestions.enhanced}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Suggestions Panel */}
            <AnimatePresence>
              {showImagePanel && imageSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="backdrop-blur-2xl bg-amber-500/10 rounded-2xl border border-amber-500/30 p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      🖼️ Image Suggestions ({imageSuggestions.length})
                    </h3>
                    <div className="flex items-center gap-3">
                      {/* Template Selector */}
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value as any)}
                        className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs"
                      >
                        <option value="classic">Classic Layout</option>
                        <option value="magazine">Magazine Style</option>
                        <option value="minimal">Minimal</option>
                        <option value="cards">Card Grid</option>
                      </select>
                      <button
                        onClick={() => setShowImagePanel(false)}
                        className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Image Suggestions List */}
                  <div className="space-y-4">
                    {imageSuggestions.map((suggestion, idx) => (
                      <div 
                        key={suggestion.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                suggestion.placement === 'header' 
                                  ? 'bg-blue-500/20 text-blue-300' 
                                  : suggestion.placement === 'inline'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-purple-500/20 text-purple-300'
                              }`}>
                                {suggestion.placement === 'header' ? '🎯 Header' : 
                                 suggestion.placement === 'inline' ? '📍 Inline' : '📐 Section Break'}
                              </span>
                              {suggestion.sectionTitle && (
                                <span className="text-xs text-white/40">
                                  After: {suggestion.sectionTitle}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/70 mb-2">{suggestion.context}</p>
                            <p className="text-xs text-white/40 italic">"{suggestion.prompt.slice(0, 100)}..."</p>
                          </div>
                          <button
                            onClick={() => generateImagesForSuggestion(suggestion.id)}
                            disabled={suggestion.generating}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                          >
                            {suggestion.generating ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </span>
                            ) : (
                              '🎨 Generate'
                            )}
                          </button>
                        </div>

                        {/* Generated Images Grid */}
                        {suggestion.generatedImages && suggestion.generatedImages.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-white/50 mb-2">Select an image (click to choose):</p>
                            <div className="grid grid-cols-4 gap-2">
                              {suggestion.generatedImages.map((img) => (
                                <button
                                  key={img.id}
                                  onClick={() => selectImage(suggestion.id, img.id)}
                                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition ${
                                    suggestion.selectedImage === img.id
                                      ? 'border-amber-400 ring-2 ring-amber-400/50'
                                      : 'border-transparent hover:border-white/30'
                                  }`}
                                >
                                  <img 
                                    src={`data:${img.mime_type};base64,${img.data}`}
                                    alt="Generated"
                                    className="w-full h-full object-cover"
                                  />
                                  {suggestion.selectedImage === img.id && (
                                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Selected Images Summary */}
                  {imageSuggestions.some(s => s.selectedImage) && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/50">
                          {imageSuggestions.filter(s => s.selectedImage).length} image(s) selected
                        </p>
                        <button
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-semibold hover:opacity-90 transition"
                        >
                          Apply to Blog Post
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page Style Panel */}
            <AnimatePresence>
              {showStylePanel && pageStyle && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="backdrop-blur-2xl bg-pink-500/10 rounded-2xl border border-pink-500/30 p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-pink-300 flex items-center gap-2">
                        🎨 {pageStyle.themeName}
                      </h3>
                      <p className="text-xs text-white/50 mt-1">{pageStyle.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Regenerate Button */}
                      <button
                        onClick={regenerateStyle}
                        disabled={analyzingStyle}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition disabled:opacity-50 flex items-center gap-1"
                        title={`Try ${moodVariations[(styleVariation + 1) % moodVariations.length]} style`}
                      >
                        {analyzingStyle ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Regenerate
                      </button>
                      {!styleApplied ? (
                        <button
                          onClick={applyPageStyle}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold hover:opacity-90 transition"
                        >
                          Apply Style
                        </button>
                      ) : (
                        <button
                          onClick={resetPageStyle}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs hover:bg-white/20 transition"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => setShowStylePanel(false)}
                        className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Colors with Edit Toggle */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-white/70 flex items-center gap-1">
                          <span>🎨</span> Color Palette
                        </h4>
                        <button
                          onClick={() => setShowColorEditor(!showColorEditor)}
                          className={`px-2 py-0.5 rounded text-[10px] transition ${
                            showColorEditor 
                              ? 'bg-pink-500/30 text-pink-300' 
                              : 'bg-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {showColorEditor ? '✓ Editing' : '✏️ Edit'}
                        </button>
                      </div>
                      
                      {/* Color Swatches */}
                      <div className={`${showColorEditor ? 'space-y-2' : 'flex flex-wrap gap-2'}`}>
                        {Object.entries(pageStyle.colors).map(([name, color]) => (
                          color && !name.includes('Gradient') && (
                            showColorEditor ? (
                              /* Editable Color Row */
                              <div key={name} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition">
                                <label className="relative cursor-pointer">
                                  <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => updateStyleColor(name, e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                                  />
                                  <div 
                                    className="w-8 h-8 rounded-lg border-2 border-white/30 shadow-sm cursor-pointer hover:scale-105 transition"
                                    style={{ backgroundColor: color }}
                                  />
                                </label>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] text-white/70 capitalize block">{name}</span>
                                  <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                                        updateStyleColor(name, val);
                                      }
                                    }}
                                    className="text-[10px] text-white/50 bg-transparent border-none outline-none w-20 font-mono"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                            ) : (
                              /* Simple Color Swatch */
                              <div key={name} className="flex items-center gap-1.5" title={`${name}: ${color}`}>
                                <div 
                                  className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-[10px] text-white/50 capitalize">{name}</span>
                              </div>
                            )
                          )
                        ))}
                      </div>
                      
                      {pageStyle.colors.backgroundGradient && (
                        <div className="mt-2 p-2 rounded-lg text-xs text-white/50 bg-white/5">
                          <span className="font-medium">Gradient:</span> {pageStyle.colors.backgroundGradient}
                        </div>
                      )}
                    </div>

                    {/* Texture & Typography */}
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1">
                          <span>✨</span> Texture
                        </h4>
                        <p className="text-xs text-white/60">
                          <span className="font-medium capitalize">{pageStyle.texture.type}</span>
                          {pageStyle.texture.type !== 'none' && (
                            <span className="text-white/40"> ({Math.round(pageStyle.texture.opacity * 100)}% opacity)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-white/40 mt-1">{pageStyle.texture.description}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1">
                          <span>📝</span> Typography
                        </h4>
                        <div className="text-xs text-white/60 space-y-1">
                          <p>Headings: <span className="text-white/80 capitalize">{pageStyle.typography.headingStyle}</span></p>
                          <p>Size: <span className="text-white/80 capitalize">{pageStyle.typography.headingSize}</span></p>
                          <p>Spacing: <span className="text-white/80 capitalize">{pageStyle.layout.spacing}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout & Mood */}
                  <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-white/70 flex items-center gap-1">
                          <span>🖼️</span> Layout
                        </h4>
                        <p className="text-xs text-white/50 mt-1">
                          {pageStyle.layout.contentWidth} width • {pageStyle.layout.imageStyle} images • {pageStyle.layout.headerStyle} header
                        </p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-semibold text-white/70">Mood</h4>
                        <p className="text-xs text-pink-300/80 mt-1">{pageStyle.mood}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Editor / Preview */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              {activeTab === 'write' ? (
                <>
                  <label className="text-white/60 text-sm mb-2 block font-medium">Content</label>
                  <textarea
                    value={post.content}
                    onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your blog post content here. Use markdown for formatting..."
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:border-[#84A98C]/50 focus:outline-none min-h-[400px] font-mono text-sm leading-relaxed transition"
                    data-testid="blog-content-input"
                  />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex gap-6 text-white/40">
                      <span>{wordCount} words</span>
                      <span>{readTime} min read</span>
                    </div>
                    <button
                      onClick={analyzeSEO}
                      disabled={analyzing || !post.content}
                      className="px-4 py-2 bg-white/[0.08] border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.15] transition disabled:opacity-50"
                    >
                      {analyzing ? 'Analyzing...' : '🔍 Analyze SEO'}
                    </button>
                  </div>
                </>
              ) : (
                /* Styled Preview */
                <div 
                  className="relative min-h-[500px] rounded-xl overflow-hidden transition-all duration-500"
                  style={styleApplied && pageStyle ? {
                    background: pageStyle.colors.backgroundGradient || pageStyle.colors.background,
                    color: pageStyle.colors.text,
                  } : {}}
                >
                  {/* Texture Overlay */}
                  {styleApplied && pageStyle && pageStyle.texture.type !== 'none' && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        opacity: pageStyle.texture.opacity,
                        backgroundImage: getTexturePattern(pageStyle.texture.type),
                        backgroundSize: pageStyle.texture.type === 'grain' ? '200px 200px' : 
                                        pageStyle.texture.type === 'dots' ? '20px 20px' :
                                        pageStyle.texture.type === 'lines' ? '10px 10px' :
                                        pageStyle.texture.type === 'geometric' ? '60px 60px' : '100px 100px',
                      }}
                    />
                  )}
                  
                  {/* Content Container */}
                  <div 
                    className={`relative z-20 p-8 ${
                      styleApplied && pageStyle?.layout.contentWidth === 'narrow' ? 'max-w-2xl mx-auto' :
                      styleApplied && pageStyle?.layout.contentWidth === 'wide' ? 'max-w-5xl mx-auto' : 'max-w-3xl mx-auto'
                    }`}
                    style={styleApplied && pageStyle ? {
                      lineHeight: pageStyle.typography.bodyLineHeight === 'relaxed' ? '1.8' :
                                  pageStyle.typography.bodyLineHeight === 'tight' ? '1.4' : '1.6',
                    } : {}}
                  >
                    {/* Header */}
                    <h1 
                      className={`mb-6 transition-all ${
                        styleApplied && pageStyle?.typography.headingStyle === 'uppercase' ? 'uppercase tracking-wider' :
                        styleApplied && pageStyle?.typography.headingStyle === 'italic' ? 'italic' :
                        styleApplied && pageStyle?.typography.headingStyle === 'light' ? 'font-light' : 'font-bold'
                      } ${
                        styleApplied && pageStyle?.typography.headingSize === 'large' ? 'text-4xl' :
                        styleApplied && pageStyle?.typography.headingSize === 'compact' ? 'text-2xl' : 'text-3xl'
                      }`}
                      style={styleApplied && pageStyle ? { color: pageStyle.colors.headings } : { color: 'white' }}
                    >
                      {post.title || 'Untitled'}
                    </h1>

                    {/* Meta Info */}
                    <div 
                      className="flex items-center gap-4 mb-8 text-sm"
                      style={styleApplied && pageStyle ? { color: pageStyle.colors.textMuted } : { color: 'rgba(255,255,255,0.5)' }}
                    >
                      <span>{post.category || 'Uncategorized'}</span>
                      <span>•</span>
                      <span>{readTime} min read</span>
                      {post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{post.tags.slice(0, 3).join(', ')}</span>
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div 
                      className={`prose max-w-none ${
                        styleApplied && pageStyle?.layout.spacing === 'airy' ? 'space-y-6' :
                        styleApplied && pageStyle?.layout.spacing === 'compact' ? 'space-y-2' : 'space-y-4'
                      }`}
                      style={styleApplied && pageStyle ? { 
                        color: pageStyle.colors.text,
                        '--tw-prose-headings': pageStyle.colors.headings,
                        '--tw-prose-links': pageStyle.colors.links,
                      } as React.CSSProperties : {}}
                    >
                      {post.content.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) {
                          return (
                            <h2 
                              key={i} 
                              className={`mt-8 mb-4 ${
                                styleApplied && pageStyle?.typography.headingStyle === 'uppercase' ? 'uppercase tracking-wide' :
                                styleApplied && pageStyle?.typography.headingStyle === 'italic' ? 'italic' :
                                styleApplied && pageStyle?.typography.headingStyle === 'light' ? 'font-light' : 'font-bold'
                              } ${
                                styleApplied && pageStyle?.typography.headingSize === 'large' ? 'text-2xl' :
                                styleApplied && pageStyle?.typography.headingSize === 'compact' ? 'text-lg' : 'text-xl'
                              }`}
                              style={styleApplied && pageStyle ? { color: pageStyle.colors.headings } : { color: 'white' }}
                            >
                              {line.replace('## ', '')}
                            </h2>
                          );
                        }
                        if (line.startsWith('### ')) {
                          return (
                            <h3 
                              key={i} 
                              className={`mt-6 mb-3 ${
                                styleApplied && pageStyle?.typography.headingStyle === 'uppercase' ? 'uppercase tracking-wide' :
                                styleApplied && pageStyle?.typography.headingStyle === 'italic' ? 'italic' :
                                styleApplied && pageStyle?.typography.headingStyle === 'light' ? 'font-light' : 'font-semibold'
                              }`}
                              style={styleApplied && pageStyle ? { color: pageStyle.colors.headings } : { color: 'white' }}
                            >
                              {line.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (line.trim() === '') return <br key={i} />;
                        return (
                          <p 
                            key={i} 
                            className="leading-relaxed"
                            style={styleApplied && pageStyle ? { color: pageStyle.colors.text } : { color: 'rgba(255,255,255,0.8)' }}
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>

                    {/* Tags Footer */}
                    {post.tags.length > 0 && (
                      <div className="mt-12 pt-6 border-t" style={styleApplied && pageStyle ? { borderColor: `${pageStyle.colors.textMuted}40` } : { borderColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map(tag => (
                            <span 
                              key={tag} 
                              className={`px-3 py-1 text-sm ${
                                styleApplied && pageStyle?.layout.imageStyle === 'rounded' ? 'rounded-full' :
                                styleApplied && pageStyle?.layout.imageStyle === 'sharp' ? 'rounded-none' : 'rounded-lg'
                              }`}
                              style={styleApplied && pageStyle ? { 
                                backgroundColor: `${pageStyle.colors.primary}20`,
                                color: pageStyle.colors.primary,
                              } : { 
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Style Applied Badge */}
                  {styleApplied && pageStyle && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-medium flex items-center gap-1.5 z-30">
                      <span>🎨</span> {pageStyle.themeName}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category & Tags */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block font-medium">Category</label>
                  <select
                    value={post.category}
                    onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#84A98C]/50 focus:outline-none transition"
                    data-testid="blog-category-select"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block font-medium">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-[#84A98C]/50 focus:outline-none transition"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-3 bg-[#84A98C]/20 border border-[#84A98C]/30 rounded-xl text-[#A7C957] hover:bg-[#84A98C]/30 transition"
                    >
                      Add
                    </button>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/[0.08] border border-white/10 rounded-full text-white/70 text-sm flex items-center gap-2"
                        >
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="text-white/40 hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <label className="text-white/60 text-sm mb-4 block font-medium">Images (up to 5)</label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#84A98C]/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-white/70 font-medium">Click or drag images here</p>
                  <p className="text-white/40 text-sm mt-1">PNG, JPG, WebP (max 10MB each)</p>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        ×
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-[#84A98C] text-white text-xs rounded">Featured</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            
            {/* SEO Score */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span>📊</span> SEO Analysis
              </h3>
              
              {seoAnalysis ? (
                <>
                  {/* Score Circle */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - seoAnalysis.score / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={seoAnalysis.score >= 80 ? '#10b981' : seoAnalysis.score >= 60 ? '#f59e0b' : '#ef4444'} />
                            <stop offset="100%" stopColor={seoAnalysis.score >= 80 ? '#34d399' : seoAnalysis.score >= 60 ? '#fbbf24' : '#f87171'} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-4xl font-bold ${getScoreColor(seoAnalysis.score)}`}>
                          {seoAnalysis.score}
                        </span>
                        <span className="text-white/40 text-xs">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Items */}
                  <div className="space-y-2">
                    {seoAnalysis.feedback.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={
                          item.type === 'success' ? 'text-emerald-400' :
                          item.type === 'warning' ? 'text-amber-400' :
                          item.type === 'info' ? 'text-sky-400' : 'text-red-400'
                        }>
                          {item.type === 'success' ? '✓' : item.type === 'warning' ? '⚠' : 'ℹ'}
                        </span>
                        <span className="text-white/70">{item.message}</span>
                      </div>
                    ))}
                  </div>

                  {/* Keywords */}
                  {seoAnalysis.details.topKeywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/50 text-xs mb-2">Top Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {seoAnalysis.details.topKeywords.slice(0, 6).map(kw => (
                          <span key={kw} className="px-2 py-0.5 bg-white/[0.05] rounded text-xs text-white/60">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3 opacity-50">📝</div>
                  <p className="text-white/40 text-sm">
                    {analyzing ? 'Analyzing your content...' : 'Write at least 100 words to see SEO analysis'}
                  </p>
                </div>
              )}
            </div>

            {/* Post Stats */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span>📈</span> Post Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Word Count</span>
                  <span className="text-white font-medium">{wordCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Read Time</span>
                  <span className="text-white font-medium">{readTime} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Images</span>
                  <span className="text-white font-medium">{imagePreviews.length} / 5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Category</span>
                  <span className="text-white font-medium">{post.category || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Tags</span>
                  <span className="text-white font-medium">{post.tags.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span>💡</span> SEO Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Title: 50-60 characters for best results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Content: 1000-2000 words is ideal
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Use headings (## or ###) to structure
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Include your focus keyword 3-5 times
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Add alt text to all images
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-2xl bg-white/[0.12] rounded-2xl border border-white/[0.15] p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-medium text-white mb-4">Schedule Post</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#84A98C]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#84A98C]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white hover:bg-white/[0.15] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => publishPost(true)}
                  disabled={!scheduleDate || !scheduleTime || publishing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#84A98C] to-[#52796F] text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {publishing ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
