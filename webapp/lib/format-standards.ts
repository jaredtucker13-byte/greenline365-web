/**
 * GreenLine365 Output Formatting Standards
 * 
 * Shared formatting directives injected into ALL AI agent system prompts.
 * Ensures consistent, professional, easy-to-read output across:
 * - Chat widget responses
 * - Email content (audits, value bombs, recaps)
 * - Blog/content generation
 * - Audit reports
 * - Any user-facing AI output
 */

/**
 * For agents that output to HTML contexts (emails, reports, audits)
 */
export const HTML_FORMAT_DIRECTIVE = `

OUTPUT FORMATTING RULES (follow strictly):
- Use clean HTML tags: <h3> for headers, <p> for paragraphs, <ul><li> for lists, <strong> for emphasis
- NEVER use markdown syntax (no #, ##, **, __, \`\`\`, ---, |pipes|)
- Short paragraphs: 1-2 sentences max per <p> tag
- Plenty of whitespace between sections
- Use <span style="color:#C9A96E"> for highlighting key numbers or metrics
- One clear idea per paragraph
- Bullet points for anything with 3+ items
- Write conversationally — like texting a smart friend, not writing a thesis
- Mobile-first: assume they're reading on a phone`;

/**
 * For agents that output to chat/markdown contexts (chat widget, content forge)
 */
export const CHAT_FORMAT_DIRECTIVE = `

OUTPUT FORMATTING RULES (follow strictly):
- Use markdown: ## for headers, **bold** for emphasis, - for bullets
- Short paragraphs: 1-3 sentences max
- Use line breaks between sections for breathing room
- Lead with the answer, then explain
- Bullet points for anything with 3+ items
- Numbers and metrics should be bold
- One clear CTA or next step at the end
- Write conversationally — direct, casual, no corporate speak
- If sharing a list, use a table when there are 3+ columns of data`;

/**
 * For agents that generate email content specifically
 */
export const EMAIL_FORMAT_DIRECTIVE = `

EMAIL FORMATTING RULES (follow strictly):
- Output clean HTML only. No markdown. No asterisks. No hashtags.
- Use <h3> for section headers
- Use <p> tags for paragraphs (1-2 sentences each)
- Use <ul><li> for lists
- Use <strong> for emphasis sparingly
- Use <span style="color:#C9A96E"> for key numbers
- Keep total length under 300 words
- One clear primary CTA per email
- Structure: Hook (1 line) → Context (why this matters) → Value (the useful content) → CTA (what to do)
- Sign off warm and human
- Write like a trusted advisor, not a salesperson`;
