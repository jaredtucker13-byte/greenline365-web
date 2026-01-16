'use client';

/**
 * Editable Region Component
 * 
 * Wraps content that can be edited by God Mode admins.
 * Shows a pencil icon on hover when edit mode is enabled.
 * 
 * Usage:
 * <EditableRegion pageSlug="home" regionKey="hero_title" type="text">
 *   <h1>Default Content Here</h1>
 * </EditableRegion>
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Check, Image as ImageIcon, Type, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAdminEditMode } from './AdminEditModeContext';

interface EditableRegionProps {
  pageSlug: string;
  regionKey: string;
  type: 'text' | 'rich_text' | 'image';
  children: ReactNode;
  className?: string;
  imageClassName?: string;
  businessId?: string | null;
}

interface SiteContent {
  id: string;
  content: string | null;
  image_url: string | null;
  image_alt: string | null;
}

export function EditableRegion({
  pageSlug,
  regionKey,
  type,
  children,
  className = '',
  imageClassName = '',
  businessId = null,
}: EditableRegionProps) {
  const { isAdmin, isEditMode } = useAdminEditMode();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadContent();
  }, [pageSlug, regionKey, businessId]);

  const loadContent = async () => {
    try {
      let query = supabase
        .from('site_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('region_key', regionKey);

      if (businessId) {
        query = query.eq('business_id', businessId);
      } else {
        query = query.is('business_id', null);
      }

      const { data } = await query.single();
      
      if (data) {
        setContent(data);
        setEditValue(data.content || data.image_url || '');
      }
    } catch (error) {
      // Content doesn't exist yet
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditValue(content?.content || content?.image_url || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload: any = {
        page_slug: pageSlug,
        region_key: regionKey,
        content_type: type,
      };

      if (businessId) {
        payload.business_id = businessId;
      }

      if (type === 'image') {
        payload.image_url = editValue;
      } else {
        payload.content = editValue;
      }

      const response = await fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Save failed');

      const result = await response.json();
      setContent(result.content);
      setIsEditing(false);

    } catch (error) {
      console.error('[EditableRegion] Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(content?.content || content?.image_url || '');
    setIsEditing(false);
  };

  // Render content (from DB or fallback to children)
  const renderContent = () => {
    if (type === 'image' && content?.image_url) {
      return (
        <img 
          src={content.image_url} 
          alt={content.image_alt || ''} 
          className={imageClassName}
        />
      );
    }

    if ((type === 'text' || type === 'rich_text') && content?.content) {
      if (React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, {}, content.content);
      }
      return content.content;
    }

    return children;
  };

  // Not in edit mode or not admin - just render content
  if (!mounted || !isAdmin || !isEditMode) {
    return <>{renderContent()}</>;
  }

  return (
    <div
      className={`editable-region relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-editable={`${pageSlug}:${regionKey}`}
    >
      {renderContent()}

      {/* Hover Overlay */}
      <AnimatePresence>
        {isHovered && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-40"
          >
            {/* Dashed border */}
            <div className="absolute inset-0 border-2 border-dashed border-purple-500/60 rounded-lg bg-purple-500/5" />
            
            {/* Region label */}
            <div className="absolute -top-6 left-0 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded">
              {regionKey.replace(/_/g, ' ')}
            </div>
            
            {/* Edit button */}
            <button
              onClick={handleEdit}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-500 text-white shadow-lg flex items-center justify-center pointer-events-auto hover:bg-purple-600 hover:scale-110 transition-all z-50"
              title="Edit this content"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {isEditing && mounted && createPortal(
        <EditModal
          type={type}
          value={editValue}
          onChange={setEditValue}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
          regionKey={regionKey}
        />,
        document.body
      )}
    </div>
  );
}

// Edit Modal Component
function EditModal({ 
  type, 
  value, 
  onChange, 
  onSave, 
  onCancel, 
  isSaving, 
  regionKey 
}: {
  type: 'text' | 'rich_text' | 'image';
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  regionKey: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              {type === 'image' ? (
                <ImageIcon className="w-4 h-4 text-purple-400" />
              ) : (
                <Type className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <div>
              <span className="font-semibold text-white">Edit Content</span>
              <span className="text-white/50 text-sm ml-2">{regionKey.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {type === 'image' ? (
            <div className="space-y-4">
              {value && (
                <div className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  <img src={value} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative">
                <input
                  type="url"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Enter image URL..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none pr-12"
                />
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 text-white/50"
                  title="Upload image (coming soon)"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : type === 'rich_text' ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none font-mono text-sm"
              placeholder="Enter content... (HTML supported)"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none text-lg"
              placeholder="Enter text..."
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') onSave(); }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <span className="text-xs text-white/40">
            Press Enter to save • Esc to cancel
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EditableRegion;
