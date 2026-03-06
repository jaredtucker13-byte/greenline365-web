'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, FileCode, FileType, File, Package,
  ChevronDown, Loader2, Check, Image as ImageIcon, Globe,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

export type ContentFormat =
  | 'html'
  | 'markdown'
  | 'plaintext'
  | 'pdf'
  | 'wordpress'
  | 'social-pack'
  | 'image-pack';

export interface SocialPost {
  platform: string;
  content: string;
  hashtags?: string[];
}

export interface ImageAsset {
  url: string;
  filename: string;
  /** Base64 data URL (alternative to url) */
  dataUrl?: string;
}

export interface ContentExportMenuProps {
  /** Title of the content being exported */
  title?: string;
  /** Main content body (markdown or plain text) */
  content?: string;
  /** HTML version of content (if available) */
  htmlContent?: string;
  /** Tags / keywords */
  tags?: string[];
  /** Category */
  category?: string;
  /** Author */
  author?: string;
  /** Featured image URL */
  featuredImage?: string;
  /** Slug for WordPress export */
  slug?: string;
  /** Social posts for social pack export */
  socialPosts?: SocialPost[];
  /** Images for image pack export */
  images?: ImageAsset[];
  /** Which formats to show */
  formats?: ContentFormat[];
  /** Custom filename prefix */
  filenamePrefix?: string;
  /** Button variant */
  variant?: 'button' | 'icon' | 'compact';
  /** Custom class */
  className?: string;
  /** Dropdown alignment */
  align?: 'left' | 'right';
  /** Callback after export */
  onExport?: (format: ContentFormat) => void;
}

// ── Format metadata ──────────────────────────────────────────────────

const FORMAT_CONFIG: Record<ContentFormat, { label: string; icon: React.ReactNode; description: string }> = {
  html:        { label: 'HTML File',          icon: <FileCode className="w-4 h-4" />,  description: 'Styled HTML document' },
  markdown:    { label: 'Markdown',           icon: <FileType className="w-4 h-4" />,  description: '.md file for any editor' },
  plaintext:   { label: 'Plain Text',         icon: <FileText className="w-4 h-4" />,  description: 'Clean text, no formatting' },
  pdf:         { label: 'PDF Document',        icon: <File className="w-4 h-4" />,      description: 'Professional document' },
  wordpress:   { label: 'WordPress XML',       icon: <Globe className="w-4 h-4" />,     description: 'WXR import format' },
  'social-pack': { label: 'Social Media Pack', icon: <Package className="w-4 h-4" />,   description: 'ZIP with captions + images' },
  'image-pack':  { label: 'Download Images',   icon: <ImageIcon className="w-4 h-4" />, description: 'All images as ZIP' },
};

// ── Helpers ──────────────────────────────────────────────────────────

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

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().slice(0, 80);
}

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\|.*?\|/g, ' ')
    .replace(/-{3,}/g, '')
    .trim();
}

function markdownToHtml(md: string): string {
  let html = md
    // Headings
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;" />')
    // Links
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr />')
    // Blockquote
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs
  html = html
    .split(/\n\n+/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|img|div)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
}

