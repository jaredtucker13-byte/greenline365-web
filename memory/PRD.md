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

### 🔄 In Progress
- Blog section refinement within Content Forge

### 📋 Upcoming (P0-P1)
1. **Content Forge Persistence**
   - Image upload to Supabase Storage
   - Save Draft / Schedule Blast to `scheduled_content` table
2. **Image Analysis Workflow**
   - Auto-generate title, caption, keywords from uploaded image using vision AI
   - "Autopilot" mode - user uploads image, AI does everything else
3. **Content Distribution Engine**
   - One piece of content → 7-15 platform-specific formats
   - Auto-reformatting for Instagram, X, Facebook, LinkedIn, TikTok, etc.
4. **Chat Widget → Content Forge Integration**
   - Assistant suggestions auto-populate Content Forge fields
   - [CAPTION], [TITLE], [HASHTAGS] parsing and apply buttons
5. **God Mode CMS** - Admin panel for site-wide content management
6. **OTP Verification System** - Twilio-based secure login

### 🔮 Future/Backlog (P2+)
1. **AI Brand Voice Co-Pilot**
   - Voice mimicry from user's previous writing samples (paste text, upload docs, or learn from published posts)
   - Artistic expansion (Sudowrite-style) - turn dry facts into compelling stories
   - Real-time SEO scoring before publish
2. **Monetization Tools**
   - Review modules (Pros/Cons, star ratings, summary boxes)
   - Digital product sales (PDF/ebooks directly from posts)
   - Premium content locks (subscription/paywall)
3. **Reader UX Enhancements**
   - Mega menus with thumbnails
   - Dark/light mode toggle
   - Split posts for increased page views
   - Sticky sidebars
4. **Voice-to-Text Drafting**
   - Record voice note → AI converts to structured blog draft
5. **Tax Report Autopilot** *(NEW - User Requested)*
   - Automated tax reporting for businesses
   - Integration with accounting systems
6. **POS System Integrations** *(NEW - User Requested)*
   - Square, Toast, Clover, etc.
   - Sync sales data for content opportunities
7. **Auto-Journaling**
   - Conversation logging for learning and analytics
8. **Dashboard Features** (30+)
9. **Industry SEO Pages** (`/use-cases/...`)
10. **Google Calendar Sync**

## Database Schema

### `scheduled_content` (Ready to use)
```sql
{
  id: uuid,
  user_id: uuid,
  title: text,
  content_type: text,
  content_data: jsonb,
  status: text,
  scheduled_at: timestamp,
  platforms: text[],
  created_at: timestamp
}
```

### `super_admins` (Workaround table)
- Used for admin authentication due to `profiles` table FK constraint issue

### Future: `chat_sessions` (Planned)
```sql
{
  id: uuid,
  user_id: uuid,
  session_id: text,
  messages: jsonb,
  mode: text,
  context: jsonb,
  created_at: timestamp,
  updated_at: timestamp
}
```

## API Endpoints

### Working
- `POST /api/chat` - AI chat assistant (mode-aware, uses Claude for creative, GPT-4o-mini for support)
- `POST /api/content-forge` - AI content generation (caption, keywords, description, blog, hashtags)
- `GET /api/receive-trends?type=[live_pulse|weekly_batch]` - Fetch trends

### Planned
- `POST /api/content-forge/upload` - Image upload to Supabase Storage
- `POST /api/content-forge/analyze-image` - Vision AI image analysis
- `POST /api/content-forge/save` - Save draft/scheduled content
- `POST /api/content-forge/distribute` - Multi-platform content distribution
- `POST /api/verify-otp` - OTP verification
- `GET /api/chat/history` - Retrieve conversation history

## Chat Widget System

### Modes
| Mode | Trigger | Personality | Quick Actions |
|------|---------|-------------|---------------|
| **Creative** | `/admin/*`, `/dashboard/*` | Brainstorming partner | Caption help, content ideas, descriptions, hashtags |
| **Concierge** | Landing pages, `/`, `/pricing` | Professional guide | Book demo, how it works, pricing, get started |
| **Support** | `/support/*`, `/help/*` | Technical helper | Problem reporting, how-to, escalation |
| **Onboarding** | `/onboarding/*`, `/getting-started/*` | Friendly guide | Tour, first post, features, account setup |

### Features
- Auto-detects page context and switches mode
- Manual mode override via switcher
- Conversation persistence (24h in localStorage)
- Content suggestion parsing with "Apply" buttons
- Expandable window for longer conversations
- Name detection and personalized greetings

## Known Issues

### Active
1. **`profiles` table FK constraint** - Using `super_admins` as workaround (P2 technical debt)

### Resolved
- Button `variant="outline"` type error - Changed to `variant="secondary"`
- Regex `/s` flag ES target error - Replaced with `[\s\S]` pattern
- Chat widget casing conflict - Renamed to ChatWidget.tsx

## Credentials
- **Admin Login**: jared.tucker13@gmail.com / GreenLine365!
- **OpenRouter API**: Available in environment as `OPENROUTER_API_KEY`

## Architecture
```
/app/webapp/
├── app/
│   ├── (main)/
│   │   ├── page.tsx           # Landing page
│   │   ├── about/page.tsx     # About page
│   │   └── privacy/page.tsx
│   ├── admin-v2/
│   │   ├── page.tsx           # Admin dashboard
│   │   └── components/
│   │       └── ContentForge.tsx  # Content creation modal
│   ├── api/
│   │   ├── chat/route.ts         # AI chat API (mode-aware)
│   │   ├── content-forge/route.ts  # AI generation API
│   │   └── receive-trends/route.ts
│   ├── components/
│   │   ├── ChatWidget.tsx        # AI assistant widget (NEW)
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── layout.tsx              # Includes ChatWidget globally
├── components/
│   └── ui/os/                  # Custom UI components
└── public/images/              # User-provided images
```

## Content Creation Flow (User's Vision)

### The "Lazy Way" (Autopilot)
1. User uploads product/image
2. AI analyzes image automatically
3. AI generates: title, caption, product description, keywords, hashtags
4. User reviews and approves (thumbs up/down)
5. AI formats into long-form blog
6. Blog is broken down into 7-15 platform-specific formats
7. Content distributed to all platforms

### The "Hands-On Way" (Human-in-the-Loop)
1. User opens Content Forge
2. Opens Chat Widget (Creative Co-Pilot)
3. Describes what they want to create
4. AI asks probing questions to understand:
   - Business type/industry
   - Target audience
   - Story behind the content
5. AI provides suggestions with [CAPTION], [TITLE] tags
6. User clicks "Apply" to populate Content Forge fields
7. User refines with AI assistance
8. Final content distributed

## Last Updated
January 10, 2026 - AI Chat Widget (production-ready) deployed, Blog section in progress
