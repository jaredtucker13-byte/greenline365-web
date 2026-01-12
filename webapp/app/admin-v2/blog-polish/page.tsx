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
 * - Style Library for saved themes
 * - Copyright tools and compliance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import StyleLibrary from '../components/StyleLibrary';
import CopyrightTools from '../components/CopyrightTools';
import AIContentDisclaimer from '../components/AIContentDisclaimer';
import { 
  CopyButton, 
  ShareButton, 
  FocusModeButton, 
  NetworkStatus,
  NotificationButton,
  QRCodeModal,
  CameraCapture,
} from '@/app/components/BrowserFeatures';
import { sendNotification, vibrate } from '@/lib/browser-apis';

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
  
  // Auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const LOCAL_STORAGE_KEY = 'greenline365_blog_draft';

  // AI Enhancement state
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    headlines?: string[];
    tags?: string[];
    meta?: { description: string; keywords: string[] };
    outline?: string;
    enhanced?: string;
    enhancedTitle?: string; // NEW: Title suggestion when enhancing content
  }>({});
  const [customPromptInput, setCustomPromptInput] = useState('');
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null); // For full-screen panels

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Trending Research state
  interface TrendingTopic {
    topic: string;
    reason: string;
    blogTitle: string;
    keywords: string[];
  }
  interface ContentIdea {
    title: string;
    description: string;
    audience: string;
    difficulty: string;
  }
  interface NewsItem {
    headline: string;
    importance: string;
    source: string;
    contentAngle: string;
  }
  interface FAQ {
    question: string;
    intent: string;
    approach: string;
    keywords: string[];
  }
  const [showTrendingPanel, setShowTrendingPanel] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingType, setTrendingType] = useState<'trending' | 'ideas' | 'news' | 'questions'>('trending');
  const [trendingIndustry, setTrendingIndustry] = useState('');
  const [trendingNiche, setTrendingNiche] = useState('');
  const [trendingResults, setTrendingResults] = useState<{
    trending?: TrendingTopic[];
    ideas?: ContentIdea[];
    news?: NewsItem[];
    questions?: FAQ[];
  }>({});

  // Image Generation state
  interface ImageSuggestion {
    id: string;
    placement: 'header' | 'inline' | 'section-break';
    context: string;
    prompt: string;
    position: number;
    sectionTitle?: string;
    generatedImages?: { id: string; data?: string; url?: string; mime_type?: string }[];
    selectedImage?: string;
    generating?: boolean;
  }
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([]);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'magazine' | 'minimal' | 'cards'>('classic');
  const [showCopyrightPanel, setShowCopyrightPanel] = useState(false);
  
  // Browser Features state
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Batch image generation state
  const [generatingAllImages, setGeneratingAllImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState<{ current: number; total: number; status: string }>({ current: 0, total: 0, status: '' });

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

  // Style Library state
  const [showStyleLibrary, setShowStyleLibrary] = useState(false);

  // Handle applying style from library
  const applyStyleFromLibrary = (style: any) => {
    // Ensure description is set
    const fullStyle: PageStyleGuide = {
      ...style,
      description: style.description || style.mood || 'Custom style from library'
    };
    setPageStyle(fullStyle);
    setShowStylePanel(true);
    setStyleApplied(true);
    setMessage({ type: 'success', text: `Applied "${style.themeName}" from library` });
  };

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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.post && (parsed.post.title || parsed.post.content)) {
          setPost(parsed.post);
          setLastAutoSave(parsed.savedAt ? new Date(parsed.savedAt) : null);
          setMessage({ type: 'info', text: '📝 Restored unsaved draft from your last session' });
        }
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage:', e);
    }
  }, []);

  // Auto-save to localStorage when content changes (debounced)
  useEffect(() => {
    // Only auto-save if there's meaningful content
    if (!post.title && !post.content) return;
    
    setHasUnsavedChanges(true);
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer for auto-save (3 seconds after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, 3000);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [post.title, post.content, post.category, post.tags]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && (post.title || post.content)) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, post.title, post.content]);

  // Save to localStorage
  const saveToLocalStorage = () => {
    try {
      setIsAutoSaving(true);
      const draftData = {
        post: {
          title: post.title,
          content: post.content,
          category: post.category,
          tags: post.tags,
          images: post.images,
          status: post.status,
        },
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);
      setIsAutoSaving(false);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      setIsAutoSaving(false);
    }
  };

  // Clear localStorage after successful save to database
  const clearLocalStorageDraft = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setHasUnsavedChanges(false);
      setLastAutoSave(null);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  };

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

  // State for upload progress
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files).slice(0, 5);
    setUploadingImages(true);
    setUploadProgress({ current: 0, total: files.length });
    
    const uploadedUrls: string[] = [];
    const newPreviews: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      
      try {
        // Create local preview immediately
        const localPreview = URL.createObjectURL(file);
        newPreviews.push(localPreview);
        
        // Upload to cloud storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'blog-posts');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok && data.url) {
          uploadedUrls.push(data.url);
          // Replace local preview with cloud URL
          newPreviews[i] = data.url;
        } else {
          console.error('Upload failed:', data.error);
          setMessage({ type: 'error', text: `Failed to upload ${file.name}: ${data.error}` });
        }
      } catch (error) {
        console.error('Upload error:', error);
        setMessage({ type: 'error', text: `Failed to upload ${file.name}` });
      }
    }
    
    // Update state with uploaded images
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setPost(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    
    if (uploadedUrls.length > 0) {
      setMessage({ type: 'success', text: `Uploaded ${uploadedUrls.length} image(s) to cloud storage` });
    }
    
    setUploadingImages(false);
    setUploadProgress({ current: 0, total: 0 });
    
    // Reset input
    e.target.value = '';
  };

  // Handle camera capture
  const handleCameraCapture = async (imageData: string) => {
    setShowCamera(false);
    vibrate([50, 30, 50]);
    
    // Convert base64 to blob and upload
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Upload to cloud storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'blog-posts');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await uploadResponse.json();
      
      if (uploadResponse.ok && data.url) {
        setImagePreviews(prev => [...prev, data.url]);
        setPost(prev => ({ ...prev, images: [...prev.images, data.url] }));
        setMessage({ type: 'success', text: '📸 Photo captured and uploaded!' });
        sendNotification('Photo Uploaded!', { body: 'Your camera photo has been added to the blog.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to upload photo' });
      }
    } catch (error) {
      console.error('Camera upload error:', error);
      setMessage({ type: 'error', text: 'Failed to process photo' });
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = imagePreviews[index];
    
    // Remove from state first for instant UI feedback
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]); // Clean up blob URL if any
      return prev.filter((_, i) => i !== index);
    });
    setPost(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    
    // Try to delete from cloud storage if it's a Supabase URL
    if (imageUrl && imageUrl.includes('supabase')) {
      try {
        // Extract path from URL
        const urlParts = imageUrl.split('/storage/v1/object/public/blog-images/');
        if (urlParts[1]) {
          await fetch(`/api/upload?path=${encodeURIComponent(urlParts[1])}`, {
            method: 'DELETE',
          });
        }
      } catch (error) {
        console.error('Failed to delete from storage:', error);
      }
    }
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
        clearLocalStorageDraft(); // Clear localStorage after successful save
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
    setAiLoading('enhance_content');
    try {
      const response = await fetch('/api/blog/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance_content_with_title',
          title: post.title,
          content: post.content,
          category: post.category,
        }),
      });

      const data = await response.json();
      if (response.ok && data.result) {
        // Parse result for both enhanced content and suggested title
        const result = data.result;
        if (typeof result === 'object' && result.content) {
          setAiSuggestions(prev => ({ 
            ...prev, 
            enhanced: result.content,
            enhancedTitle: result.title || undefined,
          }));
        } else {
          setAiSuggestions(prev => ({ ...prev, enhanced: result }));
        }
        setShowAiPanel(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Enhancement failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enhance content' });
    }
    setAiLoading(null);
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

  // Generate content from custom prompt (use suggestions)
  const generateFromPrompt = async () => {
    if (!customPromptInput.trim()) {
      setMessage({ type: 'error', text: 'Enter a prompt or paste a suggestion' });
      return;
    }
    setAiLoading('custom_prompt');
    try {
      const response = await fetch('/api/blog/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_generate',
          customPrompt: customPromptInput,
          title: post.title,
          content: post.content,
          category: post.category,
        }),
      });

      const data = await response.json();
      if (response.ok && data.result) {
        setAiSuggestions(prev => ({ ...prev, enhanced: data.result }));
        setMessage({ type: 'success', text: 'Content generated from your prompt!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Generation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate content' });
    }
    setAiLoading(null);
  };

  // Copy suggestion to custom prompt input
  const useSuggestion = (text: string) => {
    setCustomPromptInput(text);
    setMessage({ type: 'info', text: 'Suggestion copied to prompt input. Edit and generate!' });
  };

  // Voice Recording - Start/Stop (Using Web Speech API)
  const toggleVoiceRecording = async () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setMessage({ type: 'error', text: 'Speech recognition not supported in this browser. Try Chrome or Edge.' });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        (mediaRecorderRef.current as any).stop();
      }
      setIsRecording(false);
    } else {
      // Start recording with Web Speech API
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        let finalTranscript = '';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Show interim results
          if (interimTranscript) {
            setMessage({ type: 'info', text: `🎤 Hearing: "${interimTranscript}"` });
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
          if (finalTranscript.trim()) {
            setPost(prev => ({
              ...prev,
              content: prev.content ? `${prev.content}\n\n${finalTranscript.trim()}` : finalTranscript.trim(),
            }));
            setMessage({ type: 'success', text: `🎤 Added: "${finalTranscript.trim().slice(0, 50)}..."` });
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            setMessage({ type: 'error', text: 'Microphone access denied. Please allow microphone permission.' });
          } else {
            setMessage({ type: 'error', text: `Speech error: ${event.error}` });
          }
        };

        mediaRecorderRef.current = recognition as any;
        recognition.start();
        setIsRecording(true);
        setMessage({ type: 'info', text: '🎤 Listening... Speak now! Click again to stop.' });
        
      } catch (error: any) {
        console.error('Speech recognition error:', error);
        setMessage({ type: 'error', text: 'Could not start speech recognition.' });
      }
    }
  };

  // Text-to-Speech - Read content aloud
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      // Filter to English voices and sort by quality
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices);
      
      // Set default voice (prefer Google or premium voices)
      if (!selectedVoice && englishVoices.length > 0) {
        const preferred = englishVoices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Microsoft') ||
          v.name.includes('Natural')
        ) || englishVoices[0];
        setSelectedVoice(preferred);
      }
    };
    
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);
  
  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setMessage({ type: 'error', text: 'Text-to-speech not supported in this browser.' });
      return;
    }

    // If already speaking, stop
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Use selected voice or fallback
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleReadContent = () => {
    // If speaking, stop
    if (isSpeaking) {
      stopSpeaking();
      setMessage({ type: 'info', text: '🔇 Stopped reading' });
      return;
    }
    
    // Otherwise start reading
    if (!post.content) {
      setMessage({ type: 'error', text: 'No content to read' });
      return;
    }
    speakText(post.content.slice(0, 5000)); // Limit to prevent very long reads
  };

  // Transcribe audio using OpenRouter GPT-4o Audio (fallback)
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setMessage({ type: 'info', text: '✨ Transcribing your voice...' });

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const response = await fetch('/api/blog/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioBase64 }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        // Append transcribed text to content
        setPost(prev => ({
          ...prev,
          content: prev.content ? `${prev.content}\n\n${data.text}` : data.text,
        }));
        setMessage({ type: 'success', text: '🎤 Voice transcribed and added!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Transcription failed' });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setMessage({ type: 'error', text: 'Failed to transcribe audio' });
    }
    setIsTranscribing(false);
  };

  // Trending Research with Perplexity via OpenRouter
  const searchTrending = async () => {
    // Industry is now OPTIONAL - can search general trends
    setTrendingLoading(true);
    try {
      const response = await fetch('/api/blog/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: trendingIndustry || undefined, // Optional now
          niche: trendingNiche || undefined,
          type: trendingType,
          count: 5,
        }),
      });

      const data = await response.json();
      if (data.success && data.results) {
        setTrendingResults(prev => ({ ...prev, [trendingType]: data.results }));
        setMessage({ type: 'success', text: `Found ${data.results.length} ${trendingType} results` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Research failed' });
      }
    } catch (error) {
      console.error('Trending research error:', error);
      setMessage({ type: 'error', text: 'Failed to fetch trending topics' });
    }
    setTrendingLoading(false);
  };

  // Apply trending topic to blog post
  const applyTrendingTopic = (topic: TrendingTopic) => {
    setPost(prev => ({
      ...prev,
      title: topic.blogTitle,
      tags: [...new Set([...prev.tags, ...topic.keywords])],
    }));
    setMessage({ type: 'success', text: `Applied: "${topic.blogTitle}"` });
  };

  const applyContentIdea = (idea: ContentIdea) => {
    setPost(prev => ({
      ...prev,
      title: idea.title,
      content: prev.content ? prev.content + '\n\n' + idea.description : idea.description,
    }));
    setMessage({ type: 'success', text: `Applied: "${idea.title}"` });
  };

  const applyQuestion = (faq: FAQ) => {
    setPost(prev => ({
      ...prev,
      title: faq.question,
      tags: [...new Set([...prev.tags, ...faq.keywords])],
    }));
    setMessage({ type: 'success', text: `Applied question as title` });
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

  const applyEnhancedTitle = () => {
    if (aiSuggestions.enhancedTitle) {
      setPost(prev => ({ ...prev, title: aiSuggestions.enhancedTitle || '' }));
      setAiSuggestions(prev => ({ ...prev, enhancedTitle: undefined }));
      setMessage({ type: 'success', text: 'New title applied!' });
    }
  };

  const applyBothEnhanced = () => {
    if (aiSuggestions.enhanced || aiSuggestions.enhancedTitle) {
      setPost(prev => ({
        ...prev,
        content: aiSuggestions.enhanced || prev.content,
        title: aiSuggestions.enhancedTitle || prev.title,
      }));
      setAiSuggestions(prev => ({ ...prev, enhanced: undefined, enhancedTitle: undefined }));
      setMessage({ type: 'success', text: 'Title and content updated!' });
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

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 150);
    } catch (e) {
      console.log('Could not play notification sound');
    }
  };

  // Analyze blog to get image suggestions (without generating)
  const analyzeForImageSuggestions = async () => {
    if (!post.content || post.content.length < 100) {
      setMessage({ type: 'error', text: 'Add more content before analyzing images' });
      return;
    }

    setAnalyzingImages(true);
    setShowImagePanel(true);

    try {
      const analyzeResponse = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          title: post.title,
          content: post.content,
        }),
      });

      const analyzeData = await analyzeResponse.json();
      
      if (!analyzeResponse.ok || !analyzeData.suggestions?.length) {
        setMessage({ type: 'error', text: analyzeData.error || 'No image opportunities found' });
        setAnalyzingImages(false);
        return;
      }

      const suggestions: ImageSuggestion[] = analyzeData.suggestions;
      setImageSuggestions(suggestions);
      setMessage({ type: 'success', text: `Found ${suggestions.length} image opportunities! Click "Generate" on each to create.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to analyze content' });
    } finally {
      setAnalyzingImages(false);
    }
  };

  // Generate image for a single suggestion
  const generateSingleImage = async (suggestionId: string) => {
    const suggestion = imageSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Mark as generating
    setImageSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, generating: true } : s
    ));

    try {
      const genResponse = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: suggestion.prompt,
          style: 'professional',
          count: 2,
        }),
      });

      const genData = await genResponse.json();
      
      if (genResponse.ok && genData.images?.length > 0) {
        setImageSuggestions(prev => prev.map(s => 
          s.id === suggestionId 
            ? { ...s, generatedImages: genData.images, generating: false, selectedImage: genData.images[0]?.id }
            : s
        ));
        playNotificationSound();
        setMessage({ type: 'success', text: '🎨 Image generated!' });
      } else {
        setImageSuggestions(prev => prev.map(s => 
          s.id === suggestionId ? { ...s, generating: false } : s
        ));
        setMessage({ type: 'error', text: genData.message || 'Generation failed' });
      }
    } catch (error) {
      setImageSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, generating: false } : s
      ));
      setMessage({ type: 'error', text: 'Failed to generate image' });
    }
  };

  // Generate ALL images (with warning)
  const generateAllImages = async () => {
    const pendingSuggestions = imageSuggestions.filter(s => !s.generatedImages || s.generatedImages.length === 0);
    if (pendingSuggestions.length === 0) {
      setMessage({ type: 'info', text: 'All images already generated!' });
      return;
    }

    // Show warning confirmation
    const confirmed = window.confirm(
      `⚠️ Generate All Images\n\n` +
      `This will generate ${pendingSuggestions.length} image(s) using AI.\n\n` +
      `• This may take 1-2 minutes\n` +
      `• You'll hear a sound when done\n` +
      `• You can continue working while images generate\n\n` +
      `Continue?`
    );
    
    if (!confirmed) {
      return;
    }

    setGeneratingAllImages(true);
    setImageGenProgress({ current: 0, total: pendingSuggestions.length, status: 'Starting batch generation...' });
    setMessage({ type: 'info', text: `⏳ Generating ${pendingSuggestions.length} images. This may take a minute. You can work on other things - we'll beep when done!` });

    let successCount = 0;

    for (let i = 0; i < pendingSuggestions.length; i++) {
      const suggestion = pendingSuggestions[i];
      
      setImageGenProgress({ 
        current: i + 1, 
        total: pendingSuggestions.length, 
        status: `Generating ${i + 1}/${pendingSuggestions.length}...` 
      });

      setImageSuggestions(prev => prev.map(s => 
        s.id === suggestion.id ? { ...s, generating: true } : s
      ));

      try {
        const genResponse = await fetch('/api/blog/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            prompt: suggestion.prompt,
            style: 'professional',
            count: 1, // Just 1 per suggestion for batch mode
          }),
        });

        const genData = await genResponse.json();
        
        if (genResponse.ok && genData.images?.length > 0) {
          setImageSuggestions(prev => prev.map(s => 
            s.id === suggestion.id 
              ? { ...s, generatedImages: genData.images, generating: false, selectedImage: genData.images[0]?.id }
              : s
          ));
          successCount++;
        } else {
          setImageSuggestions(prev => prev.map(s => 
            s.id === suggestion.id ? { ...s, generating: false } : s
          ));
        }
      } catch (error) {
        setImageSuggestions(prev => prev.map(s => 
          s.id === suggestion.id ? { ...s, generating: false } : s
        ));
      }

      // Small delay between generations
      if (i < pendingSuggestions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setGeneratingAllImages(false);
    setImageGenProgress({ current: 0, total: 0, status: '' });
    
    // Play completion sound (more noticeable melody)
    playCompletionSound();
    sendNotification('Images Ready! 🎨', { body: `Generated ${successCount}/${pendingSuggestions.length} images` });
    setMessage({ 
      type: successCount > 0 ? 'success' : 'error', 
      text: `🎉 Done! Generated ${successCount}/${pendingSuggestions.length} images` 
    });
  };

  // Page Style Analysis
  const analyzePageStyle = async (moodHint?: string) => {
    if (!post.content || post.content.length < 100) {
      setMessage({ type: 'error', text: 'Add more content before analyzing style' });
      return;
    }

    setAnalyzingStyle(true);
    try {
      // Extract only primitive values to avoid circular references
      const requestBody = {
        action: 'analyze-style',
        title: String(post.title || ''),
        content: String(post.content || ''),
        category: String(post.category || ''),
        moodHint: moodHint ? String(moodHint) : undefined,
      };
      console.log('[Style] Starting style analysis...', requestBody.title, 'content length:', requestBody.content.length);
      
      const response = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[Style] Response status:', response.status, response.ok);
      const data = await response.json();
      console.log('[Style] Response data success:', data.success, 'themeName:', data.styleGuide?.themeName, 'error:', data.error);
      
      if (response.ok && data.success && data.styleGuide) {
        setPageStyle(data.styleGuide);
        setShowStylePanel(true);
        setStyleApplied(false);
        setMessage({ type: 'success', text: `Style suggestion: "${data.styleGuide.themeName}"` });
      } else {
        console.error('[Style] Failed:', data.error);
        setMessage({ type: 'error', text: data.error || 'Style analysis failed' });
      }
    } catch (error: any) {
      console.error('[Style] Exception:', error?.message || error);
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
          <div ref={editorRef} className="lg:col-span-2 space-y-6">
            
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
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-white/40">
                  {post.title.length}/60 characters (50-60 optimal for SEO)
                </p>
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <CopyButton text={post.title} label="" className="!px-2 !py-1 !text-xs" />
                </div>
              </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <FocusModeButton targetRef={editorRef} className="!text-xs !px-2.5 !py-1" />
                <button
                  onClick={() => setShowCamera(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 transition"
                >
                  📷 Camera
                </button>
                <button
                  onClick={() => setShowQRModal(true)}
                  disabled={!post.slug}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 transition disabled:opacity-40"
                  title={post.slug ? 'Generate QR code for this post' : 'Save post first to generate QR'}
                >
                  📱 QR Code
                </button>
                <ShareButton 
                  title={post.title}
                  text={`Check out: ${post.title}`}
                  url={post.slug ? `https://greenline365.com/blog/${post.slug}` : undefined}
                  className="!text-xs !px-2.5 !py-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <NotificationButton className="!text-xs !px-2.5 !py-1" />
                {post.content && (
                  <CopyButton text={post.content} label="Copy All" className="!text-xs !px-2.5 !py-1" />
                )}
              </div>
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

              {/* AI Tools - Premium Toolbar Design */}
              <div className="flex flex-col gap-2">
                {/* Primary AI Tools Row */}
                <div className="flex items-center gap-1.5 bg-black/30 rounded-xl px-3 py-2 border border-white/5">
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider mr-2">AI</span>
                  <button
                    onClick={generateOutline}
                    disabled={aiLoading !== null || !post.title}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95 disabled:opacity-40 disabled:hover:bg-white/5"
                    title="Generate outline"
                  >
                    {aiLoading === 'generate_outline' ? <span className="animate-pulse">•••</span> : '📋'}
                  </button>
                  <button
                    onClick={enhanceContent}
                    disabled={aiLoading !== null || post.content.length < 50}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95 disabled:opacity-40"
                    title="Enhance content"
                  >
                    {aiLoading === 'enhance_content' ? <span className="animate-pulse">•••</span> : '✨'}
                  </button>
                  <button
                    onClick={suggestHeadlines}
                    disabled={aiLoading !== null || !post.title}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95 disabled:opacity-40"
                    title="Headline suggestions"
                  >
                    {aiLoading === 'suggest_headlines' ? <span className="animate-pulse">•••</span> : '💡'}
                  </button>
                  <button
                    onClick={suggestTags}
                    disabled={aiLoading !== null}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95 disabled:opacity-40"
                    title="Suggest tags"
                  >
                    {aiLoading === 'suggest_tags' ? <span className="animate-pulse">•••</span> : '🏷️'}
                  </button>
                  <button
                    onClick={generateMeta}
                    disabled={aiLoading !== null || !post.title || !post.content}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95 disabled:opacity-40"
                    title="SEO meta"
                  >
                    {aiLoading === 'generate_meta' ? <span className="animate-pulse">•••</span> : '🔎'}
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={analyzeForImageSuggestions}
                    disabled={analyzingImages || post.content.length < 100}
                    className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-amber-200 active:scale-95 disabled:opacity-40 flex items-center gap-1"
                    title="Analyze blog for image opportunities"
                    data-testid="analyze-images-btn"
                  >
                    {analyzingImages ? (
                      <span className="animate-pulse">Analyzing...</span>
                    ) : (
                      <>🖼️ Analyze Images</>
                    )}
                  </button>
                  <button
                    onClick={() => analyzePageStyle()}
                    disabled={analyzingStyle || post.content.length < 100}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-pink-500/10 hover:bg-pink-500/20 text-pink-300/80 hover:text-pink-200 active:scale-95 disabled:opacity-40"
                    title="Style suggestions"
                  >
                    {analyzingStyle ? <span className="animate-pulse">•••</span> : '🎨'}
                  </button>
                  <button
                    onClick={() => setShowStyleLibrary(true)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all bg-gradient-to-r from-amber-500/10 to-pink-500/10 hover:from-amber-500/20 hover:to-pink-500/20 text-amber-200/80 hover:text-amber-100 active:scale-95"
                    title="Style library"
                  >
                    ❤️
                  </button>
                </div>
                
                {/* Secondary Tools Row */}
                <div className="flex items-center gap-1.5 bg-black/20 rounded-xl px-3 py-1.5 border border-white/5">
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider mr-2">Tools</span>
                  <button
                    onClick={() => setShowTrendingPanel(!showTrendingPanel)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                      showTrendingPanel 
                        ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/30' 
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                    title="Research trending topics"
                  >
                    🔍 <span className="hidden sm:inline">Research</span>
                  </button>
                  <button
                    onClick={() => setShowCopyrightPanel(!showCopyrightPanel)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                      showCopyrightPanel 
                        ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/30' 
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                    title="Copyright tools"
                  >
                    ⚖️ <span className="hidden sm:inline">Copyright</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trending Research Panel */}
            <AnimatePresence>
              {showTrendingPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="backdrop-blur-2xl bg-cyan-500/10 rounded-2xl border border-cyan-500/30 p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                      🔍 Trending Research
                      <span className="text-xs text-cyan-300/50 font-normal">Powered by Perplexity</span>
                    </h3>
                    <button
                      onClick={() => setShowTrendingPanel(false)}
                      className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Search Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <input
                      type="text"
                      value={trendingIndustry}
                      onChange={(e) => setTrendingIndustry(e.target.value)}
                      placeholder="Industry (optional)"
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                    <input
                      type="text"
                      value={trendingNiche}
                      onChange={(e) => setTrendingNiche(e.target.value)}
                      placeholder="Niche (optional)"
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                    <select
                      value={trendingType}
                      onChange={(e) => setTrendingType(e.target.value as any)}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="trending">🔥 Trending Topics</option>
                      <option value="ideas">💡 Content Ideas</option>
                      <option value="news">📰 Industry News</option>
                      <option value="questions">❓ FAQs</option>
                    </select>
                    <button
                      onClick={searchTrending}
                      disabled={trendingLoading}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {trendingLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Searching...
                        </>
                      ) : 'Search'}
                    </button>
                  </div>

                  {/* Results */}
                  {trendingResults[trendingType] && trendingResults[trendingType]!.length > 0 && (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {trendingType === 'trending' && (trendingResults.trending as TrendingTopic[])?.map((topic, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-white text-sm mb-1">{topic.topic}</h4>
                              <p className="text-xs text-white/50 mb-2">{topic.reason}</p>
                              <p className="text-xs text-cyan-300 font-medium">📝 {topic.blogTitle}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {topic.keywords?.map((kw, j) => (
                                  <span key={j} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[10px] text-cyan-300">{kw}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => applyTrendingTopic(topic)}
                              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs hover:bg-cyan-500/30 transition shrink-0"
                            >
                              Use This
                            </button>
                          </div>
                        </div>
                      ))}

                      {trendingType === 'ideas' && (trendingResults.ideas as ContentIdea[])?.map((idea, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-white text-sm mb-1">{idea.title}</h4>
                              <p className="text-xs text-white/50 mb-2">{idea.description}</p>
                              <div className="flex gap-3 text-[10px]">
                                <span className="text-cyan-300">👥 {idea.audience}</span>
                                <span className={`${idea.difficulty === 'easy' ? 'text-green-300' : idea.difficulty === 'hard' ? 'text-red-300' : 'text-amber-300'}`}>
                                  ⚡ {idea.difficulty}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => applyContentIdea(idea)}
                              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs hover:bg-cyan-500/30 transition shrink-0"
                            >
                              Use This
                            </button>
                          </div>
                        </div>
                      ))}

                      {trendingType === 'news' && (trendingResults.news as NewsItem[])?.map((news, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition">
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm mb-1">📰 {news.headline}</h4>
                            <p className="text-xs text-white/50 mb-1">{news.importance}</p>
                            <p className="text-xs text-cyan-300">💡 Content angle: {news.contentAngle}</p>
                            {news.source && <span className="text-[10px] text-white/30 mt-1 block">Source: {news.source}</span>}
                          </div>
                        </div>
                      ))}

                      {trendingType === 'questions' && (trendingResults.questions as FAQ[])?.map((faq, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-white text-sm mb-1">❓ {faq.question}</h4>
                              <p className="text-xs text-white/50 mb-2">{faq.approach}</p>
                              <div className="flex flex-wrap gap-1">
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-[10px] text-purple-300">{faq.intent}</span>
                                {faq.keywords?.map((kw, j) => (
                                  <span key={j} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[10px] text-cyan-300">{kw}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => applyQuestion(faq)}
                              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs hover:bg-cyan-500/30 transition shrink-0"
                            >
                              Use This
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {(!trendingResults[trendingType] || trendingResults[trendingType]!.length === 0) && !trendingLoading && (
                    <div className="text-center py-6 text-white/40 text-sm">
                      Enter an industry and click Search to discover trending topics
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Copyright Tools Panel */}
            <AnimatePresence>
              {showCopyrightPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <CopyrightTools 
                    content={post.content} 
                    title={post.title}
                    onAttributionGenerated={(attr) => {
                      // Optionally append attribution to content
                      setMessage({ type: 'success', text: 'Attribution generated!' });
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedPanel(expandedPanel === 'ai' ? null : 'ai')}
                        className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white transition"
                        title="Expand panel"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowAiPanel(false)}
                        className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Custom Prompt Input - Use Suggestions Here */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                    <p className="text-xs text-purple-200 mb-2 font-medium">✨ Generate Content from Suggestion</p>
                    <p className="text-[10px] text-white/40 mb-2">Click "Use This" on any suggestion below, then edit and generate new content</p>
                    <div className="flex gap-2">
                      <textarea
                        value={customPromptInput}
                        onChange={(e) => setCustomPromptInput(e.target.value)}
                        placeholder="Paste a suggestion or type your own prompt to generate content..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400/50 resize-none"
                        rows={2}
                        data-testid="custom-prompt-input"
                      />
                      <button
                        onClick={generateFromPrompt}
                        disabled={aiLoading === 'custom_prompt' || !customPromptInput.trim()}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 self-end"
                      >
                        {aiLoading === 'custom_prompt' ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        ) : 'Generate'}
                      </button>
                    </div>
                  </div>

                  {/* Headlines */}
                  {aiSuggestions.headlines && (
                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-2">💡 Headline Options</p>
                      <div className="space-y-2">
                        {aiSuggestions.headlines.map((headline, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <button
                              onClick={() => applyHeadline(headline)}
                              className="flex-1 text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition"
                            >
                              {headline}
                            </button>
                            <button
                              onClick={() => useSuggestion(`Write a blog post with the headline: "${headline}"`)}
                              className="px-2 py-1 rounded bg-purple-500/30 text-purple-200 text-[10px] hover:bg-purple-500/40 transition whitespace-nowrap"
                              title="Use this suggestion to generate content"
                            >
                              Use This
                            </button>
                          </div>
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
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">🔎 SEO Meta</p>
                        <button
                          onClick={() => useSuggestion(`Write content optimized for: ${aiSuggestions.meta?.description}. Keywords: ${aiSuggestions.meta?.keywords?.join(', ')}`)}
                          className="px-2 py-1 rounded bg-purple-500/30 text-purple-200 text-[10px] hover:bg-purple-500/40 transition"
                        >
                          Use This
                        </button>
                      </div>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => useSuggestion(`Expand on this outline:\n${aiSuggestions.outline}`)}
                            className="px-2 py-1 rounded bg-purple-500/30 text-purple-200 text-[10px] hover:bg-purple-500/40 transition"
                          >
                            Use This
                          </button>
                          <button
                            onClick={applyOutline}
                            className="px-3 py-1 rounded-lg bg-purple-500/30 text-purple-200 text-xs hover:bg-purple-500/40 transition"
                          >
                            Apply to Content
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-white/70 bg-white/5 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                        {aiSuggestions.outline}
                      </pre>
                    </div>
                  )}

                  {/* Enhanced Content */}
                  {(aiSuggestions.enhanced || aiSuggestions.enhancedTitle) && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">✨ Enhanced Content & Title</p>
                        <div className="flex gap-2">
                          {aiSuggestions.enhancedTitle && (
                            <button
                              onClick={applyEnhancedTitle}
                              className="px-2 py-1 rounded-lg bg-green-500/30 text-green-200 text-xs hover:bg-green-500/40 transition"
                            >
                              Apply Title
                            </button>
                          )}
                          {aiSuggestions.enhanced && (
                            <button
                              onClick={applyEnhanced}
                              className="px-2 py-1 rounded-lg bg-purple-500/30 text-purple-200 text-xs hover:bg-purple-500/40 transition"
                            >
                              Apply Content
                            </button>
                          )}
                          {aiSuggestions.enhanced && aiSuggestions.enhancedTitle && (
                            <button
                              onClick={applyBothEnhanced}
                              className="px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/30 to-purple-500/30 text-white text-xs hover:opacity-80 transition"
                            >
                              Apply Both
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Suggested Title */}
                      {aiSuggestions.enhancedTitle && (
                        <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="text-[10px] text-green-400 mb-1 font-semibold">📝 SUGGESTED TITLE</p>
                          <p className="text-sm text-white font-medium">{aiSuggestions.enhancedTitle}</p>
                        </div>
                      )}
                      
                      {/* Enhanced Content */}
                      {aiSuggestions.enhanced && (
                        <pre className="text-xs text-white/70 bg-white/5 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                          {aiSuggestions.enhanced}
                        </pre>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Suggestions Panel */}
            <AnimatePresence>
              {showImagePanel && (imageSuggestions.length > 0 || generatingAllImages) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="backdrop-blur-2xl bg-amber-500/10 rounded-2xl border border-amber-500/30 p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      🖼️ {generatingAllImages ? 'Generating Images...' : `Image Suggestions (${imageSuggestions.length})`}
                    </h3>
                    <div className="flex items-center gap-3">
                      {/* Progress indicator when generating all */}
                      {generatingAllImages && imageGenProgress.total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                              style={{ width: `${(imageGenProgress.current / imageGenProgress.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-amber-300/80">
                            {imageGenProgress.current}/{imageGenProgress.total}
                          </span>
                        </div>
                      )}
                      {/* Generate All Button */}
                      {!generatingAllImages && imageSuggestions.some(s => !s.generatedImages || s.generatedImages.length === 0) && (
                        <button
                          onClick={generateAllImages}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5"
                          data-testid="generate-all-images-btn"
                          title="Generate all pending images - this may take a moment"
                        >
                          ⚡ Generate All ({imageSuggestions.filter(s => !s.generatedImages || s.generatedImages.length === 0).length})
                        </button>
                      )}
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

                  {/* Progress Status Message */}
                  {generatingAllImages && imageGenProgress.status && (
                    <div className="mb-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <p className="text-xs text-amber-200 flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        {imageGenProgress.status}
                      </p>
                    </div>
                  )}
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
                            onClick={() => generateSingleImage(suggestion.id)}
                            disabled={suggestion.generating || (suggestion.generatedImages && suggestion.generatedImages.length > 0)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                              suggestion.generatedImages && suggestion.generatedImages.length > 0
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90'
                            }`}
                            data-testid={`generate-image-btn-${idx}`}
                          >
                            {suggestion.generating ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </span>
                            ) : suggestion.generatedImages && suggestion.generatedImages.length > 0 ? (
                              '✓ Generated'
                            ) : (
                              '🎨 Generate'
                            )}
                          </button>
                        </div>

                        {/* Generated Images Grid */}
                        {suggestion.generatedImages && suggestion.generatedImages.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-white/50 mb-2">Select an image (click to choose):</p>
                            <div className="grid grid-cols-2 gap-2">
                              {suggestion.generatedImages.map((img) => {
                                // Handle both URL and base64 formats
                                const imgSrc = img.url || (img.data?.startsWith('http') ? img.data : `data:${img.mime_type || 'image/png'};base64,${img.data}`);
                                return (
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
                                      src={imgSrc}
                                      alt="Generated"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback for broken images
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect fill="%23333" width="100" height="60"/><text fill="%23666" x="50" y="35" text-anchor="middle" font-size="10">Image</text></svg>';
                                      }}
                                    />
                                    {suggestion.selectedImage === img.id && (
                                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
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
                      {/* My Styles Library Button */}
                      <button
                        onClick={() => setShowStyleLibrary(true)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition flex items-center gap-1"
                        title="Open Style Library"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Library
                      </button>
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
                    <div className="flex items-center gap-6 text-white/40">
                      <span>{wordCount} words</span>
                      <span>{readTime} min read</span>
                      {/* Auto-save indicator */}
                      {(post.title || post.content) && (
                        <span className={`flex items-center gap-1.5 ${isAutoSaving ? 'text-amber-400' : hasUnsavedChanges ? 'text-amber-400/60' : 'text-green-400/60'}`}>
                          {isAutoSaving ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : hasUnsavedChanges ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              Unsaved
                            </>
                          ) : lastAutoSave ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved locally
                            </>
                          ) : null}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleVoiceRecording}
                        disabled={isTranscribing}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                          isRecording 
                            ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse' 
                            : 'bg-white/[0.08] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.15]'
                        } disabled:opacity-50`}
                        data-testid="voice-record-btn"
                      >
                        {isTranscribing ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Transcribing...
                          </>
                        ) : isRecording ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Stop
                          </>
                        ) : (
                          <>🎤 Voice</>
                        )}
                      </button>
                      <button
                        onClick={toggleReadContent}
                        disabled={!post.content}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                          isSpeaking 
                            ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse' 
                            : 'bg-white/[0.08] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.15]'
                        } disabled:opacity-50`}
                        data-testid="read-aloud-btn"
                      >
                        {isSpeaking ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Stop
                          </>
                        ) : (
                          <>🔊 Read</>
                        )}
                      </button>
                      {/* Voice Selector */}
                      {availableVoices.length > 1 && (
                        <select
                          value={selectedVoice?.name || ''}
                          onChange={(e) => {
                            const voice = availableVoices.find(v => v.name === e.target.value);
                            if (voice) setSelectedVoice(voice);
                          }}
                          className="px-2 py-2 rounded-lg bg-white/[0.08] border border-white/10 text-white/70 text-xs focus:outline-none focus:border-white/30 max-w-[120px]"
                          title="Select voice"
                        >
                          {availableVoices.map(voice => (
                            <option key={voice.name} value={voice.name} className="bg-gray-900 text-white">
                              {voice.name.replace('Microsoft ', '').replace('Google ', '').slice(0, 15)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
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

            {/* Category Selection Only - Tags moved to sidebar */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-4">
                <div className="flex-1">
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
                <div className="flex items-center gap-2 pt-6">
                  <span className="text-white/40 text-sm">Tags: {post.tags.length}</span>
                  <span className="text-white/40 text-sm">|</span>
                  <span className="text-white/40 text-sm">Images: {imagePreviews.length}/5</span>
                </div>
              </div>
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

            {/* Tags - Moved to Sidebar */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span>🏷️</span> Tags
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#84A98C]/50 focus:outline-none transition"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-[#84A98C]/20 border border-[#84A98C]/30 rounded-lg text-[#A7C957] text-sm hover:bg-[#84A98C]/30 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
              {post.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white/[0.08] border border-white/10 rounded-full text-white/70 text-xs flex items-center gap-1"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="text-white/40 hover:text-red-400 transition">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-xs">No tags yet</p>
              )}
            </div>

            {/* Image Upload - Moved to Sidebar */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span>📸</span> Images
                {uploadingImages && (
                  <span className="text-xs text-amber-400 animate-pulse ml-auto">
                    Uploading {uploadProgress.current}/{uploadProgress.total}...
                  </span>
                )}
              </h3>
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                uploadingImages 
                  ? 'border-amber-500/50 bg-amber-500/5' 
                  : 'border-white/20 hover:border-[#84A98C]/50'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="sidebar-image-upload"
                  disabled={uploadingImages}
                />
                <label htmlFor="sidebar-image-upload" className={`cursor-pointer block ${uploadingImages ? 'pointer-events-none' : ''}`}>
                  {uploadingImages ? (
                    <>
                      <svg className="w-8 h-8 mx-auto mb-2 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <p className="text-amber-400 text-sm font-medium">Uploading to cloud...</p>
                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-amber-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">📁</div>
                      <p className="text-white/70 text-sm font-medium">Upload Images</p>
                      <p className="text-white/30 text-xs mt-1">{imagePreviews.length}/5 • Cloud storage</p>
                    </>
                  )}
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imagePreviews.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                      <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        ×
                      </button>
                      {/* Cloud indicator */}
                      {img.includes('supabase') && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-500/80 rounded text-[10px] text-white flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Cloud
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="backdrop-blur-2xl bg-white/[0.08] rounded-2xl border border-white/[0.15] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <span>💡</span> SEO Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Title: 50-60 characters
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Content: 1000-2000 words
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  Use ## headings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#84A98C]">•</span>
                  3-5 keyword mentions
                </li>
              </ul>
            </div>

            {/* AI Content Disclaimer */}
            <AIContentDisclaimer compact={true} />
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

      {/* Style Library Modal */}
      <StyleLibrary
        isOpen={showStyleLibrary}
        onClose={() => setShowStyleLibrary(false)}
        onApplyStyle={applyStyleFromLibrary}
        currentStyle={pageStyle}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        data={`https://greenline365.com/blog/${post.slug || 'preview'}`}
        title="Share Blog Post"
      />

      {/* Camera Capture */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Network Status Indicator */}
      <NetworkStatus />
    </div>
  );
}
