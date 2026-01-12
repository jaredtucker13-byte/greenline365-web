# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build "GreenLine365," a comprehensive marketing OS for local businesses. The platform aims to help local businesses automate marketing, manage content, book appointments, and leverage AI for customer engagement.

## Current Status: MVP Phase
- Landing page complete with SEO optimizations
- Waitlist system active and capturing leads
- Google Auth integrated (redirects to dashboard after sign-in)
- Email system built with SendGrid integration
- **Global Theme System implemented** (5 themes available)
- Blog Auto-Polish feature in progress

---

## What's Been Implemented

### January 2026

#### Global Theme System (COMPLETE - Jan 12, 2026)
- [x] ThemeContext with CSS variables for all colors
- [x] 5 theme templates:
  - Glassmorphism (default - frosted glass with nature backdrop)
  - Midnight Purple (deep purple with electric accents)
  - Ocean Blue (calm cyan/teal tones)
  - Sunset Orange (warm sunset vibes)
  - Neon Tactical (high-tech command center)
- [x] Settings page at `/admin-v2/settings` with theme selector
- [x] Theme persists via localStorage
- [x] CSS variables applied to:
  - Sidebar (CollapsibleSidebar)
  - Calendar (HybridCalendar)
  - Quick Action buttons
  - **Content Forge modal** (all tabs, inputs, buttons, preview)
  - All text and accent colors
- [x] Theme changes apply instantly across all pages and components

#### Auth Redirect Fix (COMPLETE - Jan 12, 2026)
- [x] Sign-in now redirects to `/admin-v2` (dashboard) instead of home
- [x] Auth callback updated to redirect to dashboard
- [x] Login page session check redirects to dashboard
- [x] Settings link in sidebar now points to `/admin-v2/settings`

#### Email System (COMPLETE - Jan 11, 2026)
- [x] Email Command Center at `/admin-v2/email`
- [x] Pre-built templates (Welcome Waitlist, Booking Confirmation, Newsletter, Product Launch)
- [x] Template customization with variables
- [x] Send emails via SendGrid
- [x] Campaign tracking
- [x] Waitlist recipient integration
- [x] Added Email link to admin sidebar
- [x] Migration: `009_email_system.sql`

#### Waitlist System (COMPLETE - Jan 11, 2026)
- [x] Waitlist page at `/waitlist`
- [x] Form: Email, Name, Business Name, Industry
- [x] Auto-redirect to home after signup
- [x] "Join Waitlist" CTA in hero section
- [x] "Join Waitlist" button in navbar
- [x] Migration: `008_waitlist_table.sql`

#### Authentication (COMPLETE - Jan 11, 2026)
- [x] Google OAuth via Supabase
- [x] Email/Password login
- [x] Auth callback redirects to dashboard
- [x] Login page redirects to dashboard after success

#### Blog Auto-Polish (COMPLETE - Jan 12, 2026)
- [x] Database schema: `007_blog_system.sql`
- [x] Backend API routes:
  - `GET /api/blog` - List posts with analytics
  - `POST /api/blog` - Create new post with auto-SEO scoring
  - `POST /api/blog/analyze` - Real-time SEO analysis
  - `GET /api/blog/[slug]` - Get single post (increments views)
  - `PATCH /api/blog/[slug]` - Update post
  - `DELETE /api/blog/[slug]` - Delete post
  - **`POST /api/blog/ai` - AI content enhancements (NEW)**
- [x] Admin editor UI at `/admin-v2/blog-polish`:
  - Title input with character count (50-60 optimal)
  - Markdown content editor with word count & read time
  - Write/Preview tabs
  - Category selector (5 categories)
  - Tag management
  - Image upload (up to 5)
  - Real-time SEO Analysis:
    - Animated circular score (0-100)
    - Word count, headings, readability feedback
    - Top keywords extraction
  - Save Draft / Schedule / Publish Now actions
  - Schedule modal with date/time picker
- [x] **AI-Powered Features (OpenRouter integration):**
  - 📋 Generate Outline - Creates full blog structure from title (Claude)
  - ✨ Enhance Content - Improves readability and engagement (Claude)
  - 💡 Suggest Headlines - 5 alternative title options (GPT-4o)
  - 🏷️ Suggest Tags - Auto-generate relevant tags (GPT-4o-mini)
  - 🔎 Generate Meta - SEO description & keywords (GPT-4o-mini)
  - AI Suggestions Panel with one-click apply
- [x] **Image Generation System (Nano Banana):**
  - 🖼️ Content Analyzer - AI identifies optimal image placements (header, inline, section-break)
  - 🎨 Nano Banana Pro - Generates custom illustrations matching content
  - Smart prompts generated based on blog context
  - **Parallelized generation** for faster results (2 images default)
  - Template selector (Classic, Magazine, Minimal, Cards)
  - Click-to-select image UI
  - Python microservice at port 8002 for image generation
