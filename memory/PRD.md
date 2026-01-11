# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build "GreenLine365," a comprehensive marketing OS for local businesses. The platform aims to help local businesses automate marketing, manage content, book appointments, and leverage AI for customer engagement.

## Current Status: MVP Phase
- Landing page complete with SEO optimizations
- Waitlist system active and capturing leads
- Google Auth integrated (redirects to home, not dashboard)
- Blog Auto-Polish feature in progress

---

## What's Been Implemented

### December 2025 - January 2026

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
- [x] Auth callback redirects to home (not dashboard)
- [x] Login page redirects to home after success

#### Blog Auto-Polish (IN PROGRESS)
- [x] Database schema: `007_blog_system.sql`
- [ ] Backend API routes (`/api/blog/*`)
- [ ] Admin editor UI (`/admin-v2/blog-polish`)
- [ ] Public blog pages (`/blog`, `/blog/[slug]`)
- [ ] AI content analysis integration

---

## Prioritized Backlog

### P0 - Critical
- Run `008_waitlist_table.sql` migration
- Run `007_blog_system.sql` migration
- Complete Blog Auto-Polish MVP

### P1 - High Priority
- Blog Auto-Polish Phase 2 (export to HTML/WordPress)
- Test Retell AI Agent "Aiden"
- Keyboard shortcuts for Content Forge

### P2 - Medium Priority
- Fix booking widget invisible text
- Fix UI components too large
- Fix `profiles` table foreign key

### P3 - Future Features
- God Mode CMS
- Product Mockups Generator
- Newsletter feature
- Feature-locking for subscription tiers
- OTP verification (Twilio)
- Tax Reporting & POS Integrations
- Location Pages (SEO Phase 3)

---

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, GSAP
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **Hosting**: Vercel
- **AI**: OpenRouter

### Key Files
- `/app/webapp/app/page.tsx` - Landing page
- `/app/webapp/app/waitlist/page.tsx` - Waitlist signup
- `/app/webapp/app/login/page.tsx` - Login page
- `/app/webapp/app/auth/callback/route.ts` - Auth callback
- `/app/webapp/app/components/Navbar.tsx` - Navigation
- `/app/webapp/supabase/migrations/` - Database migrations

### Database Tables (Active)
- `tenants` - Multi-tenant business data
- `waitlist_submissions` - Waitlist signups
- `bookings` - Appointment bookings
- `blog_posts` - Blog content (pending migration)
- `blog_categories` - Blog categories (pending migration)

---

## Known Issues
1. Retell AI "Aiden" hallucinating (PAUSED by user)
2. Booking widget input text invisible
3. UI components too large
4. `profiles` table foreign key broken

---

## User Personas

### Primary: Local Business Owner
- Runs a small local business (salon, restaurant, contractor)
- Works 60+ hours/week
- Struggles with marketing and social media
- Wants automated solutions
- Budget-conscious

### Secondary: Marketing Agency
- Manages multiple local business clients
- Needs white-label solutions
- Wants scalable tools

---

## Success Metrics
- Waitlist signups
- Demo bookings
- User engagement on landing page
- SEO rankings (currently ranking #1 for "GR")
