---
name: repo-navigator
description: "Search and map a repository to find code patterns, file relationships, and architectural conventions"
version: 1.0.0
triggers:
  - "find how this pattern is used"
  - "map the codebase for"
  - "search the repository for"
  - "find best-in-class examples of"
inputs:
  - search_target: string (what to find — pattern, file type, convention)
  - scope: string (directory or module to search within, default: entire repo)
outputs:
  - pattern_report: markdown (locations, examples, and usage summary)
---

# Repo Navigator — Codebase Search and Pattern Mapping

## Purpose

The Repo Navigator skill enables agents to systematically search and map any repository to find code patterns, architectural conventions, file relationships, and best-in-class implementations. It replaces ad-hoc grepping with a structured discovery protocol.

## When to Use

- Before implementing a new feature — find existing patterns to follow
- When debugging — trace data flow across files and modules
- During code review — verify consistency with established conventions
- When onboarding to a new area of the codebase
- When looking for best-in-class examples to replicate

## Procedure

### Step 1: Define the Search Target

Clearly identify what you're looking for:

| Search Type | Example Target | Approach |
|------------|----------------|----------|
| **Pattern** | "How do API routes handle auth?" | Grep for `getUser()` in `webapp/app/api/` |
| **Convention** | "How are Zod schemas structured?" | Glob for schema files, read 3-5 examples |
| **Data Flow** | "How does incident data reach the UI?" | Trace imports from API → service → component |
| **File Relationships** | "What depends on `lib/supabase/server.ts`?" | Grep for import statements |
| **Best Practice** | "Best error handling pattern in this repo" | Search for try/catch in API routes, rank by completeness |

### Step 2: Execute the Search

Use these tools in order of efficiency:

1. **Glob** — Find files by name pattern
   - `**/*.test.ts` — all test files
   - `webapp/app/api/**/route.ts` — all API routes
   - `webapp/components/**/*.tsx` — all components

2. **Grep** — Search file contents
   - `supabase.auth.getUser()` — find auth patterns
   - `z.object` — find Zod schemas
   - `business_id` — find tenant-scoped queries

3. **Read** — Examine specific files in detail
   - Read the top 3-5 matches from Grep results
   - Focus on the most recently modified files (likely most up-to-date patterns)

4. **Explore Agent** — For broad, multi-directory searches
   - Use when simple Glob/Grep won't suffice
   - Useful for cross-cutting concerns (auth, logging, error handling)

### Step 3: Map Relationships

For each discovered pattern, document:

```markdown
### Pattern: {name}

**Locations:** {count} files
**Primary Example:** {best file path}:{line number}
**Convention:** {description of the pattern}
**Variations:** {any deviations from the primary pattern}
**Dependencies:** {what this pattern imports/requires}
```

### Step 4: Produce the Pattern Report

Output a structured report:

```markdown
## Pattern Report: {search_target}

### Summary
- **Files Searched:** {count}
- **Matches Found:** {count}
- **Primary Pattern:** {1-sentence description}

### Canonical Example
{Code block from the best example file}

### All Locations
| File | Line | Variation |
|------|------|-----------|
| ... | ... | ... |

### Recommendations
- {Follow pattern X from file Y for new implementations}
- {Avoid pattern Z seen in file W — it's outdated}
```

## GreenLine365-Specific Search Targets

### Common Searches in This Repository

| What You Need | Search Command |
|--------------|----------------|
| All API routes | `Glob: webapp/app/api/**/route.ts` |
| Auth patterns | `Grep: supabase.auth.getUser` in `webapp/app/api/` |
| RLS policies | `Grep: CREATE POLICY` in `webapp/database/` and `webapp/supabase/` |
| Zod schemas | `Grep: z.object` in `webapp/app/api/` |
| React components | `Glob: webapp/components/**/*.tsx` |
| Supabase queries | `Grep: .from(` in `webapp/` |
| Business ID scoping | `Grep: business_id` in `webapp/app/api/` |
| Incident lifecycle | `Grep: incidents` in `webapp/app/api/incidents/` |
| Middleware guards | `Read: webapp/middleware.ts` |
| Environment usage | `Grep: process.env` in `webapp/` |
| Service modules | `Glob: webapp/services/**/*.ts` |
| Database migrations | `Glob: webapp/supabase/migrations/**/*.sql` |

### Key Directories to Know

```
webapp/app/api/          → 65+ API route modules (auth, CRUD, integrations)
webapp/components/       → Reusable UI components
webapp/lib/              → Shared utilities, contexts, Supabase clients
webapp/services/         → Backend service modules
webapp/database/         → Schema definitions
webapp/supabase/         → Supabase config, edge functions, migrations
memory/                  → Specs, PRDs, system documentation
.claude/agents/          → Agent role manuals
.claude/skills/          → Skill registry (this directory)
```

## Validation

A valid Pattern Report must include:

- [ ] At least one canonical code example
- [ ] File paths with line numbers for all matches
- [ ] Clear recommendation on which pattern to follow
- [ ] Note on any deprecated or inconsistent patterns found

## Anti-Patterns

1. **Blind Grepping** — Don't search the entire repo for generic terms like `function` or `const`
2. **Ignoring Context** — A match in a test file is different from a match in production code
3. **Stale Patterns** — Prefer recently modified files; old files may use outdated conventions
4. **Incomplete Maps** — Always search migrations AND application code for database patterns
