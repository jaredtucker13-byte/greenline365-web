/**
 * Email Markdown-to-HTML Renderer
 *
 * Converts plain text / markdown-style email body into styled HTML
 * matching the GreenLine365 dark theme. Handles:
 *   - ## and ### headers → gold-accented section headings
 *   - **bold** and *italic* text
 *   - Bullet lists (- item, * item)
 *   - Numbered lists (1. item)
 *   - Horizontal rules (---, ===)
 *   - ALL CAPS lines → styled section headers
 *   - "--- BLOG #X ---" patterns → content cards
 *   - Blockquotes (> text) → styled quote blocks
 *   - Links [text](url)
 *   - Q&A detection (lines ending in ?)
 */

// Gold accent color used throughout
const GOLD = '#C9A96E';
const GOLD_DIM = '#C9A96E80';
const TEXT_PRIMARY = '#e0e0e0';
const TEXT_SECONDARY = '#a0a0a0';
const TEXT_MUTED = '#777';
const BG_CARD = '#222';
const BG_SECTION = '#1e1e1e';
const BORDER = '#333';

/**
 * Convert markdown-style text body into styled HTML for the GL365 dark email template.
 */
export function markdownToEmailHtml(body: string): string {
  if (!body || !body.trim()) return '';

  // If it's already HTML, return as-is
  if (body.trim().startsWith('<') && /<\/(div|p|h[1-6]|table|ul|ol)>/i.test(body)) {
    return body;
  }

  const lines = body.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (will add spacing via margins)
    if (!trimmed) {
      i++;
      continue;
    }

    // === Horizontal rule (=== or ---) ===
    if (/^[=]{3,}$/.test(trimmed) || /^[-]{3,}$/.test(trimmed)) {
      output.push(`<hr style="border:none;border-top:1px solid ${GOLD_DIM};margin:28px 0;" />`);
      i++;
      continue;
    }

    // === Blog/Section card pattern: --- BLOG #X --- or --- SECTION X --- ===
    if (/^[-]{2,}\s*.+\s*[-]{2,}$/.test(trimmed)) {
      const cardTitle = trimmed.replace(/^[-]+\s*/, '').replace(/\s*[-]+$/, '');
      output.push(`<div style="background:${BG_CARD};border:1px solid ${GOLD_DIM};border-radius:12px;padding:20px 24px;margin:24px 0;">`);
      output.push(`<h3 style="color:${GOLD};font-size:16px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">${inlineFormat(cardTitle)}</h3>`);

      // Collect lines inside this card until next card divider or section break
      i++;
      const cardLines: string[] = [];
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (/^[-]{2,}\s*.+\s*[-]{2,}$/.test(cl) || /^[=]{3,}$/.test(cl)) break;
        cardLines.push(lines[i]);
        i++;
      }
      if (cardLines.length > 0) {
        output.push(renderBlock(cardLines));
      }
      output.push('</div>');
      continue;
    }

    // === Markdown headers: ## or ### ===
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = trimmed.match(/^(#{1,3})/)?.[1].length || 2;
      const text = trimmed.replace(/^#{1,3}\s+/, '');
      if (level === 1) {
        output.push(`<h1 style="color:${GOLD};font-size:22px;font-weight:700;margin:32px 0 16px;border-bottom:2px solid ${GOLD_DIM};padding-bottom:8px;">${inlineFormat(text)}</h1>`);
      } else if (level === 2) {
        output.push(`<h2 style="color:${GOLD};font-size:18px;font-weight:700;margin:28px 0 12px;border-bottom:1px solid ${BORDER};padding-bottom:6px;">${inlineFormat(text)}</h2>`);
      } else {
        output.push(`<h3 style="color:#fff;font-size:15px;font-weight:600;margin:20px 0 8px;">${inlineFormat(text)}</h3>`);
      }
      i++;
      continue;
    }

    // === ALL CAPS lines (section headers like "SECTION 1: OVERVIEW") ===
    if (/^[A-Z][A-Z0-9\s:—\-&,]+$/.test(trimmed) && trimmed.length > 4 && trimmed.length < 80) {
      output.push(`<h2 style="color:${GOLD};font-size:17px;font-weight:700;margin:28px 0 12px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${BORDER};padding-bottom:6px;">${inlineFormat(trimmed)}</h2>`);
      i++;
      continue;
    }

    // === Blockquote (> text) ===
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      output.push(`<blockquote style="border-left:3px solid ${GOLD};margin:16px 0;padding:12px 16px;background:${BG_SECTION};border-radius:0 8px 8px 0;"><p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.6;margin:0;font-style:italic;">${inlineFormat(quoteLines.join('<br>'))}</p></blockquote>`);
      continue;
    }

    // === Unordered list (- item or * item) ===
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      output.push(`<ul style="margin:12px 0;padding-left:20px;">`);
      for (const item of listItems) {
        output.push(`<li style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.7;margin:0 0 6px;padding-left:4px;">${inlineFormat(item)}</li>`);
      }
      output.push('</ul>');
      continue;
    }

    // === Numbered list (1. item) ===
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      output.push(`<ol style="margin:12px 0;padding-left:20px;">`);
      for (const item of listItems) {
        output.push(`<li style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.7;margin:0 0 6px;padding-left:4px;">${inlineFormat(item)}</li>`);
      }
      output.push('</ol>');
      continue;
    }

    // === Question line (ends with ?) → styled as Q&A ===
    if (trimmed.endsWith('?') && trimmed.length > 10) {
      output.push(`<p style="color:${GOLD};font-size:15px;font-weight:600;line-height:1.6;margin:16px 0 4px;">${inlineFormat(trimmed)}</p>`);
      i++;
      // Collect answer lines (until next question, header, or blank)
      const answerLines: string[] = [];
      while (i < lines.length) {
        const al = lines[i].trim();
        if (!al) { i++; break; }
        if (al.endsWith('?') && al.length > 10) break;
        if (/^#{1,3}\s+/.test(al)) break;
        if (/^[A-Z][A-Z0-9\s:—\-&,]+$/.test(al) && al.length > 4) break;
        answerLines.push(al);
        i++;
      }
      if (answerLines.length > 0) {
        output.push(`<p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.7;margin:0 0 16px;padding-left:12px;">${inlineFormat(answerLines.join(' '))}</p>`);
      }
      continue;
    }

    // === Regular paragraph ===
    // Collect consecutive non-special lines into a paragraph
    const paraLines: string[] = [];
    while (i < lines.length) {
      const pl = lines[i].trim();
      if (!pl) { i++; break; }
      if (/^[=]{3,}$/.test(pl) || /^[-]{3,}$/.test(pl)) break;
      if (/^[-]{2,}\s*.+\s*[-]{2,}$/.test(pl)) break;
      if (/^#{1,3}\s+/.test(pl)) break;
      if (/^[A-Z][A-Z0-9\s:—\-&,]+$/.test(pl) && pl.length > 4 && pl.length < 80) break;
      if (pl.startsWith('>')) break;
      if (/^[-*]\s+/.test(pl)) break;
      if (/^\d+[.)]\s+/.test(pl)) break;
      paraLines.push(pl);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p style="color:${TEXT_SECONDARY};font-size:14px;line-height:1.7;margin:0 0 16px;">${inlineFormat(paraLines.join('<br>'))}</p>`);
    }
  }

  return output.join('\n');
}

/**
 * Render a block of lines within a card context.
 */
function renderBlock(lines: string[]): string {
  // Re-use the main renderer for card content
  return markdownToEmailHtml(lines.join('\n'));
}

/**
 * Handle inline formatting: **bold**, *italic*, [links](url), `code`
 */
function inlineFormat(text: string): string {
  let result = text;

  // Escape HTML entities (but preserve already-escaped)
  result = result
    .replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" style="color:${GOLD};text-decoration:underline;">$1</a>`
  );

  // Bold: **text**
  result = result.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong style="color:#fff;font-weight:600;">$1</strong>'
  );

  // Italic: *text*
  result = result.replace(
    /\*([^*]+)\*/g,
    '<em>$1</em>'
  );

  // Inline code: `text`
  result = result.replace(
    /`([^`]+)`/g,
    `<code style="background:${BG_CARD};padding:2px 6px;border-radius:4px;font-size:13px;color:${GOLD};">$1</code>`
  );

  return result;
}

/**
 * Generate an executive summary / TL;DR from bullet points.
 */
export function wrapTldr(points: string[]): string {
  if (!points.length) return '';
  const items = points
    .map(p => `<li style="color:${TEXT_PRIMARY};font-size:14px;line-height:1.7;margin:0 0 6px;">${inlineFormat(p)}</li>`)
    .join('');

  return `<div style="background:${BG_CARD};border:1px solid ${GOLD_DIM};border-radius:12px;padding:20px 24px;margin:0 0 24px;">
    <h3 style="color:${GOLD};font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">TL;DR</h3>
    <ul style="margin:0;padding-left:20px;">${items}</ul>
  </div>`;
}
