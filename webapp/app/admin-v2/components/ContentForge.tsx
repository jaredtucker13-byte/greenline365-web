'use client';

/**
 * ContentForge Modal Component - ENHANCED
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * Features:
 * - Live Preview Panel
 * - AI Caption Generator
 * - AI Keywords Generator  
 * - AI Product Description (for products)
 * - Smart Hashtag System (2 Standard + 3 Optional)
 * - Blog Content Creation
 * - Full user control over all AI suggestions
 * - Photo upload with drag & drop
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface ContentForgeProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSchedule: (content: ContentData) => void;
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

export default function ContentForge({ isOpen, onClose, selectedDate, onSchedule }: ContentForgeProps) {
  // Content Type
  const [contentType, setContentType] = useState<'photo' | 'product' | 'blog'>('photo');
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // AI-Generated Fields (all editable)
  const [caption, setCaption] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [productDescription, setProductDescription] = useState('');
  
  // Hashtag System
  const [brandHashtag, setBrandHashtag] = useState('#GreenLine365');
  const [localHashtag, setLocalHashtag] = useState('#TampaBusiness');
  const [optionalHashtags, setOptionalHashtags] = useState<string[]>(['', '', '']);
  
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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'hashtags' | 'blog'>('content');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [scheduledDateTime, setScheduledDateTime] = useState(
    selectedDate ? selectedDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

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

  // Update datetime when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setScheduledDateTime(selectedDate.toISOString().slice(0, 16));
    }
  }, [selectedDate]);

  const togglePlatform = (platform: 'instagram' | 'twitter' | 'facebook') => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // AI Generation Functions - Real API calls via OpenRouter
  const generateCaption = async () => {
    if (!title.trim() && !imagePreview) return;
    setIsGeneratingCaption(true);
    
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
      // Fallback to sample caption
      setCaption(`✨ ${title || 'Check this out!'}\n\nYour success story starts here. Let's make it happen together! 🚀`);
    }
    
    setIsGeneratingCaption(false);
  };

  const generateKeywords = async () => {
    if (!title.trim() && !caption.trim()) return;
    setIsGeneratingKeywords(true);
    
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
        setKeywords(data.data.keywords.slice(0, 8));
      }
    } catch (error) {
      console.error('Keywords generation error:', error);
      setKeywords(['business growth', 'local business', 'tampa', 'small business', 'entrepreneur']);
    }
    
    setIsGeneratingKeywords(false);
  };

  const generateProductDescription = async () => {
    if (!title.trim()) return;
    setIsGeneratingDescription(true);
    
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

  // Generate smart hashtags using AI
  const generateSmartHashtags = async () => {
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
        // Update standard hashtags if we got them
        if (data.data.standard && data.data.standard.length > 0) {
          setLocalHashtag(data.data.standard[1] || '#TampaBusiness');
        }
        // Update optional hashtags
        if (data.data.optional && data.data.optional.length > 0) {
          const newOptional = data.data.optional.slice(0, 3);
          setOptionalHashtags([
            newOptional[0] || '',
            newOptional[1] || '',
            newOptional[2] || ''
          ]);
        }
      }
    } catch (error) {
      console.error('Hashtag generation error:', error);
    }
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
        optional: optionalHashtags.filter(h => h.trim()),
      },
      platforms,
      scheduledDate: scheduledDateTime,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setImagePreview(null);
    setCaption('');
    setKeywords([]);
    setProductDescription('');
    setBlogTitle('');
    setBlogBody('');
    setBlogSeoDescription('');
    setOptionalHashtags(['', '', '']);
    setPlatforms(['instagram']);
  };

  // File handling
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
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
    reader.onload = (e) => setImagePreview(e.target?.result as string);
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

  const updateOptionalHashtag = (index: number, value: string) => {
    const newHashtags = [...optionalHashtags];
    newHashtags[index] = value.startsWith('#') ? value : (value ? `#${value}` : '');
    setOptionalHashtags(newHashtags);
  };

  // Get all active hashtags for preview
  const getAllHashtags = () => {
    const all = [brandHashtag, localHashtag, ...optionalHashtags.filter(h => h.trim())];
    return all.join(' ');
  };

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
                <span className="text-xs text-gray-400">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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

            {/* Main Content - Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 border-r border-[#1E262E]">
                
                {activeTab === 'content' && (
                  <>
                    {/* Content Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Content Type</label>
                      <div className="flex gap-2">
                        {(['photo', 'product', 'blog'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setContentType(type)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
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

                    {/* Image Upload */}
                    {contentType !== 'blog' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          {contentType === 'product' ? 'Product Image' : 'Upload Image'}
                        </label>
                        {imagePreview ? (
                          <div className="relative rounded-lg overflow-hidden border border-[#39FF14]/30 h-32">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => { setImagePreview(null); setImageUrl(''); }}
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
                            className={`h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition ${
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
                                <span className="text-2xl">📤</span>
                                <p className="text-xs text-gray-400 mt-1">Click or drag to upload</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Caption Generator */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-400">AI Caption</label>
                        <button
                          onClick={generateCaption}
                          disabled={isGeneratingCaption}
                          className="px-2 py-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-xs font-semibold disabled:opacity-50"
                        >
                          {isGeneratingCaption ? '⏳ Generating...' : '🧠 Generate'}
                        </button>
                      </div>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                        placeholder="Write or generate a caption..."
                        className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none resize-none"
                      />
                    </div>

                    {/* AI Keywords */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-400">Keywords</label>
                        <button
                          onClick={generateKeywords}
                          disabled={isGeneratingKeywords}
                          className="px-2 py-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-xs font-semibold disabled:opacity-50"
                        >
                          {isGeneratingKeywords ? '⏳...' : '🧠 Generate'}
                        </button>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                          placeholder="Add keyword..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none"
                        />
                        <button onClick={addKeyword} className="px-3 py-1.5 rounded-lg bg-[#39FF14]/20 text-[#39FF14] text-sm font-medium">+</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {keywords.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-[#39FF14]/10 text-[#39FF14] text-xs flex items-center gap-1">
                            {kw}
                            <button onClick={() => removeKeyword(kw)} className="hover:text-red-400">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Product Description (for products only) */}
                    {contentType === 'product' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-400">Product Description</label>
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
                  </>
                )}

                {activeTab === 'hashtags' && (
                  <>
                    {/* AI Generate Button */}
                    <button
                      onClick={generateSmartHashtags}
                      className="w-full mb-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#39FF14]/20 to-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-sm font-medium hover:from-[#39FF14]/30 hover:to-[#39FF14]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <span>✨</span> Generate Smart Hashtags with AI
                    </button>

                    {/* Standard Hashtags */}
                    <div className="p-3 rounded-lg bg-[#39FF14]/5 border border-[#39FF14]/20">
                      <h3 className="text-sm font-semibold text-[#39FF14] mb-3">📌 Standard Hashtags (Always Included)</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Brand Hashtag</label>
                          <input
                            type="text"
                            value={brandHashtag}
                            onChange={(e) => setBrandHashtag(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#39FF14]/30 text-[#39FF14] text-sm focus:border-[#39FF14] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Hyper-Local Hashtag</label>
                          <input
                            type="text"
                            value={localHashtag}
                            onChange={(e) => setLocalHashtag(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#39FF14]/30 text-[#39FF14] text-sm focus:border-[#39FF14] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Hashtags */}
                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2D3748]">
                      <h3 className="text-sm font-semibold text-white mb-3">🎯 Optional Hashtags (Customize per post)</h3>
                      <p className="text-xs text-gray-500 mb-3">Add up to 3 additional hashtags. Mix & match across platforms as needed.</p>
                      <div className="space-y-2">
                        {optionalHashtags.map((hashtag, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-4">{index + 1}.</span>
                            <input
                              type="text"
                              value={hashtag}
                              onChange={(e) => updateOptionalHashtag(index, e.target.value)}
                              placeholder={`Optional hashtag ${index + 1}...`}
                              className="flex-1 px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#2D3748] text-white text-sm placeholder:text-gray-600 focus:border-[#39FF14]/50 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hashtag Preview */}
                    <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Preview (3-5 hashtags)</h3>
                      <p className="text-sm text-[#39FF14]">{getAllHashtags() || 'Add hashtags above...'}</p>
                    </div>
                  </>
                )}

                {activeTab === 'blog' && (
                  <>
                    {/* Blog Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Blog Title</label>
                      <input
                        type="text"
                        value={blogTitle}
                        onChange={(e) => setBlogTitle(e.target.value)}
                        placeholder="Enter blog title..."
                        className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none"
                      />
                    </div>

                    {/* Blog Content Generator */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-400">Blog Content</label>
                        <button
                          onClick={generateBlogContent}
                          disabled={isGeneratingBlog || !blogTitle.trim()}
                          className="px-2 py-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-xs font-semibold disabled:opacity-50"
                        >
                          {isGeneratingBlog ? '⏳ Generating...' : '🧠 Generate Blog'}
                        </button>
                      </div>
                      <textarea
                        value={blogBody}
                        onChange={(e) => setBlogBody(e.target.value)}
                        rows={10}
                        placeholder="Write your blog content here... (Markdown supported)"
                        className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none resize-none font-mono"
                      />
                    </div>

                    {/* SEO Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">SEO Description</label>
                      <textarea
                        value={blogSeoDescription}
                        onChange={(e) => setBlogSeoDescription(e.target.value)}
                        rows={2}
                        placeholder="Meta description for search engines..."
                        className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm placeholder:text-gray-500 focus:border-[#39FF14]/50 outline-none resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{blogSeoDescription.length}/160 characters</p>
                    </div>
                  </>
                )}

                {/* Platform Selection & Schedule - Always visible */}
                <div className="pt-3 border-t border-[#1E262E]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Publish To</label>
                      <div className="flex gap-1">
                        {(['instagram', 'twitter', 'facebook'] as const).map((platform) => (
                          <button
                            key={platform}
                            onClick={() => togglePlatform(platform)}
                            className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
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
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Schedule</label>
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-xs focus:border-[#39FF14]/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="w-[380px] bg-[#0D0D0D] p-4 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📱 Live Preview</h3>
                
                {/* Phone Frame */}
                <div className="bg-[#1A1A1A] rounded-3xl p-3 border border-[#2D3748] shadow-xl">
                  {/* Phone Header */}
                  <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39FF14] to-[#0CE293] flex items-center justify-center text-black font-bold text-xs">G</div>
                      <div>
                        <p className="text-white text-xs font-semibold">GreenLine365</p>
                        <p className="text-gray-500 text-[10px]">Tampa, FL</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-lg">•••</span>
                  </div>

                  {/* Image Preview */}
                  <div className="aspect-square bg-[#0D0D0D] rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-600">
                        <span className="text-4xl">🖼️</span>
                        <p className="text-xs mt-2">Image Preview</p>
                      </div>
                    )}
                  </div>

                  {/* Engagement Bar */}
                  <div className="flex items-center gap-4 px-2 mb-3">
                    <span className="text-xl">❤️</span>
                    <span className="text-xl">💬</span>
                    <span className="text-xl">📤</span>
                    <span className="text-xl ml-auto">🔖</span>
                  </div>

                  {/* Caption Preview */}
                  <div className="px-2 space-y-2">
                    <p className="text-white text-xs">
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

                    {/* Product Description */}
                    {contentType === 'product' && productDescription && (
                      <div className="p-2 rounded-lg bg-[#0D0D0D] border border-[#2D3748]">
                        <p className="text-gray-400 text-xs">{productDescription.slice(0, 100)}...</p>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="px-2 mt-3 text-gray-600 text-[10px]">
                    Scheduled for {new Date(scheduledDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>

                {/* Platform Badges */}
                <div className="mt-4 flex gap-2 justify-center">
                  {platforms.map((p) => (
                    <span key={p} className={`px-3 py-1 rounded-full text-xs font-medium ${
                      p === 'instagram' ? 'bg-[#E4405F]/20 text-[#E4405F]'
                      : p === 'twitter' ? 'bg-white/20 text-white'
                      : 'bg-[#1877F2]/20 text-[#1877F2]'
                    }`}>
                      {p === 'instagram' ? 'Instagram' : p === 'twitter' ? 'X' : 'Facebook'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-[#39FF14]/20 bg-[#0D0D0D] flex items-center justify-between">
              <button
                onClick={() => { resetForm(); onClose(); }}
                className="px-6 py-2 rounded-lg border border-[#2D3748] text-gray-400 hover:text-white hover:border-gray-600 transition text-sm font-medium"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { /* Save as draft */ }}
                  className="px-6 py-2 rounded-lg bg-[#1A1A1A] border border-[#2D3748] text-white text-sm font-medium hover:bg-[#2D3748] transition"
                >
                  💾 Save Draft
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSchedule}
                  disabled={!title.trim() && !blogTitle.trim() || platforms.length === 0}
                  className="px-6 py-2 rounded-lg bg-[#39FF14] text-black font-bold text-sm hover:bg-[#39FF14]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  🚀 SCHEDULE BLAST
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
