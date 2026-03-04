'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, Image as ImageIcon, Share2,
  Copy, Printer, ChevronDown, Loader2, Check, X,
  FileImage, File,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'svg' | 'webp' | 'clipboard' | 'print';

export interface ExportMenuProps {
  /** The element ref to capture for image/PDF export */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Direct image URL to export (alternative to targetRef) */
  imageUrl?: string;
  /** Title for the exported file */
  title?: string;
  /** Which formats to show */
  formats?: ExportFormat[];
  /** Custom filename prefix */
  filenamePrefix?: string;
  /** Callback after successful export */
  onExport?: (format: ExportFormat) => void;
  /** Additional metadata for PDF (subtitle, date, etc.) */
  pdfMeta?: {
    subtitle?: string;
    author?: string;
    date?: string;
    description?: string;
  };
  /** Button variant */
  variant?: 'button' | 'icon' | 'compact';
  /** Custom class for the trigger button */
  className?: string;
  /** Alignment of the dropdown */
  align?: 'left' | 'right';
}

// ─── Format config ──────────────────────────────────────────────────

const FORMAT_CONFIG: Record<ExportFormat, { label: string; icon: React.ReactNode; description: string }> = {
  pdf: { label: 'PDF Document', icon: <FileText className="w-4 h-4" />, description: 'High-quality printable document' },
  png: { label: 'PNG Image', icon: <FileImage className="w-4 h-4" />, description: 'Lossless with transparency' },
  jpg: { label: 'JPG Image', icon: <ImageIcon className="w-4 h-4" />, description: 'Compressed, smaller file size' },
  svg: { label: 'SVG Vector', icon: <File className="w-4 h-4" />, description: 'Scalable vector graphic' },
  webp: { label: 'WebP Image', icon: <FileImage className="w-4 h-4" />, description: 'Modern web format' },
  clipboard: { label: 'Copy to Clipboard', icon: <Copy className="w-4 h-4" />, description: 'Paste anywhere' },
  print: { label: 'Print', icon: <Printer className="w-4 h-4" />, description: 'Send to printer' },
};

const DEFAULT_FORMATS: ExportFormat[] = ['pdf', 'png', 'jpg', 'clipboard'];

// ─── Helper: Canvas from element ────────────────────────────────────

async function elementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Dynamic import to avoid SSR issues
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas(element, {
    backgroundColor: '#0a0a0f',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });
}

