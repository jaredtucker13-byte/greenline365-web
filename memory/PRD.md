# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketing OS for local businesses called "GreenLine365". Key features include:
1. **AI Website Analyzer** - Tool to analyze existing websites or generate designs from scratch
2. **Blog Auto-Polish** - AI-powered blog writing and enhancement tool
3. **Admin Dashboard** - Secured behind Supabase authentication
4. **Copyright Compliance System** - Tools for content creators to understand and comply with copyright laws

## Core Features

### Authentication System ✅
- Supabase-based SSR authentication using `@supabase/ssr`
- Protected routes for `/admin-v2/*` and `/admin/*`
- Email/password and Google OAuth sign-in
- Middleware-based route protection

### Blog Auto-Polish ✅
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
  - ⚖️ Copyright Tools (NEW)
- **Custom Prompt Input** - Use AI suggestions to generate new content
- **Style Library** - Save and reuse design themes
- **AI Content Disclaimer** - Sidebar notice about AI content rights
- **Publishing** - Draft, schedule, or publish directly

### Copyright Compliance System ✅ (NEW)
1. **Blog Content Helper** - Copyright check in Blog Auto-Polish
2. **Legal Pages** - `/copyright-guide` comprehensive guide
3. **Content Licensing Tool** - License type explorer (CC0, CC BY, etc.)
4. **Attribution Generator** - Create proper attributions
5. **AI Content Disclaimer** - Expandable notice about AI content rights

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

### January 2026 - Session 2
- ✅ Copyright Tools component with 3 tabs (Check, License Guide, Attribution)
- ✅ AI Content Disclaimer component (compact/expanded)
- ✅ Copyright Check API (`/api/copyright/check`)
- ✅ Copyright Guide page (`/copyright-guide`)
- ✅ Added ⚖️ Copyright button to Blog Auto-Polish AI Tools
- ✅ Integrated copyright awareness throughout blog editor

### January 2026 - Session 1
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

## API Endpoints

### Blog APIs
- `POST /api/blog/ai` - AI content generation (outline, enhance, meta, tags, custom)
- `POST /api/blog/images` - Image analysis and generation
- `POST /api/blog/trending` - Trending topic research
- `POST /api/blog/analyze` - SEO analysis

### Copyright APIs (NEW)
- `POST /api/copyright/check` - Analyze content for copyright issues

### Website Analyzer APIs
- `POST /api/capture-screenshot` - Capture website screenshot from URL
- `POST /api/design-workflow/analyze` - Analyze screenshot with vision AI
- `POST /api/design-workflow/generate-mockup` - Generate visual mockup
- `POST /api/design-workflow/generate-code` - Generate React code

## File Structure
```
/app/webapp/
├── app/
│   ├── admin-v2/
│   │   ├── blog-polish/page.tsx       # Blog writing tool + Copyright Tools
│   │   ├── website-analyzer/page.tsx
│   │   └── components/
│   │       ├── CopyrightTools.tsx     # NEW: Copyright check, licenses, attribution
│   │       ├── AIContentDisclaimer.tsx # NEW: AI content notice
│   │       └── StyleLibrary.tsx
│   ├── api/
│   │   ├── blog/
│   │   ├── copyright/
│   │   │   └── check/route.ts         # NEW: Copyright analysis API
│   │   ├── capture-screenshot/route.ts
│   │   └── design-workflow/
│   ├── copyright-guide/page.tsx       # NEW: Educational copyright guide
│   ├── login/page.tsx
│   └── globals.css                    # Added dark theme select styles
├── lib/supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
└── middleware.ts
```

## Known Issues
- Website Analyzer has Python path issues in deployed environment
- Twilio A2P 10DLC Brand Registration blocked (external)
- Retell AI agent "Aiden" paused due to hallucinations

## Prioritized Backlog

### P0 (Critical)
- Test copyright tools in blog editor
- Test image generation API

### P1 (High)
- Add Brand Profile for AI context
- Implement full-screen expandable panels
- Fix Website Analyzer for production deployment

### P2 (Medium)
- Add plagiarism detection integration
- Image reverse-search for copyright verification
- Implement landing page redesign

### P3 (Future)
- Blog analytics dashboard
- Social media auto-sharing
- Resume Retell AI agent
- "God Mode" CMS
