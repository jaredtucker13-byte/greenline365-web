# GreenLine365 Platform Roadmap

## Vision: City-Wide Operating System

GreenLine365 is evolving from a business directory into a **Community Operating System** powered by three engines:

1. **The Directory Engine** (Live) — Business discovery, listings, reviews, subscriptions
2. **The Lifestyle & Entertainment Engine** (Planned) — Social discovery loops, scavenger hunts, game nights
3. **The Competitive League Engine** (Planned) — Amateur sports management, leaderboards, stats

All three engines share a common **Identity & Media Vault** and are connected by **AI Agents** (Scouts, Referees, Storytellers).

---

## Revenue Model — GL365 Is the Tool, Not the Bank

**Critical business rule:** GL365 never touches game money, prize pools, or buy-ins.

| Revenue Stream | Who Pays | Amount | What They Get |
|---|---|---|---|
| Directory Free | Business | $0 | Basic listing |
| Directory Pro | Business | $45/mo | Verified badge, CTA buttons, priority search |
| Directory Premium | Business | $89/mo | All photos, analytics, lead capture, AI reviews |
| Game Night (Free) | Individual | $0 | Score tracking, photos, AI recaps, family leaderboards — free account required |
| Consumer Plus | Individual | $4.99/mo | Loop access, identity passport, personal stats |
| Consumer Pro | Individual | $9.99/mo | Unlimited loops, AI recaps, priority matching |
| League Commissioner | League Creator | $228/season | League management, leaderboards, AI referee |
| Marketplace Add-ons | Business | Varies | Coupons ($19/mo), Featured Boost ($29/wk), Polls ($150) |

For leagues and game nights: **The Commissioner/Host manages all money.** GL365 provides the scoreboard and stats — that's it. Zero liability, no money transmission, no escrow.

---

## Engine 1: Directory & Business Tools (LIVE)

### Fully Functional
- Directory search, browse, filter by 16 categories
- Listing detail pages with contact, reviews, gallery, badges, hours, map
- Click-to-call modal with copy number + analytics
- Three-tier pricing with Stripe checkout
- Business portal (8 pages): dashboard, listing editor, photos, hours, menu, stats, settings, upgrade
- Review system with AI-powered business response drafts
- Blog system with AI writing
- CRM dashboard for lead tracking
- Admin panel (20+ sections)
- Auth (email/password, Google OAuth, magic links)
- Health monitoring + cron orchestrator

### Gaps to Fill
- [ ] Support page (replace Coming Soon)
- [ ] Portal video URL field (Premium tier)
- [ ] Blast Deals consumer browse page
- [ ] Portal onboarding validation
- [ ] Review responses UI in business portal
- [ ] Analytics charts for paid tiers

---

## Engine 2: Lifestyle & Entertainment Loops (PLANNED)

### Concept
Social discovery engine for high-frequency, low-friction engagement. Users explore their city through guided, gamified experiences. Every Loop stop is a directory listing — **Loops drive foot traffic back to the Directory.**

### Loop Types
- **Treasure/Scavenger Hunts** — Urban exploration with riddle-based destination reveals
- **Special Events** — Bridesmaid planning, birthday surprises, bachelor/bachelorette loops
- **Wellness Loops** — Self-healing resets (Gym → Juice Bar → Park)
- **History & Heritage Loops** — Walking tours of non-profits, historic sites, public murals
- **Support Local Loops** — Scavenger hunts ending at local makers, community gardens
- **Volunteer Loops** — Service + social (2 hours at food bank → local brewery)

### How It Works
1. **Entry Point** — Squad meets at a Starting Point. They "Handshake" by scanning each other's QR codes
2. **Identity Gate** — One-time Identity Selfie (opt-in). Memory Weaver creates face vector for auto-tagging
3. **Fog of War** — Loop is hidden pins on a map. Next destination revealed only after scanning QR at current stop
4. **Self-Healing Logic** — Local Scout monitors weather/traffic. Rain? Auto-swap outdoor park for indoor cafe
5. **Viral Output** — AI generates "Powered by GreenLine365" video collage of the squad's best moments

