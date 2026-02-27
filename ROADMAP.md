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

## Groups, Families & Social Game Night

### The Group Model — Not Just Families
Instead of "family" being the only unit, everything is organized around **Groups**.
One person can be in multiple groups. Groups can invite other groups. This is the social layer.

| Group Type | Example | Who Creates It |
|---|---|---|
| Family | The Tucker Family | Parent (manages child sub-profiles) |
| Friends | Friday Night Crew | Anyone with a free account |
| Neighbors | Oak Street Game Club | Anyone |
| Coworkers | Office Trivia Team | Anyone |
| Cross-Family | Tuckers + Smiths | Either group admin invites the other |

### Database Schema — Groups
```sql
groups
  id UUID PRIMARY KEY
  name TEXT NOT NULL
  slug TEXT UNIQUE -- for shareable URLs: /groups/tucker-family
  type TEXT DEFAULT 'custom' -- 'family' | 'friends' | 'neighbors' | 'custom'
  creator_id UUID REFERENCES auth.users NOT NULL
  avatar_url TEXT
  privacy TEXT DEFAULT 'private' -- 'private' | 'invite_only' | 'public'
  created_at TIMESTAMPTZ DEFAULT NOW()

group_members
  group_id UUID REFERENCES groups
  user_id UUID REFERENCES auth.users (nullable — null for child sub-profiles)
  family_member_id UUID REFERENCES family_members (nullable — set for kids)
  role TEXT DEFAULT 'member' -- 'admin' | 'member' | 'spectator'
  joined_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(group_id, user_id)  -- one membership per person per group
```

### Child Sub-Profiles (Kids Without Phones)
Parents manage child profiles under their account. Kids never need an email, phone, or device.

```sql
family_members
  id UUID PRIMARY KEY
  parent_user_id UUID REFERENCES auth.users NOT NULL
  display_name TEXT NOT NULL
  age INT
  avatar_url TEXT
  face_vector JSONB -- opt-in, stored only if parent consents
  qr_code TEXT UNIQUE -- permanent QR for check-ins (printable card)
  privacy_settings JSONB DEFAULT '{"face_tagging": true, "ai_recaps": true, "social_sharing": false}'
  consent_granted_at TIMESTAMPTZ NOT NULL -- when parent accepted consent
  created_at TIMESTAMPTZ DEFAULT NOW()
```

**How it works:**
1. Parent goes to `/account/family` → taps "Add Family Member"
2. Enters child's name, age, takes a photo (becomes avatar + optional face vector)
3. System generates a permanent QR code — can be printed on a card or shown from parent's phone
4. Child appears in the family group automatically
5. Child can be added to any game night by tapping their name — no scanning needed at home

### Privacy & Consent (COPPA-Aware)
Before creating a child profile, parent sees a **clear consent modal**:

**What GL365 does:**
- Stores the photo as the child's avatar
- Uses facial recognition ONLY to auto-tag the child in their own group's photos/videos (if toggled ON)
- Keeps all data within the parent's family account

**What GL365 NEVER does:**
- Sells, shares, or transfers any child data
- Uses child photos for advertising or training
- Allows anyone outside the family/group to see child profiles
- Retains data after the parent deletes the profile

### Parent Controls (Per Child, Toggleable Anytime)
- **Face Auto-Tagging** — ON/OFF. If OFF, child still plays, scores count, but AI won't scan for their face
- **Include in AI Recaps** — ON/OFF. If OFF, recap mentions them by name but won't include their face
- **Social Sharing** — ON/OFF. If OFF, child excluded when anyone shares to social media
- **Delete All Data** — Nuclear button. Wipes profile, photos, face vector, stats — permanently and immediately

---

## Invites & Cross-Group Game Nights

### How Invites Work
Any group admin can invite another group (or individual) to a game night:

1. Host opens `/game-night` → taps "New Game Night"
2. Selects players from their own group
3. Taps "Invite Another Group" → searches by name or shares an invite link
4. Invited group's admin gets a notification → accepts/declines
5. Both groups merge into one session — everyone sees the same scoreboard

