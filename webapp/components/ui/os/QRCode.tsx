'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { QREntityType } from '@/lib/qr/generate';

// ─── Types ───────────────────────────────────────────────────────

interface QRCodeProps {
  /** Entity type for the QR code */
  type: QREntityType;
  /** Entity ID (deal claim code, passport code, session ID, etc.) */
  entityId: string;
  /** Display size in pixels (default 200) */
  size?: number;
  /** Color theme */
  theme?: 'brand' | 'dark' | 'light' | 'print';
  /** Show a label below the QR code */
  label?: string;
  /** Show a download button */
  downloadable?: boolean;
  /** Download filename (without extension) */
  downloadFilename?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show loading skeleton while generating */
  showSkeleton?: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function QRCode({
  type,
  entityId,
  size = 200,
  theme = 'brand',
  label,
  downloadable = false,
  downloadFilename,
  className,
  showSkeleton = true,
}: QRCodeProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQR = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type,
        id: entityId,
        format: 'svg',
        theme: theme || 'brand',
        size: String(size),
      });

      const res = await fetch(`/api/qr?${params}`);

      if (!res.ok) {
        throw new Error(`QR generation failed: ${res.status}`);
      }

      const svg = await res.text();
      setSvgContent(svg);
    } catch (err: any) {
      console.error('QR fetch error:', err);
      setError(err.message || 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  }, [type, entityId, size, theme]);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  const handleDownloadPNG = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type,
        id: entityId,
        format: 'png',
        theme: theme || 'brand',
        size: String(Math.max(size, 512)), // download at higher resolution
      });

      const res = await fetch(`/api/qr?${params}`);
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFilename || `gl365-${type}-${entityId}`}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('QR download error:', err);
    }
  }, [type, entityId, size, theme, downloadFilename]);

  const handleDownloadSVG = useCallback(() => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFilename || `gl365-${type}-${entityId}`}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgContent, type, entityId, downloadFilename]);

  // Loading state
  if (loading && showSkeleton) {
    return (
      <div
        className={cn('flex flex-col items-center gap-2', className)}
      >
        <div
          className="animate-pulse rounded-lg bg-white/5"
          style={{ width: size, height: size }}
        />
        {label && (
          <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn('flex flex-col items-center gap-2', className)}
      >
        <div
          className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5"
          style={{ width: size, height: size }}
        >
          <p className="text-xs text-red-400 px-2 text-center">QR code unavailable</p>
        </div>
        <button
          onClick={fetchQR}
          className="text-xs text-[#C9A96E] hover:text-[#E8D5A3] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('flex flex-col items-center gap-2', className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* QR Code Image */}
      {svgContent && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}

      {/* Label */}
      {label && (
        <p className="text-xs text-white/60 text-center max-w-[200px] truncate">
          {label}
        </p>
      )}

      {/* Download Buttons */}
      {downloadable && svgContent && (
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPNG}
            className="text-xs px-3 py-1 rounded-md bg-[#C9A96E]/10 text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-colors"
          >
            PNG
          </button>
          <button
            onClick={handleDownloadSVG}
            className="text-xs px-3 py-1 rounded-md bg-[#C9A96E]/10 text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-colors"
          >
            SVG
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Printable QR Card ───────────────────────────────────────────

interface QRCardProps extends QRCodeProps {
  /** Title shown on the card */
  title: string;
  /** Subtitle (business name, event name, etc.) */
  subtitle?: string;
  /** Call to action text */
  cta?: string;
}

/**
 * A styled card with a QR code — for printing, embedding in emails,
 * or displaying in the business portal.
 */
export function QRCard({
  title,
  subtitle,
  cta = 'Scan with your phone',
  ...qrProps
}: QRCardProps) {
  return (
    <div className="inline-flex flex-col items-center gap-3 rounded-xl bg-[#0A0A0A] border border-[#C9A96E]/20 p-6">
      <h3 className="text-sm font-semibold text-[#C9A96E]">{title}</h3>
      {subtitle && (
        <p className="text-xs text-white/50">{subtitle}</p>
      )}
      <QRCode {...qrProps} />
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{cta}</p>
      <p className="text-[9px] text-[#C9A96E]/40">Powered by GreenLine365</p>
    </div>
  );
}
