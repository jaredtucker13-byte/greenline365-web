/**
 * Marketing Skills Loader
 * 
 * Central utility that loads relevant marketing skill frameworks
 * and injects them into AI agent system prompts.
 * 
 * Usage:
 *   import { getSkillContext } from '@/lib/marketing-skills-loader';
 *   const skillContext = getSkillContext('email-sequence');
 *   // Append to system prompt: systemPrompt + skillContext
 * 
 *   // Or auto-detect from user intent:
 *   const skillContext = getSkillContextForIntent('help me write outreach emails');
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), 'config', 'marketing-skills');

// Map user intents to relevant skills
const INTENT_SKILL_MAP: [RegExp, string[]][] = [
  // Email & Outreach
  [/email|outreach|sequence|drip|nurture|campaign|newsletter/i, ['email-sequence']],
  // Copywriting
  [/copy|headline|tagline|cta|hero|write.*page|landing page/i, ['copywriting', 'copy-editing']],
  // CRO & Conversion
  [/convert|conversion|optimize|cro|improve.*page|bounce rate/i, ['page-cro']],
  // Pricing
  [/pric|tier|plan|subscription|upgrade|paywall|upsell/i, ['pricing-strategy', 'paywall-upgrade-cro']],
  // SEO
  [/seo|search engine|rank|sitemap|schema|keyword/i, ['seo-audit', 'schema-markup', 'programmatic-seo']],
  // Signup & Onboarding
  [/signup|sign up|register|onboard|activation|welcome/i, ['signup-flow-cro', 'onboarding-cro']],
  // Social & Content
  [/social|post|instagram|linkedin|twitter|content.*strat/i, ['social-content', 'content-strategy']],
  // Popups & Forms
  [/popup|modal|form|lead capture|overlay/i, ['popup-cro', 'form-cro']],
  // Referral
  [/referral|affiliate|word of mouth|share|invite/i, ['referral-program']],
  // Analytics
  [/track|analytics|measure|metric|ga4|event/i, ['analytics-tracking', 'ab-test-setup']],
  // Ads
  [/ad|advertis|google ads|meta ads|facebook ad|paid/i, ['paid-ads']],
  // Launch
  [/launch|announce|release|product hunt/i, ['launch-strategy']],
  // Psychology
  [/psychology|persuad|persuasion|bias|behavior/i, ['marketing-psychology']],
  // Ideas
  [/idea|brainstorm|marketing.*plan|growth/i, ['marketing-ideas']],
  // Competitor
  [/competitor|alternative|comparison|vs\b/i, ['competitor-alternatives']],
];

// Cache loaded skills to avoid re-reading files
const skillCache = new Map<string, string>();

function loadSkillContent(skillName: string): string {
  if (skillCache.has(skillName)) return skillCache.get(skillName)!;

  const mainFile = join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!existsSync(mainFile)) return '';

  let content = readFileSync(mainFile, 'utf-8');

  // Also load references (condensed)
  const refsDir = join(SKILLS_DIR, skillName, 'references');
  if (existsSync(refsDir)) {
    const { readdirSync } = require('fs');
    for (const file of readdirSync(refsDir)) {
      if (file.endsWith('.md')) {
        const refContent = readFileSync(join(refsDir, file), 'utf-8');
        // Take first 2000 chars of each reference to keep context manageable
        content += `\n\n--- Reference: ${file.replace('.md', '')} ---\n${refContent.slice(0, 2000)}`;
      }
    }
  }

  skillCache.set(skillName, content);
  return content;
}

/**
 * Get skill context for a specific skill by name
 */
export function getSkillContext(skillName: string): string {
  const content = loadSkillContent(skillName);
  if (!content) return '';
  return `\n\n[MARKETING FRAMEWORK: ${skillName}]\n${content}\n[END FRAMEWORK]`;
}

/**
 * Get skill context based on multiple skill names
 */
export function getSkillsContext(skillNames: string[]): string {
  return skillNames
    .map(name => loadSkillContent(name))
    .filter(Boolean)
    .map((content, i) => `\n[FRAMEWORK ${i + 1}]\n${content}`)
    .join('\n');
}

/**
 * Auto-detect relevant skills from user message/intent
 * Returns formatted context string to append to system prompt
 */
export function getSkillContextForIntent(userMessage: string): string {
  const matchedSkills = new Set<string>();

  for (const [pattern, skills] of INTENT_SKILL_MAP) {
    if (pattern.test(userMessage)) {
      skills.forEach(s => matchedSkills.add(s));
    }
  }

  if (matchedSkills.size === 0) return '';

  // Limit to 2 skills max to keep context manageable
  const selectedSkills = Array.from(matchedSkills).slice(0, 2);
  const contexts = selectedSkills
    .map(name => {
      const content = loadSkillContent(name);
      // Truncate each skill to ~3000 chars to not blow up the context window
      return content ? `[${name.toUpperCase()} FRAMEWORK]\n${content.slice(0, 3000)}` : '';
    })
    .filter(Boolean);

  if (contexts.length === 0) return '';

  return `\n\n--- MARKETING SKILL FRAMEWORKS (apply these best practices) ---\n${contexts.join('\n\n')}\n--- END FRAMEWORKS ---`;
}

/**
 * Get a compact skill summary (for constrained contexts)
 */
export function getSkillSummary(skillName: string): string {
  const content = loadSkillContent(skillName);
  if (!content) return '';
  return content.slice(0, 500);
}

/**
 * Load a tool integration guide
 */
export function getToolGuide(toolName: string): string {
  const toolFile = join(SKILLS_DIR, 'tools', 'integrations', `${toolName}.md`);
  if (!existsSync(toolFile)) return '';
  return readFileSync(toolFile, 'utf-8');
}

/**
 * Get the core marketing psychology principles (always useful)
 * This is the "always-on" context that makes every AI response smarter
 */
export function getCoreMarketingContext(): string {
  const psychology = loadSkillContent('marketing-psychology');
  const copyFrameworks = (() => {
    const file = join(SKILLS_DIR, 'copywriting', 'references', 'copy-frameworks.md');
    return existsSync(file) ? readFileSync(file, 'utf-8') : '';
  })();

  if (!psychology && !copyFrameworks) return '';

  return `\n\n--- CORE MARKETING INTELLIGENCE ---
Apply these principles in all marketing-related responses:

${psychology ? `[KEY PSYCHOLOGY PRINCIPLES]\n${psychology.slice(0, 2000)}` : ''}

${copyFrameworks ? `[COPYWRITING FRAMEWORKS]\n${copyFrameworks.slice(0, 1500)}` : ''}
--- END MARKETING INTELLIGENCE ---`;
}
