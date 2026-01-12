# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketing OS for local businesses called "GreenLine365". Key features include:
1. **AI Website Analyzer** - Tool to analyze existing websites or generate designs from scratch
2. **Blog Auto-Polish** - AI-powered blog writing and enhancement tool
3. **Admin Dashboard** - Secured behind Supabase authentication

## Core Features

### Authentication System ✅
- Supabase-based SSR authentication using `@supabase/ssr`
- Protected routes for `/admin-v2/*` and `/admin/*`
- Email/password and Google OAuth sign-in
- Middleware-based route protection

### Blog Auto-Polish ✅ (Partially)
- **Write/Preview Modes** - Toggle between editing and preview
- **AI Tools:**
  - 📋 Outline generation
  - ✨ Content enhancement
  - 💡 Headline suggestions
  - 🏷️ Tag suggestions
  - 🔎 SEO meta generation
  - 🖼️ Image analysis & generation
  - 🎨 Style/theme suggestions
  - 🔍 Trending research (Perplexity)
- **Custom Prompt Input** - Use AI suggestions to generate new content
- **Style Library** - Save and reuse design themes
- **Publishing** - Draft, schedule, or publish directly

### AI Website Analyzer (In Progress)
- URL screenshot capture using Playwright
- Multi-model vision analysis (Gemini, GPT-4o)
- Mockup generation (Nano Banana)
- Code generation (Claude)

## Tech Stack
- **Frontend:** Next.js 16.0.10 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase SSR (`@supabase/ssr`)
- **AI Integrations:** OpenRouter, Emergent LLM Key
- **Screenshot:** Playwright (Node.js)

## What's Been Implemented

### January 2026
- ✅ Fixed Supabase SSR authentication middleware
- ✅ Fixed select dropdown visibility (dark theme CSS)
- ✅ Added custom prompt input for AI suggestions
- ✅ Added "Use This" buttons on AI suggestions
- ✅ Rewrote image generation to use Python subprocess
- ✅ Added expand button to AI Suggestions panel
- ✅ Fixed login button UI

### December 2025
- ✅ AI Website Analyzer UI at `/admin-v2/website-analyzer`
- ✅ Blog Auto-Polish UI at `/admin-v2/blog-polish`
- ✅ Multi-model AI orchestration APIs
- ✅ Style Library component

## Pending Database Migration
- `012_design_proposals.sql` - Table for storing design proposals

## API Endpoints
### Blog APIs
- `POST /api/blog/ai` - AI content generation (outline, enhance, meta, tags, custom)
- `POST /api/blog/images` - Image analysis and generation
- `POST /api/blog/trending` - Trending topic research
- `POST /api/blog/analyze` - SEO analysis

### Website Analyzer APIs
- `POST /api/capture-screenshot` - Capture website screenshot from URL
- `POST /api/design-workflow/analyze` - Analyze screenshot with vision AI
- `POST /api/design-workflow/generate-mockup` - Generate visual mockup
- `POST /api/design-workflow/generate-code` - Generate React code

## Known Issues
- Website Analyzer has Python path issues in deployed environment
- Twilio A2P 10DLC Brand Registration blocked (external)
- Retell AI agent "Aiden" paused due to hallucinations
- AI content can be irrelevant without business context

## Prioritized Backlog

### P0 (Critical)
- Test blog features after logging in
- Run database migration `012_design_proposals.sql`

### P1 (High)
- Add Brand Profile for AI context
- Implement full-screen expandable panels
- Fix Website Analyzer for production deployment

### P2 (Medium)
- Implement landing page redesign using analyzer
- Add role-based access control
- Refactor large components

### P3 (Future)
- Blog analytics dashboard
- Social media auto-sharing
- Resume Retell AI agent
- "God Mode" CMS

## File Structure
```
/app/webapp/
├── app/
│   ├── admin-v2/
│   │   ├── blog-polish/page.tsx    # Blog writing tool
│   │   ├── website-analyzer/page.tsx
│   │   └── components/
│   ├── api/
│   │   ├── blog/
│   │   │   ├── ai/route.ts         # AI content generation
│   │   │   ├── images/route.ts     # Image generation
│   │   │   └── trending/route.ts
│   │   ├── capture-screenshot/route.ts
│   │   └── design-workflow/
│   ├── login/page.tsx
│   └── globals.css                 # Added dark theme select styles
├── lib/supabase/
│   ├── client.ts                   # Browser client
│   ├── server.ts                   # Server client
│   └── middleware.ts               # Session management
└── middleware.ts                   # Route protection
```
