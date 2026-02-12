/**
 * Marketing Skills API
 * GET /api/marketing-skills - List all skills or get a specific skill
 * 
 * Serves the 25 marketing skill frameworks from Corey Haines' open-source collection.
 * Used by: Chat Concierge, Campaign Manager, Content Forge, Website Builder audit
 * 
 * Query params:
 *   ?skill=copywriting - Get a specific skill with all references
 *   ?category=cro - Filter by category (cro, content, seo, growth, strategy)
 *   ?search=email - Search across skill names and descriptions
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), 'config', 'marketing-skills');

const SKILL_CATEGORIES: Record<string, string[]> = {
  cro: ['page-cro', 'signup-flow-cro', 'onboarding-cro', 'form-cro', 'popup-cro', 'paywall-upgrade-cro'],
  content: ['copywriting', 'copy-editing', 'email-sequence', 'social-content', 'content-strategy'],
  seo: ['seo-audit', 'programmatic-seo', 'competitor-alternatives', 'schema-markup'],
  growth: ['free-tool-strategy', 'referral-program', 'ab-test-setup', 'analytics-tracking'],
  strategy: ['marketing-ideas', 'marketing-psychology', 'launch-strategy', 'pricing-strategy', 'product-marketing-context', 'paid-ads'],
};

function loadSkill(skillName: string) {
  const skillDir = join(SKILLS_DIR, skillName);
  if (!existsSync(skillDir)) return null;

  const mainFile = join(skillDir, 'SKILL.md');
  if (!existsSync(mainFile)) return null;

  const content = readFileSync(mainFile, 'utf-8');
  const references: Record<string, string> = {};

  const refsDir = join(skillDir, 'references');
  if (existsSync(refsDir)) {
    for (const file of readdirSync(refsDir)) {
      if (file.endsWith('.md')) {
        references[file.replace('.md', '')] = readFileSync(join(refsDir, file), 'utf-8');
      }
    }
  }

  // Find which category this skill belongs to
  let category = 'uncategorized';
  for (const [cat, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(skillName)) { category = cat; break; }
  }

  return {
    name: skillName,
    category,
    content,
    references,
    reference_count: Object.keys(references).length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillName = searchParams.get('skill');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    // Single skill with full content
    if (skillName) {
      const skill = loadSkill(skillName);
      if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
      return NextResponse.json({ skill });
    }

    // List all skills
    if (!existsSync(SKILLS_DIR)) {
      return NextResponse.json({ error: 'Skills directory not found' }, { status: 404 });
    }

    const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== 'tools')
      .map(d => d.name);

    let skills = dirs.map(name => {
      const mainFile = join(SKILLS_DIR, name, 'SKILL.md');
      if (!existsSync(mainFile)) return null;
      const content = readFileSync(mainFile, 'utf-8');
      const firstLine = content.split('\n').find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') || name;
      const description = content.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'))?.trim() || '';

      let cat = 'uncategorized';
      for (const [c, s] of Object.entries(SKILL_CATEGORIES)) {
        if (s.includes(name)) { cat = c; break; }
      }

      const refsDir = join(SKILLS_DIR, name, 'references');
      const refCount = existsSync(refsDir) ? readdirSync(refsDir).filter(f => f.endsWith('.md')).length : 0;

      return { name, title: firstLine, description: description.slice(0, 200), category: cat, reference_count: refCount };
    }).filter(Boolean);

    // Filter by category
    if (category) {
      skills = skills.filter(s => s?.category === category);
    }

    // Search
    if (search) {
      skills = skills.filter(s =>
        s?.name.includes(search) ||
        s?.title?.toLowerCase().includes(search) ||
        s?.description?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      skills,
      total: skills.length,
      categories: Object.keys(SKILL_CATEGORIES),
    });
  } catch (error: any) {
    console.error('Error loading skills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
