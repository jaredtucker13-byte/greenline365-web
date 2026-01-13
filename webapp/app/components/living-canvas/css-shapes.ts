'use client';

/**
 * Living Canvas - CSS Shapes Utilities
 * 
 * Provides predefined shape definitions and utilities for CSS shape-outside
 * text wrapping around non-rectangular image containers.
 */

export interface ShapeDefinition {
  shapeOutside: string;
  clipPath: string;
  float?: 'left' | 'right' | 'none';
  shapeMargin?: string;
}

// Predefined shape polygons
export const SHAPE_PRESETS: Record<string, ShapeDefinition> = {
  // L-Shapes (for S-flow patterns)
  'l-shape-right': {
    shapeOutside: 'polygon(0 0, 100% 0, 100% 60%, 60% 60%, 60% 100%, 0 100%)',
    clipPath: 'polygon(0 0, 100% 0, 100% 60%, 60% 60%, 60% 100%, 0 100%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'l-shape-left': {
    shapeOutside: 'polygon(0 0, 100% 0, 100% 100%, 40% 100%, 40% 60%, 0 60%)',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 40% 100%, 40% 60%, 0 60%)',
    float: 'right',
    shapeMargin: '1.5rem',
  },
  'l-shape-inverted-right': {
    shapeOutside: 'polygon(40% 0, 100% 0, 100% 100%, 0 100%, 0 40%, 40% 40%)',
    clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 0 100%, 0 40%, 40% 40%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'l-shape-inverted-left': {
    shapeOutside: 'polygon(0 0, 60% 0, 60% 40%, 100% 40%, 100% 100%, 0 100%)',
    clipPath: 'polygon(0 0, 60% 0, 60% 40%, 100% 40%, 100% 100%, 0 100%)',
    float: 'right',
    shapeMargin: '1.5rem',
  },

  // Circular shapes
  'circle': {
    shapeOutside: 'circle(50%)',
    clipPath: 'circle(50%)',
    float: 'left',
    shapeMargin: '2rem',
  },
  'circle-large': {
    shapeOutside: 'circle(45% at 50% 50%)',
    clipPath: 'circle(45% at 50% 50%)',
    float: 'left',
    shapeMargin: '2.5rem',
  },
  'ellipse-horizontal': {
    shapeOutside: 'ellipse(50% 35% at 50% 50%)',
    clipPath: 'ellipse(50% 35% at 50% 50%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'ellipse-vertical': {
    shapeOutside: 'ellipse(35% 50% at 50% 50%)',
    clipPath: 'ellipse(35% 50% at 50% 50%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },

  // Hexagonal shapes
  'hexagon': {
    shapeOutside: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'hexagon-flat': {
    shapeOutside: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },

  // Organic/Blob shapes
  'blob-1': {
    shapeOutside: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    float: 'left',
    shapeMargin: '2rem',
  },
  'blob-2': {
    shapeOutside: 'polygon(20% 0%, 80% 10%, 100% 35%, 95% 70%, 70% 100%, 25% 95%, 0% 65%, 5% 25%)',
    clipPath: 'polygon(20% 0%, 80% 10%, 100% 35%, 95% 70%, 70% 100%, 25% 95%, 0% 65%, 5% 25%)',
    float: 'left',
    shapeMargin: '2rem',
  },
  'organic-wave': {
    shapeOutside: 'polygon(0% 20%, 10% 0%, 50% 5%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 50% 95%, 10% 100%, 0% 80%)',
    clipPath: 'polygon(0% 20%, 10% 0%, 50% 5%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 50% 95%, 10% 100%, 0% 80%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },

  // Angular/Modern shapes
  'diamond': {
    shapeOutside: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    float: 'left',
    shapeMargin: '2rem',
  },
  'pentagon': {
    shapeOutside: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'octagon': {
    shapeOutside: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'arrow-right': {
    shapeOutside: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
    clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
    float: 'left',
    shapeMargin: '1rem',
  },
  'arrow-left': {
    shapeOutside: 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)',
    clipPath: 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)',
    float: 'right',
    shapeMargin: '1rem',
  },

  // Drop cap shapes
  'drop-cap-circle': {
    shapeOutside: 'circle(50%)',
    clipPath: 'circle(50%)',
    float: 'left',
    shapeMargin: '0.75rem',
  },
  'drop-cap-square': {
    shapeOutside: 'inset(0)',
    clipPath: 'inset(0 round 8px)',
    float: 'left',
    shapeMargin: '0.75rem',
  },
  'drop-cap-diamond': {
    shapeOutside: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    float: 'left',
    shapeMargin: '1rem',
  },

  // Special shapes
  'trapezoid': {
    shapeOutside: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
    clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'parallelogram': {
    shapeOutside: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
    clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'slant-right': {
    shapeOutside: 'polygon(0 0, 100% 0, 100% 100%, 0 85%)',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 85%)',
    float: 'left',
    shapeMargin: '1rem',
  },
  'slant-left': {
    shapeOutside: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
    clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
    float: 'right',
    shapeMargin: '1rem',
  },

  // T-Shapes (for magazine story layouts)
  't-shape-down': {
    shapeOutside: 'polygon(0% 0%, 100% 0%, 100% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 0% 40%)',
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 40%, 70% 40%, 70% 100%, 30% 100%, 30% 40%, 0% 40%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  't-shape-up': {
    shapeOutside: 'polygon(30% 0%, 70% 0%, 70% 60%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, 30% 60%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 70% 60%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, 30% 60%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  't-shape-right': {
    shapeOutside: 'polygon(0% 0%, 60% 0%, 60% 30%, 100% 30%, 100% 70%, 60% 70%, 60% 100%, 0% 100%)',
    clipPath: 'polygon(0% 0%, 60% 0%, 60% 30%, 100% 30%, 100% 70%, 60% 70%, 60% 100%, 0% 100%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  't-shape-left': {
    shapeOutside: 'polygon(40% 0%, 100% 0%, 100% 100%, 40% 100%, 40% 70%, 0% 70%, 0% 30%, 40% 30%)',
    clipPath: 'polygon(40% 0%, 100% 0%, 100% 100%, 40% 100%, 40% 70%, 0% 70%, 0% 30%, 40% 30%)',
    float: 'right',
    shapeMargin: '1.5rem',
  },

  // Lightning bolt shape
  'lightning-bolt': {
    shapeOutside: 'polygon(40% 0%, 65% 0%, 55% 35%, 100% 35%, 35% 100%, 45% 55%, 0% 55%)',
    clipPath: 'polygon(40% 0%, 65% 0%, 55% 35%, 100% 35%, 35% 100%, 45% 55%, 0% 55%)',
    float: 'left',
    shapeMargin: '2rem',
  },
  'lightning-bolt-mirror': {
    shapeOutside: 'polygon(60% 0%, 35% 0%, 45% 35%, 0% 35%, 65% 100%, 55% 55%, 100% 55%)',
    clipPath: 'polygon(60% 0%, 35% 0%, 45% 35%, 0% 35%, 65% 100%, 55% 55%, 100% 55%)',
    float: 'right',
    shapeMargin: '2rem',
  },

  // Stair-step shapes (for visual journey layouts)
  'stairs-down-right': {
    shapeOutside: 'polygon(0% 0%, 50% 0%, 50% 33%, 100% 33%, 100% 100%, 50% 100%, 50% 66%, 0% 66%)',
    clipPath: 'polygon(0% 0%, 50% 0%, 50% 33%, 100% 33%, 100% 100%, 50% 100%, 50% 66%, 0% 66%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'stairs-down-left': {
    shapeOutside: 'polygon(50% 0%, 100% 0%, 100% 66%, 50% 66%, 50% 100%, 0% 100%, 0% 33%, 50% 33%)',
    clipPath: 'polygon(50% 0%, 100% 0%, 100% 66%, 50% 66%, 50% 100%, 0% 100%, 0% 33%, 50% 33%)',
    float: 'right',
    shapeMargin: '1.5rem',
  },

  // Cross/Plus shape
  'cross': {
    shapeOutside: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
    clipPath: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
    float: 'left',
    shapeMargin: '2rem',
  },

  // Puzzle piece shapes
  'puzzle-right': {
    shapeOutside: 'polygon(0% 0%, 75% 0%, 75% 25%, 85% 25%, 100% 40%, 85% 55%, 75% 55%, 75% 100%, 0% 100%)',
    clipPath: 'polygon(0% 0%, 75% 0%, 75% 25%, 85% 25%, 100% 40%, 85% 55%, 75% 55%, 75% 100%, 0% 100%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },
  'puzzle-left': {
    shapeOutside: 'polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 25% 55%, 15% 55%, 0% 40%, 15% 25%, 25% 25%)',
    clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 25% 55%, 15% 55%, 0% 40%, 15% 25%, 25% 25%)',
    float: 'right',
    shapeMargin: '1.5rem',
  },

  // Banner/Ribbon shape
  'ribbon': {
    shapeOutside: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
    clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },

  // Speech bubble shape
  'speech-bubble': {
    shapeOutside: 'polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 15% 100%, 20% 75%, 0% 75%)',
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 15% 100%, 20% 75%, 0% 75%)',
    float: 'left',
    shapeMargin: '1.5rem',
  },

  // Rectangle variants
  'rectangle': {
    shapeOutside: 'inset(0)',
    clipPath: 'inset(0)',
    float: 'none',
  },
  'rounded-rectangle': {
    shapeOutside: 'inset(0 round 16px)',
    clipPath: 'inset(0 round 16px)',
    float: 'none',
  },
  'pill': {
    shapeOutside: 'inset(0 round 50%)',
    clipPath: 'inset(0 round 50%)',
    float: 'left',
    shapeMargin: '1rem',
  },
};

/**
 * Get shape definition by name
 */
export function getShapeDefinition(shapeName: string): ShapeDefinition | null {
  return SHAPE_PRESETS[shapeName] || null;
}

/**
 * Generate CSS styles object from shape definition
 */
export function getShapeStyles(shape: ShapeDefinition): React.CSSProperties {
  const styles: React.CSSProperties = {
    clipPath: shape.clipPath,
  };
  
  if (shape.float && shape.float !== 'none') {
    styles.float = shape.float;
    styles.shapeOutside = shape.shapeOutside;
    if (shape.shapeMargin) {
      styles.shapeMargin = shape.shapeMargin;
    }
  }
  
  return styles;
}

/**
 * Generate inline style string for SSR
 */
export function getShapeStyleString(shape: ShapeDefinition): string {
  const parts = [`clip-path: ${shape.clipPath}`];
  
  if (shape.float && shape.float !== 'none') {
    parts.push(`float: ${shape.float}`);
    parts.push(`shape-outside: ${shape.shapeOutside}`);
    if (shape.shapeMargin) {
      parts.push(`shape-margin: ${shape.shapeMargin}`);
    }
  }
  
  return parts.join('; ');
}

/**
 * Create custom polygon from points
 */
export function createCustomPolygon(points: [number, number][]): ShapeDefinition {
  const polygonStr = points.map(([x, y]) => `${x}% ${y}%`).join(', ');
  return {
    shapeOutside: `polygon(${polygonStr})`,
    clipPath: `polygon(${polygonStr})`,
    float: 'left',
    shapeMargin: '1.5rem',
  };
}

/**
 * Mirror a shape horizontally (for alternating layouts)
 */
export function mirrorShapeHorizontally(shape: ShapeDefinition): ShapeDefinition {
  // Parse polygon points and mirror them
  const polygonMatch = shape.shapeOutside.match(/polygon\((.*)\)/);
  if (!polygonMatch) return shape;
  
  const points = polygonMatch[1].split(',').map(point => {
    const [x, y] = point.trim().split(/\s+/);
    const xVal = parseFloat(x);
    return `${100 - xVal}% ${y}`;
  });
  
  const mirroredPolygon = `polygon(${points.join(', ')})`;
  
  return {
    shapeOutside: mirroredPolygon,
    clipPath: mirroredPolygon,
    float: shape.float === 'left' ? 'right' : shape.float === 'right' ? 'left' : shape.float,
    shapeMargin: shape.shapeMargin,
  };
}

// Shape categories for UI organization
export const SHAPE_CATEGORIES = {
  'L-Shapes': ['l-shape-right', 'l-shape-left', 'l-shape-inverted-right', 'l-shape-inverted-left'],
  'Circular': ['circle', 'circle-large', 'ellipse-horizontal', 'ellipse-vertical'],
  'Geometric': ['hexagon', 'hexagon-flat', 'pentagon', 'octagon', 'diamond'],
  'Organic': ['blob-1', 'blob-2', 'organic-wave'],
  'Angular': ['arrow-right', 'arrow-left', 'trapezoid', 'parallelogram', 'slant-right', 'slant-left'],
  'Drop Caps': ['drop-cap-circle', 'drop-cap-square', 'drop-cap-diamond'],
  'Basic': ['rectangle', 'rounded-rectangle', 'pill'],
};
