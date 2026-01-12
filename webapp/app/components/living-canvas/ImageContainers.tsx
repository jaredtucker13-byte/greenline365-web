'use client';

/**
 * Living Canvas - Image Container Components
 * 
 * Two visual modes:
 * - Organic: Borderless, image bleeds into background with atmospheric glow
 * - Framed: Photorealistic frames with shadows and depth
 */

import React, { useEffect, useRef, useState } from 'react';
import { ShapeDefinition, getShapeDefinition, SHAPE_PRESETS } from './css-shapes';
import { ExtractedPalette, extractColorsFromImage, DEFAULT_PALETTE, generateAtmosphericGlow } from './color-extraction';

// ============================================
// TYPES
// ============================================

export interface FrameAsset {
  url: string;
  innerBounds: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface FrameConfig {
  name: string;
  style: string;
  assets: {
    landscape?: FrameAsset;
    portrait?: FrameAsset;
    square?: FrameAsset;
  };
  shadowSettings: {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
  };
}

export interface ImageContainerProps {
  src: string;
  alt: string;
  shape?: string | ShapeDefinition;
  mode?: 'organic' | 'framed';
  frame?: FrameConfig;
  className?: string;
  width?: string | number;
  height?: string | number;
  aspectRatio?: 'landscape' | 'portrait' | 'square' | 'auto';
  onColorExtract?: (palette: ExtractedPalette) => void;
  enableAtmosphere?: boolean;
  priority?: boolean;
}

// ============================================
// ORGANIC IMAGE CONTAINER
// ============================================

export function OrganicImageContainer({
  src,
  alt,
  shape = 'rectangle',
  className = '',
  width = '100%',
  height = 'auto',
  aspectRatio = 'auto',
  onColorExtract,
  enableAtmosphere = true,
}: ImageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [loaded, setLoaded] = useState(false);
  
  const shapeDefinition = typeof shape === 'string' 
    ? getShapeDefinition(shape) || SHAPE_PRESETS.rectangle 
    : shape;

  // Extract colors when image loads
  useEffect(() => {
    if (src && enableAtmosphere) {
      extractColorsFromImage(src, { quality: 5 })
        .then(extractedPalette => {
          setPalette(extractedPalette);
          onColorExtract?.(extractedPalette);
        })
        .catch(() => {
          // Use default palette on error
          setPalette(DEFAULT_PALETTE);
        });
    }
  }, [src, enableAtmosphere, onColorExtract]);

  const aspectRatioMap = {
    landscape: '16 / 9',
    portrait: '9 / 16',
    square: '1 / 1',
    auto: 'auto',
  };

  return (
    <div
      ref={containerRef}
      className={`living-canvas-organic relative ${className}`}
      style={{
        width,
        height,
        aspectRatio: aspectRatioMap[aspectRatio],
        float: shapeDefinition.float || undefined,
        shapeOutside: shapeDefinition.float ? shapeDefinition.shapeOutside : undefined,
        shapeMargin: shapeDefinition.shapeMargin,
      }}
    >
      {/* Atmospheric glow background */}
      {enableAtmosphere && loaded && (
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-60 scale-125 transition-opacity duration-1000"
          style={{
            background: generateAtmosphericGlow(palette),
          }}
        />
      )}
      
      {/* Image with clip-path */}
      <div
        className="relative w-full h-full overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
        style={{
          clipPath: shapeDefinition.clipPath,
        }}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
        
        {/* Soft edge fade for organic feel */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 60%, ${palette.background}40 100%)`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// FRAMED IMAGE CONTAINER
// ============================================

export function FramedImageContainer({
  src,
  alt,
  frame,
  className = '',
  width = '100%',
  height = 'auto',
  aspectRatio = 'landscape',
  onColorExtract,
}: ImageContainerProps & { frame?: FrameConfig }) {
  const [loaded, setLoaded] = useState(false);
  
  // Determine which frame asset to use based on aspect ratio
  const validAspectRatios = ['landscape', 'portrait', 'square'] as const;
  type ValidAspectRatio = typeof validAspectRatios[number];
  const assetKey: ValidAspectRatio = aspectRatio === 'auto' ? 'landscape' : aspectRatio as ValidAspectRatio;
  const frameAsset = frame?.assets?.[assetKey] || frame?.assets?.landscape;
  const shadow = frame?.shadowSettings;

  const shadowStyle = shadow 
    ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`
    : '8px 12px 24px rgba(0,0,0,0.35)';

  const aspectRatioMap = {
    landscape: '16 / 9',
    portrait: '9 / 16',
    square: '1 / 1',
    auto: 'auto',
  };

  // Extract colors for ambient lighting
  useEffect(() => {
    if (src && onColorExtract) {
      extractColorsFromImage(src, { quality: 5 })
        .then(onColorExtract)
        .catch(() => {});
    }
  }, [src, onColorExtract]);

  return (
    <div
      className={`living-canvas-framed relative ${className}`}
      style={{
        width,
        height: height === 'auto' ? undefined : height,
        aspectRatio: height === 'auto' ? aspectRatioMap[aspectRatio] : undefined,
      }}
    >
      {/* Frame with shadow */}
      <div
        className="relative w-full h-full"
        style={{
          boxShadow: shadowStyle,
        }}
      >
        {/* Frame border/asset */}
        {frameAsset?.url ? (
          // Custom frame asset
          <div className="absolute inset-0">
            <img 
              src={frameAsset.url} 
              alt="Frame" 
              className="w-full h-full object-fill"
            />
          </div>
        ) : (
          // Default CSS frame
          <div 
            className="absolute inset-0 rounded-sm"
            style={{
              background: 'linear-gradient(145deg, #8B7355 0%, #654321 50%, #3D2914 100%)',
              padding: '16px',
            }}
          >
            {/* Inner bevel */}
            <div 
              className="absolute inset-[8px] rounded-sm"
              style={{
                background: 'linear-gradient(145deg, #3D2914 0%, #654321 100%)',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.1)',
              }}
            />
          </div>
        )}
        
        {/* Image container (inside frame bounds) */}
        <div
          className="absolute overflow-hidden bg-black"
          style={{
            top: frameAsset?.innerBounds?.top || 16,
            right: frameAsset?.innerBounds?.right || 16,
            bottom: frameAsset?.innerBounds?.bottom || 16,
            left: frameAsset?.innerBounds?.left || 16,
          }}
        >
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            loading="lazy"
          />
          
          {/* Glass reflection effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
            }}
          />
        </div>
      </div>
      
      {/* Wall shadow (depth effect) */}
      <div
        className="absolute -z-10 rounded-sm blur-md"
        style={{
          top: '8px',
          left: '8px',
          right: '-8px',
          bottom: '-8px',
          background: 'rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

// ============================================
// UNIFIED IMAGE CONTAINER
// ============================================

export function LivingCanvasImage({
  mode = 'organic',
  ...props
}: ImageContainerProps) {
  if (mode === 'framed') {
    return <FramedImageContainer {...props} />;
  }
  return <OrganicImageContainer {...props} />;
}

// ============================================
// SHAPED TEXT WRAPPER
// ============================================

interface ShapedTextProps {
  children: React.ReactNode;
  wrapAroundShape?: string | ShapeDefinition;
  wrapDirection?: 'left' | 'right' | 'both';
  className?: string;
}

export function ShapedText({
  children,
  wrapAroundShape,
  wrapDirection = 'both',
  className = '',
}: ShapedTextProps) {
  return (
    <div 
      className={`living-canvas-text prose prose-invert max-w-none ${className}`}
      style={{
        // Text will flow around floated elements with shape-outside
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// DROP CAP IMAGE
// ============================================

interface DropCapImageProps {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  shape?: string;
  className?: string;
}

export function DropCapImage({
  src,
  alt,
  size = 'medium',
  shape = 'drop-cap-circle',
  className = '',
}: DropCapImageProps) {
  const sizeMap = {
    small: '60px',
    medium: '90px',
    large: '120px',
  };

  const shapeDefinition = getShapeDefinition(shape) || SHAPE_PRESETS['drop-cap-circle'];

  return (
    <div
      className={`living-canvas-drop-cap ${className}`}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        float: 'left',
        shapeOutside: shapeDefinition.shapeOutside,
        shapeMargin: '0.5rem',
        marginRight: '0.75rem',
        marginBottom: '0.25rem',
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{
          clipPath: shapeDefinition.clipPath,
        }}
      />
    </div>
  );
}

export default LivingCanvasImage;