- [x] **Page Style System (COMPLETE - Jan 12, 2026):**
  - 🎨 AI analyzes content and suggests complete visual theme
  - **Color Palette**: Primary, secondary, accent, background, text, headings, links
  - **Background Gradients**: CSS gradient suggestions
  - **Texture**: None, grain, dots, lines, geometric, organic + opacity
  - **Typography**: Heading style, size, line height, emphasis
  - **Layout**: Content width, image style, spacing, header style
  - **Mood**: Emotional impact description
  - One-click "Apply Style" to preview pane
  - **"Reset" button** to undo style application
  - **"Regenerate" button** to explore mood variations (8 preset moods: professional, creative, bold, calm, warm, modern, luxurious, playful)
  - **Color Editor** - click "Edit" to fine-tune individual color values with color pickers and hex input
  - **style_guide saved to database** as JSONB column in blog_posts table
  - Preview shows styled content with applied colors, typography, textures
  - Style badge shows theme name on preview (e.g., "🎨 Growth Catalyst")
- [x] **Style Library (NEW - Jan 12, 2026):**
  - **"❤️ My Library" button** in AI tools toolbar for quick access
  - **Save Current Style** - one-click save with custom name and tags
  - **Beautiful style cards** showing color palette preview, theme name, mood
  - **Search & Filter** - search by name/tags, filter by All/Default/Recent
  - **Usage tracking** - tracks how many times each style is used
  - **Set as Default** - star a style to auto-suggest for new posts
  - **Quick Apply** - one-click apply any saved style
  - **Delete** - remove styles from library
  - **Database migration**: `011_style_presets.sql` (requires manual execution)
- [x] Added "Blog" link to admin sidebar
- [x] **Testing**: All backend tests pass, full workflow verified (test_blog_polish_api.py)

### December 2025

#### Landing Page & SEO (COMPLETE)
- [x] Hero section with phone mockup
- [x] Features section (3-column grid)
- [x] How it Works section (4 steps)
- [x] Testimonial section
- [x] FAQ section
- [x] Booking form integration
- [x] Fixed GSAP/CSS card rendering bug
- [x] SEO Content Hub: 7 pages created
  - `/features/ai-content-creation`
  - `/features/automated-scheduling`
  - `/features/local-trend-tracking`
  - `/industries/restaurants`
  - `/industries/retail`
  - `/industries/professional-services`
  - `/industries/healthcare`
- [ ] Public blog pages (`/blog`, `/blog/[slug]`)
- [ ] AI content analysis integration

---

## Prioritized Backlog

### P0 - Critical
- ~~Run `009_email_system.sql` migration~~
- ~~Run `007_blog_system.sql` migration~~
- ~~Complete Blog Auto-Polish MVP~~
- ~~Run `010_blog_style_guide.sql` migration (style_guide JSONB column)~~
- ~~Run `011_style_presets.sql` migration (Style Library)~~
- ~~Build public-facing blog pages with style rendering~~

### P1 - High Priority
- Test Retell AI Agent "Aiden" (PAUSED by user)
- Keyboard shortcuts for Content Forge
- Email analytics dashboard
- Optimize image generation speed (currently ~40s)

### P2 - Medium Priority
- Fix booking widget invisible text
- Fix UI components too large
- Fix `profiles` table foreign key
- Scheduled email campaigns

### P3 - Future Features
- God Mode CMS
- Product Mockups Generator
- Newsletter feature
- Feature-locking for subscription tiers
- OTP verification (Twilio Verify Service)
- Tax Reporting & POS Integrations
- Location Pages (SEO Phase 3)
- Additional theme templates (custom user themes)

---

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, GSAP
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **Email**: SendGrid
- **Hosting**: Vercel
- **AI**: OpenRouter

### Key Files
- `/app/webapp/app/page.tsx` - Landing page
- `/app/webapp/app/waitlist/page.tsx` - Waitlist signup
- `/app/webapp/app/login/page.tsx` - Login page
- `/app/webapp/app/auth/callback/route.ts` - Auth callback
- `/app/webapp/app/admin-v2/page.tsx` - Main dashboard
- `/app/webapp/app/admin-v2/settings/page.tsx` - Settings & Theme selector
- `/app/webapp/app/admin-v2/lib/ThemeContext.tsx` - Global theme system
- `/app/webapp/app/admin-v2/email/page.tsx` - Email Command Center
- `/app/webapp/app/api/email/*` - Email API routes
- `/app/webapp/app/components/Navbar.tsx` - Navigation
- `/app/webapp/supabase/migrations/` - Database migrations

### Database Tables
- `tenants` - Multi-tenant business data
- `waitlist_submissions` - Waitlist signups
- `bookings` - Appointment bookings
- `email_templates` - Email templates (pending migration)
- `email_campaigns` - Email campaigns (pending migration)
- `email_sends` - Email send logs (pending migration)
- `blog_posts` - Blog content with style_guide JSONB (MIGRATED)
- `blog_analytics` - Blog post analytics (MIGRATED)
- `blog_categories` - Blog categories (MIGRATED)

---

## Known Issues
1. Retell AI "Aiden" hallucinating (PAUSED by user)
2. Booking widget input text invisible
3. UI components too large
4. `profiles` table foreign key broken
5. **Twilio SMS**: BLOCKED due to A2P 10DLC brand registration failure (user needs to resolve with Twilio support)

---

## Blocked Items
- **SMS Command Center**: Cannot send SMS due to Twilio A2P 10DLC brand registration failure. User has been provided support ticket templates to send to Twilio.

---

## Success Metrics
- Waitlist signups
- Demo bookings
- Email open rates
- User engagement on landing page
- SEO rankings (currently ranking #1 for "GR")
