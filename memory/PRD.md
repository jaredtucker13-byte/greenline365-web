# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-assisted business operating system for small businesses, featuring:
1. **Dual Dashboard System:**
   - **God Mode (Site CMS):** Admin panel to manage the public website's content, colors, and layout
   - **User Dashboard (Content Command Center):** Main application interface for content creation features

2. **Core Features:**
   - **Daily Trend Hunter (Weekly):** Weekly batch of 3-5 content ideas for scheduling
   - **Local Pulse (Live):** Real-time (3-hour) actionable marketing suggestions based on local conditions

3. **Additional Requirements:**
   - Landing page redesign with "distressed business owner" storyline
   - OTP verification system via N8N/Twilio
   - Database production readiness (RLS, indexes)

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL with RLS)
- **Integrations:** N8N Webhooks, Twilio (planned for OTP)
- **Deployment:** Vercel

## User Personas
1. **Small Business Owner (Primary):** Uses the Content Command Center to create and schedule marketing content
2. **Super Admin:** Uses God Mode CMS to manage the public website

## What's Been Implemented

### Completed (January 10, 2026)
- [x] **Login System Fixed:** User can now log in with `jared.tucker13@gmail.com` / `GreenLine365!`
- [x] **Super Admin ID Mismatch Fixed:** Corrected `super_admins` table user_id to match auth.users
- [x] **Live Local Pulse Feature:** Fully functional with real-time data display
  - Shows trends that expire in 3 hours
  - Countdown timer to next update
  - "Create Special Now" action buttons
  - Fetches from `/api/receive-trends?type=live_pulse`
- [x] **Weekly Trend Hunter Feature:** Fully functional with weekly content ideas
  - Shows up to 5 trends for content planning
  - Traffic indicators (HIGH/MEDIUM/LOW)
  - "Create Content" action buttons
  - Fetches from `/api/receive-trends?type=weekly_batch`
- [x] **API Endpoint `/api/receive-trends`:**
  - POST: Receives trends from N8N workflows, stores in `local_trends` table
  - GET: Returns trends filtered by type (live_pulse or weekly_batch)
  - Properly handles JSONB `trend_data` column structure
- [x] **Database:** RLS enabled on ~96 tables, 250+ performance indexes added

### Previously Completed
- [x] Supabase database cleanup and production readiness
- [x] `super_admins` workaround table for admin access
- [x] Vercel configuration fixed (`vercel.json`)
- [x] Navbar updated with Sign In/Sign Up and God Mode links
- [x] Dashboard scaffolding (`/admin-v2` page)
- [x] `trend_history` table for auto-journaling

## Prioritized Backlog

### P0 (Critical)
- [ ] **Landing Page Redesign:** Implement the "distressed business owner" storyline with:
  - Specific imagery (barber shop before/after)
  - Daily Trend Hunter live demo integration
  - 40% smaller booking calendar
  - Remove redundant funnels/buttons

### P1 (High Priority)
- [ ] **God Mode CMS:** Create `/god-mode` page for site-wide editing (colors, content, layout)
- [ ] **OTP Verification System:** Implement N8N/Twilio spec with `verification_events` audit table
- [ ] **UI Fixes:**
  - Booking widget invisible text
  - Components resize (75% smaller)
  - Admin sidebar collapse fix

### P2 (Medium Priority)
- [ ] **Content Forge Integration:** Wire "Create Content" buttons to ContentForge modal
- [ ] **N8N Webhook Setup Documentation:** Guide for user to configure N8N workflows

### Future/Backlog
- [ ] Build remaining 30+ dashboard features
- [ ] Industry SEO Pages (`/use-cases/...`)
- [ ] Google Calendar Sync integration
- [ ] Full user profile system (fix `profiles` table FK issue)

## Known Issues
1. **`profiles` table FK broken:** Workaround via `super_admins` table
2. **Landing page is old version:** Major user dissatisfaction - needs redesign

## Key API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/receive-trends` | POST | Receives trends from N8N (live_pulse or weekly_batch) |
| `/api/receive-trends?type=live_pulse` | GET | Returns non-expired live trends |
| `/api/receive-trends?type=weekly_batch` | GET | Returns weekly trends (last 7 days) |
| `/api/daily-trend-hunter` | POST | User-triggered live demo on landing page |

## Database Schema (Key Tables)
- `local_trends`: `{id, city_name, trend_data (JSONB), source, expires_at, user_id, zip_code, created_at}`
- `trend_history`: Auto-journaling of all trend requests
- `super_admins`: `{user_id, email, full_name}` - Admin access workaround
- `business_services`: User's services for context-aware suggestions

## Credentials
- **Admin Login:** `jared.tucker13@gmail.com` / `GreenLine365!`
- **User ID:** `677b536d-6521-4ac8-a0a5-98278b35f4cc`

## Files Reference
- `/app/webapp/app/admin-v2/page.tsx` - Main dashboard
- `/app/webapp/app/admin-v2/components/LiveLocalPulse.tsx` - Live trends component
- `/app/webapp/app/admin-v2/components/WeeklyTrendBatch.tsx` - Weekly trends component
- `/app/webapp/app/api/receive-trends/route.ts` - Trends API endpoint
- `/app/webapp/app/page.tsx` - Landing page (needs redesign)
- `/app/webapp/lib/supabase/client.ts` - Supabase client config
