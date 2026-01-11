'use client';

/**
 * ContentForge Modal Component - V2 REDESIGN
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Improvements:
 * - Columnar layout with better spacing
 * - Clickable AI-generated hashtag suggestions
 * - Calendar popup for date selection
 * - Feedback thumbs up/down on AI content
 * - Image analysis workflow preparation
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import ChatWidget from '../../components/ChatWidget';

interface ContentForgeProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSchedule: (content: ContentData) => void;
  initialTitle?: string;
  initialContext?: string;
}

interface ContentData {
  type: 'photo' | 'product' | 'blog';
  title: string;
  imageUrl: string;
  caption: string;
  keywords: string[];
  productDescription?: string;
  blogContent?: {
    title: string;
    body: string;
    seoDescription: string;
  };
  hashtags: {
    brand: string;
    local: string;
    optional: string[];
  };
  platforms: ('instagram' | 'twitter' | 'facebook')[];
  scheduledDate: string;
}

export default function ContentForge({ isOpen, onClose, selectedDate, onSchedule, initialTitle, initialContext }: ContentForgeProps) {
  // Content Type
  const [contentType, setContentType] = useState<'photo' | 'product' | 'blog'>('photo');
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // AI-Generated Fields (all editable)
  const [caption, setCaption] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [productDescription, setProductDescription] = useState('');
  
  // Hashtag System
  const [brandHashtag, setBrandHashtag] = useState('#GreenLine365');
  const [localHashtag, setLocalHashtag] = useState('#TampaBusiness');
  const [optionalHashtags, setOptionalHashtags] = useState<string[]>([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  
  // Blog Content
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');
  const [blogSeoDescription, setBlogSeoDescription] = useState('');
  
  // Platform Selection
  const [platforms, setPlatforms] = useState<('instagram' | 'twitter' | 'facebook')[]>(['instagram']);
  
  // UI State
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'hashtags' | 'blog'>('content');
  
  // Image Analysis State (Autopilot)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(selectedDate || new Date());
  const [scheduledTime, setScheduledTime] = useState('08:00');
  
  // Feedback State
  const [captionFeedback, setCaptionFeedback] = useState<'up' | 'down' | null>(null);
  const [keywordsFeedback, setKeywordsFeedback] = useState<'up' | 'down' | null>(null);
  const [descriptionFeedback, setDescriptionFeedback] = useState<'up' | 'down' | null>(null);
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // AI Assistant Panel State
  const [showAssistant, setShowAssistant] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Update date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  }, [selectedDate]);

  // Close calendar/time picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle suggestions from Chat Widget
  const handleChatSuggestion = useCallback((suggestion: { type: string; content: string; applied?: boolean }) => {
    if (!suggestion.applied) return; // Only handle when "Apply" is clicked
    
    switch (suggestion.type) {
      case 'caption':
        setCaption(suggestion.content);
        setSaveMessage({ type: 'success', text: '✨ Caption applied!' });
        break;
      case 'title':
        if (activeTab === 'blog') {
          setBlogTitle(suggestion.content);
        } else {
          setTitle(suggestion.content);
        }
        setSaveMessage({ type: 'success', text: '✨ Title applied!' });
        break;
      case 'keywords':
        const newKeywords = suggestion.content.split(',').map(k => k.trim()).filter(k => k);
        setSuggestedKeywords(prev => [...new Set([...prev, ...newKeywords])]);
        setSaveMessage({ type: 'success', text: '✨ Keywords added to suggestions!' });
        break;
      case 'hashtags':
        const newHashtags = suggestion.content.split(' ').filter(h => h.startsWith('#'));
        setSuggestedHashtags(prev => [...new Set([...prev, ...newHashtags])]);
        setSaveMessage({ type: 'success', text: '✨ Hashtags added to suggestions!' });
        break;
      case 'description':
        setProductDescription(suggestion.content);
        setSaveMessage({ type: 'success', text: '✨ Description applied!' });
        break;
      case 'blog':
        setBlogBody(suggestion.content);
        setSaveMessage({ type: 'success', text: '✨ Blog content applied!' });
        break;
      default:
        break;
    }
    setTimeout(() => setSaveMessage(null), 2000);
  }, [activeTab]);

  const togglePlatform = (platform: 'instagram' | 'twitter' | 'facebook') => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Get formatted datetime for submission
  const getScheduledDateTime = () => {
    const date = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toISOString();
  };

  // AI Generation Functions
  const generateCaption = async () => {
    if (!title.trim() && !imagePreview) return;
    setIsGeneratingCaption(true);
    setCaptionFeedback(null);
    
    try {
      const response = await fetch('/api/content-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'caption',
          businessType: 'local business',
          location: 'Tampa, FL',
          contentType: contentType,
          imageDescription: title || 'business content',
          additionalContext: caption || undefined
        })
      });
      
      const data = await response.json();
      if (data.success && data.data.caption) {
        setCaption(data.data.caption);
      }
    } catch (error) {
      console.error('Caption generation error:', error);
      setCaption(`✨ ${title || 'Check this out!'}\n\nYour success story starts here. Let's make it happen together! 🚀`);
    }
    
    setIsGeneratingCaption(false);
  };

  const generateKeywords = async () => {
    if (!title.trim() && !caption.trim()) return;
    setIsGeneratingKeywords(true);
    setKeywordsFeedback(null);
    
    try {
      const response = await fetch('/api/content-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'keywords',
          businessType: 'local business',
          location: 'Tampa, FL',
          contentType: contentType,
          productName: title || undefined
        })
      });
      
      const data = await response.json();
      if (data.success && data.data.keywords) {
        // Store as suggestions, not directly as keywords
        const newSuggestions = data.data.keywords
          .slice(0, 8)
          .filter((kw: string) => !keywords.includes(kw));
        setSuggestedKeywords(newSuggestions);
      }
    } catch (error) {
      console.error('Keywords generation error:', error);
      setSuggestedKeywords(['business growth', 'local business', 'tampa', 'small business', 'entrepreneur']);
    }
    
    setIsGeneratingKeywords(false);
  };

  const generateProductDescription = async () => {
    if (!title.trim()) return;
    setIsGeneratingDescription(true);
    setDescriptionFeedback(null);
    
    try {
      const response = await fetch('/api/content-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'description',
          businessType: 'local business',
          productName: title,
          additionalContext: caption || undefined
        })
      });
      
      const data = await response.json();
      if (data.success && data.data.description) {
        setProductDescription(data.data.description);
      }
    } catch (error) {
      console.error('Description generation error:', error);
      setProductDescription(`Introducing ${title} - crafted with care and designed to exceed your expectations.`);
    }
    
    setIsGeneratingDescription(false);
  };

  const generateBlogContent = async () => {
    if (!blogTitle.trim()) return;
    setIsGeneratingBlog(true);
    
    try {
      const response = await fetch('/api/content-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'blog',
          businessType: 'local business',
          location: 'Tampa, FL',
          additionalContext: blogTitle
        })
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setBlogBody(data.data.content);
        setBlogSeoDescription(`Learn about ${blogTitle.toLowerCase()} and discover actionable strategies. Expert insights from GreenLine365.`);
      }
    } catch (error) {
      console.error('Blog generation error:', error);
      setBlogBody(`## Introduction\n\n${blogTitle} is a topic that matters to every business owner.\n\n## Key Points\n\n1. Start with a solid foundation\n2. Implement proven strategies\n3. Measure and adjust\n\n## Conclusion\n\nReady to take your business to the next level?`);
    }
    
    setIsGeneratingBlog(false);
  };

  // Generate smart hashtags - now stores them as suggestions
  const generateSmartHashtags = async () => {
    setIsGeneratingHashtags(true);
    try {
      const response = await fetch('/api/content-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hashtags',
          businessType: 'local business',
          location: 'Tampa, FL',
          brandHashtag: brandHashtag,
          contentType: contentType
        })
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        // Combine standard and optional into suggestions that user can click to add
        const allSuggestions = [
          ...(data.data.standard || []),
          ...(data.data.optional || [])
        ].filter(h => h && !optionalHashtags.includes(h) && h !== brandHashtag && h !== localHashtag);
        setSuggestedHashtags(allSuggestions.slice(0, 8));
      }
    } catch (error) {
      console.error('Hashtag generation error:', error);
      setSuggestedHashtags(['#SmallBusiness', '#LocalBiz', '#TampaLife', '#Entrepreneur', '#BusinessGrowth']);
    }
    setIsGeneratingHashtags(false);
  };

  // Add a suggested hashtag to the optional list
  const addSuggestedHashtag = (hashtag: string) => {
    if (optionalHashtags.length < 5 && !optionalHashtags.includes(hashtag)) {
      setOptionalHashtags([...optionalHashtags, hashtag]);
      setSuggestedHashtags(suggestedHashtags.filter(h => h !== hashtag));
    }
  };

  // Remove an optional hashtag
  const removeOptionalHashtag = (hashtag: string) => {
    setOptionalHashtags(optionalHashtags.filter(h => h !== hashtag));
  };

  const handleSchedule = () => {
    onSchedule({
      type: contentType,
      title,
      imageUrl: imagePreview || imageUrl,
      caption,
      keywords,
      productDescription: contentType === 'product' ? productDescription : undefined,
      blogContent: contentType === 'blog' ? {
        title: blogTitle,
        body: blogBody,
        seoDescription: blogSeoDescription,
      } : undefined,
      hashtags: {
        brand: brandHashtag,
        local: localHashtag,
        optional: optionalHashtags,
      },
      platforms,
      scheduledDate: getScheduledDateTime(),
    });
    resetForm();
    onClose();
  };

  // Save as draft to Supabase
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const contentData = {
        type: contentType,
        imageUrl: imagePreview || imageUrl,
        caption,
        keywords,
        productDescription: contentType === 'product' ? productDescription : undefined,
        blogContent: contentType === 'blog' ? {
          title: blogTitle,
          body: blogBody,
          seoDescription: blogSeoDescription,
        } : undefined,
        hashtags: {
          brand: brandHashtag,
          local: localHashtag,
          optional: optionalHashtags,
        },
      };

      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user', // TODO: Replace with actual user ID from auth
          title: title || blogTitle || 'Untitled Draft',
          contentType,
          contentData,
          status: 'draft',
          platforms,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage({ type: 'success', text: '✓ Draft saved!' });
        // Auto-hide message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save draft' });
    } finally {
      setIsSaving(false);
    }
  };

  // Schedule and save to Supabase
  const handleScheduleBlast = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const contentData = {
        type: contentType,
        imageUrl: imagePreview || imageUrl,
        caption,
        keywords,
        productDescription: contentType === 'product' ? productDescription : undefined,
        blogContent: contentType === 'blog' ? {
          title: blogTitle,
          body: blogBody,
          seoDescription: blogSeoDescription,
        } : undefined,
        hashtags: {
          brand: brandHashtag,
          local: localHashtag,
          optional: optionalHashtags,
        },
      };

      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user', // TODO: Replace with actual user ID from auth
          title: title || blogTitle || 'Scheduled Content',
          contentType,
          contentData,
          status: 'scheduled',
          scheduledAt: getScheduledDateTime(),
          platforms,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Also call the original onSchedule for calendar display
        handleSchedule();
        setSaveMessage({ type: 'success', text: '🚀 Scheduled!' });
      } else {
        throw new Error(data.error || 'Failed to schedule');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to schedule content' });
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setImagePreview(null);
    setCaption('');
    setKeywords([]);
    setSuggestedKeywords([]);
    setProductDescription('');
    setBlogTitle('');
    setBlogBody('');
    setBlogSeoDescription('');
    setOptionalHashtags([]);
    setSuggestedHashtags([]);
    setPlatforms(['instagram']);
    setCaptionFeedback(null);
    setKeywordsFeedback(null);
    setDescriptionFeedback(null);
    setAnalysisComplete(false);
  };

  // ============================================
  // IMAGE ANALYSIS - AUTOPILOT MODE
  // ============================================
  const analyzeImage = async (imageDataUrl: string) => {
    setIsAnalyzingImage(true);
    setAnalysisComplete(false);
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageDataUrl,
          contentType,
          businessType: 'local business',
          location: 'Tampa, FL',
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        const { analysis } = data;
        
        // Auto-populate all fields
        if (analysis.title) setTitle(analysis.title);
        if (analysis.caption) setCaption(analysis.caption);
        if (analysis.productDescription) setProductDescription(analysis.productDescription);
        // Store keywords as suggestions so user can pick which ones to add
        if (analysis.keywords?.length > 0) {
          setSuggestedKeywords(analysis.keywords);
        }
        if (analysis.hashtags?.brand) setBrandHashtag(analysis.hashtags.brand);
        if (analysis.hashtags?.local) setLocalHashtag(analysis.hashtags.local);
        if (analysis.hashtags?.suggested?.length > 0) {
          setSuggestedHashtags(analysis.hashtags.suggested);
        }
        if (analysis.suggestedPlatforms?.length > 0) {
          const validPlatforms = analysis.suggestedPlatforms.filter(
            (p: string) => ['instagram', 'twitter', 'facebook'].includes(p)
          ) as ('instagram' | 'twitter' | 'facebook')[];
          if (validPlatforms.length > 0) setPlatforms(validPlatforms);
        }
        
        setAnalysisComplete(true);
        setSaveMessage({ type: 'success', text: '✨ AI analysis complete!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      setSaveMessage({ type: 'error', text: 'Analysis failed - try manual entry' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // File handling - now with auto-analysis option
  const handleFileSelect = (file: File, autoAnalyze = true) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setAnalysisComplete(false);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      
      // Auto-analyze after upload completes
      if (autoAnalyze) {
        setTimeout(() => analyzeImage(dataUrl), 1200);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Get all active hashtags for preview
  const getAllHashtags = () => {
    const all = [brandHashtag, localHashtag, ...optionalHashtags.filter(h => h.trim())];
    return all.join(' ');
  };

  // Feedback component
  const FeedbackButtons = ({ 
    feedback, 
    onFeedback 
  }: { 
    feedback: 'up' | 'down' | null; 
    onFeedback: (val: 'up' | 'down') => void;
  }) => (
    <div className="flex items-center gap-1 ml-2">
      <button
        onClick={() => onFeedback('up')}
        className={`p-1 rounded transition ${
          feedback === 'up' 
            ? 'text-[#39FF14] bg-[#39FF14]/20' 
            : 'text-gray-500 hover:text-[#39FF14] hover:bg-[#39FF14]/10'
        }`}
        title="Good result"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
      <button
        onClick={() => onFeedback('down')}
        className={`p-1 rounded transition ${
          feedback === 'down' 
            ? 'text-red-400 bg-red-400/20' 
            : 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
        }`}
        title="Needs improvement"
      >
        <svg className="w-3.5 h-3.5 rotate-180" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-2 md:inset-4 bg-[#0A0A0A] border border-[#39FF14]/20 rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-[#39FF14]/20 flex items-center justify-between bg-[#0D0D0D]">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-[#39FF14]">⚡</span> Content Forge
                </h2>
                <div className="flex gap-1 bg-[#1A1A1A] rounded-lg p-1">
                  {(['content', 'hashtags', 'blog'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === tab
                          ? 'bg-[#39FF14] text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab === 'content' ? '📸 Content' : tab === 'hashtags' ? '#️⃣ Hashtags' : '📝 Blog'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* AI Assistant Toggle */}
                <button
                  onClick={() => setShowAssistant(!showAssistant)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    showAssistant
                      ? 'bg-[#8A2BE2] text-white'
                      : 'bg-[#1A1A1A] border border-[#2D3748] text-gray-400 hover:text-[#8A2BE2] hover:border-[#8A2BE2]/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {showAssistant ? 'Hide Assistant' : 'AI Assistant'}
                </button>
                <span className="text-xs text-gray-400">
                  {scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2D3748] hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content - Three Column Layout with AI Assistant */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Form */}
              <div className={`flex-1 overflow-y-auto p-4 border-r border-[#1E262E] transition-all ${showAssistant ? 'max-w-[50%]' : ''}`}>
                
                {activeTab === 'content' && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Column - Image & Basic Info */}
                    <div className="space-y-4">
                      {/* Content Type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Content Type</label>
                        <div className="flex gap-2">
                          {(['photo', 'product', 'blog'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setContentType(type)}
                              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition ${
                                contentType === type
                                  ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]'
                                  : 'border-[#2D3748] bg-[#1A1A1A] text-gray-400 hover:border-gray-600'
                              }`}
                            >
                              {type === 'photo' ? '📸 Photo' : type === 'product' ? '🛍️ Product' : '📝 Blog'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image Upload */}
                      {contentType !== 'blog' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-400">Upload Image</label>
                            {imagePreview && !isAnalyzingImage && (
                              <button
                                onClick={() => analyzeImage(imagePreview)}
                                className="text-xs px-2 py-1 rounded bg-[#8A2BE2]/20 text-[#8A2BE2] hover:bg-[#8A2BE2]/30 transition flex items-center gap-1"
                              >
                                🔄 Re-analyze
                              </button>
                            )}
                          </div>
                          {imagePreview ? (
                            <div className="relative rounded-lg overflow-hidden border border-[#39FF14]/30 aspect-video">
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              
                              {/* Analysis overlay */}
                              {isAnalyzingImage && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                  <div className="w-10 h-10 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin mb-3"></div>
                                  <p className="text-[#39FF14] text-sm font-medium">Analyzing image...</p>
                                  <p className="text-gray-400 text-xs mt-1">AI is generating content</p>
                                </div>
                              )}
                              
                              {/* Success badge */}
                              {analysisComplete && !isAnalyzingImage && (
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-[#39FF14] text-black text-xs font-semibold flex items-center gap-1">
                                  ✓ AI Analyzed
                                </div>
                              )}
                              
                              <button
                                onClick={() => { setImagePreview(null); setImageUrl(''); setAnalysisComplete(false); }}
                                className="absolute top-2 right-2 w-6 h-6 rounded bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={`aspect-video rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition ${
                                isDragging ? 'border-[#39FF14] bg-[#39FF14]/5' : 'border-[#2D3748] hover:border-[#39FF14]/50'
                              }`}
                            >
                              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
                              {isUploading ? (
                                <div className="text-center">
                                  <div className="text-sm text-gray-400">Uploading... {uploadProgress}%</div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span className="text-3xl">📤</span>
                                  <p className="text-xs text-gray-400 mt-2">Click or drag to upload</p>
                                  <p className="text-xs text-[#8A2BE2] mt-1">🤖 AI will auto-analyze</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Title / Campaign Name</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter a title..."
                          className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none"
                        />
                      </div>

                      {/* Scheduling Section */}
                      <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                        <label className="block text-xs font-medium text-gray-400 mb-3">📅 Schedule</label>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Date Picker */}
                          <div className="relative" ref={calendarRef}>
                            <button
                              onClick={() => setShowCalendar(!showCalendar)}
                              className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-xs text-left hover:border-[#39FF14]/50 transition flex items-center justify-between"
                            >
                              <span>{scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                            
                            {showCalendar && (
                              <div className="absolute top-full left-0 mt-2 z-50 bg-[#1A1A1A] border border-[#39FF14]/30 rounded-lg shadow-xl">
                                <style>{`
                                  .rdp {
                                    --rdp-cell-size: 32px;
                                    --rdp-accent-color: #39FF14;
                                    --rdp-background-color: #39FF14;
                                    margin: 0;
                                    padding: 12px;
                                  }
                                  .rdp-months { background: transparent; }
                                  .rdp-month { background: transparent; }
                                  .rdp-caption { color: white; font-size: 12px; }
                                  .rdp-head_cell { color: #6B7280; font-size: 10px; }
                                  .rdp-cell { color: white; }
                                  .rdp-day { color: white; font-size: 11px; border-radius: 6px; }
                                  .rdp-day:hover { background: #39FF14/20; }
                                  .rdp-day_selected { background: #39FF14 !important; color: black !important; }
                                  .rdp-day_today { border: 1px solid #39FF14; }
                                  .rdp-nav_button { color: #39FF14; }
                                  .rdp-nav_button:hover { background: #39FF14/20; }
                                `}</style>
                                <DayPicker
                                  mode="single"
                                  selected={scheduledDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      setScheduledDate(date);
                                      setShowCalendar(false);
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Time Picker Dropdown */}
                          <div className="relative" ref={timePickerRef}>
                            <button
                              onClick={() => setShowTimePicker(!showTimePicker)}
                              className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-xs text-left hover:border-[#39FF14]/50 transition flex items-center justify-between"
                            >
                              <span>{scheduledTime.replace(/^(\d{2}):(\d{2})$/, (_, h, m) => {
                                const hour = parseInt(h);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const hour12 = hour % 12 || 12;
                                return `${hour12}:${m} ${ampm}`;
                              })}</span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            
                            {showTimePicker && (
                              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#1A1A1A] border border-[#39FF14]/30 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {/* Generate time options */}
                                {Array.from({ length: 24 }, (_, h) => {
                                  const times = ['00', '30'].map(m => {
                                    const hour24 = h.toString().padStart(2, '0');
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    const hour12 = h % 12 || 12;
                                    return {
                                      value: `${hour24}:${m}`,
                                      label: `${hour12}:${m} ${ampm}`
                                    };
                                  });
                                  return times;
                                }).flat().map(({ value, label }) => (
                                  <button
                                    key={value}
                                    onClick={() => {
                                      setScheduledTime(value);
                                      setShowTimePicker(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs hover:bg-[#39FF14]/10 transition ${
                                      scheduledTime === value ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-white'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Platform Selection */}
                        <div className="mt-3">
                          <label className="block text-xs text-gray-500 mb-2">Platforms</label>
                          <div className="flex gap-2">
                            {(['instagram', 'twitter', 'facebook'] as const).map((platform) => (
                              <button
                                key={platform}
                                onClick={() => togglePlatform(platform)}
                                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition ${
                                  platforms.includes(platform)
                                    ? platform === 'instagram' ? 'border-[#E4405F] bg-[#E4405F]/20 text-white'
                                    : platform === 'twitter' ? 'border-white bg-white/20 text-white'
                                    : 'border-[#1877F2] bg-[#1877F2]/20 text-white'
                                    : 'border-[#2D3748] bg-[#1A1A1A] text-gray-500'
                                }`}
                              >
                                {platform === 'instagram' ? 'IG' : platform === 'twitter' ? 'X' : 'FB'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - AI Generation */}
                    <div className="space-y-4">
                      {/* AI Caption Generator */}
                      <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-400 flex items-center">
                            AI Caption
                            {caption && <FeedbackButtons feedback={captionFeedback} onFeedback={setCaptionFeedback} />}
                          </label>
                          <button
                            onClick={generateCaption}
                            disabled={isGeneratingCaption}
                            className="px-2 py-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-xs font-semibold disabled:opacity-50"
                          >
                            {isGeneratingCaption ? '⏳...' : '🧠 Generate'}
                          </button>
                        </div>
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          rows={4}
                          placeholder="Write or generate a caption..."
                          className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none resize-none"
                        />
                      </div>

                      {/* AI Keywords */}
                      <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-400 flex items-center">
                            Keywords
                            {keywords.length > 0 && <FeedbackButtons feedback={keywordsFeedback} onFeedback={setKeywordsFeedback} />}
                          </label>
                          <button
                            onClick={generateKeywords}
                            disabled={isGeneratingKeywords}
                            className="px-2 py-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-xs font-semibold disabled:opacity-50"
                          >
                            {isGeneratingKeywords ? '⏳...' : '🧠 Generate'}
                          </button>
                        </div>
                        
                        {/* Manual input */}
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                            placeholder="Add keyword..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-xs placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none"
                          />
                          <button onClick={addKeyword} className="px-3 py-1.5 rounded-lg bg-[#39FF14]/20 text-[#39FF14] text-xs font-medium hover:bg-[#39FF14]/30 transition">+</button>
                        </div>
                        
                        {/* Selected keywords */}
                        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                          {keywords.length === 0 ? (
                            <span className="text-xs text-gray-600">Click suggestions below to add ↓</span>
                          ) : (
                            keywords.map((kw) => (
                              <span key={kw} className="px-2 py-0.5 rounded-full bg-[#39FF14]/20 text-[#39FF14] text-xs flex items-center gap-1">
                                {kw}
                                <button onClick={() => removeKeyword(kw)} className="hover:text-red-400 ml-0.5">×</button>
                              </span>
                            ))
                          )}
                        </div>
                        
                        {/* AI Suggested keywords - clickable to add */}
                        {suggestedKeywords.length > 0 && (
                          <div className="pt-2 border-t border-[#2D3748]">
                            <p className="text-[10px] text-gray-500 mb-1.5">🤖 AI Suggestions (click to add)</p>
                            <div className="flex flex-wrap gap-1.5">
                              {suggestedKeywords.map((kw) => (
                                <button
                                  key={kw}
                                  onClick={() => {
                                    if (!keywords.includes(kw)) {
                                      setKeywords([...keywords, kw]);
                                      setSuggestedKeywords(suggestedKeywords.filter(s => s !== kw));
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded-full bg-[#8A2BE2]/10 text-[#8A2BE2] text-xs hover:bg-[#8A2BE2]/20 transition flex items-center gap-1"
                                >
                                  + {kw}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Product Description (for products only) */}
                      {contentType === 'product' && (
                        <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center">
                              Product Description
                              {productDescription && <FeedbackButtons feedback={descriptionFeedback} onFeedback={setDescriptionFeedback} />}
                            </label>
                            <button
                              onClick={generateProductDescription}
                              disabled={isGeneratingDescription}
                              className="px-2 py-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-xs font-semibold disabled:opacity-50"
                            >
                              {isGeneratingDescription ? '⏳...' : '🧠 Generate'}
                            </button>
                          </div>
                          <textarea
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe your product..."
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'hashtags' && (
                  <div className="space-y-4">
                    {/* AI Generate Button */}
                    <button
                      onClick={generateSmartHashtags}
                      disabled={isGeneratingHashtags}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#39FF14]/20 to-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-sm font-medium hover:from-[#39FF14]/30 hover:to-[#39FF14]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingHashtags ? (
                        <>⏳ Generating...</>
                      ) : (
                        <>✨ Generate Smart Hashtags with AI</>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Left - Standard Hashtags */}
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-[#39FF14]/5 border border-[#39FF14]/20">
                          <h3 className="text-sm font-semibold text-[#39FF14] mb-3">📌 Standard Hashtags</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Brand</label>
                              <input
                                type="text"
                                value={brandHashtag}
                                onChange={(e) => setBrandHashtag(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
                                className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#39FF14]/30 text-[#39FF14] text-sm focus:border-[#39FF14] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Local</label>
                              <input
                                type="text"
                                value={localHashtag}
                                onChange={(e) => setLocalHashtag(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
                                className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#39FF14]/30 text-[#39FF14] text-sm focus:border-[#39FF14] outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Active Optional Hashtags */}
                        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2D3748]">
                          <h3 className="text-sm font-semibold text-white mb-2">🎯 Your Hashtags</h3>
                          <p className="text-xs text-gray-500 mb-3">Click suggestions to add (max 5)</p>
                          <div className="flex flex-wrap gap-2 min-h-[40px]">
                            {optionalHashtags.length === 0 ? (
                              <span className="text-xs text-gray-600">Click suggestions to add →</span>
                            ) : (
                              optionalHashtags.map((hashtag) => (
                                <span 
                                  key={hashtag}
                                  className="px-2 py-1 rounded-full bg-[#39FF14]/20 text-[#39FF14] text-xs flex items-center gap-1"
                                >
                                  {hashtag}
                                  <button 
                                    onClick={() => removeOptionalHashtag(hashtag)}
                                    className="hover:text-red-400 ml-1"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right - AI Suggestions */}
                      <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#8A2BE2]/30">
                        <h3 className="text-sm font-semibold text-[#8A2BE2] mb-2">🤖 AI Suggestions</h3>
                        <p className="text-xs text-gray-500 mb-3">Click to add to your hashtags</p>
                        <div className="flex flex-wrap gap-2 min-h-[100px]">
                          {suggestedHashtags.length === 0 ? (
                            <span className="text-xs text-gray-600">Generate hashtags to see suggestions</span>
                          ) : (
                            suggestedHashtags.map((hashtag) => (
                              <button
                                key={hashtag}
                                onClick={() => addSuggestedHashtag(hashtag)}
                                disabled={optionalHashtags.length >= 5}
                                className="px-2 py-1 rounded-full bg-[#8A2BE2]/10 text-[#8A2BE2] text-xs hover:bg-[#8A2BE2]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                + {hashtag}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hashtag Preview */}
                    <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Preview</h3>
                      <p className="text-sm text-[#39FF14]">{getAllHashtags() || 'Add hashtags above...'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'blog' && (
                  <div className="space-y-4">
                    {/* Blog Header */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left - Blog Settings */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Blog Title</label>
                          <input
                            type="text"
                            value={blogTitle}
                            onChange={(e) => setBlogTitle(e.target.value)}
                            placeholder="Enter a compelling blog title..."
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">{blogTitle.length}/60 characters (ideal for SEO)</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">SEO Description</label>
                          <textarea
                            value={blogSeoDescription}
                            onChange={(e) => setBlogSeoDescription(e.target.value)}
                            rows={2}
                            placeholder="Meta description for search engines..."
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none resize-none"
                          />
                          <p className={`text-xs mt-1 ${blogSeoDescription.length > 160 ? 'text-red-400' : 'text-gray-500'}`}>
                            {blogSeoDescription.length}/160 characters {blogSeoDescription.length > 160 && '(too long!)'}
                          </p>
                        </div>
                      </div>

                      {/* Right - SEO Preview & Actions */}
                      <div className="space-y-3">
                        {/* SEO Preview Card */}
                        <div className="p-3 rounded-lg bg-white/5 border border-[#2D3748]">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Google Preview</p>
                          <div className="space-y-1">
                            <p className="text-[#8AB4F8] text-sm truncate hover:underline cursor-pointer">
                              {blogTitle || 'Your Blog Title Here'} - GreenLine365
                            </p>
                            <p className="text-[#BDC1C6] text-xs">greenline365.com › blog › {blogTitle ? blogTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 20) : 'your-post'}</p>
                            <p className="text-[#BDC1C6] text-xs line-clamp-2">
                              {blogSeoDescription || 'Your meta description will appear here. Make it compelling to improve click-through rates from search results.'}
                            </p>
                          </div>
                        </div>

                        {/* Generate Button */}
                        <button
                          onClick={generateBlogContent}
                          disabled={isGeneratingBlog || !blogTitle.trim()}
                          className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isGeneratingBlog ? '⏳ Generating...' : '🧠 Generate Blog Content'}
                        </button>

                        {/* Quick tips */}
                        <div className="text-[10px] text-gray-500">
                          💡 Tip: Use the AI Assistant for brainstorming topics and outlines
                        </div>
                      </div>
                    </div>

                    {/* Blog Content Editor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-gray-400">Blog Content</label>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{blogBody.split(/\s+/).filter(w => w).length} words</span>
                          <span>~{Math.ceil(blogBody.split(/\s+/).filter(w => w).length / 200)} min read</span>
                        </div>
                      </div>
                      
                      {/* Formatting Toolbar */}
                      <div className="flex gap-1 p-1 rounded-lg bg-[#1A1A1A] border border-[#2D3748]">
                        {[
                          { icon: 'H1', action: () => setBlogBody(prev => `## ${prev}`) },
                          { icon: 'H2', action: () => setBlogBody(prev => `### ${prev}`) },
                          { icon: 'B', action: () => setBlogBody(prev => `**${prev}**`), bold: true },
                          { icon: 'I', action: () => setBlogBody(prev => `*${prev}*`), italic: true },
                          { icon: '•', action: () => setBlogBody(prev => `${prev}\n- `) },
                          { icon: '1.', action: () => setBlogBody(prev => `${prev}\n1. `) },
                          { icon: '"', action: () => setBlogBody(prev => `${prev}\n> `) },
                          { icon: '🔗', action: () => setBlogBody(prev => `${prev}[link text](url)`) },
                        ].map((tool, i) => (
                          <button
                            key={i}
                            onClick={tool.action}
                            className={`px-2 py-1 rounded text-xs hover:bg-[#2D3748] transition ${tool.bold ? 'font-bold' : ''} ${tool.italic ? 'italic' : ''} text-gray-400 hover:text-white`}
                          >
                            {tool.icon}
                          </button>
                        ))}
                        <div className="flex-1" />
                        <span className="text-[10px] text-gray-600 px-2 py-1">Markdown supported</span>
                      </div>

                      <textarea
                        value={blogBody}
                        onChange={(e) => setBlogBody(e.target.value)}
                        rows={12}
                        placeholder="Write your blog content here...

## Introduction
Start with a hook that grabs attention.

## Main Points
- Point 1
- Point 2
- Point 3

## Conclusion
End with a call to action."
                        className="w-full px-4 py-3 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-600 focus:border-[#39FF14]/50 outline-none resize-none font-mono leading-relaxed"
                      />
                    </div>

                    {/* Blog Distribution Preview */}
                    <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                      <p className="text-xs text-gray-400 mb-2">📤 This blog will be reformatted for:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Full Blog Post', 'Instagram Carousel', 'Twitter Thread', 'LinkedIn Article', 'Email Newsletter'].map(format => (
                          <span key={format} className="px-2 py-1 rounded-full bg-[#39FF14]/10 text-[#39FF14] text-xs">
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Preview */}
              <div className="w-[320px] bg-[#0D0D0D] p-4 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📱 Live Preview</h3>
                
                {/* Phone Frame */}
                <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2D3748] shadow-xl">
                  {/* Phone Header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#39FF14] to-[#0CE293] flex items-center justify-center text-black font-bold text-xs">G</div>
                      <div>
                        <p className="text-white text-xs font-semibold">GreenLine365</p>
                        <p className="text-gray-500 text-[10px]">Tampa, FL</p>
                      </div>
                    </div>
                    <span className="text-gray-500">•••</span>
                  </div>

                  {/* Image Preview */}
                  <div className="aspect-square bg-[#0D0D0D] rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-600">
                        <span className="text-3xl">🖼️</span>
                        <p className="text-xs mt-1">Image Preview</p>
                      </div>
                    )}
                  </div>

                  {/* Engagement Bar */}
                  <div className="flex items-center gap-3 px-1 mb-2">
                    <span className="text-lg">❤️</span>
                    <span className="text-lg">💬</span>
                    <span className="text-lg">📤</span>
                    <span className="text-lg ml-auto">🔖</span>
                  </div>

                  {/* Caption Preview */}
                  <div className="px-1 space-y-1.5">
                    <p className="text-white text-xs leading-relaxed">
                      <span className="font-semibold">greenline365</span>{' '}
                      {caption || title || 'Your caption will appear here...'}
                    </p>
                    
                    {/* Hashtags */}
                    <p className="text-[#39FF14] text-xs">{getAllHashtags()}</p>
                    
                    {/* Keywords */}
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="px-1.5 py-0.5 rounded bg-[#2D3748] text-gray-400 text-[10px]">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="px-1 mt-2 text-gray-600 text-[10px]">
                    Scheduled for {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {scheduledTime}
                  </p>
                </div>

                {/* Platform Badges */}
                <div className="mt-3 flex gap-2 justify-center">
                  {platforms.map((p) => (
                    <span key={p} className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p === 'instagram' ? 'bg-[#E4405F]/20 text-[#E4405F]'
                      : p === 'twitter' ? 'bg-white/20 text-white'
                      : 'bg-[#1877F2]/20 text-[#1877F2]'
                    }`}>
                      {p === 'instagram' ? 'Instagram' : p === 'twitter' ? 'X' : 'Facebook'}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Assistant Panel */}
              <AnimatePresence>
                {showAssistant && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 380, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#0A0A0A] border-l border-[#8A2BE2]/30 overflow-hidden flex flex-col"
                  >
                    <div className="h-full">
                      <ChatWidget 
                        embedded={true}
                        forceMode="creative"
                        onContentSuggestion={handleChatSuggestion}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-[#39FF14]/20 bg-[#0D0D0D] flex items-center justify-between">
              <button
                onClick={() => { resetForm(); onClose(); }}
                className="px-4 py-2 rounded-lg border border-[#2D3748] text-gray-400 hover:text-white hover:border-gray-600 transition text-sm font-medium"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {/* Save Message */}
                {saveMessage && (
                  <span className={`text-sm px-3 py-1 rounded-lg ${
                    saveMessage.type === 'success' 
                      ? 'bg-[#39FF14]/10 text-[#39FF14]' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {saveMessage.text}
                  </span>
                )}
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving || (!title.trim() && !blogTitle.trim() && !caption.trim())}
                  className="px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm font-medium hover:bg-[#2D3748] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>⏳ Saving...</>
                  ) : (
                    <>💾 Save Draft</>
                  )}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleScheduleBlast}
                  disabled={isSaving || (!title.trim() && !blogTitle.trim()) || platforms.length === 0}
                  className="px-5 py-2 rounded-lg bg-[#39FF14] text-black font-bold text-sm hover:bg-[#39FF14]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? '⏳...' : '🚀 SCHEDULE BLAST'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
