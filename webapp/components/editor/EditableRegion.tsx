'use client';

/**
 * Editable Region Component
 * 
 * Wraps content that can be edited by God Mode admins.
 * Shows a pencil icon on hover that opens an inline editor.
 * 
 * Usage:
 * <EditableRegion pageSlug="home" regionKey="hero_title" type="text">
 *   <h1>Default Content Here</h1>
 * </EditableRegion>
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Check, Image as ImageIcon, Type, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface EditableRegionProps {
  pageSlug: string;
  regionKey: string;
  type: 'text' | 'rich_text' | 'image';
  children: ReactNode;
  className?: string;
  imageClassName?: string;  // For image type - applied to img tag
  businessId?: string | null;  // null = global content
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mounted, setMounted] = useState(false);

  // Check if user is admin on mount
  useEffect(() => {
    setMounted(true);
    checkAdminStatus();
    loadContent();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.is_admin || false);
    } catch (error) {
      console.error('[EditableRegion] Admin check error:', error);
    }
  };

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
      // Content doesn't exist yet, that's okay
    }
  };

  const handleEdit = () => {
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
        last_edited_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (businessId) {
        payload.business_id = businessId;
      }

      if (type === 'image') {
        payload.image_url = editValue;
      } else {
        payload.content = editValue;
      }

      // Call API to save
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

  // Render the actual content (either from DB or children as fallback)
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
      // Clone children and replace text content
      if (React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, {}, content.content);
      }
      return content.content;
    }

    // Default to children
    return children;
  };

  // Don't show edit UI if not admin or not mounted
  if (!mounted || !isAdmin) {
    return <>{renderContent()}</>;
  }

  return (
    <div
      className={`editable-region relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-editable-region={`${pageSlug}:${regionKey}`}
    >
      {renderContent()}

      {/* Hover Overlay with Pencil */}
      <AnimatePresence>
        {isHovered && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Border highlight */}
            <div className="absolute inset-0 border-2 border-dashed border-purple-500/50 rounded-lg" />
            
            {/* Pencil button */}
            <button
              onClick={handleEdit}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-500 text-white shadow-lg flex items-center justify-center pointer-events-auto hover:bg-purple-600 transition z-50"
              title={`Edit ${regionKey}`}
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
interface EditModalProps {
  type: 'text' | 'rich_text' | 'image';
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  regionKey: string;
}

function EditModal({ type, value, onChange, onSave, onCancel, isSaving, regionKey }: EditModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {type === 'image' ? (
              <ImageIcon className="w-5 h-5 text-purple-400" />
            ) : (
              <Type className="w-5 h-5 text-purple-400" />
            )}
            <span className="font-medium text-white">Edit: {regionKey.replace(/_/g, ' ')}</span>
          </div>
          <button onClick={onCancel} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {type === 'image' ? (
            <div className="space-y-4">
              {value && (
                <div className="aspect-video rounded-lg overflow-hidden bg-white/5">
                  <img src={value} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter image URL..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
              />
              <p className="text-xs text-white/40">
                Tip: Upload images to Supabase Storage and paste the URL here
              </p>
            </div>
          ) : type === 'rich_text' ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
              placeholder="Enter content..."
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
              placeholder="Enter text..."
              autoFocus
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-white/5">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EditableRegion;
