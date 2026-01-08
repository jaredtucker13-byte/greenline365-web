# GreenLine365

AI-powered business planning and accountability platform with Tactical Command Center.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter API (for AI chat)
OPENROUTER_API_KEY=your-openrouter-key

# SendGrid (for email - optional)
SENDGRID_API_KEY=your-sendgrid-key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
webapp/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── admin/             # Admin dashboard v1
│   ├── admin-v2/          # Tactical Command Center
│   │   ├── components/    # Command Center components
│   │   │   ├── DemoController.tsx
│   │   │   ├── HybridCalendar.tsx
│   │   │   ├── ContentForge.tsx
│   │   │   └── ...
│   │   └── page.tsx
│   ├── api/               # API routes
│   │   ├── bookings/
│   │   ├── chat/
│   │   └── verify-email/
│   ├── blog/              # Blog page
│   ├── demo-calendar/     # Demo booking flow
│   ├── demo/[sessionId]/  # Demo session experience
│   ├── how-it-works/      # How it works page
│   ├── pricing/           # Pricing page
│   ├── use-cases/         # Industry use cases
│   ├── waitlist/          # Waitlist signup
│   └── components/        # Shared components
├── config/                # Configuration files (YAML)
│   ├── demo-profiles.yml  # Demo Controller presets
│   ├── industries.yml     # Industry mappings
│   ├── local-intel-rules.yml  # Local Pulse categories
│   └── companion-prompts.yml  # AI Companion prompts
├── database/              # Database schema
│   └── schema.sql         # Supabase SQL schema
├── lib/                   # Utility libraries
│   └── supabase/          # Supabase client
├── scripts/               # Utility scripts
│   ├── seed.ts            # TypeScript seed script
│   └── seed-simple.js     # JavaScript seed script
└── supabase/              # Supabase Edge Functions
    └── functions/
        ├── schedule-blast/
        ├── local-trends/
        └── lead-alerts/
```

---

## ⚙️ Configuration (`/config`)

The `/config` directory contains YAML configuration files that define app behavior:

### `demo-profiles.yml`
Defines presets for the Demo Controller (B2B sales demos):
- `id`: Unique identifier
- `slug`: URL-friendly slug
- `business_name`: Display name
- `city_location`: City/location
- `industry`: Industry category
- `primary_color`: Brand primary color (hex)
- `accent_color`: Brand accent color (hex)

### `industries.yml`
Maps industries to default demo profiles:
- `id`: Industry identifier
- `name`: Display name
- `default_demo_profile_id`: Links to demo-profiles.yml
- `icon`: Emoji icon
- `description`: Short description

### `local-intel-rules.yml`
Defines Local Pulse / Daily Trend Hunter categories:
- Category definitions with icons and colors
- Keyword triggers for categorization
- Suggested actions per category
- Traffic level configurations

### `companion-prompts.yml`
AI Companion system prompts and templates:
- Default system prompt
- Greeting templates
- Context modifiers by industry/time
- Error response templates

---

## 🗄️ Database Setup

### 1. Run Schema Migration

Execute the SQL in `/database/schema.sql` in your Supabase SQL Editor:

```sql
-- Tables created:
-- bookings, content_schedule, local_trends, leads, activity_log,
-- client_config, demo_profiles, demo_sessions, industries,
-- waitlist_submissions, newsletter_subscriptions
```

### 2. Seed from Config

```bash
# Using the simple JavaScript seeder
node scripts/seed-simple.js

# Or with TypeScript (requires ts-node)
npx ts-node scripts/seed.ts
```

This populates `demo_profiles` and `industries` tables from config files.

---

## 🎮 Demo Controller Flow

The Demo Controller allows B2B sales demos with customized branding:

1. **Hidden Trigger**: Triple-click on "TACTICAL V2.0" in sidebar
2. **Select Preset**: Choose from pre-configured business profiles
3. **Customize**: Modify business name, colors, location
4. **Apply**: Config is applied to the Command Center UI

### Online Demo Flow (`/demo-calendar` → `/demo/[sessionId]`)

1. User visits `/demo-calendar`
2. Fills in name, email, company, industry
3. System matches industry → `demo_profile_id` (via `industries.yml`)
4. Creates `demo_sessions` row in Supabase
5. Redirects to `/demo/[sessionId]` with themed experience

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy schedule-blast
supabase functions deploy local-trends
supabase functions deploy lead-alerts
```

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bookings` | POST | Create new booking |
| `/api/chat` | POST | AI chat completion |
| `/api/verify-email` | POST | Email verification (mocked) |

---

## 🔗 Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/about` | About page |
| `/how-it-works` | Product walkthrough |
| `/use-cases` | Industry use cases |
| `/pricing` | Pricing page |
| `/demo-calendar` | Book a demo |
| `/demo/[sessionId]` | Demo experience |
| `/admin-v2` | Tactical Command Center |
| `/dashboard` | Redirects to /admin-v2 |
| `/waitlist` | Join waitlist |
| `/newsletter` | Newsletter signup |
| `/blog` | Blog (coming soon) |
| `/support` | Support page |

---

## 📄 License

Proprietary - GreenLine365
