# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketing OS for local businesses called "GreenLine365". Key features:
1. **AI Website Analyzer** - Analyze websites and generate redesign proposals
2. **Blog Auto-Polish** - AI-powered blog writing and enhancement tool
3. **Admin Dashboard** - Secured behind Supabase authentication
4. **Copyright Compliance System** - Tools for content creators

## What's Been Implemented

### January 2026 - Session 3 (UX Improvements)
- ✅ Fixed image generation model name (gemini-2.5-flash-image-preview)
- ✅ Reorganized Blog Auto-Polish layout (Tags & Images to sidebar)
- ✅ Added button click feedback (scale animations)
- ✅ Added loading states with text ("Working...", "Enhancing...")
- ✅ Improved AI Tools bar with flex-wrap
- ✅ Better sidebar space utilization

### January 2026 - Session 2 (Copyright System)
- ✅ Copyright Tools component (Check, License Guide, Attribution)
- ✅ AI Content Disclaimer component
- ✅ Copyright Check API
- ✅ Copyright Guide page (/copyright-guide)

### January 2026 - Session 1 (Auth & Core Fixes)
- ✅ Fixed Supabase SSR authentication
- ✅ Fixed select dropdown visibility
- ✅ Added custom prompt input for AI suggestions
- ✅ Rewrote image generation API

### December 2025
- ✅ Initial Blog Auto-Polish UI
- ✅ AI Website Analyzer UI
- ✅ Style Library component

## Core Features

### Blog Auto-Polish
- **Editor Modes**: Write (Markdown) / Preview
- **AI Tools** (with click feedback):
  - 📋 Outline | ✨ Enhance | 💡 Headlines | 🏷️ Tags | 🔎 Meta
  - 🖼️ Images | 🎨 Style | ❤️ Library | 🔍 Research | ⚖️ Copyright
- **Right Sidebar**:
  - 📊 SEO Score
  - 📈 Post Stats
  - 🏷️ Tags (inline add/remove)
  - 📸 Images (grid upload)
  - 💡 Quick Tips
  - 🤖 AI Disclaimer

### Copyright Tools
- Content check for issues
- License type explorer (CC0 → All Rights Reserved)
- Attribution generator
- AI content disclaimers

### Authentication
- Supabase SSR with middleware
- Protected /admin-v2/* routes
- Email/password + Google OAuth

## API Endpoints

### Blog APIs
- `POST /api/blog/ai` - AI content generation
- `POST /api/blog/images` - Image generation (Fixed: gemini-2.5-flash-image-preview)
- `POST /api/blog/trending` - Trending research
- `POST /api/copyright/check` - Copyright analysis

### Website Analyzer (Needs Production Fix)
- `POST /api/capture-screenshot`
- `POST /api/design-workflow/analyze`
- `POST /api/design-workflow/generate-mockup` (Fixed model)
- `POST /api/design-workflow/generate-code`

## Known Issues
- Website Analyzer: Python path issues in deployed environment
- Twilio A2P: External registration blocked

## Prioritized Backlog

### P0 (Critical)
- Test blog image generation
- Test new sidebar layout

### P1 (High)
- Add collapsible sections for mobile
- Implement undo for destructive actions
- Fix Website Analyzer for production

### P2 (Medium)
- Add tooltips for all AI tools
- Plagiarism detection integration
- Role-based access control

### P3 (Future)
- Blog analytics dashboard
- Social media auto-sharing
- Resume Retell AI agent

## File Structure
```
/app/webapp/app/
├── admin-v2/
│   ├── blog-polish/page.tsx     # Main blog editor (refactored)
│   ├── website-analyzer/page.tsx
│   └── components/
│       ├── CopyrightTools.tsx
│       ├── AIContentDisclaimer.tsx
│       └── StyleLibrary.tsx
├── api/
│   ├── blog/
│   │   ├── ai/route.ts
│   │   └── images/route.ts      # Fixed model name
│   ├── copyright/check/route.ts
│   └── design-workflow/
│       └── generate-mockup/route.ts  # Fixed model name
├── copyright-guide/page.tsx
└── login/page.tsx
```
