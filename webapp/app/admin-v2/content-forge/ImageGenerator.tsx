'use client';

/**
 * ImageGenerator - Text-to-image generation component.
 *
 * Uses the existing /api/blog/images route with generate-custom action.
 * Supports aspect ratio selection and displays generated images inline with download.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon, Loader2, Download, Trash2,
  Maximize2, X, RefreshCw,
} from 'lucide-react';
import ExportMenu from '../components/shared/ExportMenu';

// ─── Types ──────────────────────────────────────────────────────────

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: number;
}

type AspectRatio = '16:9' | '1:1' | '9:16' | '21:9';

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: 'Landscape', icon: '▬' },
  { value: '1:1', label: 'Square', icon: '■' },
  { value: '9:16', label: 'Portrait', icon: '▮' },
  { value: '21:9', label: 'Cinematic', icon: '▬▬' },
];

// ─── Component ──────────────────────────────────────────────────────

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-custom',
          userPrompt: prompt.trim(),
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (data.success && data.images?.length > 0) {
        const newImages: GeneratedImage[] = data.images.map((img: any) => ({
          id: img.id || `img-${Date.now()}`,
          url: img.url || img.data,
          prompt: prompt.trim(),
          aspectRatio,
          createdAt: Date.now(),
        }));
        setImages(prev => [...newImages, ...prev]);
        setPrompt('');
      } else {
        setError(data.message || 'Failed to generate image. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (previewImage?.id === id) setPreviewImage(null);
  };

  return (
    <div className="px-6 space-y-6">
      {/* Input Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-pink-400" />
          Generate Image
        </h2>
        <p className="text-white/40 text-sm mb-4">Describe the image you want to create</p>

        {/* Prompt Input */}
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="A serene mountain landscape at golden hour with a winding river reflecting the sunset colors..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none outline-none focus:border-pink-500/40 transition"
          disabled={isGenerating}
        />

        {/* Controls Row */}
        <div className="flex items-center gap-3 mt-3">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {ASPECT_RATIOS.map(ar => (
              <button
                key={ar.value}
                onClick={() => setAspectRatio(ar.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  aspectRatio === ar.value
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
                title={ar.label}
              >
                <span className="mr-1">{ar.icon}</span>
                {ar.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
              color: 'white',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mt-3"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Generating Animation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            </div>
            <h3 className="text-white font-bold mb-1">Creating your image...</h3>
            <p className="text-white/40 text-sm">This may take 30-60 seconds</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Images Gallery */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">
              Generated Images ({images.length})
            </h3>
            {images.length > 1 && (
              <button
                onClick={() => setImages([])}
                className="text-xs text-white/40 hover:text-red-400 transition"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5"
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full aspect-video object-cover cursor-pointer"
                  onClick={() => setPreviewImage(img)}
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPreviewImage(img)}
                    className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                    title="Preview"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </button>
                  <ExportMenu
                    imageUrl={img.url}
                    title={`Generated Image - ${img.prompt.slice(0, 30)}`}
                    filenamePrefix="greenline_image"
                    formats={['pdf', 'png', 'jpg', 'clipboard']}
                    variant="icon"
                    pdfMeta={{ subtitle: img.prompt.slice(0, 80) }}
                  />
                  <a
                    href={img.url}
                    download={`greenline-image-${img.id}.png`}
                    className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </a>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>

                {/* Prompt Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white/70 line-clamp-2">{img.prompt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/40">{img.aspectRatio}</span>
                    <span className="text-[10px] text-white/40">
                      {new Date(img.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isGenerating && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <ImageIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Your generated images will appear here</p>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage.url}
                alt={previewImage.prompt}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <ExportMenu
                  imageUrl={previewImage.url}
                  title={`Generated Image`}
                  filenamePrefix="greenline_image"
                  formats={['pdf', 'png', 'jpg', 'clipboard', 'print']}
                  variant="icon"
                />
                <a
                  href={previewImage.url}
                  download={`greenline-image-${previewImage.id}.png`}
                  className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition"
                >
                  <Download className="w-5 h-5 text-white" />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="mt-3 px-2">
                <p className="text-white/70 text-sm">{previewImage.prompt}</p>
                <button
                  onClick={() => {
                    setPrompt(previewImage.prompt);
                    setPreviewImage(null);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 mt-2 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate with this prompt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