**Invite methods:**
- **In-app notification** (if the other group is already on GL365)
- **Share link** (text/email — recipient creates free account if they don't have one)
- **QR scan** (in person — scan each other's group QR to join)

### Cross-Family Game Night Example
```
Saturday Night Showdown (Mar 1)
  Teams: Tucker Family vs. Smith Family
  ├── Game 1: Trivial Pursuit — Smiths win (32-28)
  ├── Game 2: Pictionary — Tuckers win (by 3 rounds)
  └── Game 3: Uno — Smith kid (age 9) destroys everyone

  Result: Smiths win 2-1
  Rivalry Record: Tuckers lead series 5-4 all time
```

The AI knows the **rivalry history** between groups. Every cross-group matchup builds the narrative.

---

## Tournaments & Championships

### How Tournaments Work
When multiple groups want structured competition, anyone can create a **Tournament**:

1. Creator picks the game (Monopoly, Trivia, Spades, etc.)
2. Sets format: **Single elimination**, **Double elimination**, **Round robin**, or **Swiss**
3. Sets schedule: all in one night OR spread across weeks
4. Invites groups (or opens registration with a public link)
5. Bracket auto-generates when registration closes
6. Matches happen as regular game night sessions — results feed the bracket
7. Championship match crowns the winner

### Tournament Types
- **House Tournament** — One family, bracket among individual members (Thanksgiving Monopoly championship)
- **Neighborhood Cup** — 4-8 families in the neighborhood compete over a month
- **Friends League** — Weekly trivia among friend groups, season standings, playoffs
- **Open Tournament** — Public registration, anyone on GL365 in the area can join

### Database Schema — Tournaments
```sql
tournaments
  id UUID PRIMARY KEY
  name TEXT NOT NULL
  slug TEXT UNIQUE
  game_type TEXT NOT NULL -- 'monopoly' | 'trivia' | 'spades' | 'custom'
  format TEXT DEFAULT 'single_elimination' -- 'single_elim' | 'double_elim' | 'round_robin' | 'swiss'
  creator_id UUID REFERENCES auth.users
  status TEXT DEFAULT 'registration' -- 'registration' | 'active' | 'completed' | 'canceled'
  max_participants INT
  registration_open BOOLEAN DEFAULT true
  schedule_type TEXT DEFAULT 'flexible' -- 'single_day' | 'weekly' | 'flexible'
  rules JSONB
  bracket JSONB -- auto-generated bracket structure
  champion_group_id UUID REFERENCES groups -- winner
  created_at TIMESTAMPTZ DEFAULT NOW()

tournament_participants
  tournament_id UUID REFERENCES tournaments
  group_id UUID REFERENCES groups -- a group enters the tournament
  seed INT -- seeding position (optional)
  status TEXT DEFAULT 'active' -- 'active' | 'eliminated' | 'champion' | 'withdrew'
  registered_at TIMESTAMPTZ DEFAULT NOW()
```

### The Championship Escalation Path
```
Family Game Night (weekly)
  → Cross-Family Showdown (monthly — invited groups)
    → Neighborhood Cup (quarterly — open tournament)
      → City Championship (annual — top groups from all neighborhoods)
```

Each level is optional. Most people stay at family game night. But the path exists for people who want to compete. And every level drives more people onto the platform.

---

## Game Night Session Management

### Flexibility Rules
Game nights must be **completely flexible** — no rigid flows. The host controls everything:

- **Start** a game night anytime (no scheduling required)
- **Pause** mid-game (dinner break, someone has to leave, etc.)
- **Resume** where you left off
- **Cancel** at any point — scores from that session are discarded (with confirmation)
- **Reset** a game in progress — start fresh without creating a new session
- **End early** — partial game still counts, stats still update
- **Rematch** — one-tap to start the same game with the same players
- **Switch games** — mid-session, swap from Monopoly to Uno without ending the night
- **Add/remove players** mid-game — someone shows up late or leaves early
- **Invite mid-game** — another family shows up? Add them to the session live

### Session States
```
draft → active → paused → active → completed
                     ↓                    ↓
                  canceled            recap generated
```

### Game Night Flow
1. Host opens `/game-night` → taps "New Game Night"
2. Picks the game from the Game Library (or creates custom)
3. Selects players from their group(s) — tap to add, no scanning needed at home
4. Optionally invites another group (link, notification, or QR)
5. Game starts — host's phone becomes the scoreboard
6. During play: snap photos anytime (auto-tagged if consent given)
7. Game ends: enter final scores (or snap the board for AI parsing)
8. AI generates recap covering the whole evening
9. Host can share recap to social (respecting all privacy toggles)

### Multi-Game Nights
A single session can contain **multiple games**:
```
Thursday Game Night (Feb 27)
├── Game 1: Uno (7:00 PM) — Winner: Bella
├── Game 2: Monopoly (7:45 PM) — Winner: Tyler (by bankruptcy)
└── Game 3: Scrabble (9:15 PM) — Winner: Mom
Overall MVP: Tyler (2 wins)
```

The AI recap covers the whole evening, not just one game.

### Shareable Recap Pages
Every game night generates a public recap at `/recap/[id]`:
- Games played, scores, winners
- Best photos (respecting privacy toggles)
- "Powered by GreenLine365" branding
- CTA: "Track your game nights free — join GreenLine365"
- Every share is an ad for the platform

---

## Pages Required (Full Game Night System)

| Page | Purpose | Priority |
|---|---|---|
| `/account/groups` | Manage all your groups (family, friends, etc.) | Phase 2 |
| `/account/groups/[id]` | Group detail: members, stats, history, invite link | Phase 2 |
| `/account/family` | Manage child sub-profiles under parent account | Phase 2 |
| `/account/family/[memberId]` | Child profile: all-time stats, badges, game history | Phase 2.5 |
| `/game-night` | Start a game night: pick game, select players, invite groups | Phase 2.5 |
| `/game-night/[id]` | Active session: score entry, photos, live scoreboard, controls | Phase 2.5 |
| `/game-night/[id]/recap` | AI recap with photos, stats, shareable video collage | Phase 2.5 |
| `/recap/[id]` | Public shareable recap (privacy-enforced) | Phase 2.5 |
| `/tournaments` | Browse/create tournaments | Phase 3 |
| `/tournaments/[id]` | Tournament bracket, schedule, results | Phase 3 |
| `/invite/[code]` | Accept a group/game night invite (creates account if needed) | Phase 2.5 |

Plus: extend `/account/settings` with per-child privacy toggles

---

## Shared Infrastructure: The Universal Primitives

### The Session (Universal Container)
Every interaction is a **Session** — a Loop, a League Match, a Poker Night, a Game Night, a Deal Redemption:

```sql
sessions
  id UUID PRIMARY KEY
  type TEXT -- 'loop' | 'match' | 'poker' | 'game_night' | 'deal' | 'civic' | 'tournament_match'
  creator_id UUID REFERENCES auth.users
  venue_id UUID REFERENCES directory_listings (nullable for home games)
  league_id UUID REFERENCES leagues (nullable)
  tournament_id UUID REFERENCES tournaments (nullable)
  status TEXT -- 'draft' | 'active' | 'paused' | 'completed' | 'canceled'
  metadata JSONB -- fog_of_war_pins, blind_schedule, buy_in, rules, game_name, etc.
  started_at TIMESTAMPTZ
  ended_at TIMESTAMPTZ

session_participants
  session_id UUID REFERENCES sessions
  user_id UUID REFERENCES auth.users (nullable — null for child sub-profiles)
  family_member_id UUID REFERENCES family_members (nullable — set for kids)
  group_id UUID REFERENCES groups (nullable — which group they represent)
  role TEXT -- 'player' | 'spectator' | 'commissioner' | 'host'
  checked_in_at TIMESTAMPTZ
  checked_out_at TIMESTAMPTZ
  score JSONB -- flexible per game type

-- Multi-game support within a session (e.g., 3 games in one evening)
session_games
  id UUID PRIMARY KEY
  session_id UUID REFERENCES sessions
  game_name TEXT NOT NULL -- 'Monopoly' | 'Uno' | 'Trivia' | custom
  game_template_id UUID REFERENCES game_templates (nullable)
  sequence INT -- order within the session (1, 2, 3...)
  status TEXT -- 'active' | 'completed' | 'canceled'
  winner_user_id UUID (nullable)
  winner_family_member_id UUID (nullable)
  winner_group_id UUID (nullable)
  scores JSONB -- per-player scores for this specific game
  started_at TIMESTAMPTZ
  ended_at TIMESTAMPTZ

-- Preloaded game templates so users don't start from scratch
game_templates
  id UUID PRIMARY KEY
  name TEXT -- 'Monopoly' | 'Uno' | 'Scrabble' | etc.
  category TEXT -- 'board_game' | 'card_game' | 'party_game' | 'sport' | 'custom'
  scoring_type TEXT -- 'points' | 'wins' | 'ranks' | 'money' | 'custom'
  default_player_count INT
  icon TEXT -- emoji or icon reference
  rules_summary TEXT
  is_system BOOLEAN DEFAULT true -- system templates vs user-created
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
- [x] Support page (FAQ, contact form, quick links)
- [x] Portal video URL field (Premium tier, metadata JSONB)
- [x] Blast Deals consumer browse page (`/deals`)
- [x] Community & Civic category expansion (8 new categories)
- [ ] Portal onboarding validation
- [ ] Review responses UI in business portal
- [ ] Analytics charts for paid tiers

### Phase 2: Identity, Groups & Session Foundation
- [ ] `identity_passports` table + migration
- [ ] `groups` + `group_members` tables
- [ ] `family_members` table (child sub-profiles with privacy/consent)
- [ ] `sessions` + `session_participants` + `session_games` tables
- [ ] `game_templates` table + seed data (Monopoly, Uno, Scrabble, etc.)
- [ ] Universal QR code generation (extends blast deals QR)
- [ ] Identity Passport profile page
- [ ] Group management pages (`/account/groups`, `/account/groups/[id]`)
- [ ] Family management page (`/account/family`)
- [ ] Consent & privacy modal for child profiles
- [ ] Invite system (link, notification, QR) + `/invite/[code]` accept page

### Phase 2.5: Game Night MVP (Free Tier Funnel)
- [ ] Game Night start page (`/game-night`) — pick game, select players, invite groups
- [ ] Active session page (`/game-night/[id]`) — score entry, photos, live scoreboard
- [ ] Session controls: pause, resume, cancel, reset, rematch, switch game, invite mid-game
- [ ] Multi-game support within one session (`session_games`)
- [ ] Cross-group game nights (Tuckers vs. Smiths)
- [ ] AI recap generation (`/game-night/[id]/recap`)
- [ ] Public shareable recap pages (`/recap/[id]`) with privacy enforcement
- [ ] Family member stats page (`/account/family/[memberId]`)
- [ ] Per-child privacy toggles in account settings
- [ ] Streak system (weekly streaks, rivalry records, monthly MVPs)

### Phase 3: Tournaments & Leagues
- [ ] Tournament creation flow (format, game, registration)
- [ ] Auto-bracket generation (single/double elim, round robin, swiss)
- [ ] Tournament pages (`/tournaments`, `/tournaments/[id]`)
- [ ] Commissioner setup flow for paid leagues
- [ ] League hub page (`/leagues/[slug]`)
- [ ] Leaderboard component (reused across game night, tournaments, leagues)
- [ ] AI match recap generation
- [ ] Poker ledger (buy-in/cashout tracking)
- [ ] Championship escalation: family → cross-family → neighborhood → city

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
