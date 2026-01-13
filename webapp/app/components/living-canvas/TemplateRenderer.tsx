'use client';

/**
 * Living Canvas - Template Renderer
 * 
 * Renders templates from the database with dynamic content slots.
 * Supports S-Flow, Gallery Grid, Drop-Cap, and custom layouts.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LivingCanvasImage, DropCapImage, ShapedText, FrameConfig } from './ImageContainers';
import { SHAPE_PRESETS, getShapeDefinition } from './css-shapes';
import { ExtractedPalette, extractColorsFromImage, DEFAULT_PALETTE, applyPaletteToElement, generateGradient } from './color-extraction';

// ============================================
// TYPES
// ============================================

export interface TemplateSlot {
  id: string;
  type: 'image' | 'text';
  shape?: string;
  gridArea?: string;
  wrapAround?: string;
  overlay?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: { x: number; y: number; width: number; height: number };
  aspectRatio?: '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | '21:9' | string;
}

export interface TemplateStructure {
  type: string;
  slots: TemplateSlot[];
  gridConfig?: {
    columns: number;
    rows: number;
    gap: string;
    type?: string;
    cellSize?: string;
  };
  flowDirection?: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  structure: TemplateStructure;
  visual_mode: 'organic' | 'framed';
  css_shapes?: Record<string, any>;
  color_settings?: {
    extractFrom?: string;
    applyTo?: string[];
    fallbackPalette?: string[];
  };
  frame_asset_id?: string;
}

export interface SlotContent {
  type: 'image' | 'text';
  url?: string;
  alt?: string;
  content?: string;
  title?: string;
}

export interface TemplateRendererProps {
  template: Template;
  content: Record<string, SlotContent>;
  frame?: FrameConfig;
  className?: string;
  onPaletteChange?: (palette: ExtractedPalette) => void;
}

// ============================================
// S-FLOW TEMPLATE
// ============================================

function SFlowTemplate({
  template,
  content,
  frame,
  palette,
}: {
  template: Template;
  content: Record<string, SlotContent>;
  frame?: FrameConfig;
  palette: ExtractedPalette;
}) {
  const { slots, gridConfig } = template.structure;
  const cssShapes = template.css_shapes || {};
  
  // Group slots into sections (image + associated text)
  const sections: { image: TemplateSlot; text?: TemplateSlot }[] = [];
  
  for (let i = 0; i < slots.length; i += 2) {
    const imageSlot = slots[i];
    const textSlot = slots[i + 1];
    if (imageSlot?.type === 'image') {
      sections.push({ image: imageSlot, text: textSlot });
    }
  }

  return (
    <div 
      className="living-canvas-s-flow"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridConfig?.columns || 2}, 1fr)`,
        gap: gridConfig?.gap || '2rem',
      }}
    >
      {sections.map((section, idx) => {
        const imageContent = content[section.image.id];
        const textContent = section.text ? content[section.text.id] : null;
        const isRightSide = idx % 2 === 1;
        const shapeConfig = cssShapes[section.image.id] || {};
        
        return (
          <motion.div
            key={section.image.id}
            className="contents"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
          >
            {/* Image with shape */}
            <div
              className={`relative ${isRightSide ? 'order-2' : 'order-1'}`}
              style={{ gridArea: section.image.gridArea }}
            >
              {imageContent?.url && (
                <LivingCanvasImage
                  src={imageContent.url}
                  alt={imageContent.alt || ''}
                  mode={template.visual_mode}
                  shape={section.image.shape || 'l-shape-right'}
                  frame={frame}
                  aspectRatio="landscape"
                  enableAtmosphere={template.visual_mode === 'organic'}
                />
              )}
            </div>
            
            {/* Text that wraps around shape */}
            {textContent && (
              <div
                className={`relative ${isRightSide ? 'order-1' : 'order-2'}`}
                style={{ 
                  gridArea: section.text?.gridArea,
                }}
              >
                <div 
                  className="prose prose-invert max-w-none"
                  style={{
                    color: palette.text,
                  }}
                >
                  {textContent.title && (
                    <h3 
                      className="text-2xl font-bold mb-4"
                      style={{ color: palette.primary }}
                    >
                      {textContent.title}
                    </h3>
                  )}
                  <div 
                    className="text-lg leading-relaxed opacity-90"
                    dangerouslySetInnerHTML={{ __html: textContent.content || '' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// GALLERY GRID TEMPLATE
// ============================================

function GalleryGridTemplate({
  template,
  content,
  frame,
  palette,
}: {
  template: Template;
  content: Record<string, SlotContent>;
  frame?: FrameConfig;
  palette: ExtractedPalette;
}) {
  const { slots, gridConfig } = template.structure;
  
  return (
    <div
      className="living-canvas-gallery-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridConfig?.columns || 3}, 1fr)`,
        gridTemplateRows: `repeat(${gridConfig?.rows || 2}, 1fr)`,
        gap: gridConfig?.gap || '1.5rem',
      }}
    >
      {slots.map((slot, idx) => {
        const slotContent = content[slot.id];
        
        return (
          <motion.div
            key={slot.id}
            className="relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            style={{ gridArea: slot.gridArea }}
          >
            {slotContent?.url ? (
              <LivingCanvasImage
                src={slotContent.url}
                alt={slotContent.alt || ''}
                mode={template.visual_mode}
                shape={slot.shape}
                frame={frame}
                aspectRatio="square"
                width="100%"
                height="100%"
              />
            ) : (
              // Empty slot placeholder
              <div 
                className="w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center"
                style={{ 
                  borderColor: `${palette.muted}50`,
                  background: `${palette.background}80`,
                }}
              >
                <span className="text-sm opacity-50">Drop image here</span>
              </div>
            )}
            
            {/* Hover overlay with caption */}
            {slotContent?.alt && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white text-sm">{slotContent.alt}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// DROP CAP TEMPLATE
// ============================================

function DropCapTemplate({
  template,
  content,
  palette,
}: {
  template: Template;
  content: Record<string, SlotContent>;
  palette: ExtractedPalette;
}) {
  const imageSlot = template.structure.slots.find(s => s.type === 'image');
  const textSlot = template.structure.slots.find(s => s.type === 'text');
  
  const imageContent = imageSlot ? content[imageSlot.id] : null;
  const textContent = textSlot ? content[textSlot.id] : null;
  
  return (
    <div className="living-canvas-drop-cap-layout">
      <div 
        className="prose prose-invert max-w-none text-lg leading-relaxed"
        style={{ color: palette.text }}
      >
        {/* Drop cap image */}
        {imageContent?.url && (
          <DropCapImage
            src={imageContent.url}
            alt={imageContent.alt || ''}
            size={imageSlot?.size || 'medium'}
            shape={imageSlot?.shape || 'drop-cap-circle'}
          />
        )}
        
        {/* Text content */}
        <div dangerouslySetInnerHTML={{ __html: textContent?.content || '' }} />
      </div>
    </div>
  );
}

// ============================================
// HERO FEATURE TEMPLATE
// ============================================

function HeroFeatureTemplate({
  template,
  content,
  frame,
  palette,
}: {
  template: Template;
  content: Record<string, SlotContent>;
  frame?: FrameConfig;
  palette: ExtractedPalette;
}) {
  const heroImageSlot = template.structure.slots.find(s => s.id === 'hero-image');
  const heroTitleSlot = template.structure.slots.find(s => s.id === 'hero-title');
  const bodyTextSlot = template.structure.slots.find(s => s.id === 'body-text');
  
  const heroImage = heroImageSlot ? content[heroImageSlot.id] : null;
  const heroTitle = heroTitleSlot ? content[heroTitleSlot.id] : null;
  const bodyText = bodyTextSlot ? content[bodyTextSlot.id] : null;
  
  return (
    <div className="living-canvas-hero-feature">
      {/* Hero section */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {heroImage?.url && (
          <img
            src={heroImage.url}
            alt={heroImage.alt || ''}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${palette.background} 0%, transparent 50%, ${palette.background}40 100%)`,
          }}
        />
        
        {/* Title overlay */}
        {heroTitle?.content && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-center max-w-4xl"
              style={{ 
                color: palette.text,
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {heroTitle.content}
            </motion.h1>
          </div>
        )}
      </div>
      
      {/* Body text */}
      {bodyText?.content && (
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div 
            className="prose prose-invert prose-lg max-w-none"
            style={{ color: palette.text }}
            dangerouslySetInnerHTML={{ __html: bodyText.content }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// HEXAGONAL GRID TEMPLATE
// ============================================

function HexagonalGridTemplate({
  template,
  content,
  frame,
  palette,
}: {
  template: Template;
  content: Record<string, SlotContent>;
  frame?: FrameConfig;
  palette: ExtractedPalette;
}) {
  const { slots, gridConfig } = template.structure;
  const cellSize = gridConfig?.cellSize || '180px';
  
  return (
    <div 
      className="living-canvas-hex-grid flex flex-wrap justify-center gap-4 py-8"
    >
      {slots.map((slot, idx) => {
        const slotContent = content[slot.id];
        const isOffsetRow = Math.floor(idx / 4) % 2 === 1;
        
        return (
          <motion.div
            key={slot.id}
            className="relative"
            style={{
              width: cellSize,
              height: cellSize,
              marginLeft: isOffsetRow ? `calc(${cellSize} / 2)` : '0',
            }}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
          >
            {slotContent?.url ? (
              <LivingCanvasImage
                src={slotContent.url}
                alt={slotContent.alt || ''}
                mode={template.visual_mode}
                shape="hexagon"
                frame={frame}
                width="100%"
                height="100%"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: `${palette.muted}30`,
                }}
              >
                <span className="text-xs opacity-50">+</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// CIRCULAR FOCUS TEMPLATE
// ============================================

function CircularFocusTemplate({
  template,
  content,
  palette,
}: {
  template: Template;
  content: Record<string, SlotContent>;
  palette: ExtractedPalette;
}) {
  const imageSlot = template.structure.slots.find(s => s.type === 'image');
  const textSlot = template.structure.slots.find(s => s.type === 'text');
  
  const imageContent = imageSlot ? content[imageSlot.id] : null;
  const textContent = textSlot ? content[textSlot.id] : null;
  
  return (
    <div className="living-canvas-circular-focus max-w-4xl mx-auto">
      <div className="relative">
        {/* Circular image floated */}
        {imageContent?.url && (
          <div
            className="float-left mr-8 mb-4"
            style={{
              width: '300px',
              height: '300px',
              shapeOutside: 'circle(50%)',
              shapeMargin: '2rem',
            }}
          >
            <LivingCanvasImage
              src={imageContent.url}
              alt={imageContent.alt || ''}
              mode="organic"
              shape="circle"
              width="100%"
              height="100%"
              enableAtmosphere={true}
            />
          </div>
        )}
        
        {/* Text flows around the circle */}
        {textContent?.content && (
          <div 
            className="prose prose-invert prose-lg max-w-none"
            style={{ color: palette.text }}
          >
            {textContent.title && (
              <h2 
                className="text-3xl font-bold mb-4"
                style={{ color: palette.primary }}
              >
                {textContent.title}
              </h2>
            )}
            <div dangerouslySetInnerHTML={{ __html: textContent.content }} />
          </div>
        )}
        
        {/* Clear float */}
        <div className="clear-both" />
      </div>
    </div>
  );
}

// ============================================
// MAIN TEMPLATE RENDERER
// ============================================

export function TemplateRenderer({
  template,
  content,
  frame,
  className = '',
  onPaletteChange,
}: TemplateRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  
  // Extract colors from primary image
  useEffect(() => {
    const primaryImageSlot = template.structure.slots.find(s => s.type === 'image');
    const primaryImage = primaryImageSlot ? content[primaryImageSlot.id] : null;
    
    if (primaryImage?.url) {
      extractColorsFromImage(primaryImage.url, { quality: 7 })
        .then(extractedPalette => {
          setPalette(extractedPalette);
          onPaletteChange?.(extractedPalette);
          
          // Apply to container
          if (containerRef.current) {
            applyPaletteToElement(containerRef.current, extractedPalette);
          }
        })
        .catch(() => {
          setPalette(DEFAULT_PALETTE);
        });
    }
  }, [template, content, onPaletteChange]);

  // Render template based on type
  const renderTemplate = () => {
    switch (template.structure.type) {
      case 's-flow':
      case 'winding-path':
        return <SFlowTemplate template={template} content={content} frame={frame} palette={palette} />;
      
      case 'gallery-grid':
        return <GalleryGridTemplate template={template} content={content} frame={frame} palette={palette} />;
      
      case 'drop-cap':
        return <DropCapTemplate template={template} content={content} palette={palette} />;
      
      case 'feature-block':
      case 'hero-feature':
        return <HeroFeatureTemplate template={template} content={content} frame={frame} palette={palette} />;
      
      case 'hexagonal-grid':
        return <HexagonalGridTemplate template={template} content={content} frame={frame} palette={palette} />;
      
      case 'circular-focus':
        return <CircularFocusTemplate template={template} content={content} palette={palette} />;
      
      default:
        // Default to gallery grid
        return <GalleryGridTemplate template={template} content={content} frame={frame} palette={palette} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`living-canvas-container relative ${className}`}
      style={{
        background: generateGradient(palette),
        color: palette.text,
        minHeight: '400px',
        padding: '2rem',
      }}
    >
      {renderTemplate()}
    </div>
  );
}

export default TemplateRenderer;
