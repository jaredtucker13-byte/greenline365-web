'use client';

/**
 * ContentForge Modal Component
 * GreenLine365 Admin V2 - Tactical Multi-Command Center
 * 
 * The Ultimate Content Router featuring:
 * - Photo vs Product toggle
 * - Campaign Title, Image URL, Post Description inputs
 * - AI Hashtag Generator
 * - Social platform selection (Instagram, X, Facebook)
 * - SCHEDULE BLAST action button
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ContentForgeProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSchedule: (content: ContentData) => void;
}

interface ContentData {
  type: 'photo' | 'product';
  title: string;
  imageUrl: string;
  description: string;
  hashtags: string[];
  platforms: ('instagram' | 'twitter' | 'facebook')[];
  scheduledDate: string;
}

export default function ContentForge({ isOpen, onClose, selectedDate, onSchedule }: ContentForgeProps) {
  const [contentType, setContentType] = useState<'photo' | 'product'>('photo');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<('instagram' | 'twitter' | 'facebook')[]>(['instagram']);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState(
    selectedDate ? selectedDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  const togglePlatform = (platform: 'instagram' | 'twitter' | 'facebook') => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const generateHashtags = async () => {
    if (!description.trim()) return;
    
    setIsGeneratingHashtags(true);
    // Simulate AI hashtag generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const suggestedHashtags = [
      '#GreenLine365',
      '#BusinessGrowth',
      '#AIAutomation',
      '#DigitalMarketing',
      '#SmallBusiness',
      '#ContentCreation',
      '#SocialMediaMarketing',
      '#TampaBusiness',
    ];
    
    setHashtags(suggestedHashtags.slice(0, 6));
    setIsGeneratingHashtags(false);
  };

  const handleSchedule = () => {
    onSchedule({
      type: contentType,
      title,
      imageUrl,
      description,
      hashtags,
      platforms,
      scheduledDate: scheduledDateTime,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setDescription('');
    setHashtags([]);
    setPlatforms(['instagram']);
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#1A1A1A] border border-[#39FF14]/30 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(57,255,20,0.15)]"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#39FF14]/20 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-[#39FF14]">⚡</span> Content Forge
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Drafting for {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#1E262E] border border-[#2D3748] hover:border-[#39FF14]/30 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Content Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setContentType('photo')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      contentType === 'photo'
                        ? 'border-[#8A2BE2] bg-[#8A2BE2]/20 text-white'
                        : 'border-[#2D3748] bg-[#1E262E] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg mr-2">📸</span> Photo
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setContentType('product')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      contentType === 'product'
                        ? 'border-[#8A2BE2] bg-[#8A2BE2]/20 text-white'
                        : 'border-[#2D3748] bg-[#1E262E] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg mr-2">🛍️</span> Product
                  </motion.button>
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter campaign title..."
                  className="w-full px-4 py-3 rounded-xl bg-[#1E262E] border border-[#2D3748] text-white placeholder:text-gray-500 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 rounded-xl bg-[#1E262E] border border-[#2D3748] text-white placeholder:text-gray-500 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition"
                />
              </div>

              {/* Post Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Post Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Write your post caption..."
                  className="w-full px-4 py-3 rounded-xl bg-[#1E262E] border border-[#2D3748] text-white placeholder:text-gray-500 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition resize-none"
                />
              </div>

              {/* AI Hashtag Generator */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">AI Hashtag Generator</label>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateHashtags}
                    disabled={isGeneratingHashtags || !description.trim()}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#39FF14] text-black text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingHashtags ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span>🧠</span> Generate Hashtags
                      </>
                    )}
                  </motion.button>
                </div>
                <div className="min-h-[60px] p-3 rounded-xl bg-[#1E262E] border border-[#2D3748]">
                  {hashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hashtags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-2 py-1 rounded-full bg-[#39FF14]/20 text-[#39FF14] text-sm flex items-center gap-1 cursor-pointer hover:bg-[#39FF14]/30 transition"
                          onClick={() => removeHashtag(tag)}
                        >
                          {tag}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Generated hashtags will appear here...</p>
                  )}
                </div>
              </div>

              {/* Schedule DateTime */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E262E] border border-[#2D3748] text-white focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Publish To</label>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePlatform('instagram')}
                    className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      platforms.includes('instagram')
                        ? 'border-[#E4405F] bg-[#E4405F]/20 text-white'
                        : 'border-[#2D3748] bg-[#1E262E] text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePlatform('twitter')}
                    className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      platforms.includes('twitter')
                        ? 'border-white bg-white/20 text-white'
                        : 'border-[#2D3748] bg-[#1E262E] text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePlatform('facebook')}
                    className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      platforms.includes('facebook')
                        ? 'border-[#1877F2] bg-[#1877F2]/20 text-white'
                        : 'border-[#2D3748] bg-[#1E262E] text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-[#39FF14]/20 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 rounded-xl border border-[#2D3748] text-gray-400 hover:text-white hover:border-gray-600 transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(57, 255, 20, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSchedule}
                disabled={!title.trim() || platforms.length === 0}
                className="flex-1 py-3 px-6 rounded-xl bg-[#39FF14] text-black font-bold hover:bg-[#39FF14]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🚀</span> SCHEDULE BLAST
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