### Key Technical Components
- **Session Graph** — Loops are graphs of possible nodes, not fixed routes. AI assembles in real-time based on weather, time, preferences, venue capacity, and active Blast Deals
- **Geofencing** — GPS-based check-in verification at each stop
- **QR Integration** — Reuses existing Blast Deals QR infrastructure for check-ins
- **AI Scout Agent** — Uses SambaNova Sonic (via OpenRouter) for real-time navigation decisions

---

## Engine 3: Competitive League Loops (PLANNED)

### Concept
Professional-grade infrastructure for amateur competition. Turns any recurring game into a formal league with a "Digital Front Office." Targets Commissioners who want to organize their community.

### League Types

#### Traditional Sports
- Bowling, Darts, Billiards/Pool, Flag Football, Pickleball, Cornhole

#### Hobby Leagues
- Esports, Trivia, Axe Throwing

#### Card & Casino Games
- **Poker Home Games** — Buy-in ledger, chip tracking, cashout verification, ROI stats
- Card tournaments (Spades, Hearts, Bridge)

#### Family Game Night (FREE — No Paid Tier Required)
**This is a free feature.** Anyone with a free GL365 account can use it. No subscription needed.
It's the top-of-funnel: people sign up for Game Night, discover the directory, loops, and deals.

- **Board Games** — Monopoly, Risk, Settlers of Catan, Scrabble, Clue, Life
- **Card Games** — Uno, Phase 10, Skip-Bo, Spades, Hearts
- **Party Games** — Trivia, charades, Pictionary, codenames
- Tracked scores across sessions, photos, AI-generated recaps
- "Dad has won 7 of the last 10 Monopoly games. His strategy? Buy everything orange."
- Family leaderboards, season standings, rivalry tracking
- Photo journal of every game night — the AI captures the vibe
- Makes the mundane magical — brings a new spin to game night
- **Why it's free:** It gets families onto the platform. They create accounts, invite friends,
  and organically discover everything else GL365 offers

### How It Works

#### Commissioner Setup
1. Commissioner creates league, defines sport/game, season length, and rules
2. Sets "Banker" rules (how cash is physically collected — GL365 never touches money)
3. Pays seasonal platform fee ($228 base)

