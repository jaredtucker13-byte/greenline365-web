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

### Completed (January 10, 2026 - Session 2)
- [x] **Landing Page Redesign Complete:**
  - Original hero section preserved (phone mockup, "The Operating System for the Local Economy")
  - NEW: Distressed owners section with triptych image ("Running on Empty")
  - NEW: Solution section with barber selfie ("Your Phone is Already a Marketing Machine")
  - NEW: Daily Trend Hunter live demo integrated
  - NEW: Success story section with clean packed restaurant image (before footer)
  - Testimonial moved from floating element to static section
  - All 4 user-provided images integrated: hero-packed-house.jpg, distressed-owners.jpg, barber-selfie.jpg, barber-result.jpg, packed-house-clean.jpg
- [x] **Modular High-Density Layout Implemented:**
  - 50/50 split architecture for all major sections
  - 3-column grids for features and FAQ
  - Max-width 1280px container constraint
  - Fluid typography with clamp()
  - Fluid padding with clamp()
- [x] **Floating Testimonial Removed:** Replaced with static testimonial section
- [x] **About Page Complete with Jared's Story:**
  - Personal photo with nephews and dog Ajax
  - All 4 product photos (canvas art, mugs)
  - "Imagine what these could have been" messaging
  - Full biography and mission statement
  - 5-year, 5-phase vision section
  - Built for micro-business section
- [x] **ContentForge Backend Wired Up:**
  - `/api/content-forge` endpoint created
  - OpenRouter API integration with OPENROUTER_API_KEY
  - Caption generation (GPT-4o)
  - Keywords generation (GPT-4o)
  - Product description generation (GPT-4o)
  - Blog content generation (Claude Sonnet)
  - Smart hashtags generation (Claude Sonnet)
  - Live trends via Perplexity
- [x] **Database Ready:** `scheduled_content` table exists in Supabase

### Previously Completed (January 10, 2026 - Session 1)
- [x] **Login System Fixed:** User can now log in with `jared.tucker13@gmail.com` / `GreenLine365!`
- [x] **Live Local Pulse Feature:** Fully functional with real-time data display
- [x] **Weekly Trend Hunter Feature:** Fully functional with weekly content ideas
- [x] **API Endpoint `/api/receive-trends`:** POST/GET for N8N workflows
- [x] **Database:** RLS enabled on ~96 tables, 250+ performance indexes added
- [x] **SEO Implementation:** Meta tags, sitemap, robots.txt complete
- [x] **Content Forge UI:** Full-screen modal with AI generator buttons, hashtag system, file upload UI
- [x] **Session Persistence:** Auto-redirect for logged-in users
- [x] **Preview Mode Toggle:** Admin can preview customer view

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] **Landing Page Redesign:** ✅ DONE

### P1 (High Priority)
- [ ] **Content Forge Backend:** Wire up AI generators
  - GPT-5.2 for smart thinking
  - Claude Sonnet 4.5 for blogs/hashtags
  - Perplexity for live web search
  - Nano Banana Pro for image generation
  - Supabase Storage for image uploads
- [ ] **UI Fixes:**
  - Booking widget invisible text
  - Components resize (40-75% smaller as requested by user)
- [ ] **God Mode CMS:** Create `/god-mode` page for site-wide editing
- [ ] **OTP Verification System:** Implement N8N/Twilio spec

### P2 (Medium Priority)
- [ ] **Admin sidebar collapse fix**
- [ ] **N8N Webhook Setup Documentation**

### Future/Backlog
- [ ] Build remaining 30+ dashboard features
- [ ] Industry SEO Pages (`/use-cases/...`)
- [ ] Google Calendar Sync integration
- [ ] Full user profile system (fix `profiles` table FK issue)

## LLM Integration Stack (User Specified)
| Use Case | Provider |
|----------|----------|
| Video Analysis | Gemini 3 |
| Image Generation | Nano Banana Pro |
| Smart Thinking/Core AI | GPT-5.2 |
| Blog, Hashtags, Content | Claude Sonnet 4.5 |
| Live Web Search | Perplexity |

## Key API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/receive-trends` | POST | Receives trends from N8N (live_pulse or weekly_batch) |
| `/api/receive-trends?type=live_pulse` | GET | Returns non-expired live trends |
| `/api/receive-trends?type=weekly_batch` | GET | Returns weekly trends (last 7 days) |
| `/api/daily-trend-hunter` | POST | User-triggered live demo on landing page |

## Database Schema (Key Tables)
- `local_trends`: `{id, city_name, trend_data (JSONB), source, expires_at, user_id, zip_code, created_at}`
- `scheduled_content`: `{id, user_id, title, description, content_type, scheduled_date, platforms, hashtags, image_url, status, metadata}`
- `trend_history`: Auto-journaling of all trend requests
- `super_admins`: `{user_id, email, full_name}` - Admin access workaround

## Credentials
- **Admin Login:** `jared.tucker13@gmail.com` / `GreenLine365!`
- **User ID:** `677b536d-6521-4ac8-a0a5-98278b35f4cc`

## Files Reference
- `/app/webapp/app/page.tsx` - Landing page (UPDATED)
- `/app/webapp/app/admin-v2/page.tsx` - Main dashboard
- `/app/webapp/app/admin-v2/components/ContentForge.tsx` - Content creation modal
- `/app/webapp/app/admin-v2/components/LiveLocalPulse.tsx` - Live trends component
- `/app/webapp/app/admin-v2/components/WeeklyTrendBatch.tsx` - Weekly trends component
- `/app/webapp/app/api/receive-trends/route.ts` - Trends API endpoint
- `/app/webapp/public/images/` - User-provided images

## Image Assets
- `hero-packed-house.jpg` - Original packed house with overlays
- `packed-house-clean.jpg` - Clean version for success story section
- `distressed-owners.jpg` - Triptych of stressed business owners
- `barber-selfie.jpg` - Client taking selfie with haircut
- `barber-result.jpg` - Professional haircut result
