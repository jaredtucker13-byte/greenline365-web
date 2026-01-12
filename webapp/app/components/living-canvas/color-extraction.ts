'use client';

/**
 * Living Canvas - Color Extraction System
 * 
 * Extracts dominant colors from images and generates CSS custom properties
 * for dynamic theming throughout the canvas.
 */

// Simple color extraction without external dependencies
// Uses canvas to sample dominant colors from images

export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

export interface ColorExtractionOptions {
  quality?: number; // 1-10, higher = more accurate but slower
  colorCount?: number; // Number of colors to extract
}

// Convert RGB to HSL for better color manipulation
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Get luminance for contrast calculations
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Color quantization using median cut algorithm (simplified)
function quantizeColors(pixels: Uint8ClampedArray, colorCount: number): [number, number, number][] {
  const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  // Sample pixels and count color frequencies
  for (let i = 0; i < pixels.length; i += 4) {
    // Reduce color precision to group similar colors
    const r = Math.round(pixels[i] / 16) * 16;
    const g = Math.round(pixels[i + 1] / 16) * 16;
    const b = Math.round(pixels[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    
    if (colorMap.has(key)) {
      const existing = colorMap.get(key)!;
      existing.count++;
    } else {
      colorMap.set(key, { count: 1, r, g, b });
    }
  }
  
  // Sort by frequency and return top colors
  const sortedColors = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount * 3); // Get more than needed for filtering
  
  // Filter out very similar colors and return unique ones
  const uniqueColors: [number, number, number][] = [];
  
  for (const color of sortedColors) {
    const isDuplicate = uniqueColors.some(([r, g, b]) => {
      const dr = Math.abs(r - color.r);
      const dg = Math.abs(g - color.g);
      const db = Math.abs(b - color.b);
      return dr + dg + db < 50; // Threshold for similarity
    });
    
    if (!isDuplicate) {
      uniqueColors.push([color.r, color.g, color.b]);
      if (uniqueColors.length >= colorCount) break;
    }
  }
  
  return uniqueColors;
}

/**
 * Extract color palette from an image URL
 */
export async function extractColorsFromImage(
  imageUrl: string,
  options: ColorExtractionOptions = {}
): Promise<ExtractedPalette> {
  const { quality = 5, colorCount = 6 } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        // Create canvas for color sampling
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Scale down for performance (quality setting)
        const scale = 10 / quality;
        canvas.width = Math.max(1, Math.floor(img.width / scale));
        canvas.height = Math.max(1, Math.floor(img.height / scale));
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = quantizeColors(imageData.data, colorCount);
        
        if (colors.length === 0) {
          throw new Error('No colors extracted');
        }
        
        // Build palette from extracted colors
        const palette = buildPaletteFromColors(colors);
        resolve(palette);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for color extraction'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Build a cohesive palette from extracted colors
 */
function buildPaletteFromColors(colors: [number, number, number][]): ExtractedPalette {
  // Sort colors by saturation and lightness for better selection
  const colorData = colors.map(([r, g, b]) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    const luminance = getLuminance(r, g, b);
    return { r, g, b, h, s, l, luminance };
  });
  
  // Find the most vibrant color for primary
  const primary = colorData.reduce((best, color) => 
    (color.s > best.s && color.l > 20 && color.l < 80) ? color : best
  , colorData[0]);
  
  // Find a complementary or contrasting color for secondary
  const secondary = colorData.find(color => {
    const hueDiff = Math.abs(color.h - primary.h);
    return hueDiff > 60 && hueDiff < 300 && color.s > 30;
  }) || colorData[1] || primary;
  
  // Find an accent color (high saturation, different from primary/secondary)
  const accent = colorData.find(color => {
    const hueDiff1 = Math.abs(color.h - primary.h);
    const hueDiff2 = Math.abs(color.h - secondary.h);
    return hueDiff1 > 40 && hueDiff2 > 40 && color.s > 40;
  }) || primary;
  
  // Calculate background based on primary (dark or light theme)
  const avgLuminance = colorData.reduce((sum, c) => sum + c.luminance, 0) / colorData.length;
  const isDark = avgLuminance < 0.5;
  
  // Generate background color
  const bgHsl = rgbToHsl(primary.r, primary.g, primary.b);
  const bgRgb = hslToRgb(bgHsl[0], Math.max(5, bgHsl[1] * 0.1), isDark ? 8 : 96);
  
  // Generate text color for contrast
  const textRgb = isDark ? [245, 245, 245] : [20, 20, 20];
  
  // Generate muted color
  const mutedRgb = hslToRgb(primary.h, 10, isDark ? 30 : 70);
  
  return {
    primary: rgbToHex(primary.r, primary.g, primary.b),
    secondary: rgbToHex(secondary.r, secondary.g, secondary.b),
    accent: rgbToHex(accent.r, accent.g, accent.b),
    background: rgbToHex(bgRgb[0], bgRgb[1], bgRgb[2]),
    text: rgbToHex(textRgb[0] as number, textRgb[1] as number, textRgb[2] as number),
    muted: rgbToHex(mutedRgb[0], mutedRgb[1], mutedRgb[2]),
  };
}

/**
 * Apply extracted palette as CSS custom properties
 */
export function applyPaletteToElement(element: HTMLElement, palette: ExtractedPalette): void {
  element.style.setProperty('--canvas-primary', palette.primary);
  element.style.setProperty('--canvas-secondary', palette.secondary);
  element.style.setProperty('--canvas-accent', palette.accent);
  element.style.setProperty('--canvas-background', palette.background);
  element.style.setProperty('--canvas-text', palette.text);
  element.style.setProperty('--canvas-muted', palette.muted);
  
  // Also set RGB values for transparency support
  const hexToRgbStr = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };
  
  element.style.setProperty('--canvas-primary-rgb', hexToRgbStr(palette.primary));
  element.style.setProperty('--canvas-secondary-rgb', hexToRgbStr(palette.secondary));
  element.style.setProperty('--canvas-accent-rgb', hexToRgbStr(palette.accent));
}

/**
 * Generate a gradient background from palette
 */
export function generateGradient(palette: ExtractedPalette, direction: string = '135deg'): string {
  return `linear-gradient(${direction}, ${palette.background} 0%, ${palette.primary}15 50%, ${palette.secondary}10 100%)`;
}

/**
 * Generate atmospheric glow effect
 */
export function generateAtmosphericGlow(palette: ExtractedPalette): string {
  return `
    radial-gradient(ellipse at 20% 30%, ${palette.primary}30 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, ${palette.secondary}20 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, ${palette.accent}10 0%, transparent 70%)
  `;
}

// Default fallback palette
export const DEFAULT_PALETTE: ExtractedPalette = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  background: '#0a0a0f',
  text: '#f5f5f5',
  muted: '#4b5563',
};
