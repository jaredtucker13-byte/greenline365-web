'use client';

/**
 * DraftsPanel Component
 * Shows saved drafts and scheduled content
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Draft {
  id: string;
  title: string;
  content_type: 'photo' | 'product' | 'blog';
  content_data: {
    caption?: string;
    imageUrl?: string;
    keywords?: string[];
    hashtags?: {
      brand: string;
      local: string;
      optional: string[];
    };
  };
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at: string | null;
  platforms: string[];
  created_at: string;
}

interface DraftsPanelProps {
  userId?: string;
  onEditDraft?: (draft: Draft) => void;
}

export default function DraftsPanel({ userId = 'demo-user', onEditDraft }: DraftsPanelProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scheduledContent, setScheduledContent] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drafts' | 'scheduled'>('drafts');
  const [error, setError] = useState<string | null>(null);

  // Fetch drafts on mount
  useEffect(() => {
    fetchContent();
  }, [userId]);

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
      
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    
    try {
      const res = await fetch(`/api/drafts?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Remove from local state
        setDrafts(drafts.filter(d => d.id !== id));
        setScheduledContent(scheduledContent.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
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

  const currentItems = activeTab === 'drafts' ? drafts : scheduledContent;

  return (
    <div className="bg-[#0D0D0D] rounded-2xl border border-[#2D3748] overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3748]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'drafts'
                ? 'bg-[#39FF14]/20 text-[#39FF14]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📝 Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'scheduled'
                ? 'bg-[#39FF14]/20 text-[#39FF14]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📅 Scheduled ({scheduledContent.length})
          </button>
        </div>
        <button
          onClick={fetchContent}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] text-gray-400 hover:text-white transition"
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <span className="animate-pulse">Loading...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            {error}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">
              {activeTab === 'drafts' ? '📄' : '📅'}
            </span>
            <p className="text-gray-400 text-sm">
              {activeTab === 'drafts' 
                ? 'No drafts yet. Create content and save as draft!'
                : 'No scheduled content yet. Schedule your first blast!'}
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
                  className="group relative bg-[#1A1A1A] rounded-xl p-3 border border-[#2D3748] hover:border-[#39FF14]/30 transition"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail or icon */}
                    <div className="w-12 h-12 rounded-lg bg-[#2D3748] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.content_data?.imageUrl ? (
                        <img 
                          src={item.content_data.imageUrl} 
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
                        <div>
                          <h4 className="text-white text-sm font-medium truncate">
                            {item.title || 'Untitled'}
                          </h4>
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                            {item.content_data?.caption || 'No caption'}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {onEditDraft && (
                            <button
                              onClick={() => onEditDraft(item)}
                              className="p-1.5 rounded-lg hover:bg-[#39FF14]/10 text-gray-400 hover:text-[#39FF14] transition"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-2 mt-2">
                        {/* Platforms */}
                        <div className="flex gap-0.5">
                          {item.platforms?.map((p) => (
                            <span key={p} className="text-xs" title={p}>
                              {getPlatformIcon(p)}
                            </span>
                          ))}
                        </div>
                        
                        {/* Date */}
                        <span className="text-gray-500 text-xs">
                          {activeTab === 'scheduled' && item.scheduled_at
                            ? `📅 ${formatDate(item.scheduled_at)}`
                            : formatDate(item.created_at)}
                        </span>
                        
                        {/* Keywords count */}
                        {item.content_data?.keywords && item.content_data.keywords.length > 0 && (
                          <span className="text-gray-500 text-xs">
                            🏷️ {item.content_data.keywords.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
