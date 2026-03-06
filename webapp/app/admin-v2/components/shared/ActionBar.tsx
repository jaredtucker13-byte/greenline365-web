'use client';

/**
 * ActionBar - Floating bottom toolbar for content creation pages.
 *
 * Provides quick actions: Copy, Share, Export (PDF/PNG/JPG), Save Draft, Publish.
 * Only rendered on content-creation pages (Content Forge, Blog Polish, Creative Studio, Ingredients).
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Share2, Save, Send, Check, Loader2,
  Download, FileText, Image as ImageIcon, Printer,
  X, Clipboard,
} from 'lucide-react';
import ExportMenu from './ExportMenu';

// ─── Types ──────────────────────────────────────────────────────────

export interface ActionBarProps {
  /** Text content to copy (if applicable) */
  copyContent?: string;
  /** Ref to the element to export as image/PDF */
  exportTargetRef?: React.RefObject<HTMLElement | null>;
  /** Direct image URL for export */
  exportImageUrl?: string;
  /** Title for exported files */
  exportTitle?: string;
  /** Whether a save action is available */
  onSave?: () => void | Promise<void>;
  /** Whether a publish action is available */
  onPublish?: () => void | Promise<void>;
  /** Custom label for save button */
  saveLabel?: string;
  /** Custom label for publish button */
  publishLabel?: string;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether publish is in progress */
  isPublishing?: boolean;
  /** Share URL */
  shareUrl?: string;
  /** Share title */
  shareTitle?: string;
  /** Extra actions to render */
  extraActions?: React.ReactNode;
  /** Whether to show copy button */
  showCopy?: boolean;
  /** Whether to show share button */
  showShare?: boolean;
  /** Whether to show export menu */
  showExport?: boolean;
  /** Additional class names */
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────

export default function ActionBar({
  copyContent,
  exportTargetRef,
  exportImageUrl,
  exportTitle = 'GreenLine365 Export',
  onSave,
  onPublish,
  saveLabel = 'Save Draft',
  publishLabel = 'Publish',
  isSaving = false,
  isPublishing = false,
  shareUrl,
  shareTitle,
  extraActions,
  showCopy = true,
  showShare = true,
  showExport = true,
  className = '',
}: ActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    if (!copyContent) return;
    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = copyContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle || 'Check this out',
          url: shareUrl || window.location.href,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.5 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ${className}`}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#141419]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        {/* Copy */}
        {showCopy && copyContent && (
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}

        {/* Share */}
        {showShare && (
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              shared
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Share"
          >
            {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {shared ? 'Shared' : 'Share'}
          </button>
        )}

        {/* Export */}
        {showExport && (exportTargetRef || exportImageUrl) && (
          <ExportMenu
            targetRef={exportTargetRef}
            imageUrl={exportImageUrl}
            title={exportTitle}
            filenamePrefix="greenline365"
            formats={['pdf', 'png', 'jpg', 'clipboard', 'print']}
            variant="compact"
            align="left"
            pdfMeta={{
              subtitle: exportTitle,
            }}
          />
        )}

        {/* Extra actions */}
        {extraActions}

        {/* Divider */}
        {(onSave || onPublish) && (
          <div className="w-px h-6 bg-white/10 mx-1" />
        )}

        {/* Save */}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition disabled:opacity-40"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveLabel}
          </button>
        )}

        {/* Publish */}
        {onPublish && (
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A96E] to-[#B8934A] text-black text-xs font-bold transition disabled:opacity-40 hover:brightness-110"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {publishLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
