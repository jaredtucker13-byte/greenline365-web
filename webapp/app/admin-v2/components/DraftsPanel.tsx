'use client';

/**
 * DraftsPanel Component - Enhanced
 * Shows saved drafts and scheduled content with full actions
 * 
 * Features:
 * - Click to edit draft
 * - Action menu: Edit, Publish, Delete, Duplicate
 * - Last saved timestamp
 * - Error handling with retry
 * - Auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Draft {
  id: string;
  title: string;
  description: string;
  content_type: 'photo' | 'product' | 'blog';
  event_type: string;
  scheduled_date: string;
  platforms: string[];
  hashtags: string[];
  image_url: string | null;
  status: 'draft' | 'scheduled' | 'published';
  color: string;
  metadata: {
    keywords?: string[];
    fullContentData?: {
      caption?: string;
      imageUrl?: string;
      content?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

interface DraftsPanelProps {
  userId?: string;
  onEditDraft?: (draft: Draft) => void;
  onPublishDraft?: (draft: Draft) => void;
}

export default function DraftsPanel({ userId = 'demo-user', onEditDraft, onPublishDraft }: DraftsPanelProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scheduledContent, setScheduledContent] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drafts' | 'scheduled'>('drafts');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch drafts on mount
  useEffect(() => {
    fetchContent();
  }, [userId]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch drafts
      const draftsRes = await fetch(`/api/drafts?userId=${userId}&status=draft`);
      const draftsData = await draftsRes.json();
      
      // Fetch scheduled
      const scheduledRes = await fetch(`/api/drafts?userId=${userId}&status=scheduled`);
      const scheduledData = await scheduledRes.json();
      
      if (draftsData.success) setDrafts(draftsData.drafts || []);
      if (scheduledData.success) setScheduledContent(scheduledData.drafts || []);
      setRetryCount(0);
      
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchContent();
  }, []);

  const handleItemClick = (item: Draft, e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-button')) return;
    
    if (onEditDraft) {
      onEditDraft(item);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/drafts?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDrafts(drafts.filter(d => d.id !== id));
        setScheduledContent(scheduledContent.filter(d => d.id !== id));
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  const handleDuplicate = async (item: Draft, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(item.id);
    
    try {
      const duplicatedDraft = {
        ...item,
        id: undefined,
        title: `${item.title} (Copy)`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...duplicatedDraft, userId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.draft) {
          setDrafts(prev => [data.draft, ...prev]);
        }
        fetchContent(); // Refresh to get accurate data
      }
    } catch (err) {
      console.error('Duplicate failed:', err);
      alert('Failed to duplicate. Please try again.');
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  const handlePublish = async (item: Draft, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onPublishDraft) {
      onPublishDraft(item);
      setActionMenuOpen(null);
      return;
    }
    
    setActionLoading(item.id);
    try {
      const res = await fetch('/api/drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: item.id, 
          userId, 
          status: 'published',
          updated_at: new Date().toISOString(),
        }),
      });
      
      if (res.ok) {
        setDrafts(drafts.filter(d => d.id !== item.id));
        alert('Published successfully!');
      }
    } catch (err) {
      console.error('Publish failed:', err);
      alert('Failed to publish. Please try again.');
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  const handleEdit = (item: Draft, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMenuOpen(null);
    if (onEditDraft) {
      onEditDraft(item);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return '📸';
      case 'product': return '🛍️';
      case 'blog': return '📝';
      default: return '📄';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📷';
      case 'twitter': return '𝕏';
      case 'facebook': return '📘';
      default: return '🌐';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const currentItems = activeTab === 'drafts' ? drafts : scheduledContent;

  return (
    <div className="bg-[#0D0D0D] rounded-2xl border border-[#2D3748] overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3748]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
              activeTab === 'drafts'
                ? 'bg-[#39FF14]/20 text-[#39FF14]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📝 Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
              activeTab === 'scheduled'
                ? 'bg-[#39FF14]/20 text-[#39FF14]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📅 Scheduled ({scheduledContent.length})
          </button>
        </div>
        <button
          onClick={fetchContent}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition active:scale-95 disabled:opacity-50"
          title="Refresh"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <span className="animate-pulse">Loading drafts...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-3">❌ {error}</div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition active:scale-95"
            >
              🔄 Retry {retryCount > 0 && `(${retryCount})`}
            </button>
            <p className="text-gray-500 text-xs mt-2">Error ID: {Date.now().toString(36)}</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">
              {activeTab === 'drafts' ? '📄' : '📅'}
            </span>
            <p className="text-gray-400 text-sm">
              {activeTab === 'drafts' 
                ? 'No drafts yet. Create content and save as draft!'
                : 'No scheduled content yet. Schedule your first post!'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {currentItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={(e) => handleItemClick(item, e)}
                  className="group relative bg-[#1A1A1A] rounded-xl p-3 border border-[#2D3748] hover:border-[#39FF14]/30 transition cursor-pointer active:scale-[0.99]"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onEditDraft?.(item)}
                  aria-label={`Edit draft: ${item.title || 'Untitled'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail or icon */}
                    <div className="w-12 h-12 rounded-lg bg-[#2D3748] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{getContentTypeIcon(item.content_type)}</span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate group-hover:text-[#39FF14] transition">
                            {item.title || 'Untitled Draft'}
                          </h4>
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                            {item.description || 'No description'}
                          </p>
                        </div>
                        
                        {/* Action Menu */}
                        <div className="relative action-button">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(actionMenuOpen === item.id ? null : item.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#39FF14]/10 text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                            aria-label="Actions menu"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          
                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {actionMenuOpen === item.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 top-8 w-36 bg-[#1A1A1A] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleEdit(item, e)}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#39FF14]/10 hover:text-[#39FF14] transition flex items-center gap-2"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={(e) => handlePublish(item, e)}
                                  disabled={actionLoading === item.id}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-green-500/10 hover:text-green-400 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                  {actionLoading === item.id ? '⏳' : '🚀'} Publish
                                </button>
                                <button
                                  onClick={(e) => handleDuplicate(item, e)}
                                  disabled={actionLoading === item.id}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-blue-500/10 hover:text-blue-400 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                  {actionLoading === item.id ? '⏳' : '📋'} Duplicate
                                </button>
                                <div className="border-t border-[#2D3748]" />
                                <button
                                  onClick={(e) => handleDelete(item.id, e)}
                                  disabled={actionLoading === item.id}
                                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                  {actionLoading === item.id ? '⏳' : '🗑️'} Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Status badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.status === 'draft' 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : item.status === 'scheduled'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                        
                        {/* Platforms */}
                        {item.platforms?.length > 0 && (
                          <div className="flex gap-0.5">
                            {item.platforms.map((p) => (
                              <span key={p} className="text-xs" title={p}>
                                {getPlatformIcon(p)}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Last saved */}
                        <span className="text-gray-500 text-[10px]" title={formatDate(item.updated_at)}>
                          💾 {getTimeAgo(item.updated_at)}
                        </span>
                        
                        {/* Scheduled date */}
                        {activeTab === 'scheduled' && item.scheduled_date && (
                          <span className="text-blue-400 text-[10px]">
                            📅 {formatDate(item.scheduled_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* No image indicator for content that could have an image */}
                  {!item.image_url && item.content_type !== 'blog' && (
                    <div className="mt-2 pt-2 border-t border-[#2D3748]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // This would trigger image generation
                          alert('Image generation coming soon!');
                        }}
                        className="action-button w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-300 text-xs hover:from-purple-500/20 hover:to-pink-500/20 transition flex items-center justify-center gap-1"
                      >
                        🖼️ Generate Image with Nano Banana
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Quick tip */}
      <div className="px-4 py-2 border-t border-[#2D3748] bg-[#0D0D0D]/50">
        <p className="text-gray-500 text-[10px] text-center">
          💡 Press <kbd className="px-1 py-0.5 bg-[#2D3748] rounded text-gray-400">Enter</kbd> to edit • Click anywhere on draft to open
        </p>
      </div>
    </div>
  );
}
