/**
 * Living Canvas - Component Library
 * 
 * A dynamic, templated publishing system with:
 * - Non-rectangular image layouts (CSS Shapes)
 * - Two visual modes: Organic (borderless) and Framed (photorealistic)
 * - Dynamic color extraction and theming
 * - Reusable templates stored in CMS
 * 
 * @example
 * ```tsx
 * import { TemplateRenderer, LivingCanvasImage } from '@/components/living-canvas';
 * 
 * // Use a template from the CMS
 * <TemplateRenderer 
 *   template={template}
 *   content={contentSlots}
 * />
 * 
 * // Or use individual components
 * <LivingCanvasImage
 *   src="/image.jpg"
 *   alt="Description"
 *   mode="organic"
 *   shape="l-shape-right"
 * />
 * ```
 */

// Main components
export { 
  LivingCanvasImage,
  OrganicImageContainer,
  FramedImageContainer,
  ShapedText,
  DropCapImage,
} from './ImageContainers';

export type {
  ImageContainerProps,
  FrameAsset,
  FrameConfig,
} from './ImageContainers';

// Template renderer
export { 
  TemplateRenderer,
  default as TemplateRendererDefault,
} from './TemplateRenderer';

export type {
  Template,
  TemplateSlot,
  TemplateStructure,
  SlotContent,
  TemplateRendererProps,
} from './TemplateRenderer';

// CSS Shapes utilities
export {
  SHAPE_PRESETS,
  SHAPE_CATEGORIES,
  getShapeDefinition,
  getShapeStyles,
  getShapeStyleString,
  createCustomPolygon,
  mirrorShapeHorizontally,
} from './css-shapes';

export type { ShapeDefinition } from './css-shapes';

// Color extraction
export {
  extractColorsFromImage,
  applyPaletteToElement,
  generateGradient,
  generateAtmosphericGlow,
  DEFAULT_PALETTE,
} from './color-extraction';

export type {
  ExtractedPalette,
  ColorExtractionOptions,
} from './color-extraction';
