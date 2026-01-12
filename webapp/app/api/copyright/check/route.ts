import { NextRequest, NextResponse } from 'next/server';

/**
 * Copyright Check API
 * Analyzes content for potential copyright issues
 */

interface CheckRequest {
  content: string;
  title?: string;
}

interface CheckResult {
  status: 'safe' | 'warning' | 'caution';
  issues: string[];
  suggestions: string[];
}

// Patterns that might indicate copyright issues
const COPYRIGHT_PATTERNS = [
  { pattern: /©\s*\d{4}/gi, issue: 'Contains copyright symbol with year', suggestion: 'Ensure you have permission to use this content' },
  { pattern: /all rights reserved/gi, issue: 'Contains "All Rights Reserved" notice', suggestion: 'This content may be protected - verify licensing' },
  { pattern: /reproduced with permission/gi, issue: 'References permission requirements', suggestion: 'Verify you have the required permissions' },
  { pattern: /licensed under/gi, issue: 'Contains licensing language', suggestion: 'Follow the specified license terms' },
  { pattern: /patent pending|patented/gi, issue: 'References patent protection', suggestion: 'Patent content may have additional restrictions' },
  { pattern: /trademark|™|®/gi, issue: 'Contains trademark references', suggestion: 'Use trademarks appropriately and accurately' },
];

// Phrases that suggest quoted/borrowed content
const QUOTE_PATTERNS = [
  { pattern: /according to [A-Z][a-z]+/g, issue: 'Contains attribution phrases', suggestion: 'Ensure proper citation format' },
  { pattern: /"[^"]{50,}"/g, issue: 'Contains long quoted passages', suggestion: 'Verify quote length is within fair use limits' },
  { pattern: /\[source:|source:/gi, issue: 'Contains source references', suggestion: 'Include complete attribution' },
];

export async function POST(request: NextRequest) {
  try {
    const body: CheckRequest = await request.json();
    const { content, title } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for copyright patterns
    for (const { pattern, issue, suggestion } of COPYRIGHT_PATTERNS) {
      if (pattern.test(content)) {
        issues.push(issue);
        suggestions.push(suggestion);
      }
    }

    // Check for quote patterns
    for (const { pattern, issue, suggestion } of QUOTE_PATTERNS) {
      if (pattern.test(content)) {
        if (!issues.includes(issue)) {
          issues.push(issue);
          suggestions.push(suggestion);
        }
      }
    }

    // Check content length for substantial copying concerns
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 500 && !content.includes('original') && !content.includes('by me')) {
      suggestions.push('For longer content, consider adding a statement about originality');
    }

    // AI-specific suggestions
    suggestions.push('AI-generated content may have limited copyright protection in some jurisdictions');
    suggestions.push('Consider adding human creative elements to strengthen copyright claims');

    // Determine status
    let status: 'safe' | 'warning' | 'caution' = 'safe';
    if (issues.length >= 3) {
      status = 'warning';
    } else if (issues.length > 0) {
      status = 'caution';
    }

    // Add general best practices if no issues found
    if (issues.length === 0) {
      suggestions.push('Content appears original - good practice to document creation date');
      suggestions.push('Consider adding your copyright notice: © ' + new Date().getFullYear() + ' [Your Name]');
    }

    const result: CheckResult = {
      status,
      issues,
      suggestions: [...new Set(suggestions)], // Remove duplicates
    };

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('[Copyright Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Check failed' },
      { status: 500 }
    );
  }
}
