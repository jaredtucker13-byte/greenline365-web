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
  - All text and accent colors
- [x] Theme changes apply instantly across all pages

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

#### Blog Auto-Polish (IN PROGRESS)
- [x] Database schema: `007_blog_system.sql`
- [ ] Backend API routes (`/api/blog/*`)
- [ ] Admin editor UI (`/admin-v2/blog-polish`)
- [ ] Public blog pages (`/blog`, `/blog/[slug]`)
- [ ] AI content analysis integration

---

## Prioritized Backlog

### P0 - Critical
- Run `009_email_system.sql` migration
- Run `007_blog_system.sql` migration
- Complete Blog Auto-Polish MVP

### P1 - High Priority
- Blog Auto-Polish Phase 2 (export to HTML/WordPress)
- Test Retell AI Agent "Aiden"
- Keyboard shortcuts for Content Forge
- Email analytics dashboard

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
- `blog_posts` - Blog content (pending migration)
- `blog_categories` - Blog categories (pending migration)

---

## Known Issues
1. Retell AI "Aiden" hallucinating (PAUSED by user)
2. Booking widget input text invisible
3. UI components too large
4. `profiles` table foreign key broken

---

## Success Metrics
- Waitlist signups
- Demo bookings
- Email open rates
- User engagement on landing page
- SEO rankings (currently ranking #1 for "GR")
