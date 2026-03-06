'use client';

/**
 * Ingredients - Stock Photo Library & Mockup Generator
 *
 * Upload stock photos, write system prompts, and generate mockup images
 * using existing studio API routes.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import EnhancedInputBar from '../components/shared/EnhancedInputBar';
import ExportMenu from '../components/shared/ExportMenu';
import ActionBar from '../components/shared/ActionBar';
import {
  Upload, Trash2, Image as ImageIcon, Sparkles, FolderOpen,
  Loader2, X, Check, Grid, List, Plus, Wand2, Eye,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface StockPhoto {
  id: string;
  file?: File;
  url: string;
  name: string;
  addedAt: number;
}

interface GeneratedMockup {
  id: string;
  url: string;
  prompt: string;
  sourcePhotos: string[];
  createdAt: number;
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function IngredientsPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'generate'>('library');

  // Library state
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([]);
  const [previewMockup, setPreviewMockup] = useState<GeneratedMockup | null>(null);

  // ─── File Handling ──────────────────────────────────────────────

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newPhotos: StockPhoto[] = imageFiles.map(file => ({
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      addedAt: Date.now(),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  // ─── Mockup Generation ─────────────────────────────────────────

  const generateMockups = async (prompt: string) => {
    const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));
    if (selectedPhotosList.length === 0 && !prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Build the full prompt combining system prompt + user prompt
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\nUser request: ${prompt}`
        : prompt;

      const response = await fetch('/api/blog/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-custom',
          userPrompt: fullPrompt,
          aspectRatio: '16:9',
        }),
      });

      const data = await response.json();

      if (response.ok && data.images?.length > 0) {
        const newMockups: GeneratedMockup[] = data.images.map((img: { id: string; url: string }) => ({
          id: img.id,
          url: img.url,
          prompt: prompt,
          sourcePhotos: Array.from(selectedPhotos),
          createdAt: Date.now(),
        }));
        setGeneratedMockups(prev => [...newMockups, ...prev]);
        setGenerationPrompt('');
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-os-dark">
      <PageHeader
        title="Ingredients"
        icon="🧪"
        subtitle="Stock Photo Library & Mockup Generator"
        showBack
        showBreadcrumbs
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-gold-500 text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-1.5" />
              Photo Library
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'generate'
                  ? 'bg-gold-500 text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Wand2 className="w-4 h-4 inline mr-1.5" />
              Generate Mockups
            </button>
          </div>
        }
      />

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'library' ? (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Upload Area */}
              <div
                className={`relative mb-6 rounded-2xl border-2 border-dashed transition-all p-8 text-center ${
                  isDragging
                    ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                    : 'border-white/20 bg-white/5 hover:border-white/30'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-white/60 text-sm mb-1">
                  Drag & drop stock photos here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#C9A96E] hover:underline font-medium"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-white/30 text-xs">
                  Supports PNG, JPG, WebP - Upload as many as you need
                </p>
              </div>

              {/* Toolbar */}
              {photos.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAll}
                      className="text-xs text-white/50 hover:text-white/80 transition"
                    >
                      {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedPhotos.size > 0 && (
                      <>
                        <span className="text-xs text-[#C9A96E]">
                          {selectedPhotos.size} selected
                        </span>
                        <button
                          onClick={() => {
                            setPhotos(prev => prev.filter(p => !selectedPhotos.has(p.id)));
                            setSelectedPhotos(new Set());
                          }}
                          className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Selected
                        </button>
                        <button
                          onClick={() => setActiveTab('generate')}
                          className="text-xs text-[#C9A96E] hover:text-[#d4b97a] transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Generate with Selected
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">{photos.length} photos</span>
                    <div className="flex bg-white/5 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Grid / List */}
              {photos.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/5">
                  <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No photos yet</p>
                  <p className="text-white/25 text-xs mt-1">Upload stock photos to start building your library</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className={`relative group rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        selectedPhotos.has(photo.id)
                          ? 'border-[#C9A96E] ring-2 ring-[#C9A96E]/30'
                          : 'border-transparent hover:border-white/20'
                      }`}
                      onClick={() => toggleSelect(photo.id)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full aspect-square object-cover"
                      />
                      {/* Selection indicator */}
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        selectedPhotos.has(photo.id)
                          ? 'bg-[#C9A96E] border-[#C9A96E]'
                          : 'border-white/40 bg-black/30 opacity-0 group-hover:opacity-100'
                      }`}>
                        {selectedPhotos.has(photo.id) && (
                          <Check className="w-3 h-3 text-black" />
                        )}
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {/* Name */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] text-white/70 truncate">{photo.name}</p>
                      </div>
                    </div>
                  ))}
                  {/* Add more button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 flex flex-col items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-6 h-6 text-white/20" />
                    <span className="text-[10px] text-white/30">Add More</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        selectedPhotos.has(photo.id)
                          ? 'border-[#C9A96E]/50 bg-[#C9A96E]/5'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                      onClick={() => toggleSelect(photo.id)}
                    >
                      <img src={photo.url} alt={photo.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{photo.name}</p>
                        <p className="text-[10px] text-white/30">
                          {new Date(photo.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* Left: Config Panel */}
              <div className="col-span-4 space-y-6">
                {/* System Prompt */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-[#C9A96E]">01</span>
                    System Prompt
                  </h3>
                  <p className="text-[10px] text-white/40 mb-2">
                    Define the style, brand guidelines, and constraints for all generated images.
                  </p>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="e.g., All images should follow our brand colors (navy blue, gold). Use a professional, modern aesthetic. Include subtle shadows and clean lines. Products should be displayed on white or marble backgrounds."
                    rows={6}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/25 focus:border-[#C9A96E]/50 focus:outline-none resize-none"
                  />
                </div>

                {/* Selected Photos Summary */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-[#C9A96E]">02</span>
                    Source Photos
                  </h3>
                  {selectedPhotos.size > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.filter(p => selectedPhotos.has(p.id)).map(photo => (
                        <div key={photo.id} className="relative rounded-lg overflow-hidden">
                          <img src={photo.url} alt={photo.name} className="w-full aspect-square object-cover" />
                          <button
                            onClick={() => toggleSelect(photo.id)}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveTab('library')}
                        className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition"
                      >
                        <Plus className="w-4 h-4 text-white/30" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('library')}
                      className="w-full py-4 rounded-xl border border-dashed border-white/10 text-center hover:border-white/20 transition"
                    >
                      <ImageIcon className="w-6 h-6 text-white/15 mx-auto mb-1" />
                      <p className="text-xs text-white/30">Select photos from library</p>
                    </button>
                  )}
                </div>

                {/* Generation Prompt */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-[#C9A96E]">03</span>
                    Generate
                  </h3>
                  <EnhancedInputBar
                    value={generationPrompt}
                    onChange={setGenerationPrompt}
                    onSubmit={(val) => generateMockups(val)}
                    placeholder="Describe the mockup you want to create..."
                    isLoading={isGenerating}
                    loadingText="Generating..."
                    submitLabel="Generate Mockup"
                    submitIcon={<Wand2 className="w-3.5 h-3.5" />}
                    multiline
                    showTone
                    showStyle
                    showVoice
                    styleOptions={[
                      { value: 'professional', label: 'Professional' },
                      { value: 'creative', label: 'Creative' },
                      { value: 'minimalist', label: 'Minimalist' },
                      { value: 'cinematic', label: 'Cinematic' },
                      { value: 'editorial', label: 'Editorial' },
                    ]}
                    defaultOptions={{ tone: 'professional', style: 'professional' }}
                  />
                </div>
              </div>

              {/* Right: Generated Mockups Gallery */}
              <div className="col-span-8">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4 min-h-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                      Generated Mockups
                    </h3>
                    {generatedMockups.length > 0 && (
                      <span className="text-xs text-white/40">{generatedMockups.length} mockups</span>
                    )}
                  </div>

                  {generatedMockups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Wand2 className="w-12 h-12 text-white/10 mb-3" />
                      <p className="text-white/30 text-sm">No mockups generated yet</p>
                      <p className="text-white/15 text-xs mt-1">
                        Write a prompt and hit Generate to create mockups
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedMockups.map(mockup => (
                        <div
                          key={mockup.id}
                          className="relative group rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition"
                        >
                          <img
                            src={mockup.url}
                            alt={mockup.prompt}
                            className="w-full aspect-video object-cover"
                            onError={(e) => {
                              const t = e.target as HTMLImageElement;
                              t.style.display = 'none';
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white/60 line-clamp-1">{mockup.prompt}</p>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewMockup(mockup)}
                              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
                            >
                              <Eye className="w-5 h-5 text-white" />
                            </button>
                            <ExportMenu
                              imageUrl={mockup.url}
                              title={`Mockup - ${mockup.prompt.slice(0, 40)}`}
                              filenamePrefix="ingredient_mockup"
                              formats={['pdf', 'png', 'jpg', 'clipboard']}
                              variant="icon"
                              pdfMeta={{
                                subtitle: 'Generated Mockup',
                                description: mockup.prompt,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewMockup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewMockup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewMockup(null)}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewMockup.url}
                alt={previewMockup.prompt}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <ExportMenu
                  imageUrl={previewMockup.url}
                  title={`Mockup - ${previewMockup.prompt.slice(0, 40)}`}
                  filenamePrefix="ingredient_mockup"
                  formats={['pdf', 'png', 'jpg', 'webp', 'clipboard', 'print']}
                  variant="button"
                  pdfMeta={{
                    subtitle: 'Ingredients Mockup',
                    description: previewMockup.prompt,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ActionBar - Command Center Input */}
      <ActionBar
        onSubmit={(prompt, toolId) => {
          if (toolId === 'image') {
            setSystemPrompt(prompt);
            setActiveTab('generate');
          }
        }}
        isForging={isGenerating}
        forgingText="Generating Mockups..."
        defaultTool="image"
      />
    </div>
  );
}