#### Game Night Flow
1. Players scan Community QR at venue (or host's home for poker/game nights)
2. Identity Passport verifies presence
3. **Score Capture:**
   - Traditional sports: Snap photo of scoreboard → Gemini vision extracts data
   - Poker: Log buy-ins/cashouts manually or via chip photo
   - Board games: Manual entry or photo of final game state
   - Claude updates standings automatically
4. Dispute window for score confirmation
5. AI writes match recap

#### League Hub
- Each league gets a dynamic landing page (`/leagues/[slug]`)
- Live leaderboard
- Trash-talk threads
- Wall of Fame (match-day photos/reels)
- Season history and all-time stats

### Banker Model (Zero Financial Liability)
GL365 has **zero liability** for prize money, buy-ins, or payouts:
- The Commissioner manages the physical pot of cash
- GL365 provides the "source of truth" for who won
- The app is a **ledger**, not a wallet
- Down the road with a legal team: could explore wallet features

### Player Stats (Per Game Type)
```
Bowling:  avg score, high game, seasons played, strike %
Poker:    ROI %, sessions, biggest win, in-the-money %
Darts:    avg PPD, 180 count, checkout %
Monopoly: win rate, avg game length, favorite property
Trivia:   correct %, best category, streak record
```

---

## Community & Civic Services Layer (PLANNED)

### Concept
Expands GL365 from business directory to community resource. Non-paying entities get listings with a "Community Badge" — they're "For the Community, Not for Profit."

### Multi-Layered Entity System
1. **Paid Businesses** — Companies with subscriptions for lead generation
2. **Public Resources** — Data pulled via API or scraped by Scout (Parks, Fire Stations)
3. **Community Badge** — Special verification for non-profits and civic groups

### Community Categories

#### Education & Youth Services
- Tutors & learning centers
- Daycares & preschools
- Youth sports & clubs (Little League, Chess club)
- Music & art teachers (private lessons)
- Special education resources & support groups

#### Health & Wellness (Community Layer)
- Mobile notaries
- Independent pharmacies with delivery
- Community clinics & urgent care
- Personal trainers (parks, home gyms)
- Elder care services (companion care, meal delivery, local transport)

#### Civic & Non-Profit
- Places of worship (churches, synagogues, mosques, community centers)
- Animal shelters & rescues
- Local charities & food banks
- Civic groups (Rotary, HOAs, neighborhood associations, town hall)
- Volunteer hubs — Scout Agent suggests opportunities based on user's skills

#### The Gig Economy & Local Artisans
- Local makers (honey, handmade soaps, furniture — the "Farmer's Market" layer)
- Photographers (family portraits, real estate, event coverage)
- Event planners & caterers (block parties, small events)
- IT & computer repair (the local tech wizard)

### Government & Public Integration
Even without paying, AI pulls this data to be the ultimate local resource:
- **Parks & Rec** — Trail maps, playground locations, court availability (pickleball/tennis)
- **Waste & Recycling** — Schedules integrated into user dashboard by address
- **Emergency Services** — Fire stations, police precincts, nearest hospitals
- **Public Transit** — Bus routes, ferry schedules (crucial for Key West)

---

## Shared Infrastructure: The Universal Primitives

### The Session (Universal Container)
Every interaction is a **Session** — a Loop, a League Match, a Poker Night, a Game Night, a Deal Redemption:

```sql
sessions
  id UUID PRIMARY KEY
  type TEXT -- 'loop' | 'match' | 'poker' | 'game_night' | 'deal' | 'civic'
  creator_id UUID REFERENCES auth.users
  venue_id UUID REFERENCES directory_listings (nullable for home games)
  league_id UUID REFERENCES leagues (nullable)
  status TEXT -- 'draft' | 'active' | 'paused' | 'completed' | 'canceled'
  metadata JSONB -- fog_of_war_pins, blind_schedule, buy_in, rules, game_name, etc.
  started_at TIMESTAMPTZ
  ended_at TIMESTAMPTZ

session_participants
  session_id UUID REFERENCES sessions
  user_id UUID REFERENCES auth.users
  role TEXT -- 'player' | 'spectator' | 'commissioner' | 'host'
  checked_in_at TIMESTAMPTZ
  checked_out_at TIMESTAMPTZ
  score JSONB -- flexible per game type
```

### Identity Passport (One Profile, Every Mode)
```sql
identity_passports
  user_id UUID PRIMARY KEY REFERENCES auth.users
  display_name TEXT
  avatar_url TEXT
  face_vector JSONB -- opt-in, for Memory Weaver auto-tagging
  qr_code TEXT UNIQUE -- permanent QR, like a digital wristband

  -- Lifestyle stats
  loops_completed INT DEFAULT 0
  total_miles NUMERIC DEFAULT 0
  favorite_venue_id UUID

  -- League stats (per sport/game)
  league_stats JSONB DEFAULT '{}'
  -- e.g. {"bowling": {"avg": 172, "high": 243}, "poker": {"roi": "+12.4%", "sessions": 47}}

  -- Community stats
  volunteer_hours NUMERIC DEFAULT 0
  civic_loops_completed INT DEFAULT 0

  -- Achievements
  badges JSONB DEFAULT '[]'
```

### Leagues Table
```sql
leagues
  id UUID PRIMARY KEY
  commissioner_id UUID REFERENCES auth.users
  name TEXT
  slug TEXT UNIQUE
  sport_type TEXT -- 'bowling' | 'darts' | 'poker' | 'monopoly' | 'trivia' | etc.
  category TEXT -- 'traditional_sport' | 'card_game' | 'board_game' | 'party_game'
  venue_id UUID REFERENCES directory_listings (nullable)
  season_name TEXT
  rules JSONB
  status TEXT -- 'setup' | 'active' | 'completed' | 'archived'
  max_players INT
  entry_fee_description TEXT -- "Commissioner collects $20/player" (descriptive only)
  created_at TIMESTAMPTZ DEFAULT NOW()
```

### How Existing Infrastructure Maps to New Features

| Existing Feature | New Use |
|---|---|
| Directory Listings | Venue Registry for Loops & Leagues |
| Blast Deals QR Codes | Universal check-in mechanism |
| CRM Leads | Player profiles & commissioner accounts |
| Chat AI Agent | Scout (navigation), Referee (scores), Commissioner Assistant |
| Stripe Billing | Consumer subs + commissioner seasonal fees (never game money) |
| Blog System | AI-written match recaps & league news |
| Review System | Player ratings & venue ratings |
| Badge System | Achievement trophies & season awards |
| Analytics/Stats | Player stats dashboards |

---

## AI Agent Roles

| Agent | Engine | Runtime | Purpose |
|---|---|---|---|
| **Local Scout** | Loops | SambaNova Sonic (OpenRouter) | Real-time navigation, weather checks, route healing |
| **Memory Weaver** | Loops | Gemini Pro | Face detection, auto-tagging, video collage generation |
| **Universal Referee** | Leagues | Gemini Pro + Claude | Scoreboard OCR, score validation, standings update |
| **Commissioner Assistant** | Leagues | Claude | Scheduling, roster management, rule enforcement |
| **Storyteller** | Both | Claude | Match recaps, game night summaries, season narratives |
| **Civic Scout** | Community | SambaNova Sonic | Public data aggregation, volunteer matching |

---

## Revenue Flywheel

```
Consumer pays $4.99/mo → Gets Loop access + identity passport
  → Every Loop stop = foot traffic to a Directory listing
  → Listing owner sees "12 Loop visitors this week" in analytics

Business pays $45/mo → Gets listed as potential Loop venue
  → Offers Blast Deal to attract Loop traffic
  → AI Scout prioritizes venues with active deals

Commissioner pays $228/season → Gets league management tools
  → Games happen at Directory venues (bars, bowling alleys)
  → Venues see "League Night" traffic boost
  → Venues can sponsor leagues (logo on leaderboard page)

Everyone feeds everyone. Loops drive business revenue.
Leagues drive venue traffic. The Directory is the foundation.
```

---

## Build Priority

### Phase 1: Shore Up the Sellable Product (NOW)
- [x] Click-to-call modal
- [ ] Support page
- [ ] Portal video URL field (Premium)
- [ ] Blast Deals consumer browse page
- [ ] Community & Civic category expansion
- [ ] Portal onboarding validation

### Phase 2: Identity & Session Foundation
- [ ] `identity_passports` table + migration
- [ ] `sessions` + `session_participants` tables
- [ ] `leagues` table
- [ ] Universal QR code generation (extends blast deals QR)
- [ ] Identity Passport profile page

### Phase 3: League MVP
- [ ] Commissioner setup flow
- [ ] League hub page (`/leagues/[slug]`)
- [ ] Manual score entry
- [ ] Leaderboard component
- [ ] AI match recap generation
- [ ] Game Night mode (board games, card games)
- [ ] Poker ledger (buy-in/cashout tracking)

### Phase 4: Loops MVP
- [ ] Loop template creator
- [ ] Fog of War map component
- [ ] QR check-in at venues
- [ ] Self-healing route logic (weather/traffic)
- [ ] AI-generated loop recap

### Phase 5: Community Layer
- [ ] Community Badge for non-profits
- [ ] Public resource data connectors (Parks API, Transit API)
- [ ] Volunteer matching via Scout Agent
- [ ] Civic Loops (History, Volunteer, Support Local)

---

*Last updated: 2026-02-27*