async function urlToCanvas(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

// ─── Component ──────────────────────────────────────────────────────

export default function ExportMenu({
  targetRef,
  imageUrl,
  title = 'Export',
  formats = DEFAULT_FORMATS,
  filenamePrefix = 'greenline365',
  onExport,
  pdfMeta,
  variant = 'button',
  className = '',
  align = 'right',
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [success, setSuccess] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const getCanvas = async (): Promise<HTMLCanvasElement> => {
    if (imageUrl) {
      return urlToCanvas(imageUrl);
    }
    if (targetRef?.current) {
      return elementToCanvas(targetRef.current);
    }
    throw new Error('No export target specified');
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setError(null);
    const fname = `${sanitizeFilename(filenamePrefix)}_${Date.now()}`;

    try {
      switch (format) {
        case 'pdf': {
          // Use @react-pdf/renderer for PDF generation
          const canvas = await getCanvas();
          const imgDataUrl = canvas.toDataURL('image/png');

          // Dynamic import to avoid SSR issues
          const { pdf, Document, Page, View, Text, Image: PdfImage, StyleSheet } = await import('@react-pdf/renderer');

          const styles = StyleSheet.create({
            page: {
              backgroundColor: '#0a0a0f',
              padding: 40,
              fontFamily: 'Helvetica',
            },
            header: {
              marginBottom: 20,
            },
            title: {
              fontSize: 24,
              color: '#C9A96E',
              fontWeight: 'bold',
              marginBottom: 6,
            },
            subtitle: {
              fontSize: 12,
              color: '#888888',
              marginBottom: 4,
            },
            meta: {
              fontSize: 10,
              color: '#666666',
              marginBottom: 2,
            },
            divider: {
              borderBottomWidth: 1,
              borderBottomColor: '#333333',
              marginVertical: 16,
            },
            imageContainer: {
              alignItems: 'center',
            },
            image: {
              maxWidth: '100%',
              maxHeight: 500,
              objectFit: 'contain' as const,
            },
            description: {
              fontSize: 11,
              color: '#999999',
              marginTop: 16,
              lineHeight: 1.5,
            },
            footer: {
              position: 'absolute',
              bottom: 30,
              left: 40,
              right: 40,
              borderTopWidth: 1,
              borderTopColor: '#333333',
              paddingTop: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
            footerText: {
              fontSize: 8,
              color: '#555555',
            },
          });

          const PdfDoc = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                  <Text style={styles.title}>{title || 'GreenLine365 Export'}</Text>
                  {pdfMeta?.subtitle && <Text style={styles.subtitle}>{pdfMeta.subtitle}</Text>}
                  {pdfMeta?.author && <Text style={styles.meta}>Created by: {pdfMeta.author}</Text>}
                  <Text style={styles.meta}>{pdfMeta?.date || new Date().toLocaleDateString()}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.imageContainer}>
                  <PdfImage src={imgDataUrl} style={styles.image} />
                </View>
                {pdfMeta?.description && (
                  <Text style={styles.description}>{pdfMeta.description}</Text>
                )}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>GreenLine365</Text>
                  <Text style={styles.footerText}>Exported {new Date().toLocaleString()}</Text>
                </View>
              </Page>
            </Document>
          );

          const blob = await pdf(<PdfDoc />).toBlob();
          downloadBlob(blob, `${fname}.pdf`);
          break;
        }

        case 'png': {
          const canvas = await getCanvas();
          canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${fname}.png`);
          }, 'image/png');
          break;
        }

        case 'jpg': {
          const canvas = await getCanvas();
          canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${fname}.jpg`);
          }, 'image/jpeg', 0.92);
          break;
        }

        case 'webp': {
          const canvas = await getCanvas();
          canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${fname}.webp`);
          }, 'image/webp', 0.92);
          break;
        }

        case 'svg': {
          // SVG export: wrap the image in an SVG container
          const canvas = await getCanvas();
          const dataUrl = canvas.toDataURL('image/png');
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          downloadBlob(blob, `${fname}.svg`);
          break;
        }

        case 'clipboard': {
          const canvas = await getCanvas();
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob }),
                ]);
              } catch {
                // Fallback: copy data URL as text
                const dataUrl = canvas.toDataURL('image/png');
                await navigator.clipboard.writeText(dataUrl);
              }
            }
          }, 'image/png');
          break;
        }

        case 'print': {
          const canvas = await getCanvas();
          const dataUrl = canvas.toDataURL('image/png');
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>${title}</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
                  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                  @media print { body { background: white; } }
                </style>
              </head>
              <body>
                <img src="${dataUrl}" alt="${title}" />
              </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          }
          break;
        }
      }

      setSuccess(format);
      setTimeout(() => setSuccess(null), 2000);
      onExport?.(format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  const triggerButton = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition ${className}`}
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
      );
    }

    if (variant === 'compact') {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          Export
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition ${className}`}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      {triggerButton()}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 w-64 rounded-xl bg-[#141419] border border-white/10 shadow-2xl overflow-hidden ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-white/70">Export As</p>
              {error && (
                <p className="text-[10px] text-red-400 mt-1">{error}</p>
              )}
            </div>

            {/* Format Options */}
            <div className="py-1">
              {formats.map(format => {
                const config = FORMAT_CONFIG[format];
                const isExporting = exporting === format;
                const isSuccess = success === format;

                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    disabled={!!exporting}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition disabled:opacity-50 group"
                  >
                    <span className={`flex-shrink-0 ${
                      isSuccess ? 'text-green-400' : isExporting ? 'text-[#C9A96E]' : 'text-white/50 group-hover:text-white/80'
                    }`}>
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSuccess ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        config.icon
                      )}
                    </span>
                    <div className="text-left">
                      <p className="text-sm text-white/90">{config.label}</p>
                      <p className="text-[10px] text-white/40">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
