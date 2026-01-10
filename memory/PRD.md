# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered business operating system for local businesses that:
- Automates content creation and scheduling
- Tracks local trends and opportunities
- Provides a "money-making machine" for users
- Saves business owners 15+ hours per week

## Target Users
- Small business owners (barbers, HVAC technicians, local shops)
- Content creators and marketers
- Anyone running a local business without dedicated marketing staff

## Tech Stack
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Integrations**: OpenRouter (LLM access), Vercel (hosting)
- **Planned**: Twilio (OTP), Google Calendar Sync

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

### 🔄 In Progress
- None currently

### 📋 Upcoming (P0-P1)
1. **Content Forge Persistence**
   - Image upload to Supabase Storage
   - Save Draft / Schedule Blast to `scheduled_content` table
2. **Image Analysis Workflow**
   - Auto-generate title, caption, keywords from uploaded image
3. **God Mode CMS** - Admin panel for site-wide content management
4. **OTP Verification System** - Twilio-based secure login

### 🔮 Future/Backlog (P2+)
1. **AI Brand Voice Co-Pilot**
   - Voice mimicry from user's writing samples
   - Artistic expansion (Sudowrite-style)
   - Real-time SEO scoring
2. **Monetization Tools**
   - Review modules (Pros/Cons, star ratings)
   - Digital product sales (PDF/ebooks)
   - Premium content locks
3. **Reader UX Enhancements**
   - Mega menus with thumbnails
   - Dark/light mode toggle
   - Voice-to-text drafting
4. **Dashboard Features** (30+)
5. **Industry SEO Pages** (`/use-cases/...`)
6. **Google Calendar Sync**

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

## API Endpoints

### Working
- `POST /api/content-forge` - AI content generation (caption, keywords, description, blog, hashtags)
- `GET /api/receive-trends?type=[live_pulse|weekly_batch]` - Fetch trends

### Planned
- `POST /api/content-forge/upload` - Image upload to Supabase Storage
- `POST /api/content-forge/save` - Save draft/scheduled content
- `POST /api/verify-otp` - OTP verification

## Known Issues

### Active
1. **Build Deployment** - Fixed regex `/s` flag issue, ready for redeploy
2. **`profiles` table FK constraint** - Using `super_admins` as workaround (P2 technical debt)

### Resolved
- Button `variant="outline"` type error - Changed to `variant="secondary"`
- Regex `/s` flag ES target error - Replaced with `[\s\S]` pattern

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
│   └── api/
│       ├── content-forge/route.ts  # AI generation API
│       └── receive-trends/route.ts
├── components/
│   └── ui/os/                 # Custom UI components
└── public/images/             # User-provided images
```

## Last Updated
January 10, 2026 - Content Forge Phase 0 redesign completed