function buildStyledHtml(title: string, bodyHtml: string, author?: string, date?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #1a1a2e; max-width: 720px; margin: 0 auto; padding: 40px 20px; background: #fafafa; }
  h1 { font-size: 2.2em; margin-bottom: 0.3em; color: #111; }
  h2 { font-size: 1.6em; margin: 1.5em 0 0.5em; color: #222; border-bottom: 2px solid #C9A96E; padding-bottom: 0.2em; }
  h3 { font-size: 1.3em; margin: 1.2em 0 0.4em; color: #333; }
  p { margin: 0.8em 0; }
  a { color: #C9A96E; }
  img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
  ul, ol { margin: 0.8em 0; padding-left: 1.5em; }
  li { margin: 0.3em 0; }
  blockquote { border-left: 4px solid #C9A96E; padding: 0.5em 1em; margin: 1em 0; background: #f0f0f0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
  .meta { color: #888; font-size: 0.9em; margin-bottom: 1.5em; }
</style>
</head>
<body>
<article>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${author ? `By ${escapeHtml(author)} &middot; ` : ''}${date || new Date().toLocaleDateString()}</div>
${bodyHtml}
</article>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildWordPressXml(title: string, content: string, slug: string, category?: string, tags?: string[]): string {
  const pubDate = new Date().toUTCString();
  const escapedContent = `<![CDATA[${content}]]>`;
  const escapedTitle = `<![CDATA[${title}]]>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <title>GreenLine365 Export</title>
  <link>https://greenline365.com</link>
  <wp:wxr_version>1.2</wp:wxr_version>
  <item>
    <title>${escapedTitle}</title>
    <dc:creator><![CDATA[admin]]></dc:creator>
    <content:encoded>${escapedContent}</content:encoded>
    <excerpt:encoded><![CDATA[]]></excerpt:encoded>
    <wp:post_name>${slug}</wp:post_name>
    <wp:post_type>post</wp:post_type>
    <wp:status>draft</wp:status>
    <wp:post_date>${new Date().toISOString().replace('T', ' ').slice(0, 19)}</wp:post_date>
    <pubDate>${pubDate}</pubDate>
${category ? `    <category domain="category" nicename="${sanitize(category)}"><![CDATA[${category}]]></category>\n` : ''}${(tags || []).map(t => `    <category domain="post_tag" nicename="${sanitize(t)}"><![CDATA[${t}]]></category>`).join('\n')}
  </item>
</channel>
</rss>`;
}

async function fetchAsBlob(url: string): Promise<Blob> {
  const resp = await fetch(url);
  return resp.blob();
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const resp = await fetch(dataUrl);
  return resp.blob();
}

async function buildZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  // Minimal ZIP builder (no external lib needed for simple files)
  // Each file: local file header + data, then central directory + end record
  const entries: { header: Uint8Array; data: Uint8Array; name: Uint8Array; offset: number }[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());

    // Local file header
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);  // signature
    view.setUint16(4, 20, true);           // version needed
    view.setUint16(6, 0, true);            // flags
    view.setUint16(8, 0, true);            // compression (none)
    view.setUint16(10, 0, true);           // mod time
    view.setUint16(12, 0, true);           // mod date
    view.setUint32(14, crc32(data), true); // crc32
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);           // extra length
    header.set(nameBytes, 30);

    entries.push({ header, data, name: nameBytes, offset });
    offset += header.length + data.length;
  }

  // Central directory
  const cdParts: Uint8Array[] = [];
  for (const entry of entries) {
    const cd = new Uint8Array(46 + entry.name.length);
    const v = new DataView(cd.buffer);
    v.setUint32(0, 0x02014b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 20, true);
    v.setUint16(8, 0, true);
    v.setUint16(10, 0, true);
    v.setUint16(12, 0, true);
    v.setUint16(14, 0, true);
    const headerView = new DataView(entry.header.buffer);
    v.setUint32(16, headerView.getUint32(14, true), true); // crc32
    v.setUint32(20, entry.data.length, true);
    v.setUint32(24, entry.data.length, true);
    v.setUint16(28, entry.name.length, true);
    v.setUint16(30, 0, true);
    v.setUint16(32, 0, true);
    v.setUint16(34, 0, true);
    v.setUint16(36, 0, true);
    v.setUint32(38, 0, true);
    v.setUint32(42, entry.offset, true);
    cd.set(entry.name, 46);
    cdParts.push(cd);
  }

  const cdSize = cdParts.reduce((s, p) => s + p.length, 0);
  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const allParts: Uint8Array[] = [];
  for (const entry of entries) {
    allParts.push(entry.header, entry.data);
  }
  allParts.push(...cdParts, endRecord);

  const totalSize = allParts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of allParts) {
    result.set(part, pos);
    pos += part.length;
  }

  return new Blob([result], { type: 'application/zip' });
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Component ────────────────────────────────────────────────────────

const DEFAULT_FORMATS: ContentFormat[] = ['html', 'markdown', 'plaintext', 'pdf'];

export default function ContentExportMenu({
  title = 'Untitled',
  content = '',
  htmlContent,
  tags,
  category,
  author,
  featuredImage,
  slug,
  socialPosts,
  images,
  formats = DEFAULT_FORMATS,
  filenamePrefix = 'greenline365',
  variant = 'button',
  className = '',
  align = 'right',
  onExport,
}: ContentExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ContentFormat | null>(null);
  const [success, setSuccess] = useState<ContentFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const fname = sanitize(filenamePrefix || title);

  const handleExport = async (format: ContentFormat) => {
    setExporting(format);
    setError(null);

    try {
      switch (format) {
        case 'html': {
          const bodyHtml = htmlContent || markdownToHtml(content);
          const fullHtml = buildStyledHtml(title, bodyHtml, author);
          downloadBlob(new Blob([fullHtml], { type: 'text/html' }), `${fname}.html`);
          break;
        }

        case 'markdown': {
          const md = `# ${title}\n\n${content}`;
          downloadBlob(new Blob([md], { type: 'text/markdown' }), `${fname}.md`);
          break;
        }

        case 'plaintext': {
          const plain = `${title}\n${'='.repeat(title.length)}\n\n${stripMarkdown(content)}`;
          downloadBlob(new Blob([plain], { type: 'text/plain' }), `${fname}.txt`);
          break;
        }

        case 'pdf': {
          const { pdf, Document, Page, View, Text, StyleSheet } = await import('@react-pdf/renderer');

          const styles = StyleSheet.create({
            page: { padding: 50, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
            title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#111111' },
            meta: { fontSize: 10, color: '#888888', marginBottom: 20 },
            divider: { borderBottomWidth: 1, borderBottomColor: '#dddddd', marginBottom: 20 },
            body: { fontSize: 11, lineHeight: 1.6, color: '#333333' },
            heading2: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 6, color: '#222222' },
            heading3: { fontSize: 13, fontWeight: 'bold', marginTop: 12, marginBottom: 4, color: '#333333' },
            paragraph: { marginBottom: 8 },
            footer: { position: 'absolute', bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: '#eeeeee', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
            footerText: { fontSize: 8, color: '#999999' },
            tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
            tag: { fontSize: 9, color: '#C9A96E', backgroundColor: '#FFF8EE', padding: '2 6', borderRadius: 3 },
          });

          // Split content into blocks
          const blocks = content.split(/\n+/).filter(l => l.trim());

          const PdfDoc = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.meta}>{author ? `By ${author} | ` : ''}{new Date().toLocaleDateString()}{category ? ` | ${category}` : ''}</Text>
                {tags && tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {tags.map((t, i) => <Text key={i} style={styles.tag}>{t}</Text>)}
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.body}>
                  {blocks.map((block, i) => {
                    if (block.startsWith('## ')) return <Text key={i} style={styles.heading2}>{block.replace(/^##\s+/, '')}</Text>;
                    if (block.startsWith('### ')) return <Text key={i} style={styles.heading3}>{block.replace(/^###\s+/, '')}</Text>;
                    if (block.startsWith('# ')) return <Text key={i} style={styles.heading2}>{block.replace(/^#\s+/, '')}</Text>;
                    const clean = block.replace(/[*_~`]/g, '').replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[([^\]]*)\]\(.*?\)/g, '$1');
                    return <Text key={i} style={styles.paragraph}>{clean}</Text>;
                  })}
                </View>
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

        case 'wordpress': {
          const bodyHtml = htmlContent || markdownToHtml(content);
          const postSlug = slug || sanitize(title);
          const xml = buildWordPressXml(title, bodyHtml, postSlug, category, tags);
          downloadBlob(new Blob([xml], { type: 'application/xml' }), `${fname}-wordpress.xml`);
          break;
        }

        case 'social-pack': {
          if (!socialPosts || socialPosts.length === 0) {
            setError('No social posts to export');
            break;
          }
          const files: { name: string; blob: Blob }[] = [];

          for (const sp of socialPosts) {
            const platformName = sanitize(sp.platform);
            let text = sp.content;
            if (sp.hashtags && sp.hashtags.length > 0) {
              text += '\n\n' + sp.hashtags.map(h => `#${h}`).join(' ');
            }
            files.push({
              name: `${platformName}-caption.txt`,
              blob: new Blob([text], { type: 'text/plain' }),
            });
          }

          // Include images if available
          if (images && images.length > 0) {
            for (const img of images) {
              try {
                const blob = img.dataUrl
                  ? await dataUrlToBlob(img.dataUrl)
                  : await fetchAsBlob(img.url);
                files.push({ name: img.filename, blob });
              } catch {
                // Skip failed image downloads
              }
            }
          }

          const zip = await buildZip(files);
          downloadBlob(zip, `${fname}-social-pack.zip`);
          break;
        }

        case 'image-pack': {
          if (!images || images.length === 0) {
            setError('No images to export');
            break;
          }

          if (images.length === 1) {
            // Single image — download directly
            const img = images[0];
            const blob = img.dataUrl
              ? await dataUrlToBlob(img.dataUrl)
              : await fetchAsBlob(img.url);
            downloadBlob(blob, img.filename);
          } else {
            const files: { name: string; blob: Blob }[] = [];
            for (const img of images) {
              try {
                const blob = img.dataUrl
                  ? await dataUrlToBlob(img.dataUrl)
                  : await fetchAsBlob(img.url);
                files.push({ name: img.filename, blob });
              } catch {
                // Skip failed downloads
              }
            }
            const zip = await buildZip(files);
            downloadBlob(zip, `${fname}-images.zip`);
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

  // Filter formats that have required data
  const availableFormats = formats.filter(f => {
    if (f === 'social-pack') return socialPosts && socialPosts.length > 0;
    if (f === 'image-pack') return images && images.length > 0;
    return true;
  });

  const triggerButton = () => {
    if (variant === 'icon') {
      return (
        <button onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition ${className}`} title="Export Content">
          <Download className="w-4 h-4" />
        </button>
      );
    }
    if (variant === 'compact') {
      return (
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition ${className}`}>
          <Download className="w-3.5 h-3.5" />
          Export
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }
    return (
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition ${className}`}>
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
            className={`absolute z-50 mt-2 w-72 rounded-xl bg-[#141419] border border-white/10 shadow-2xl overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-white/70">Export Content</p>
              {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
            </div>

            <div className="py-1">
              {availableFormats.map(format => {
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
                    <span className={`flex-shrink-0 ${isSuccess ? 'text-green-400' : isExporting ? 'text-[#C9A96E]' : 'text-white/50 group-hover:text-white/80'}`}>
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSuccess ? <Check className="w-4 h-4" /> : config.icon}
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
