---
name: skill-builder
description: "Create new SKILL.md files when agents encounter tasks that would benefit from a reusable skill definition"
version: 1.0.0
triggers:
  - "new skill needed"
  - "create a skill for"
  - "register a new capability"
inputs:
  - skill_name: string (kebab-case identifier)
  - skill_description: string (trigger phrase)
  - skill_purpose: string (what the skill enables)
outputs:
  - file: .claude/skills/{skill_name}/SKILL.md
---

# Skill Builder — Meta-Skill for Self-Authoring

## Purpose

The Skill Builder is a meta-skill that enables agents to create new, well-structured SKILL.md files when they encounter recurring tasks that would benefit from a formalized skill definition. This keeps the skills registry growing organically as the project evolves.

## When to Use

- An agent encounters a complex, multi-step task that will likely recur
- A pattern emerges across multiple tasks that could be standardized
- A new integration or tool needs a repeatable workflow

## Skill Authoring Protocol

### Step 1: Validate the Need

Before creating a new skill, verify:

1. **No existing skill covers this** — search `.claude/skills/` for overlap
2. **The task is recurring** — one-off tasks don't need skills
3. **The task is complex enough** — trivial operations don't need formalization
4. **The task has clear inputs/outputs** — skills must be deterministic

### Step 2: Create the Skill Directory

```bash
mkdir -p .claude/skills/{skill-name}
```

Naming rules:
- Use `kebab-case` (e.g., `email-template-builder`, `api-route-scaffolder`)
- Be specific — `stripe-webhook-handler` not `payment-thing`
- Maximum 3 words

### Step 3: Write the SKILL.md

Every SKILL.md must follow this structure:

```markdown
---
name: {skill-name}
description: "{One-line trigger phrase describing when to use this skill}"
version: 1.0.0
triggers:
  - "{natural language phrase that activates this skill}"
  - "{alternate trigger phrase}"
inputs:
  - {input_name}: {type} ({description})
outputs:
  - {output_description}
---

# {Skill Name} — {Short Description}

## Purpose
{Why this skill exists — 2-3 sentences max}

## When to Use
{Bullet list of scenarios that trigger this skill}

## Procedure
{Step-by-step instructions the agent must follow}

## Inputs
{Detailed description of required inputs}

## Outputs
{What the skill produces — files, reports, configurations}

## Validation
{How to verify the skill executed correctly}

## Examples
{At least one concrete example of the skill in action}
```

### Step 4: Register the Skill

After creating the SKILL.md:

1. Verify the file is valid markdown with correct YAML frontmatter
2. Ensure the skill directory is committed to version control
3. Log the creation in the commit message: `feat(skills): add {skill-name} skill`

## Validation Checklist

- [ ] YAML frontmatter has `name`, `description`, `version`
- [ ] `triggers` array has at least one entry
- [ ] `inputs` and `outputs` are defined
- [ ] Procedure section has numbered steps
- [ ] No overlap with existing skills in `.claude/skills/`
- [ ] File committed to git

## Example: Creating a New Skill

**Scenario:** An agent repeatedly scaffolds new API routes with auth, validation, and error handling.

**Action:**

```bash
mkdir -p .claude/skills/api-route-scaffolder
```

Then write `.claude/skills/api-route-scaffolder/SKILL.md`:

```markdown
---
name: api-route-scaffolder
description: "Scaffold a new Next.js API route with auth, Zod validation, and error handling"
version: 1.0.0
triggers:
  - "create a new API route"
  - "scaffold an endpoint"
inputs:
  - route_path: string (e.g., "api/widgets")
  - http_methods: string[] (e.g., ["GET", "POST"])
  - requires_auth: boolean
outputs:
  - file: webapp/app/{route_path}/route.ts
---

# API Route Scaffolder

## Purpose
Generates a new Next.js App Router API route file with authentication,
Zod input validation, Supabase client setup, and standardized error handling.

## Procedure
1. Create the route directory under `webapp/app/`
2. Generate `route.ts` with the standard template
3. Add Zod schemas for request validation
4. Include auth guard via `supabase.auth.getUser()`
5. Add RLS-compatible queries scoped to `business_id`
6. Run `npm run typecheck` to verify
```

## Anti-Patterns

1. **Skill Bloat** — Don't create skills for one-off tasks
2. **Vague Triggers** — "do stuff" is not a trigger; "scaffold a Playwright test for a CRUD page" is
3. **Missing Validation** — Every skill must define how to verify success
4. **Duplicate Skills** — Always search the registry first
