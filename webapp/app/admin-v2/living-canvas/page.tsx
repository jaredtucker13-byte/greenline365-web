'use client';

/**
 * Living Canvas - Template Editor
 * 
 * Create and edit dynamic layouts with:
 * - Template selection from library
 * - Content slot management
 * - Visual mode toggle (organic/framed)
 * - Live preview with color extraction
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TemplateRenderer, 
  Template, 
  SlotContent,
  SHAPE_PRESETS,
  SHAPE_CATEGORIES,
  ExtractedPalette,
  DEFAULT_PALETTE,
} from '@/app/components/living-canvas';

// System templates (these would come from Supabase in production)
const SYSTEM_TEMPLATES: Template[] = [
  // ========== STORY SHAPE TEMPLATES (New!) ==========
  {
    id: 'ai-visual-journey',
    name: 'Visual Journey (AI Story)',
    slug: 'ai-visual-journey',
    description: 'A phased visual story with T-shapes, circles, and hexagons - perfect for AI/tech narratives',
    category: 'story',
    visual_mode: 'framed',
    structure: {
      type: 'visual-journey',
      slots: [
        // Hero section
        { id: 'hero-image', type: 'image', shape: 'rectangle', aspectRatio: '21:9', gridArea: '1 / 1 / 2 / 3' },
        { id: 'hero-title', type: 'text', overlay: true },
        // Phase 1: Genesis
        { id: 'phase1-image', type: 'image', shape: 't-shape-down', aspectRatio: '4:3' },
        { id: 'phase1-text', type: 'text', wrapAround: 'phase1-image' },
        { id: 'phase1-inset', type: 'image', shape: 'circle', aspectRatio: '1:1', size: 'small' },
        // Phase 2: Integration
        { id: 'phase2-brain', type: 'image', shape: 'hexagon', aspectRatio: '1:1', size: 'small' },
        { id: 'phase2-arm', type: 'image', shape: 'circle', aspectRatio: '1:1', size: 'small' },
        { id: 'phase2-hands', type: 'image', shape: 'hexagon', aspectRatio: '1:1', size: 'small' },
        { id: 'phase2-main', type: 'image', shape: 't-shape-right', aspectRatio: '16:9' },
        { id: 'phase2-city', type: 'image', shape: 'rectangle', aspectRatio: '21:9' },
        { id: 'phase2-text', type: 'text' },
        // Phase 3: Harmonization
        { id: 'phase3-image', type: 'image', shape: 'rectangle', aspectRatio: '21:9' },
        { id: 'phase3-text', type: 'text' },
      ],
      gridConfig: { columns: 2, rows: 6, gap: '2rem' },
    },
  },
  {
    id: 'lightning-story',
    name: 'Lightning Story',
    slug: 'lightning-story',
    description: 'Dynamic layout with lightning bolt shapes and circles - great for innovation stories',
    category: 'story',
    visual_mode: 'framed',
    structure: {
      type: 'lightning-story',
      slots: [
        { id: 'hero-image', type: 'image', shape: 'rectangle', aspectRatio: '16:9' },
        { id: 'hero-title', type: 'text', overlay: true },
        { id: 'section1-lightning', type: 'image', shape: 'lightning-bolt', aspectRatio: '3:4' },
        { id: 'section1-text', type: 'text', wrapAround: 'section1-lightning' },
        { id: 'section2-circle', type: 'image', shape: 'circle', aspectRatio: '1:1' },
        { id: 'section2-text', type: 'text', wrapAround: 'section2-circle' },
        { id: 'section3-lightning', type: 'image', shape: 'lightning-bolt-mirror', aspectRatio: '3:4' },
        { id: 'section3-text', type: 'text', wrapAround: 'section3-lightning' },
        { id: 'footer-image', type: 'image', shape: 'rectangle', aspectRatio: '21:9' },
      ],
      gridConfig: { columns: 2, rows: 5, gap: '2rem' },
    },
  },
  {
    id: 't-shape-cascade',
    name: 'T-Shape Cascade',
    slug: 't-shape-cascade',
    description: 'Alternating T-shaped images with text flowing around - professional magazine style',
    category: 'story',
    visual_mode: 'framed',
    structure: {
      type: 't-cascade',
      slots: [
        { id: 'hero-image', type: 'image', shape: 'rectangle', aspectRatio: '16:9' },
        { id: 'intro-text', type: 'text' },
        { id: 'section1-image', type: 'image', shape: 't-shape-down', aspectRatio: '4:3' },
        { id: 'section1-text', type: 'text', wrapAround: 'section1-image' },
        { id: 'section2-image', type: 'image', shape: 't-shape-up', aspectRatio: '4:3' },
        { id: 'section2-text', type: 'text', wrapAround: 'section2-image' },
        { id: 'section3-image', type: 'image', shape: 't-shape-right', aspectRatio: '4:3' },
        { id: 'section3-text', type: 'text', wrapAround: 'section3-image' },
        { id: 'conclusion-image', type: 'image', shape: 'rectangle', aspectRatio: '21:9' },
        { id: 'conclusion-text', type: 'text' },
      ],
      gridConfig: { columns: 2, rows: 6, gap: '2rem' },
    },
  },
  {
    id: 'geometric-narrative',
    name: 'Geometric Narrative',
    slug: 'geometric-narrative',
    description: 'Mix of hexagons, circles, and T-shapes telling a visual story',
    category: 'story',
    visual_mode: 'organic',
    structure: {
      type: 'geometric-narrative',
      slots: [
        { id: 'hero-image', type: 'image', shape: 'rectangle', aspectRatio: '16:9' },
        { id: 'intro-text', type: 'text' },
        { id: 'hex1', type: 'image', shape: 'hexagon', aspectRatio: '1:1', size: 'medium' },
        { id: 'hex2', type: 'image', shape: 'hexagon', aspectRatio: '1:1', size: 'medium' },
        { id: 'hex3', type: 'image', shape: 'hexagon', aspectRatio: '1:1', size: 'medium' },
        { id: 'middle-text', type: 'text' },
        { id: 'circle-feature', type: 'image', shape: 'circle', aspectRatio: '1:1', size: 'large' },
        { id: 'circle-text', type: 'text', wrapAround: 'circle-feature' },
        { id: 't-feature', type: 'image', shape: 't-shape-down', aspectRatio: '4:3' },
        { id: 't-text', type: 'text', wrapAround: 't-feature' },
        { id: 'conclusion-image', type: 'image', shape: 'rectangle', aspectRatio: '16:9' },
      ],
      gridConfig: { columns: 3, rows: 5, gap: '1.5rem' },
    },
  },
  {
    id: 'staircase-story',
    name: 'Staircase Story',
    slug: 'staircase-story',
    description: 'Step-by-step visual journey using stair shapes - perfect for tutorials or processes',
    category: 'story',
    visual_mode: 'framed',
    structure: {
      type: 'staircase',
      slots: [
        { id: 'hero-image', type: 'image', shape: 'rectangle', aspectRatio: '16:9' },
        { id: 'intro-text', type: 'text' },
        { id: 'step1-image', type: 'image', shape: 'stairs-down-right', aspectRatio: '4:3' },
        { id: 'step1-text', type: 'text', wrapAround: 'step1-image' },
        { id: 'step2-image', type: 'image', shape: 'stairs-down-left', aspectRatio: '4:3' },
        { id: 'step2-text', type: 'text', wrapAround: 'step2-image' },
        { id: 'step3-image', type: 'image', shape: 'stairs-down-right', aspectRatio: '4:3' },
        { id: 'step3-text', type: 'text', wrapAround: 'step3-image' },
        { id: 'final-image', type: 'image', shape: 'rectangle', aspectRatio: '21:9' },
        { id: 'conclusion-text', type: 'text' },
      ],
      gridConfig: { columns: 2, rows: 6, gap: '2rem' },
    },
  },
  
  // ========== ORIGINAL TEMPLATES ==========
  {
    id: 'winding-path',
    name: 'Winding Path (S-Flow)',
    slug: 'winding-path',
    description: 'Three interlocked L-shaped images forming a zig-zag pattern',
    category: 'magazine',
    visual_mode: 'organic',
    structure: {
      type: 's-flow',
      slots: [
        { id: 'image-1', type: 'image', shape: 'l-shape-right', gridArea: '1 / 1 / 2 / 2' },
        { id: 'text-1', type: 'text', wrapAround: 'image-1', gridArea: '1 / 2 / 2 / 3' },
        { id: 'image-2', type: 'image', shape: 'l-shape-left', gridArea: '2 / 2 / 3 / 3' },
        { id: 'text-2', type: 'text', wrapAround: 'image-2', gridArea: '2 / 1 / 3 / 2' },
        { id: 'image-3', type: 'image', shape: 'l-shape-right', gridArea: '3 / 1 / 4 / 2' },
        { id: 'text-3', type: 'text', wrapAround: 'image-3', gridArea: '3 / 2 / 4 / 3' },
      ],
      gridConfig: { columns: 2, rows: 3, gap: '2rem' },
    },
    css_shapes: {
      'image-1': { shapeOutside: 'polygon(0 0, 100% 0, 100% 60%, 60% 60%, 60% 100%, 0 100%)', float: 'left' },
      'image-2': { shapeOutside: 'polygon(0 0, 100% 0, 100% 100%, 40% 100%, 40% 60%, 0 60%)', float: 'right' },
      'image-3': { shapeOutside: 'polygon(0 0, 100% 0, 100% 60%, 60% 60%, 60% 100%, 0 100%)', float: 'left' },
    },
  },
  {
    id: 'gallery-grid',
    name: 'Gallery Grid',
    slug: 'gallery-grid',
    description: 'A 3x2 grid - each cell can be organic or framed',
    category: 'gallery',
    visual_mode: 'framed',
    structure: {
      type: 'gallery-grid',
      slots: [
        { id: 'cell-1', type: 'image', shape: 'rectangle' },
        { id: 'cell-2', type: 'image', shape: 'rectangle' },
        { id: 'cell-3', type: 'image', shape: 'rectangle' },
        { id: 'cell-4', type: 'image', shape: 'rectangle' },
        { id: 'cell-5', type: 'image', shape: 'rectangle' },
        { id: 'cell-6', type: 'image', shape: 'rectangle' },
      ],
      gridConfig: { columns: 3, rows: 2, gap: '1.5rem' },
    },
  },
  {
    id: 'drop-cap',
    name: 'Drop Cap Feature',
    slug: 'drop-cap',
    description: 'Text with a polygon-shaped image as the first letter',
    category: 'general',
    visual_mode: 'organic',
    structure: {
      type: 'drop-cap',
      slots: [
        { id: 'drop-image', type: 'image', shape: 'hexagon', size: 'medium' },
        { id: 'body-text', type: 'text', wrapAround: 'drop-image' },
      ],
    },
  },
  {
    id: 'hero-feature',
    name: 'Hero Feature Block',
    slug: 'hero-feature',
    description: 'Full-width hero with overlaid title',
    category: 'magazine',
    visual_mode: 'organic',
    structure: {
      type: 'hero-feature',
      slots: [
        { id: 'hero-image', type: 'image', shape: 'full-width' },
        { id: 'hero-title', type: 'text', overlay: true },
        { id: 'body-text', type: 'text' },
      ],
    },
  },
  {
    id: 'circular-focus',
    name: 'Circular Focus',
    slug: 'circular-focus',
    description: 'Central circular image with text flowing around',
    category: 'organic',
    visual_mode: 'organic',
    structure: {
      type: 'circular-focus',
      slots: [
        { id: 'center-image', type: 'image', shape: 'circle' },
        { id: 'surrounding-text', type: 'text', wrapAround: 'center-image' },
      ],
    },
  },
  {
    id: 'hexagonal-grid',
    name: 'Hexagonal Grid',
    slug: 'hexagonal-grid',
    description: 'Honeycomb-style layout',
    category: 'gallery',
    visual_mode: 'framed',
    structure: {
      type: 'hexagonal-grid',
      slots: [
        { id: 'hex-1', type: 'image', shape: 'hexagon' },
        { id: 'hex-2', type: 'image', shape: 'hexagon' },
        { id: 'hex-3', type: 'image', shape: 'hexagon' },
        { id: 'hex-4', type: 'image', shape: 'hexagon' },
        { id: 'hex-5', type: 'image', shape: 'hexagon' },
        { id: 'hex-6', type: 'image', shape: 'hexagon' },
        { id: 'hex-7', type: 'image', shape: 'hexagon' },
      ],
      gridConfig: { type: 'honeycomb', cellSize: '180px', columns: 4, rows: 2, gap: '1rem' },
    },
  },
];

// Demo content
const DEMO_CONTENT: Record<string, SlotContent> = {
  'image-1': { 
    type: 'image', 
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 
    alt: 'Mountain landscape' 
  },
  'text-1': { 
    type: 'text', 
    title: 'The Journey Begins',
    content: '<p>Every great adventure starts with a single step into the unknown. The mountains call to those who dare to dream beyond the horizon, offering wisdom that can only be found in the silence between peaks.</p><p>As dawn breaks over the alpine meadows, the world transforms into a canvas of light and shadow, painting stories that have echoed through millennia.</p>' 
  },
  'image-2': { 
    type: 'image', 
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 
    alt: 'Valley vista' 
  },
  'text-2': { 
    type: 'text', 
    title: 'Finding Your Path',
    content: '<p>The path less traveled often leads to the most extraordinary discoveries. In the valleys between giants, small streams carve their way through ancient stone, teaching patience to all who listen.</p><p>Nature\'s architecture surpasses anything built by human hands, reminding us that we are merely visitors in a gallery of endless wonder.</p>' 
  },
  'image-3': { 
    type: 'image', 
    url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800', 
    alt: 'Summit view' 
  },
  'text-3': { 
    type: 'text', 
    title: 'Reaching the Summit',
    content: '<p>At the peak, everything becomes clear. The struggles of the climb fade into memory as the vista unfolds before you, a reward that words cannot capture. This is why we climb—not to conquer, but to understand.</p>' 
  },
  // Gallery grid content
  'cell-1': { type: 'image', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600', alt: 'Nature 1' },
  'cell-2': { type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600', alt: 'Nature 2' },
  'cell-3': { type: 'image', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600', alt: 'Nature 3' },
  'cell-4': { type: 'image', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600', alt: 'Nature 4' },
  'cell-5': { type: 'image', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600', alt: 'Nature 5' },
  'cell-6': { type: 'image', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', alt: 'Nature 6' },
  // Drop cap content
  'drop-image': { type: 'image', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400', alt: 'Sunlight' },
  'body-text': { 
    type: 'text', 
    content: '<p>In the beginning, there was light—pure, transformative, and eternal. The ancients understood what modern minds often forget: that illumination comes not from external sources alone, but from the willingness to see. As the golden rays filter through the canopy, they remind us that even in darkness, light finds a way. This is the fundamental truth of existence: that beauty persists, that hope endures, and that every shadow is merely evidence that somewhere, light still shines.</p>' 
  },
  // Hero content
  'hero-image': { type: 'image', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600', alt: 'Mountain hero' },
  'hero-title': { type: 'text', content: 'Above the Clouds' },
  // Circular content
  'center-image': { type: 'image', url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600', alt: 'Tree of life' },
  'surrounding-text': { 
    type: 'text', 
    title: 'The Circle of Life',
    content: '<p>All things are connected in the great circle. The tree draws from the earth and reaches for the sky, bridging worlds that seem separate but are eternally entwined. Its roots remember what its leaves dream, and in this memory lies the secret of growth.</p><p>We too are part of this circle, drawing sustenance from those who came before and reaching toward possibilities yet to unfold. In understanding our place within this natural order, we find not limitation but liberation—the freedom that comes from knowing we belong to something greater than ourselves.</p><p>The seasons turn, the years pass, but the circle remains unbroken. This is our inheritance and our responsibility: to receive, to grow, to give, and to release, trusting that what we return to the earth will nourish generations yet to come.</p>' 
  },
  // Hexagonal content
  'hex-1': { type: 'image', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400', alt: 'Hex 1' },
  'hex-2': { type: 'image', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', alt: 'Hex 2' },
  'hex-3': { type: 'image', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400', alt: 'Hex 3' },
  'hex-4': { type: 'image', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', alt: 'Hex 4' },
  'hex-5': { type: 'image', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', alt: 'Hex 5' },
  'hex-6': { type: 'image', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', alt: 'Hex 6' },
  'hex-7': { type: 'image', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', alt: 'Hex 7' },
};

export default function LivingCanvasPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(SYSTEM_TEMPLATES[0]);
  const [content, setContent] = useState<Record<string, SlotContent>>(DEMO_CONTENT);
  const [visualMode, setVisualMode] = useState<'organic' | 'framed'>('organic');
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [showEditor, setShowEditor] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  
  // Update visual mode when template changes
  useEffect(() => {
    setVisualMode(selectedTemplate.visual_mode);
  }, [selectedTemplate]);
  
  // Get template with current visual mode override
  const activeTemplate: Template = {
    ...selectedTemplate,
    visual_mode: visualMode,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Living Canvas</h1>
              <p className="text-sm text-white/50">Dynamic templated layouts</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Visual Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setVisualMode('organic')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    visualMode === 'organic' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  🌊 Organic
                </button>
                <button
                  onClick={() => setVisualMode('framed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    visualMode === 'framed' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  🖼️ Framed
                </button>
              </div>
              
              {/* Editor Toggle */}
              <button
                onClick={() => setShowEditor(!showEditor)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  showEditor 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {showEditor ? 'Hide Editor' : 'Edit Content'}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar - Template Selector */}
        <aside className="w-64 min-h-screen bg-white/[0.02] border-r border-white/10 p-4">
          <h2 className="text-sm font-semibold text-white/70 mb-4 px-2">Templates</h2>
          
          <div className="space-y-2">
            {SYSTEM_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full text-left px-3 py-3 rounded-xl transition ${
                  selectedTemplate.id === template.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {template.category === 'gallery' ? '🎨' : 
                     template.category === 'magazine' ? '📰' : 
                     template.category === 'organic' ? '🌿' : '✨'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${
                      selectedTemplate.id === template.id ? 'text-white' : 'text-white/80'
                    }`}>
                      {template.name}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {template.structure.slots.length} slots
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Extracted Colors Display */}
          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-semibold text-white/50 mb-3">Extracted Palette</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(palette).slice(0, 6).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div 
                    className="w-full aspect-square rounded-lg mb-1"
                    style={{ background: color }}
                  />
                  <span className="text-[10px] text-white/40">{name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Shape Preview */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-semibold text-white/50 mb-3">Available Shapes</h3>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(SHAPE_PRESETS).slice(0, 12).map(shapeName => (
                <div 
                  key={shapeName}
                  className="aspect-square bg-white/10 rounded"
                  style={{ clipPath: SHAPE_PRESETS[shapeName].clipPath }}
                  title={shapeName}
                />
              ))}
            </div>
          </div>
        </aside>
        
        {/* Main Content - Preview */}
        <main className="flex-1">
          {/* Editor Panel (Collapsible) */}
          <AnimatePresence>
            {showEditor && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-white/10 overflow-hidden"
              >
                <div className="p-6 bg-white/[0.02]">
                  <h3 className="text-lg font-semibold text-white mb-4">Content Slots</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {activeTemplate.structure.slots.map(slot => (
                      <div 
                        key={slot.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            {slot.id}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                            {slot.type}
                          </span>
                        </div>
                        
                        {slot.type === 'image' ? (
                          <div>
                            <input
                              type="text"
                              value={content[slot.id]?.url || ''}
                              onChange={(e) => setContent(prev => ({
                                ...prev,
                                [slot.id]: { ...prev[slot.id], type: 'image', url: e.target.value }
                              }))}
                              placeholder="Image URL"
                              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                            />
                            {content[slot.id]?.url && (
                              <img 
                                src={content[slot.id].url} 
                                alt="" 
                                className="mt-2 w-full h-20 object-cover rounded-lg"
                              />
                            )}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={content[slot.id]?.title || ''}
                              onChange={(e) => setContent(prev => ({
                                ...prev,
                                [slot.id]: { ...prev[slot.id], type: 'text', title: e.target.value }
                              }))}
                              placeholder="Title (optional)"
                              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 mb-2"
                            />
                            <textarea
                              value={content[slot.id]?.content?.replace(/<[^>]*>/g, '') || ''}
                              onChange={(e) => setContent(prev => ({
                                ...prev,
                                [slot.id]: { ...prev[slot.id], type: 'text', content: `<p>${e.target.value}</p>` }
                              }))}
                              placeholder="Text content"
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Template Preview */}
          <div className="p-8">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <TemplateRenderer
                template={activeTemplate}
                content={content}
                onPaletteChange={setPalette}
              />
            </div>
          </div>
          
          {/* Template Info */}
          <div className="px-8 pb-8">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">{activeTemplate.name}</h3>
              <p className="text-white/60 text-sm mb-4">{activeTemplate.description}</p>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>Type: {activeTemplate.structure.type}</span>
                <span>•</span>
                <span>Category: {activeTemplate.category}</span>
                <span>•</span>
                <span>Slots: {activeTemplate.structure.slots.length}</span>
                <span>•</span>
                <span>Mode: {visualMode}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
