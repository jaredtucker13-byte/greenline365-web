# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered business operating system for local businesses that:
- Automates content creation and scheduling
- Tracks local trends and opportunities
- Provides a "money-making machine" for users
- Saves business owners 15+ hours per week
- **Includes an AI brainstorming assistant** that eliminates the need for external AI tools

## Target Users
- Small business owners (barbers, HVAC technicians, local shops)
- Content creators and marketers
- Anyone running a local business without dedicated marketing staff

## Tech Stack
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter (Claude Sonnet 3.5 for creative, GPT-4o-mini for support)
- **Integrations**: Vercel (hosting)
- **Planned**: Twilio (OTP), Google Calendar Sync, POS systems

## Core Features

### ✅ Completed
1. **Landing Page** - Modular, high-density layout with user's storyline and images
2. **About Page** - Comprehensive biography with personal photos and product images
3. **Content Forge AI Backend** - OpenRouter integration for caption, keyword, description, blog, hashtag generation
4. **Content Forge UI Redesign (Phase 0)** - Jan 10, 2026
   - 2-column layout with proper spacing
   - Calendar popup date picker (react-day-picker)
   - Clickable AI hashtag suggestions
   - Feedback thumbs up/down on AI content
5. **Daily Trend Hunter Demo** - ZIP code-based local trend discovery
6. **Admin Dashboard** - Command center with calendar and scheduling
7. **AI Chat Widget (Production-Ready)** - Jan 10, 2026
   - Context-aware: Auto-switches between modes based on page
   - **Creative Co-Pilot Mode** (Admin/Dashboard) - Brainstorming partner for content creation
   - **Concierge Mode** (Landing pages) - Professional assistant for visitors
   - Human-in-the-loop conversation flow
   - Quick action buttons tailored to context
   - Conversation persistence (24h localStorage)
   - Mode switcher for manual override
   - Expandable window
8. **Save Draft & Drafts Panel** - Jan 10, 2026
   - Save Draft button persists content to Supabase
   - Drafts Panel shows saved drafts with preview
   - Tabs for Drafts vs Scheduled content
   - Delete functionality
   - Proper schema alignment with `scheduled_content` table
9. **GSAP Premium Animations** - Jan 10, 2026
   - Replaced Framer Motion with GSAP for performance
   - Hero section entrance animations with staggered text reveals
   - Scroll-triggered animations for all sections
   - Feature cards stagger animation
   - How It Works step cards with progress bars
   - FAQ cards grid reveal
   - Parallax background effects
   - Floating phone mockup animation
   - Background glow pulsing effects
   - Hover lift effects on interactive cards
10. **Landing Page Duplicate Section Fix** - Jan 11, 2026
    - Removed duplicate "Distressed Owners" section
    - Page now flows correctly: Hero → Problem → Features → How It Works → Testimonial → Solution
11. **Weekly Trend Hunter - Content Forge Integration** - Jan 11, 2026
    - "Create Content →" buttons now open Content Forge with pre-filled title and context
    - Trend data (title, suggested action) populates the form automatically
12. **Content Forge - Auto-Analyze Toggle** - Jan 11, 2026
    - Added toggle to enable/disable auto-image-analysis
    - Users can choose "Manual Mode" to write their own content
    - Shows "✍️ Manual Mode" or "🤖 AI will auto-analyze" based on toggle state
13. **Chat Widget Scroll Fix** - Jan 11, 2026
    - Fixed scroll behavior in chat messages container
    - Added min-h-0 and proper flex constraints for overflow handling
14. **"How the System Works" 2x2 Layout** - Jan 11, 2026
    - Changed from single column to 2-column grid (2 cards per row)
    - Added icons for each step (🔍, 📡, 🎯, 📈)
    - More compact and visually balanced
15. **Booking Section Enhancement** - Jan 11, 2026
    - Enhanced left panel with stats row (40%, 24/7, 2min)
    - Added quick benefits section (No credit card, Free strategy call, Cancel anytime)
    - Compact form mode for booking widget
    - Smaller text sizes and tighter spacing
16. **Custom 404 Page** - Jan 11, 2026
    - Branded 404 page with animated "404" text
    - "Back to Home" and "Get Help" buttons
    - Fun fact about 404 error origin
    - Prevents users from being stuck on broken links

### 🔄 In Progress
- Wire up AI Assistant suggestions to Content Forge fields ("Apply" buttons)

### 📋 Upcoming (P0-P1)
1. **Image Analysis Workflow**
   - Auto-generate title, caption, keywords from uploaded image using vision AI
   - "Autopilot" mode - user uploads image, AI does everything else
2. **Chat Widget → Content Forge Integration**
   - Assistant suggestions auto-populate Content Forge fields
   - [CAPTION], [TITLE], [HASHTAGS] parsing and apply buttons
3. **Content Distribution Engine**
   - One piece of content → 7-15 platform-specific formats
   - Auto-reformatting for Instagram, X, Facebook, LinkedIn, TikTok, etc.
4. **God Mode CMS** - Admin panel for site-wide content management
5. **OTP Verification System** - Twilio-based secure login

### 🔮 Future/Backlog (P2+)
1. **AI Brand Voice Co-Pilot**
   - Voice mimicry from user's previous writing samples
   - Artistic expansion (Sudowrite-style)
   - Real-time SEO scoring before publish
2. **Monetization Tools**
   - Review modules (Pros/Cons, star ratings)
   - Digital product sales (PDF/ebooks)
   - Premium content locks
3. **Voice-to-Text Drafting**
   - Record voice note → AI converts to blog draft
4. **Tax Report Autopilot** *(User Requested)*
   - Automated tax reporting for businesses
5. **POS System Integrations** *(User Requested)*
   - Square, Toast, Clover, etc.
6. **Dashboard Features** (30+)
7. **Industry SEO Pages**
8. **Google Calendar Sync**

## Database Schema

### `scheduled_content` (Active - Verified Working)
```sql
{
  id: uuid,
  user_id: uuid,
  title: text,
  description: text,
  content_type: text,
  event_type: text,
  scheduled_date: timestamp NOT NULL,
  platforms: text[],
  hashtags: text[],
  image_url: text,
  status: text (draft/scheduled/published),
  color: text,
  metadata: jsonb (keywords, fullContentData, blogContent),
  created_at: timestamp,
  updated_at: timestamp
}
```

## API Endpoints

### Working
- `POST /api/chat` - AI chat assistant (mode-aware)
- `POST /api/content-forge` - AI content generation
- `GET /api/receive-trends` - Fetch trends
- `GET /api/drafts` - Fetch user drafts
- `POST /api/drafts` - Save new draft/scheduled content
- `PUT /api/drafts` - Update draft
- `DELETE /api/drafts` - Delete draft

## Chat Widget System

### Modes
| Mode | Trigger | Personality |
|------|---------|-------------|
| **Creative** | `/admin/*`, `/dashboard/*` | Brainstorming partner |
| **Concierge** | Landing pages | Professional guide |
| **Support** | `/support/*` | Technical helper |
| **Onboarding** | `/getting-started/*` | Friendly guide |

## Known Issues

### Resolved
- ✅ Button `variant="outline"` type error
- ✅ Regex `/s` flag ES target error
- ✅ Chat widget casing conflict
- ✅ Chat widget cut-off positioning
- ✅ Save Draft not working (schema mismatch)

### Active
- `profiles` table FK constraint (using workaround)
- Landing page ZIP input needs testing

## Credentials
- **Admin Login**: jared.tucker13@gmail.com / GreenLine365!
- **OpenRouter API**: Environment variable `OPENROUTER_API_KEY`

## Last Updated
January 10, 2026 - GSAP Premium Animations completed on landing page
