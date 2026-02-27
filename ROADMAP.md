<!-- AGENT METADATA
  status: active
  updated: 2026-02-27
  scope: Full 3-engine vision, revenue model, Engine 1/2/3 specs, future features
  read-when: You need to understand the product roadmap or long-term vision
-->

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

## Gamification Engine

### XP & Leveling
Every player earns XP for everything — not just winning, *participating*:

| Action | XP |
|---|---|
| Show up to game night | +10 |
| Complete a game (even if you lose) | +5 |
| Win a game | +15 |
| Win the overall evening (most wins) | +25 |
| Break someone's winning streak | +10 |
| Take a photo during game night | +5 |
| Invite a new group to play | +20 |
| Correct prediction on who would win | +10 |
| Earn a new achievement badge | +15 |
| Share a recap to social media | +5 |

**Level Titles:**
```
Level 1-5:    Rookie
Level 6-15:   Regular
Level 16-30:  Veteran
Level 31-50:  Legend
Level 51+:    Hall of Famer
```

Level shows on your profile, in game sessions, and on leaderboards. Kids get the same system.

### Achievement Badges (Context-Aware)
The AI detects **moments** and awards badges. You don't know what badges exist until you earn them — discovery is part of the fun.

| Badge | How You Earn It |
|---|---|
| Comeback Kid | Won after being in last place halfway through |
| Streak Breaker | Beat someone on a 5+ game winning streak |
| Iron Throne | Won 5 games of the same type in a row |
| Night Owl | Finished a game after midnight |
| The Closer | Won the last game of the evening 5 times |
| Variety Pack | Played 10 different games in one month |
| Giant Killer | A child beats an adult in a strategy game |
| Perfect Host | Hosted 10 game nights |
| Social Butterfly | Played with 5 different groups |
| Dynasty | Your group won a tournament |
| Underdog | Won as the lowest-seeded player/group in a tournament |
| Grudge Match | Won against a rival after losing 3+ in a row to them |
| Century Club | Played 100 total games |
| Marathon | Game night lasted 4+ hours |
| Photo Bomb | Took 10+ photos in one session |

### Live AI Commentary ("The Color Commentator")
During the game, after each score entry, the AI drops real-time commentary as a notification/banner:

> "Tyler takes the lead! He's now won 3 of the last 4 rounds. Can anyone stop this kid?"

> "UPSET ALERT: Bella is about to beat Dad for the first time in Scrabble. She's up by 23 points with 4 tiles left."

> "Fun fact: Mom has never lost a game of Uno when she goes first. She just went first."

This is what makes people laugh, screenshot it, and share it. The AI becomes the **narrator of your life.**

### Game Night Modifiers ("The Spice Wheel")
Before each game, the host can optionally spin a modifier wheel that adds a twist:

| Modifier | What It Does |
|---|---|
| Double Stakes | This game counts for 2x XP |
| Handicap | Current leader starts with a disadvantage |
| Mystery Pick | AI randomly selects the next game |
| Revenge Match | Whoever lost last game picks the next one |
| Speed Round | 50% time limit on turns |
| Wildcard | One random rule change mid-game (AI decides) |
| Photo Challenge | Bonus XP if everyone takes a photo during the game |

Totally optional. Never forced. But once people discover it, they'll use it every time.

### Rivalry Engine
When two players or groups face each other repeatedly, the AI builds a rivalry profile:

```
Tucker Family vs. Smith Family
  Head-to-Head: Tuckers lead 14-11 (all time)
  Current Streak: Smiths on a 3-game run
  Most Contested Game: Trivial Pursuit (7-7 tie)
  Biggest Blowout: Tuckers won Monopoly by $4,200

  "The Smiths have clawed their way back after a brutal 5-game
  losing streak in October. Tyler Tucker still hasn't forgiven
  the Smith kid for that Uno reverse card heard 'round the world."
```

Auto-generated from session data. The AI writes it like a sports journalist. Every matchup adds a chapter.

### Predictions — Bet With XP, Not Money
Before each game, every player (and spectators) can predict the winner. Correct predictions earn bonus XP.

The AI also makes its prediction:
> "AI Pick: Tyler (62% win probability based on 47 Monopoly games). Upset potential: Bella (hot streak)."

No money. Just bragging rights and XP. Kids love it. When the AI is wrong, it becomes a moment.

### "Previously On..." Opener
When a group starts a new game night, the AI opens with a narrative recap:

> "Previously on Tucker Family Game Night: Dad's 7-game Scrabble dynasty came to a shocking end when Bella deployed a triple word score on 'QUIXOTIC' for 98 points. Mom maintained her Uno streak at 4. Tonight... can Tyler be convinced to play Risk again?"

10 seconds of text that makes everyone laugh before games start. Builds continuity — your game nights have a *story arc.*

### Digital Trading Cards
After each game night, the AI generates a trading card for the MVP:

```
┌─────────────────────────┐
│  [Player Photo]         │
│                         │
│  TYLER TUCKER           │
│  "The Monopoly Mogul"   │
│                         │
│  Level: 23 (Veteran)    │
│  Win Rate: 68%          │
│  Best Game: Monopoly    │
│  Streak: 4 wins         │
│                         │
│  Feb 27, 2026           │
│  ★★★★☆ (Rare)          │
└─────────────────────────┘
```

**Rarity based on the moment:**
- **Common** — Regular win
- **Rare** — Won 3+ in one night
- **Epic** — Broke a 10+ game streak or comeback win
- **Legendary** — Won a tournament championship

Collectible. Shareable. Kids will obsess over these.

### Seasonal Events
The platform changes with real-world seasons:

| Season | Event | Special Badge |
|---|---|---|
| Fall | Harvest Tournament | Pumpkin Crown |
| Winter | Holiday Championship | Snowflake Legend |
| Spring | March Madness Bracket | Bracket Buster |
| Summer | Outdoor Games Season | Sun Champion |

Seasonal leaderboards reset. Everyone starts fresh. New badges to earn. Creates urgency.

### Rage Quit Protection & Badge Decay
**Problem:** Someone losing badly quits the app mid-game. Ruins the data, ruins the vibe.
**Solution:** Completing games is rewarded. Quitting is penalized. Sportsmanship is a stat.

#### Completion Bonus
Players who finish every game in a session get a **Completion Bonus**:
- +15 XP per game completed (on top of regular XP)
- "Sportsmanship" stat tracked on profile (% of games completed)
- 100% completion in a month → **"Good Sport" badge**
- 10 consecutive game nights with 100% completion → **"Iron Will" badge**

#### Badge Decay System
Badges aren't permanent trophies — some require maintenance:

**Decayable badges** (lose them if you stop earning them):
- "Iron Throne" (5 wins in a row) → decays if you quit 2 games in a month
- "Good Sport" → requires 90%+ completion rate, recalculated monthly
- "Streak" badges → break the streak and the badge grays out (but record stays in history)
- Seasonal badges → expire at end of season (archived in trophy case, not active)

**Permanent badges** (earned forever once unlocked):
- "Century Club" (100 games)
- "Giant Killer" (first time moments)
- "Dynasty" (tournament wins)
- All "first time" achievements

#### What Happens When Someone Rage Quits
1. **Game continues without them** — remaining players can still finish and log scores
2. **Quitter gets 0 XP** for that game (no completion bonus)
3. **"DNF" (Did Not Finish)** recorded on their profile for that game
4. **Sportsmanship score drops** — visible on their profile
5. **3+ DNFs in a month** → temporary loss of prediction privileges (can't predict winners)
6. **AI calls it out in the recap** (playfully): "Dad rage-quit Monopoly at 9:17 PM after landing on Boardwalk with a hotel. His Sportsmanship rating drops to 78%."

#### The "Comeback Incentive"
If someone quits but comes back to the NEXT game night:
- **No additional penalty** — we want them back
- **"Redemption Arc" bonus XP** if they complete every game next session
- AI narrates: "After last week's infamous walkout, Dad returned with something to prove..."

**Philosophy:** Punish the quit, but reward the return. Never lock someone out. The goal is to make completing games feel so good (XP, badges, commentary) that quitting feels like you're leaving money on the table.

### Game Night Score (Group Health Metric)
Each group gets a composite score measuring how vibrant their game nights are:

```
Tucker Family Game Night Score: 87/100

Frequency:        ★★★★★  (weekly for 6 weeks straight)
Variety:          ★★★★☆  (8 different games this month)
Competitiveness:  ★★★★★  (average margin of victory: 12%)
Participation:    ★★★☆☆  (3/5 members play regularly)
Engagement:       ★★★★☆  (photos + shares + invites)
```

Subtle nudge: "Our Participation score dropped — let's get Mom to play this week."

---

## TV & Cast Mode (Big Screen Experience)

### Concept
Turn the family TV or computer into the **Game Night command center**. The phone is the remote control; the big screen is the show. No special hardware, no app install — just a URL on any device with a browser.

### How It Works
1. Host starts a game night on their phone
2. Taps "Cast to TV" → gets a short URL or QR code (e.g., `/game-night/abc123/tv`)
3. Opens that URL on the TV's browser (smart TV, Chromecast, laptop → HDMI, Fire Stick browser, etc.)
4. TV enters **Big Screen Mode** — full-screen, large text, dark background, optimized for 10-foot viewing distance
5. Phone stays as the controller — enter scores, snap photos, manage players
6. TV auto-updates in real-time via WebSocket (or SSE/polling fallback)

### What Shows on the TV

#### Pre-Game: "Previously On..." Opener
- Full-screen cinematic intro with the AI narrative
- Shows rivalry records, streak stats, last session highlights
- Background music (optional, toggleable) — subtle game night ambiance
- Transitions into the scoreboard when the first game starts

#### During Game: Live Scoreboard
- **Giant scoreboard** with player names, avatars, current scores
- Score changes animate in (numbers roll up, color flash on updates)
- **Sound effects** on score entry:
  - Score update: satisfying "ding"
  - Take the lead: triumphant horn
  - Big comeback: dramatic crescendo
  - Achievement unlocked: badge sound + visual overlay
  - Streak broken: record scratch
- **Live AI commentary** scrolls across the bottom like a sports ticker
- **Turn timer** (optional, for turn-based games): visible countdown with escalating tick sound in the last 10 seconds
- **Prediction bar** at top: "Tyler 62% | Bella 25% | Dad 13%" — updates live

#### Between Games: Intermission Screen
- Results from the last game with winner spotlight
- "MVP so far" highlight
- Upcoming game announcement
- Fun stats: "Dad has won 0 games tonight. Historic drought."
- "Next Game Starts in..." countdown (if host sets a break timer)

#### Post-Game: Evening Recap
- Full recap on the big screen — scores, photos, badges earned, XP gained
- Trading card reveal (if MVP card was generated)
- Group Game Night Score update
- "Powered by GreenLine365" outro with share CTA QR code

### Which Features Get TV Mode (Logically Scoped)

Not everything belongs on a TV. Here's the logic:

| Feature | TV Mode? | Why |
|---|---|---|
| Live Scoreboard | YES | The whole point — big visible scores |
| Turn Timer | YES | Visible countdown for everyone at the table |
| AI Commentary | YES | Scrolling ticker — makes everyone laugh |
| "Previously On..." Opener | YES | Cinematic intro sets the tone |
| Achievement Unlocked | YES | Badge popup with sound — celebratory moment |
| Prediction Results | YES | "AI said Tyler... Tyler wins! AI was right!" |
| Score Entry | NO | Phone only — the host enters scores on their device |
| Photo Capture | NO | Phone camera only |
| Player Management | NO | Phone only — add/remove players |
| Settings/Privacy | NO | Phone only — never on a shared screen |
| Rivalry Deep Dive | NO | Too detailed for a glance — phone/profile thing |
| Badge Decay Warnings | NO | Personal — not for the family TV |

### Technical Approach
- **Route:** `/game-night/[id]/tv` — separate route with TV-optimized layout
- **No auth required on TV** — the URL is the access token (short-lived, session-scoped)
- **WebSocket sync** — phone pushes score updates → server → TV receives via WebSocket
- **SSE fallback** — Server-Sent Events if WebSocket isn't available on the TV browser
- **Polling last resort** — 2-second polling for the most basic smart TV browsers
- **Web Audio API** — Sound effects via the browser. Host can mute/adjust volume from phone
- **CSS for 10ft UI** — Minimum 48px font for scores, 32px for names, high contrast, no tiny text
- **Auto-dim** — If no activity for 5 minutes, scoreboard dims (screen burn prevention)
- **Responsive** — Works on 720p, 1080p, and 4K displays

### Database Schema — TV Mode
```sql
-- No new tables needed. TV mode reads from existing session data.
-- One addition to sessions metadata:

sessions.metadata.tv_mode JSONB
  enabled BOOLEAN DEFAULT false
  access_token TEXT -- short random token for TV URL auth
  sound_enabled BOOLEAN DEFAULT true
  show_predictions BOOLEAN DEFAULT true
  show_commentary BOOLEAN DEFAULT true
  theme TEXT DEFAULT 'dark' -- 'dark' | 'neon' | 'classic'
  timer_default_seconds INT -- null = no timer
```

---

## Community Leaderboards & Public Game Night Hub

### Concept
Game Night isn't just a private family thing — it's a **community activity**. Groups that opt in can appear on **public leaderboards**, driving friendly competition between families, friend groups, and neighborhoods across the city. This is GL365's social discovery layer for games.

### The Community Hub (`/community`)
Central page for all public game activity in the city. Think of it as the "ESPN homepage" for your local game night scene.

#### Sections:
1. **City Leaderboard** — Top groups ranked by Game Night Score
2. **This Week's Action** — Active game nights, upcoming tournaments, recent results
3. **Rising Stars** — New groups climbing the ranks fast
4. **Rivalry of the Week** — AI-selected most dramatic matchup
5. **Tournament Corner** — Open registration, brackets in progress, recent champions
6. **Hall of Fame** — All-time records, legendary moments, top streaks

### Leaderboard Types

| Leaderboard | Metric | Resets |
|---|---|---|
| Game Night Score | Composite (frequency, variety, competitiveness, participation, engagement) | Never (all-time) |
| Monthly MVP | Most XP earned in a calendar month | Monthly |
| Win Rate Kings | Highest win % (minimum 10 games) | Seasonal |
| Streak Watch | Current longest active streak (weekly game nights) | Breaks when streak breaks |
| Most Competitive Rivalry | Closest head-to-head record between two groups | Never |
| Tournament Champions | Groups with the most tournament wins | Seasonal |
| New Group of the Month | Highest Game Night Score in first 30 days | Monthly |

### Privacy & Opt-In
**Nothing is public by default.** Groups must explicitly opt in to community visibility:

- **Private** (default) — Group doesn't appear anywhere public. Stats are internal only.
- **Leaderboard Only** — Group name + Game Night Score appear on community leaderboards. No details.
- **Public Profile** — Full group page visible: stats, game history, rivalries, badges. Photos still respect individual privacy toggles.

Toggle in `/account/groups/[id]/settings` → "Community Visibility"

### Public Group Pages (`/community/groups/[slug]`)
When a group opts into public visibility, they get a shareable page:

```
Tucker Family Game Night
  City Rank: #3 in Tampa Bay
  Game Night Score: 87/100
  Games Played: 142 (all time)
  Favorite Game: Monopoly (played 47 times)
  Active Streak: 6 weeks
  Members: 5

  Recent Results:
  ├── Feb 26: Tuckers beat Smiths 2-1 (Monopoly, Uno, Scrabble)
  ├── Feb 19: Tucker Family Night — Tyler MVP (3 wins)
  └── Feb 12: Neighborhood Cup Round 2 — Tuckers advance

  Rivalries:
  └── vs. Smith Family: 14-11 (Tuckers lead)

  Achievements: 🏆 Dynasty, ⚡ Iron Will, 🃏 Variety Pack
```

### Community Activity Feed
The `/community` page has a real-time activity feed (opt-in groups only):
- "The Tucker Family just completed their 6th consecutive weekly game night!"
- "New rivalry forming: Johnson Crew and Oak Street Gang are 3-3 after tonight"
- "UPSET: The Smith Kids beat the Parents for the first time in Risk!"
- "Spring Tournament registration is open — 4 spots left"

### City-Level Aggregation
Since GL365 is city-focused, leaderboards are scoped by city/region:
- `/community?city=tampa` — Tampa Bay leaderboard
- `/community?city=orlando` — Orlando leaderboard
- Eventually: inter-city championships

### Pages Required

| Page | Purpose | Priority |
|---|---|---|
| `/community` | Hub for all public game activity — leaderboards, feed, tournaments | Phase 2.5 |
| `/community/leaderboards` | Detailed leaderboard views with filters (monthly, all-time, by game) | Phase 2.5 |
| `/community/groups/[slug]` | Public group profile page (opted-in groups only) | Phase 2.5 |
| `/community/rivalries` | Top rivalries across the city | Phase 2.75 |
| `/community/hall-of-fame` | All-time records and legendary moments | Phase 3 |

### Database Schema — Community Leaderboards
```sql
-- Group visibility setting (add to groups table)
groups.community_visibility TEXT DEFAULT 'private' -- 'private' | 'leaderboard' | 'public'
groups.city TEXT -- 'tampa' | 'orlando' | etc. (for city-scoped boards)

-- Materialized leaderboard (rebuilt nightly or on score change)
community_leaderboard
  id UUID PRIMARY KEY
  group_id UUID REFERENCES groups
  city TEXT NOT NULL
  game_night_score INT -- cached composite score
  total_games INT
  total_sessions INT
  win_rate NUMERIC
  current_streak INT
  monthly_xp INT
  rank INT -- computed rank within city
  period TEXT DEFAULT 'all_time' -- 'all_time' | 'monthly' | 'seasonal'
  computed_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(group_id, period)

-- Community activity feed (for the real-time feed)
community_feed
  id UUID PRIMARY KEY
  group_id UUID REFERENCES groups (nullable)
  event_type TEXT -- 'game_completed' | 'streak_milestone' | 'rivalry_update' | 'tournament_result' | 'badge_earned'
  headline TEXT -- "The Tucker Family completed their 6th straight week!"
  detail JSONB -- structured data for rich rendering
  city TEXT
  created_at TIMESTAMPTZ DEFAULT NOW()
```

---

## Game Maker Partnership System (QR Scorecards)

### Concept
Build the infrastructure now so that one day, game makers (Hasbro, Mattel, indie publishers) can integrate directly with GL365. The dream: every board game box includes a GL365 QR code. Scan it, and the game is auto-detected, scoring template loads, and players can photograph the official scorecard to auto-capture results.

### How It Works Today (Without Partnerships)

1. **Manual game selection** — Host picks "Monopoly" from the Game Library
2. **Manual score entry** — Host types in scores or ranks
3. **Photo of board** — Optional photo, Gemini Vision extracts what it can (best effort)

### How It Works With Game Maker Integration

1. **QR on game box or scorecard** — Player scans it with their phone
2. **Auto-detection** — System recognizes the game, loads the correct template
3. **Official scorecard photo** — Player takes a photo of the game's official paper scorecard
4. **AI parses the scorecard** — Gemini Vision knows the exact scorecard format for this game
5. **Scores auto-populate** — Verified and editable before confirming
6. **Game-specific stats** — Deeper stats unique to each game (Monopoly: properties owned, Scrabble: highest single word, etc.)

### The Partnership API

For game makers who want to integrate:

```
POST /api/partners/games — Register a new game
  {
    name: "Settlers of Catan",
    publisher: "Catan Studio",
    scoring_type: "points",
    win_condition: "first_to_10",
    scorecard_format: { ... },  // Layout description for AI parsing
    qr_identifier: "catan-base-2025",  // Encoded in their QR codes
    stats_schema: {  // Game-specific stats to track
      "longest_road": "boolean",
      "largest_army": "boolean",
      "victory_points": "integer",
      "resource_totals": "object"
    }
  }

GET /api/partners/games/:id/stats — Aggregate anonymized play data
  Response: {
    total_plays: 847293,
    avg_game_length_minutes: 72,
    avg_players: 3.8,
    win_condition_distribution: { "points": 62%, "domination": 38% }
  }
```

**What game makers get:**
- Anonymized play data (how many people play their game, avg game length, player counts)
- Featured placement in the Game Library
- "Official GL365 Partner" badge on game template
- Branded scoring experience (their colors, logo on the scoreboard)
- Analytics dashboard: which cities play their game most, trending up/down

**What GL365 gets:**
- QR codes in game boxes = free distribution and user acquisition
- Better score parsing (official scorecard formats → higher accuracy)
- Revenue from partnership fees (featured placement, data access)
- Legitimacy as "the platform" for board game tracking

### Scorecard Recognition System

The core tech that makes this work — with or without partnerships:

#### Without Partnership (Community-Trained)
- Users snap photos of scoreboards/scorecards
- Gemini Vision does best-effort parsing
- User confirms/corrects → that correction trains the system
- Over time, community corrections build a recognition model per game
- Crowdsourced accuracy: after 100 corrections for Monopoly scorecards, the system gets very good

#### With Partnership (Official Format)
- Game maker provides the exact scorecard layout
- AI knows exactly where to look for each player's score
- Near-perfect accuracy from day one
- Can read game-specific data (not just final scores)

### Database Schema — Game Maker Partnerships
```sql
-- Partner game templates (extends game_templates)
game_templates.partner_id UUID REFERENCES partners (nullable)
game_templates.qr_identifier TEXT UNIQUE -- what their QR encodes
game_templates.scorecard_format JSONB -- layout for AI parsing
game_templates.stats_schema JSONB -- game-specific stats definition
game_templates.branding JSONB -- logo_url, primary_color, secondary_color

-- Partner accounts
partners
  id UUID PRIMARY KEY
  name TEXT NOT NULL -- 'Hasbro' | 'Catan Studio' | etc.
  slug TEXT UNIQUE
  contact_email TEXT
  api_key TEXT UNIQUE -- for API access
  logo_url TEXT
  tier TEXT DEFAULT 'basic' -- 'basic' | 'premium' | 'enterprise'
  status TEXT DEFAULT 'pending' -- 'pending' | 'active' | 'suspended'
  created_at TIMESTAMPTZ DEFAULT NOW()

-- Scorecard recognition training data
scorecard_scans
  id UUID PRIMARY KEY
  game_template_id UUID REFERENCES game_templates
  image_url TEXT -- the photo
  raw_ai_result JSONB -- what Gemini returned
  user_corrected JSONB -- what the user fixed (null if AI was correct)
  was_correct BOOLEAN -- did AI get it right?
  session_game_id UUID REFERENCES session_games
  created_at TIMESTAMPTZ DEFAULT NOW()
```

### Revenue from Partnerships

| Tier | Price | Games Allowed | Who It's For |
|---|---|---|---|
| Basic | Free | Up to 3 | Indie creators, Kickstarter publishers, local game designers |
| Premium | $500/mo | Up to 5 (+$150/mo per extra game) | Established publishers: Catan Studio, Exploding Kittens, Czech Games |
| Professional | $2,000/mo | Up to 25 (+$100/mo per extra game) | Multi-title publishers: Asmodee brands, Ravensburger, Spin Master |
| Enterprise | Custom (starts ~$5K/mo) | Unlimited | Hasbro, Mattel — 50+ title catalogs |

#### What Each Tier Gets

| Feature | Basic | Premium | Professional | Enterprise |
|---|---|---|---|---|
| Game in library | YES | YES | YES | YES |
| Community QR support | YES | YES | YES | YES |
| Basic play count data | YES | YES | YES | YES |
| Official scorecard format | — | YES | YES | YES |
| Featured placement in Game Library | — | YES | YES | YES |
| "Official GL365 Partner" badge | — | YES | YES | YES |
| Branded scoring experience (logo + colors) | — | YES | YES | YES |
| Full analytics dashboard (per game) | — | YES | YES | YES |
| Portfolio dashboard (compare all titles) | — | — | YES | YES |
| Promotional tools (discount codes, challenges) | — | — | YES | YES |
| API access (pull data into their BI tools) | — | — | YES | YES |
| Co-branded experience (custom themes, sounds, badges) | — | — | — | YES |
| QR codes in physical game boxes | — | — | — | YES |
| Exclusive city sponsorships | — | — | — | YES |
| Dedicated account manager | — | — | — | YES |
| Custom integrations | — | — | — | YES |

#### Revenue Projections (At Scale)
```
50 indie publishers (Free)         = $0/mo      (but fills the game catalog)
30 Premium publishers ($500/mo)    = $15,000/mo
10 Professional publishers ($2K/mo) = $20,000/mo
3 Enterprise deals (~$10K/mo avg)  = $30,000/mo
                                     ─────────
                            Total  = $65,000/mo ($780K/year)
```

This is a **long-term play**. Build the scanning and template infrastructure now. Partnerships come when GL365 has critical mass. But the revenue potential is significant — and it compounds because every QR code in a game box is a free user acquisition channel.

### Database Schema — Gamification
```sql
-- XP and leveling
player_xp
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users (nullable)
  family_member_id UUID REFERENCES family_members (nullable)
  xp_total INT DEFAULT 0
  level INT DEFAULT 1
  current_streak INT DEFAULT 0 -- consecutive weeks with a game night
  longest_streak INT DEFAULT 0
  updated_at TIMESTAMPTZ DEFAULT NOW()

-- Achievement badges earned
player_achievements
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users (nullable)
  family_member_id UUID REFERENCES family_members (nullable)
  badge_slug TEXT NOT NULL -- 'comeback_kid' | 'iron_throne' | etc.
  earned_at TIMESTAMPTZ DEFAULT NOW()
  session_id UUID REFERENCES sessions -- which session triggered it
  metadata JSONB -- context: what game, who they beat, etc.
  UNIQUE(user_id, badge_slug) -- one badge per person (first earn only)

-- Rivalry tracking between players/groups
rivalries
  id UUID PRIMARY KEY
  entity_a_type TEXT -- 'user' | 'family_member' | 'group'
  entity_a_id UUID
  entity_b_type TEXT
  entity_b_id UUID
  wins_a INT DEFAULT 0
  wins_b INT DEFAULT 0
  current_streak_holder TEXT -- 'a' | 'b' | null
  current_streak_count INT DEFAULT 0
  total_matches INT DEFAULT 0
  last_match_at TIMESTAMPTZ
  narrative JSONB -- AI-generated rivalry story chapters
  UNIQUE(entity_a_id, entity_b_id)

-- Predictions per game
game_predictions
  id UUID PRIMARY KEY
  session_game_id UUID REFERENCES session_games
  predictor_user_id UUID REFERENCES auth.users (nullable)
  predictor_family_member_id UUID REFERENCES family_members (nullable)
  predicted_winner_user_id UUID (nullable)
  predicted_winner_family_member_id UUID (nullable)
  predicted_winner_group_id UUID (nullable)
  was_correct BOOLEAN -- set after game completes
  created_at TIMESTAMPTZ DEFAULT NOW()

-- Trading cards generated after sessions
trading_cards
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users (nullable)
  family_member_id UUID REFERENCES family_members (nullable)
  session_id UUID REFERENCES sessions
  title TEXT -- "The Monopoly Mogul"
  rarity TEXT -- 'common' | 'rare' | 'epic' | 'legendary'
  stats JSONB -- win_rate, streak, best_game, etc.
  image_url TEXT -- AI-generated card image
  created_at TIMESTAMPTZ DEFAULT NOW()

-- Seasonal events
seasonal_events
  id UUID PRIMARY KEY
  name TEXT -- 'Harvest Tournament 2026'
  season TEXT -- 'fall' | 'winter' | 'spring' | 'summer'
  year INT
  badge_slug TEXT -- special seasonal badge
  starts_at TIMESTAMPTZ
  ends_at TIMESTAMPTZ
  leaderboard JSONB -- seasonal rankings
  status TEXT DEFAULT 'upcoming' -- 'upcoming' | 'active' | 'completed'
```

---

## Pages Required (Full Platform)

| Page | Purpose | Priority |
|---|---|---|
| `/account/groups` | Manage all your groups (family, friends, etc.) | Phase 2 |
| `/account/groups/[id]` | Group detail: members, stats, history, invite link | Phase 2 |
| `/account/groups/[id]/settings` | Group settings: community visibility, privacy | Phase 2 |
| `/account/family` | Manage child sub-profiles under parent account | Phase 2 |
| `/account/family/[memberId]` | Child profile: all-time stats, badges, game history | Phase 2.5 |
| `/game-night` | Start a game night: pick game, select players, invite groups | Phase 2.5 |
| `/game-night/[id]` | Active session: score entry, photos, live scoreboard, controls | Phase 2.5 |
| `/game-night/[id]/tv` | TV/Cast Mode: full-screen scoreboard for big screens | Phase 2.5 |
| `/game-night/[id]/recap` | AI recap with photos, stats, shareable video collage | Phase 2.5 |
| `/recap/[id]` | Public shareable recap (privacy-enforced) | Phase 2.5 |
| `/community` | Public hub: leaderboards, activity feed, tournaments, hall of fame | Phase 2.5 |
| `/community/leaderboards` | Detailed leaderboard views with filters (monthly, all-time, by game) | Phase 2.5 |
| `/community/groups/[slug]` | Public group profile page (opted-in groups only) | Phase 2.5 |
| `/community/rivalries` | Top rivalries across the city | Phase 2.75 |
| `/community/hall-of-fame` | All-time records and legendary moments | Phase 3 |
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

## Future Revenue Streams — Platform Expansion Pricing

**Pricing Philosophy:** GL365 is a startup. Launch prices are intentionally low to drive adoption. Every price below includes a "Launch" column (what we charge now to get users in the door) and an "Established" column (what we raise to once the value is proven and adoption is strong). The jump should feel justified — more features, more data, more users on the platform backing the value.

---

### 1. City Passport — Local Business Challenges

**What it is:** Gamified exploration challenges — "Visit 5 coffee shops in Tampa this month → earn the Caffeine Explorer badge." Businesses opt in through their existing directory listing. Consumers scan QR at each stop (uses existing Blast Deals QR infra). Completing a challenge earns XP on their Identity Passport.

**Who pays:** Businesses who want to sponsor/create featured challenges.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Participate in challenges | Free (consumer) | Free | Always free — this is engagement |
| Business opt-in to challenges | Free (included in directory listing) | Free | More stops = better challenges |
| Sponsored challenge (featured + promoted) | $99/challenge | $249/challenge | "Complete the Ybor Taco Trail" — sponsored by a restaurant group |
| Multi-stop campaign (5+ businesses, co-branded) | $349/campaign | $799/campaign | Tourism boards, BIDs, restaurant groups |
| Recurring monthly challenge | $79/mo | $199/mo | Auto-renews, always featured |

**Why these prices work at launch:** $99 for a sponsored challenge is cheaper than a single Facebook ad campaign and generates real foot traffic. Easy yes for a local business. Room to triple the price once we can show conversion data.

---

### 2. Event Check-In & Ticketing

**What it is:** Any local event (block party, farmer's market, concert, 5K run) uses GL365 as the check-in system. Organizer creates a Session (type: 'event'). Attendees scan QR → checked in via Identity Passport. Real-time headcount. Post-event AI recap.

**Who pays:** Event organizers.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Single event (up to 50 attendees) | $19/event | $39/event | Farmer's markets, meetups, small gatherings |
| Single event (up to 200 attendees) | $39/event | $79/event | Block parties, charity runs, concerts in the park |
| Single event (up to 1,000 attendees) | $79/event | $149/event | Festivals, large community events |
| Monthly unlimited events | $69/mo | $149/mo | Recurring organizers (weekly farmer's markets, monthly meetups) |
| Annual unlimited | $549/yr | $1,199/yr | Saves ~35% vs monthly, locks in commitment |
| AI recap + photo package add-on | $9/event | $19/event | Auto-generated recap with tagged photos, shareable link |

**Why these prices work at launch:** $19 for a check-in system at a farmer's market is a no-brainer. The real cost of managing a sign-in sheet + post-event follow-up is hours of time. We're replacing clipboards with QR codes.

---

### 3. Loyalty Program Engine

**What it is:** Any business on the directory runs a loyalty program through GL365. "Visit 10 times → earn a free coffee." Consumer scans QR each visit. Their Identity Passport tracks all loyalty across every business. One app replaces every punch card in their wallet.

**Who pays:** Businesses (add-on to directory subscription).

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Basic loyalty (visits tracked, 1 reward tier) | $15/mo | $29/mo | Simple punch-card replacement |
| Standard loyalty (multiple reward tiers, custom rewards) | $29/mo | $59/mo | "5 visits = free cookie, 10 = free drink, 25 = free meal" |
| Premium loyalty (analytics, segmentation, push notifications) | $49/mo | $99/mo | Know who your best regulars are, re-engage lapsed customers |
| Included free in Directory Premium ($89/mo) | Basic loyalty tier | Standard loyalty tier | Upsells directory subscriptions |

**Why these prices work at launch:** $15/mo for a digital loyalty system is less than the cost of printing punch cards. Businesses already pay $20+/mo for standalone loyalty apps. GL365 bundles it into the ecosystem they're already on.

---

### 4. Local Creator & Services Marketplace

**What it is:** Photographers, DJs, caterers, handymen, tutors, pet sitters — anyone in the gig/freelance and artisan directory categories gets a full service profile. Portfolio, booking requests, reviews. "Request a Quote" button feeds into CRM as a lead.

**Who pays:** Service providers (subscription), plus optional transaction lead fees.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Basic creator listing | Free | Free | Photo, bio, category, reviews — same as any directory listing |
| Creator Pro (portfolio, booking, lead capture) | $25/mo | $49/mo | Up to 20 portfolio items, booking calendar, quote requests |
| Creator Premium (featured, AI-written profile, unlimited portfolio) | $45/mo | $89/mo | AI writes service descriptions, featured in search results |
| Lead fee (per qualified booking request) | $2/lead | $5/lead | Only charged when a consumer submits a request — pay for results |

**Why these prices work at launch:** $25/mo for a full service profile with lead capture is dirt cheap compared to Thumbtack ($15-75 per lead), Bark ($5-30 per lead), or HomeAdvisor ($15-100 per lead). We're offering subscriptions, not per-lead gouging.

---

### 5. Neighborhood Safety & Community Groups

**What it is:** Neighborhood groups with a safety layer — suspicious activity alerts, lost pet alerts, power outage check-ins, severe weather coordination. Think Nextdoor but inside the GL365 ecosystem, feeding into Game Night discovery and local business engagement.

**Who pays:** This is mostly free (civic utility, top-of-funnel for everything else). Premium features for verified neighborhoods.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Basic neighborhood group | Free | Free | Always free — civic utility drives adoption |
| Verified Neighborhood (admin tools, emergency alerts, resident verification) | $2.99/mo per household | $5.99/mo per household | Block-level admin, priority alerts, verified resident badges |
| HOA / Property Management integration | $49/mo | $99/mo | Bulk resident management, announcement tools, vote/survey |
| Sponsored safety feature (local security company, insurance) | $199/mo | $499/mo | "Neighborhood Watch powered by ADT" — brand placement |

**Why these prices work at launch:** $2.99/household for a verified neighborhood is cheaper than a single Nextdoor ad. The real value is that every household on the platform is now a potential Game Night user, directory browser, and Loop participant. This is the acquisition play.

---

### 6. Rec League & Parks Department Scheduling

**What it is:** Parks & Rec departments use GL365 to manage court reservations, rec league signups, standings, and scheduling. Individual rec league commissioners use it for their own leagues (bowling, softball, cornhole, etc.).

**Who pays:** League commissioners (existing pricing) + government/civic partnerships.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| League Commissioner (existing) | $228/season | $228/season | Already defined — no change |
| League Commissioner Lite (casual, <8 teams) | $99/season | $149/season | Smaller leagues, fewer features |
| Parks & Rec Department (single facility) | $199/mo | $499/mo | Court reservations, league management, event check-in |
| Parks & Rec Department (city-wide, all facilities) | $999/mo | $2,499/mo | Unlimited facilities, city dashboard, public recreation portal |
| Facility booking widget (embeddable on city website) | Included in Parks tier | Included | White-labeled, drops into existing .gov sites |

**Why these prices work at launch:** $199/mo for a parks scheduling system is a fraction of what cities pay for legacy recreation management software ($500-2K+/mo). We're undercutting the market with a modern, mobile-first product and we can raise prices once the city is dependent on it.

---

### 7. Real Estate Open House Check-In

**What it is:** Realtors place a GL365 QR code at open houses. Visitors scan in → auto-logged on Identity Passport. Realtor gets a lead list with contact info. AI generates follow-up email drafts. Visitors can review the neighborhood on GL365.

**Who pays:** Individual realtors and brokerages.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Single open house check-in | $15/event | $29/event | QR code, attendee list, basic export |
| Monthly unlimited (individual agent) | $49/mo | $99/mo | Unlimited open houses, CRM integration, AI follow-up drafts |
| Brokerage account (up to 10 agents) | $199/mo | $399/mo | Multi-agent dashboard, team lead routing, brand consistency |
| Brokerage account (up to 50 agents) | $499/mo | $999/mo | Large brokerages, office-level analytics, custom branding |
| AI follow-up email drafts (add-on) | $5/open house | $9/open house | Personalized emails drafted per attendee based on visit data |

**Why these prices work at launch:** $15 for a digital open house sign-in is nothing — realtors spend $200+ on open house marketing. The AI follow-up emails alone save hours. $49/mo unlimited is a fraction of what they pay for CRM tools like BoomTown ($750/mo) or Follow Up Boss ($69/mo per agent).

---

### 8. City Intelligence Data Products (Anonymized)

**What it is:** At scale, GL365 has behavioral data nobody else has — where people go, when, what they do, what games they play, what businesses they visit. Anonymized and aggregated, this is gold for city planners, commercial real estate firms, tourism boards, and researchers.

**Who pays:** Municipal governments, commercial real estate firms, tourism boards, market researchers.

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Standard city report (single neighborhood, quarterly) | $299/report | $999/report | Foot traffic patterns, business density, activity trends |
| Custom analytics package (specific questions answered) | $999/report | $4,999/report | "Where do 25-35 year olds eat on Friday nights in SoHo?" |
| Ongoing data subscription (monthly dashboards) | $499/mo | $1,999/mo | Real-time anonymized city intelligence dashboard |
| Tourism board package (seasonal insights + event impact) | $799/quarter | $2,499/quarter | "What was the economic impact of Gasparilla on local businesses?" |
| API access (raw anonymized data feed) | $1,499/mo | $4,999/mo | For firms with their own BI tools — pipe GL365 data into Tableau, etc. |

**Why these prices work at launch:** $299 for a neighborhood report is accessible for a small real estate firm. The data gets more valuable as GL365 grows — a report when we have 10K users is interesting, but when we have 100K users it's priceless. Prices should scale with data quality.

**Important:** This stream only activates when GL365 has significant user scale (50K+ active users in a metro area). Don't sell data products until the data is actually meaningful.

---

### 9. Sponsorship Layer (Non-Intrusive, Context-Aware)

**What it is:** Local businesses sponsor things people are already using — game nights, leagues, tournaments, community feeds. Not banner ads. Contextual, useful integrations: "Tonight's Game Night is sponsored by Tony's Pizza — order with code GAMENIGHT for 15% off."

**Who pays:** Local businesses (must already have an active directory listing).

| Product | Launch Price | Established Price | Notes |
|---|---|---|---|
| Game Night sponsor (logo + deal shown on session pages) | $39/mo | $79/mo | Appears on all game nights within 5-mile radius |
| League sponsor (logo on leaderboard + standings page) | $79/mo | $199/mo | Branded leaderboard, mention in AI recaps |
| Tournament title sponsor | $149/tournament | $349/tournament | "The Tony's Pizza Invitational" — logo everywhere |
| Community hub sponsor (featured in activity feed) | $199/mo | $499/mo | Premium placement in the community feed |
| Loop stop sponsor (priority routing + branded check-in) | $99/mo | $249/mo | AI Scout prioritizes their location on nearby Loops |
| City Passport challenge sponsor | $99/challenge | $249/challenge | Same as #1 above — cross-listed here for visibility |
| Bundle: Full sponsorship package (all of the above) | $399/mo | $999/mo | Saves ~40% vs individual. For businesses that want maximum visibility |

**Why these prices work at launch:** $39/mo for game night sponsorship is less than a single pizza. The business is already paying for a directory listing — this is a natural upsell. "You're already on GL365. Want to be the pizza people order during game night?" Easy sell.

---

## Target Buyers — Who Writes the Check

### 1. City Passport Challenges — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Restaurant group owner | Owner of 3-5 locations | $99/challenge | Cheaper than a Yelp ad, drives foot traffic across all locations |
| BID / Main Street director | Executive Director (e.g., Ybor City Development Corp) | $349/campaign | Already has marketing budget to promote the district |
| Tourism board marketing manager | Visit Tampa Bay, marketing coordinator | $349-$799/campaign | "Tampa Foodie Trail" — they spend $50K+/yr on tourism campaigns |
| Chamber of Commerce | Events coordinator | $79/mo recurring | Promotes member businesses — built into member services budget |
| Brewery/taproom owner | Owner-operator | $79/mo recurring | "Visit 5 Tampa breweries" challenge — drives new customers |
| Hotel concierge partner | Hotel GM or marketing director | $349/campaign | Recommend challenges to hotel guests — tourism play |

### 2. Event Check-In — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Farmer's market organizer | Market manager (often 1 person) | $19/event | Replaces the clipboard. Gets attendee data for sponsors |
| Non-profit event coordinator | Development director | $39/event | Charity 5K check-in — needs headcount for donor reporting |
| Block party organizer | HOA president or neighborhood leader | $19/event | Proves attendance to the city for permits |
| Church/community center admin | Office manager or pastor | $69/mo unlimited | Weekly events: fish fry, youth group, bingo night |
| Festival production company | Event producer / operations manager | $79/event | Real-time headcount = fire marshal compliance |
| Running club / race director | Race director | $39-$79/event | Replaces expensive race timing software for casual events |
| Fitness studio / yoga instructor | Studio owner or independent instructor | $19/event | Workshops, pop-up classes in the park |
| Corporate event planner | HR coordinator or admin assistant | $39/event | Company picnic, team-building. Expense report friendly |

### 3. Loyalty Program Engine — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Coffee shop owner | Owner-operator | $15/mo | Replaces paper punch card. "Visit 10, free coffee" — already does this manually |
| Restaurant owner (single location) | Owner or GM | $29/mo | Knows regulars by face but not by data |
| Barbershop / salon owner | Owner-operator | $15/mo | Clients already come regularly — now track and reward it |
| Boutique retail owner | Clothing/gift shop owner | $29/mo | "Spend $500 lifetime → 10% off next purchase" |
| Auto detail / car wash owner | Owner-operator | $15/mo | Wash clubs are already a thing — this digitizes it |
| Ice cream / frozen yogurt shop | Owner (often a franchise) | $15/mo | Perfect for families. Kids beg to go back for the next stamp |
| Pet groomer / vet clinic | Owner or office manager | $29/mo | Pet owners are the most loyal repeat customers on earth |
| Existing GL365 Premium subscriber | Already paying $89/mo | Free (included) | "You already have this — just turn it on" |

### 4. Creator & Services Marketplace — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Wedding / event photographer | Self-employed | $25/mo | Portfolio + booking page. Currently paying $30+/mo for Squarespace |
| Mobile DJ | Self-employed | $25/mo | Needs booking page, reviews, local discoverability |
| Independent caterer | Solo operator | $25/mo | "Request a Quote" replaces DMs and phone tag |
| Handyman / home repair | Self-employed tradesperson | $25/mo | Thumbtack charges $15-75 PER LEAD. This is flat rate |
| Private tutor | Independent (math, SAT prep, music) | $25/mo | Parents search locally — reviews build trust |
| Personal trainer (outdoor/mobile) | Independent trainer | $25/mo | Trains in parks, needs visibility beyond Instagram |
| House cleaner / maid service | Solo operator or small team | $25/mo | Referral-based business — reviews are everything |
| Pet sitter / dog walker | Self-employed (Rover competitor) | $25/mo | No 20% platform fee like Rover takes |
| Local artisan (candles, soap, jewelry) | Maker / Etsy seller wanting local customers | Free-$25/mo | Portfolio for farmer's markets + online presence |
| Lawn care / landscaping | Owner-operator | $25/mo | Seasonal demand — needs to be found when people search |

### 5. Neighborhood Safety — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| HOA president | Volunteer board president | $49/mo | Replaces the HOA email chain nobody reads |
| Property management company | Community association manager (CAM) | $49/mo per community | Manages 10-50 communities — $49 each is nothing vs current software |
| Neighborhood association leader | Volunteer coordinator | $2.99/household | "Less than a coffee/month for safety alerts" |
| Gated community board | HOA board (votes on expenditures) | $49/mo | Resident verification is a real security concern they already pay for |
| Local security company (ADT, etc.) | Sales manager or regional marketing | $199/mo sponsor | Logo on every alert — brand placement in the right context |
| Insurance agency (State Farm, Allstate) | Local agent / agency owner | $199/mo sponsor | "Home safety tips brought to you by..." — relevant, non-intrusive |
| Apartment complex management | Property manager | $49/mo | Resident communication, maintenance visibility, event coordination |

### 6. Rec League & Parks — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Bowling league organizer | League secretary (usually a volunteer) | $99/season | Currently using paper or a free spreadsheet |
| Cornhole league organizer | Guy whose backyard league grew | $99-$228/season | 20+ players weekly — needs real standings and scheduling |
| Bar trivia host | Trivia MC or bar manager | $99/season | Track team standings across weeks, generate repeat customers |
| Pickleball group organizer | Person managing the court group chat | $99/season | Court scheduling + match results + standings |
| Dart league commissioner | Commissioner (often the bar owner) | $228/season | Formal league — needs official standings, schedule management |
| Parks & Rec coordinator | Recreation program coordinator | $199/mo | One rec center: court bookings, youth leagues, event check-in |
| City recreation director | Director of Parks & Recreation | $999/mo | City-wide: all parks, all facilities, all leagues |
| YMCA / Boys & Girls Club | Program director | $199/mo | Youth sports leagues, facility scheduling, parent communication |
| Church recreation coordinator | Youth pastor or activities director | $99/season | Church basketball, volleyball, game nights |

### 7. Real Estate Open House — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Solo real estate agent | Licensed realtor (independent) | $15/event or $49/mo | Currently using a paper sign-in sheet — loses half the leads |
| Real estate team lead | Team lead with 3-5 agents | $49/mo | All team open houses funneling into one dashboard |
| Brokerage managing broker | Managing broker / office manager | $199/mo (10 agents) | Standardizes lead capture across the office |
| Large brokerage operations | VP of Operations (KW, RE/MAX, etc.) | $499/mo (50 agents) | Enterprise deal, office-level analytics |
| New construction sales office | Sales manager at a homebuilder | $49/mo | Model home visitors tracked automatically |
| Commercial real estate broker | CRE agent showing office/retail space | $15/event | Fewer events, higher-value leads. $15/showing is nothing |

### 8. City Intelligence Data — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Commercial real estate analyst | Market analyst at CBRE, JLL | $499-$999/report | "Which neighborhoods have foot traffic growth?" — informs $10M+ decisions |
| City planner | Urban planner or economic development director | $299/report | "Where should we put the new community center?" — data-driven |
| Tourism board researcher | Research director at Visit Tampa Bay | $799/quarter | "What was Gasparilla's economic impact?" — justifies their own budget |
| Franchise development manager | Site selection for Chick-fil-A, Starbucks, etc. | $999/report | "Where should we open next in Tampa?" |
| Small business lender | SBA lender or community bank loan officer | $499/mo | "Is this neighborhood growing?" — loan risk assessment |
| University researcher | Professor / grad researcher (urban studies) | $299/report | Academic research, grant-funded |
| Insurance underwriter | Regional underwriter | $499/mo | Neighborhood risk profiles, activity patterns |

### 9. Sponsorship Layer — Buyers

| Buyer | Title / Role | Price Point | Why They Say Yes |
|---|---|---|---|
| Pizza shop owner | Owner-operator | $39/mo | "Order with code GAMENIGHT for 15% off" — shown when families are hungry |
| Local brewery / bar owner | Owner or marketing manager | $79/mo | Logo on the leaderboard league players check every week |
| Restaurant wanting event traffic | Owner or GM | $149/tournament | "The Tony's Pizza Invitational" — title sponsor |
| Local gym / fitness studio | Owner or marketing manager | $99/mo | Loop stop sponsor — AI routes people past their door |
| Real estate agent (personal brand) | Individual agent | $199/mo | Face and brand in the activity feed of their target neighborhood |
| Insurance agent (local) | Local State Farm / Allstate agent | $399/mo bundle | Everywhere in the ecosystem — maximum local brand presence |
| Car dealership | Marketing manager | $199/mo | Cheaper and more targeted than radio ads |
| Bank / credit union (local branch) | Branch manager or regional marketing | $79/mo | "Season standings brought to you by Suncoast Credit Union" |
| Urgent care / medical practice | Practice administrator | $39/mo | "Need a doctor? We're open late" — shown to families in the area |
| Auto repair / tire shop | Owner | $39/mo | Contextual: shown to families in the neighborhood |

---

### The Common Thread Across All 9 Streams

**Small decisions by real people.** Almost every buyer above is either:
1. **A business owner** making a $15-$199/mo decision on their own (no committee, no procurement)
2. **A solo operator** spending $25-$49/mo as a business expense
3. **A program coordinator** with a small discretionary budget ($99-$999/mo)
4. **A marketing manager** at a mid-size org with an existing ad budget they're reallocating

The only exceptions are:
- **City-wide Parks deals** ($999+/mo) — government procurement, longer sales cycle
- **Data products** ($299-$4,999) — B2B/B2G, need a sales team, but also need 50K+ users first

**Every other sale can happen over a 5-minute conversation.** That's the power of low price points at launch.

---

## Automation Blueprint — Every Stream Runs Itself

**The rule:** If a human at GL365 has to touch it, it doesn't ship. Every revenue stream must be fully self-service — signup, configuration, payment, delivery, and reporting. Zero manual intervention. The only time a GL365 human gets involved is Enterprise deals ($5K+/mo) and government contracts ($999+/mo), because those buyers expect a conversation.

### The 4 Infrastructure Pillars That Power Everything

These already exist or are already planned. Every automated revenue stream below is just a **new UI on top of these same 4 systems:**

```
┌─────────────────────────────────────────────────────────────┐
│                    GL365 Automation Stack                     │
│                                                               │
│  1. STRIPE BILLING (Live)                                     │
│     └─ Handles ALL payments: subscriptions, one-time,         │
│        usage-based, add-ons, upgrades, downgrades, refunds    │
│                                                               │
│  2. BUSINESS PORTAL (Live, 8 pages)                           │
│     └─ Self-service hub. Every business feature is a new      │
│        tab or page in the portal they already use              │
│                                                               │
│  3. QR CODE + SESSION SYSTEM (Planned)                        │
│     └─ Universal check-in. Every scan creates a record.       │
│        Loyalty visits, event check-ins, challenge stops,      │
│        open house sign-ins — all the same QR scan → log       │
│                                                               │
│  4. IDENTITY PASSPORT (Planned)                               │
│     └─ Consumer's universal profile. Every interaction        │
│        across every stream feeds into one identity.            │
│        Loyalty cards, event history, challenge progress,       │
│        game stats — all in one place                          │
└─────────────────────────────────────────────────────────────┘
```

**The pattern is always the same:**
1. Business/creator/organizer signs up via self-service portal
2. They configure their product (challenge, loyalty program, event, sponsorship)
3. They pay via Stripe (auto-billed, no invoicing)
4. The product goes live immediately (no approval queue)
5. Consumers interact via QR scan or app
6. Analytics auto-populate in the portal dashboard
7. GL365 touches nothing

---

### Stream 1: City Passport Challenges — Automation

**Business side (portal):**
```
Business Portal → "Challenges" tab (new)
  → "Create a Challenge" button
  → Pick type: Single-stop or Multi-stop
  → If multi-stop: invite other businesses (they accept via notification)
  → Set reward: badge name, XP amount, or "Show this coupon on completion"
  → Set duration: one-time or recurring monthly
  → Preview challenge card
  → Pay via Stripe: $99 one-time or $79/mo recurring
  → Challenge goes live immediately in consumer app
  → Dashboard shows: participants, completion rate, foot traffic per stop
```

**Consumer side (app):**
```
Consumer → Browse Challenges (in Community Hub or City Passport page)
  → Tap "Join Challenge"
  → Visit each stop → scan QR (same Blast Deals QR already at the business)
  → Progress bar updates automatically
  → Complete all stops → badge unlocked, XP awarded, coupon displayed
  → No human at GL365 involved at any step
```

**Multi-stop campaigns ($349):**
```
Lead business creates challenge → invites partner businesses by email/in-app
  → Each partner accepts with one tap (they're already on GL365)
  → Lead business pays the $349 (or splits — Stripe handles split billing)
  → All stops auto-linked
  → Each business sees their own traffic in their own dashboard
```

**What's automated:** Everything. Challenge creation, partner invitations, payment, publishing, QR scanning, progress tracking, badge awarding, analytics.

**What's NOT automated:** Tourism board campaigns ($799) — these are larger deals where someone at GL365 may hop on a call. But even these could be self-service if the tourism board has a GL365 account.

---

### Stream 2: Event Check-In — Automation

**Organizer side:**
```
Anyone with a GL365 account → "Create Event" (new page: /events/new)
  → Enter: event name, date, time, venue (pick from directory or enter address)
  → Select capacity tier: 50 / 200 / 1,000
  → Price auto-calculated: $19 / $39 / $79
  → Or toggle "Monthly Unlimited" → $69/mo subscription
  → Pay via Stripe
  → System generates unique QR code for the event
  → Organizer prints QR or displays on phone/tablet at the door
  → Dashboard (live during event): real-time headcount, attendee list
  → Post-event: attendee export (CSV), optional AI recap ($9 add-on, one-click purchase)
```

**Attendee side:**
```
Attendee arrives → scans event QR with phone camera (no app needed, opens web)
  → If GL365 account: auto-checked in via Identity Passport
  → If no account: quick name + email form (creates lead, optional account creation)
  → Organizer's dashboard updates instantly (WebSocket)
  → Attendee gets: "You're checked in! ✓" confirmation page
```

**What's automated:** Event creation, payment, QR generation, check-in, real-time headcount, attendee export, AI recap generation.

**What's NOT automated:** Nothing. This is 100% self-service from start to finish. Even the AI recap is auto-generated — organizer clicks "Generate Recap" and it runs.

---

### Stream 3: Loyalty Program — Automation

**Business side (portal):**
```
Business Portal → "Loyalty" tab (new)
  → Toggle: "Enable Loyalty Program"
  → If on Free directory listing: shown upgrade prompt ("Upgrade to add loyalty")
  → If on Pro ($45/mo): shown loyalty add-on pricing ($15/mo Basic, $29/mo Standard)
  → If on Premium ($89/mo): Basic loyalty included free, Standard $29/mo, Premium $49/mo
  → Configure rewards:
    Basic: "Visit X times → get [reward description]"
    Standard: Multiple tiers ("5 visits = free cookie, 10 = free drink, 25 = free meal")
    Premium: + segmentation, push notifications, lapsed customer re-engagement
  → Pay via Stripe (added to existing subscription as line item)
  → Loyalty program goes live immediately
  → Same QR code already at their business handles loyalty scans
  → Dashboard shows: total loyalty members, visit frequency, rewards redeemed, top customers
```

**Consumer side:**
```
Consumer visits business → scans existing QR code (same one for Blast Deals)
  → System detects: this business has a loyalty program
  → If first visit: "Welcome! You're now earning rewards at [Business Name]"
  → If returning: "Visit 4 of 10 — 6 more until your free coffee!"
  → All loyalty cards live in Identity Passport → one screen, every business
  → Push notification when close to a reward: "1 more visit until your free cookie!"
  → Reward earned → shows coupon/code on phone → business honors it
```

**What's automated:** Program setup, billing (added to existing Stripe subscription), visit tracking (via existing QR scans), reward calculation, notifications, consumer-facing loyalty cards.

**What's NOT automated:** The business actually giving the free coffee. That's on them. GL365 just shows the coupon.

---

### Stream 4: Creator Marketplace — Automation

**Creator side:**
```
Creator signs up for GL365 (free account)
  → Claims/creates their directory listing in a gig/artisan category
  → Listing page shows: "Upgrade to Creator Pro for portfolio, booking & lead capture"
  → Tap "Upgrade" → Stripe checkout → $25/mo or $45/mo
  → Portal unlocks Creator tools:
    - Portfolio: upload up to 20 images/videos of work (unlimited on Premium)
    - Booking calendar: set availability, block out dates
    - "Request a Quote" form: auto-generates on their public listing page
    - AI profile writer (Premium): answer 5 questions → AI writes the full profile
  → Listing page now shows portfolio gallery + "Request a Quote" button + reviews
```

**Consumer side:**
```
Consumer searches "photographer Tampa" on GL365
  → Creator Pro/Premium listings appear with portfolio and booking button
  → Consumer taps "Request a Quote"
  → Fills out: event type, date, budget range, message
  → Creator gets notification + email (same CRM lead system businesses already use)
  → Creator responds via portal or email
  → Lead fee ($2) auto-charged to creator's Stripe subscription
  → GL365 never brokers the deal — just connects them
```

**What's automated:** Signup, portfolio building, AI profile generation, booking forms, lead routing, lead fee billing, search ranking.

**What's NOT automated:** The creator actually responding to leads and doing the work. That's their job.

---

### Stream 5: Neighborhood Safety — Automation

**Group creation:**
```
Any GL365 user → "Create Group" → select type: "Neighborhood"
  → Enter neighborhood name, draw boundary on map (or enter zip/address)
  → Invite neighbors: share link via text, email, Nextdoor, or print flyer with QR
  → Group is live immediately (free tier)
  → Post alerts: suspicious activity, lost pets, weather, power outages
  → All members get notifications
```

**Verified upgrade:**
```
Group admin → "Upgrade to Verified Neighborhood"
  → Stripe checkout: $2.99/mo per household
  → Billing: admin pays for the whole group OR each household pays individually
    (Stripe handles both models — admin-paid or split-billing)
  → Verified features unlock:
    - Resident verification (ID check or address confirmation)
    - Priority emergency alerts (push + SMS)
    - Admin tools: member management, announcement scheduling, polls/votes
    - "Verified Resident" badge on profiles
```

**HOA integration:**
```
Property manager creates group → selects "HOA / Property Management"
  → $49/mo via Stripe
  → Bulk import residents (CSV upload or integration with their management software)
  → Announcement tools, vote/survey builder, maintenance request visibility
  → Self-service from start to finish
```

**Sponsor:**
```
Local security company / insurance agent → already has GL365 business listing
  → Business Portal → "Sponsorships" tab → select "Neighborhood Safety Sponsor"
  → Pick radius or specific neighborhoods
  → Upload logo, write tagline
  → Pay $199/mo via Stripe
  → Logo auto-appears on safety alerts and group pages within selected area
  → No human at GL365 approves it — automated content policy check only
```

**What's automated:** Group creation, invitations, posting, notifications, verified upgrade billing, HOA import, sponsor self-service.

**What's NOT automated:** Resident verification for Verified Neighborhoods may need a lightweight automated check (address confirmation via a mailed postcard code, or matching a utility bill — can be built later). V1 can use self-attestation.

---

### Stream 6: Rec League & Parks — Automation

**Commissioner self-service (already planned):**
```
Commissioner signs up → "Create League"
  → Pick sport/game type, season length, number of teams
  → System auto-selects tier:
    - <8 teams: Lite ($99/season)
    - 8+ teams: Standard ($228/season)
  → Pay via Stripe
  → League hub page auto-generates (/leagues/[slug])
  → Commissioner manages everything in portal:
    - Create schedule (auto-generated based on team count + weeks)
    - Enter scores (or let team captains enter + commissioner confirms)
    - Standings auto-calculate
    - AI recaps auto-generate after each match
  → Players join via invite link → free GL365 account
```

**Parks & Rec self-service:**
```
Parks coordinator signs up → "Create Facility"
  → Enter: facility name, address, amenities (courts, fields, rooms)
  → Set available time slots per amenity
  → Set booking rules: max duration, advance booking window, member-only times
  → Pay $199/mo via Stripe
  → Public booking page auto-generates (/facilities/[slug])
  → Residents browse availability → book a court → confirmation email
  → Coordinator dashboard: utilization rates, popular times, revenue (if charging booking fees)
  → City-wide tier ($999/mo): all facilities on one dashboard, single payment
```

**Embeddable widget for .gov sites:**
```
Parks coordinator → "Get Embed Code"
  → Copy/paste an iframe or JavaScript snippet
  → Drops into existing city website
  → White-labeled: shows city branding, not GL365
  → Residents book through the city website → data flows back to GL365 dashboard
```

**What's automated:** League creation, scheduling, scoring, standings, AI recaps, facility setup, booking, embeddable widget generation.

**What's NOT automated:** City-wide Parks deals ($999/mo) will likely need a demo call. But the product itself is still self-service once they sign up. The call is just to close the deal, not to set anything up.

---

### Stream 7: Real Estate Open House — Automation

**Agent self-service:**
```
Realtor signs up for GL365 → "I'm a Real Estate Professional"
  → Select: Individual ($49/mo unlimited) or Single Event ($15/event)
  → Pay via Stripe
  → "Create Open House" button:
    - Enter property address (auto-fills from MLS data if available)
    - Set date/time
    - Upload property photos (optional)
    - System generates unique QR code + printable sign-in sheet with QR
  → Print QR → place at open house entrance
  → During event: live dashboard shows check-ins as they happen
  → After event: one-click export attendee list (name, email, phone)
  → AI follow-up add-on ($5): click "Generate Follow-Ups" → AI drafts personalized email for each attendee
```

**Visitor side:**
```
Visitor arrives at open house → scans QR
  → If GL365 account: auto-checked in (name, email pre-filled from Identity Passport)
  → If no account: quick form (name, email, phone, "Are you working with an agent?")
  → Optional: "Rate this neighborhood" prompt (feeds GL365 review system)
  → Visitor gets: property details page, neighborhood info, nearby listings
```

**Brokerage self-service:**
```
Managing broker → "Create Brokerage Account"
  → Select tier: 10 agents ($199/mo) or 50 agents ($499/mo)
  → Pay via Stripe
  → Invite agents via email → they join the brokerage account
  → Each agent creates their own open houses under the brokerage umbrella
  → Managing broker sees: all open houses, all leads, all agents — one dashboard
  → Lead routing: leads auto-assigned to the listing agent
```

**What's automated:** Account creation, open house setup, QR generation, check-in, lead capture, attendee export, AI follow-up drafts, brokerage management.

**What's NOT automated:** Nothing. Even brokerage onboarding is self-service. The realtor world is used to signing up for tools online.

---

### Stream 8: City Intelligence Data — Automation

**This is the one exception.** Data products are harder to fully automate because:
- Custom reports require understanding what the buyer actually wants
- Data quality depends on GL365 having 50K+ users (not there yet)
- Government/enterprise buyers expect a conversation

**But the templated reports CAN be automated:**
```
GL365 Data Portal (separate product page: /data or /intelligence)
  → Browse available report templates:
    - "Neighborhood Foot Traffic Report" ($299)
    - "Restaurant & Nightlife Trends" ($299)
    - "Seasonal Event Impact Analysis" ($799)
    - "Franchise Site Selection Report" ($999)
  → Select report → pick neighborhood/city/region
  → Pay via Stripe
  → System auto-generates report from aggregated anonymized data
  → PDF + interactive dashboard delivered to buyer's email
  → Report uses pre-built SQL queries + AI narrative generation
  → No human at GL365 writes anything — it's all templated
```

**Ongoing subscriptions (automated):**
```
Buyer → "Subscribe to Monthly Dashboard" ($499/mo)
  → Stripe subscription
  → Dashboard auto-refreshes with new data each month
  → Automated email: "Your February City Intelligence report is ready"
  → Buyer logs into their dashboard anytime
```

**Custom reports ($999+) — semi-automated:**
```
Buyer submits request via form → describes what they want
  → AI drafts a report scope based on available data
  → GL365 team reviews scope (5 minutes — is this answerable with our data?)
  → If yes: auto-generate report from templates + custom queries
  → If no: reply with "We don't have enough data for this yet"
  → The goal: get to a point where even custom reports are AI-generated
    with minimal human review
```

**What's automated:** Templated reports, subscriptions, dashboards, delivery.

**What's NOT automated (yet):** Custom reports need light human review. API access setup may need a brief onboarding. These are the $999+ products — the unit economics support a quick human touch.

---

### Stream 9: Sponsorship Layer — Automation

**Business side (portal):**
```
Business Portal → "Sponsorships" tab (new)
  → Browse available sponsorship types:
    ┌─────────────────────────────────────────────────┐
    │ 🎲 Game Night Sponsor         $39/mo            │
    │    Your logo + deal on game nights near you      │
    │                                                   │
    │ 🏆 League Sponsor             $79/mo             │
    │    Logo on leaderboards + mention in AI recaps   │
    │                                                   │
    │ 🏅 Tournament Title Sponsor   $149/tournament    │
    │    "The [Your Name] Invitational"                │
    │                                                   │
    │ 📢 Community Hub Sponsor      $199/mo            │
    │    Featured in the community activity feed        │
    │                                                   │
    │ 🗺️ Loop Stop Sponsor          $99/mo             │
    │    AI Scout routes people past your door          │
    │                                                   │
    │ 📦 Full Bundle                $399/mo             │
    │    Everything above — save 40%                    │
    └─────────────────────────────────────────────────┘
  → Select sponsorship → configure:
    - Upload logo (or use one from their listing)
    - Write tagline / deal ("Code GAMENIGHT for 15% off")
    - Set radius (1 mile, 5 miles, city-wide)
    - Set duration (monthly or per-event)
  → Preview how it looks on a game night session / leaderboard / hub
  → Pay via Stripe
  → Sponsorship goes live immediately
  → Dashboard shows: impressions, clicks, deal redemptions
```

**How it displays (automated):**
```
System logic (no human curation):
  → Game Night starts within 5 miles of sponsor's location
  → Sponsor's logo + deal auto-inserted on the session page
  → AI recap mentions: "Tonight's Game Night sponsored by Tony's Pizza"
  → If league sponsor: logo auto-placed on leaderboard component
  → If tournament sponsor: tournament name auto-prefixed
  → Content policy: automated check (no profanity, no competitor logos)
  → No manual approval queue — goes live on purchase
```

**What's automated:** Browsing, purchasing, configuration, display logic, impression tracking, deal redemptions, billing.

**What's NOT automated:** Nothing. The full bundle at $399/mo is still self-service. Business owners don't need a sales call for $399 — they need a preview of what their sponsorship looks like.

---

### The Self-Service Principle — One Portal, Every Product

The key to making all of this automated is that **every B2B product is a tab in the same Business Portal they already use:**

```
Business Portal (existing, 8 pages)
  ├── Dashboard ✅ (live)
  ├── Listing Editor ✅ (live)
  ├── Photos ✅ (live)
  ├── Hours ✅ (live)
  ├── Menu ✅ (live)
  ├── Stats ✅ (live)
  ├── Settings ✅ (live)
  ├── Upgrade ✅ (live)
  │
  ├── Loyalty Program (NEW — Stream 3)
  ├── Sponsorships (NEW — Stream 9)
  ├── Challenges (NEW — Stream 1)
  ├── Events (NEW — Stream 2)
  └── Data & Reports (NEW — Stream 8, admin-only)
```

For B2C products (Creator Marketplace, Neighborhood Groups, Event Check-In, League Commissioner), the consumer/organizer gets their own dashboard page:

```
Consumer Account (/account)
  ├── Identity Passport ✅ (planned)
  ├── My Groups ✅ (planned)
  ├── My Family ✅ (planned)
  ├── My Game Nights ✅ (planned)
  │
  ├── My Loyalty Cards (NEW — Stream 3 consumer view)
  ├── My Challenges (NEW — Stream 1 consumer view)
  ├── My Events (NEW — Stream 2 organizer view)
  ├── My Leagues (NEW — Stream 6 commissioner view)
  ├── My Listings (NEW — Stream 4 creator view)
  ├── My Open Houses (NEW — Stream 7 realtor view)
  └── My Neighborhood (NEW — Stream 5)
```

**No new apps. No separate logins. No separate billing systems.** Everything is a feature inside the platform they're already using. One Stripe customer ID per user. One portal. One login.

---

### Automation Summary — All 9 Streams

| # | Stream | Fully Automated? | Human Touch Needed? |
|---|---|---|---|
| 1 | City Passport Challenges | YES | Tourism board campaigns ($799) may want a call |
| 2 | Event Check-In | YES | None — 100% self-service |
| 3 | Loyalty Program | YES | None — toggle on, configure, done |
| 4 | Creator Marketplace | YES | None — sign up, build profile, receive leads |
| 5 | Neighborhood Safety | YES | Resident verification V1 = self-attestation |
| 6 | Rec League & Parks | MOSTLY | City-wide Parks deals ($999+) need a demo call |
| 7 | Real Estate Open House | YES | None — realtors are used to self-service tools |
| 8 | City Intelligence Data | MOSTLY | Custom reports ($999+) need light review. Templates are auto |
| 9 | Sponsorship Layer | YES | None — browse, preview, buy, live |

**7 out of 9 are 100% automated.** The other 2 only need human touch for their highest-tier products ($999+), and even those are automated once the deal is closed.

### Current Revenue Streams (Phase 1, Live Now)

| Stream | Price Range | Year 1 Realistic | Year 2 Growth |
|---|---|---|---|
| Directory Free | $0 | $0 (user acquisition) | $0 |
| Directory Pro | $45/mo | 100 businesses × $45 = $54K/yr | 300 × $45 = $162K/yr |
| Directory Premium | $89/mo | 40 businesses × $89 = $42.7K/yr | 120 × $89 = $128K/yr |
| Consumer Plus | $4.99/mo | 200 users × $4.99 = $12K/yr | 1,000 × $4.99 = $60K/yr |
| Consumer Pro | $9.99/mo | 50 users × $9.99 = $6K/yr | 300 × $9.99 = $36K/yr |
| Marketplace Add-ons | $19-$150 | ~$18K/yr | ~$60K/yr |
| **Subtotal** | | **~$133K/yr** | **~$446K/yr** |

### Phase 2-3 Revenue Streams (6-18 months)

| Stream | Price Range | Year 1 After Launch | Year 2 Growth |
|---|---|---|---|
| League Commissioners | $99-$228/season | 30 leagues = $20K/yr | 150 leagues = $95K/yr |
| Game Night (Free tier, drives upgrades) | $0 | $0 (funnel) | $0 (funnel) |
| Loyalty Program add-on | $15-$49/mo | 50 businesses × $25 avg = $15K/yr | 200 × $35 avg = $84K/yr |
| Event Check-In | $19-$79/event | 100 events × $35 avg = $3.5K/yr | 500 events + 20 monthly = $34K/yr |
| Sponsorship Layer | $39-$399/mo | 20 sponsors × $79 avg = $19K/yr | 80 × $149 avg = $143K/yr |
| **Subtotal** | | **~$58K/yr** | **~$356K/yr** |

### Phase 3.5-4 Revenue Streams (18-36 months)

| Stream | Price Range | Year 1 After Launch | Year 2 Growth |
|---|---|---|---|
| Game Maker Partnerships | $500-$10K+/mo | 10 Premium + 3 Pro = $132K/yr | 30P + 10Pro + 2Ent = $660K/yr |
| Creator Marketplace | $25-$89/mo | 75 creators × $30 avg = $27K/yr | 300 × $45 avg = $162K/yr |
| Real Estate Check-In | $15-$499/mo | 20 agents × $49 avg = $12K/yr | 80 agents + 5 brokerages = $86K/yr |
| City Passport Challenges | $79-$349/campaign | 30 challenges = $5K/yr | 150 challenges = $30K/yr |
| **Subtotal** | | **~$176K/yr** | **~$938K/yr** |

### Phase 5+ Revenue Streams (36+ months, requires scale)

| Stream | Price Range | Year 1 After Launch | Year 2 Growth |
|---|---|---|---|
| Parks & Rec Departments | $199-$2,499/mo | 3 facilities × $199 = $7K/yr | 2 cities × $999 = $24K/yr |
| Neighborhood Safety (Verified) | $2.99/mo/household | 200 households = $7.2K/yr | 2,000 households = $72K/yr |
| City Intelligence Data Products | $299-$4,999 | 5 reports = $3K/yr | $499/mo sub × 5 + reports = $42K/yr |
| **Subtotal** | | **~$17K/yr** | **~$138K/yr** |

### Total Revenue Trajectory

```
                    Year 1        Year 2        Year 3 (projected)
                    ──────        ──────        ──────────────────
Current streams     $133K         $446K         $650K
Phase 2-3           $58K          $356K         $550K
Phase 3.5-4         $176K         $938K         $1.5M
Phase 5+            $17K          $138K         $400K
                    ──────        ──────        ──────
TOTAL               $384K         $1.88M        $3.1M
```

**Key assumptions:**
- Single metro area (Tampa Bay) in Year 1
- Second metro expansion begins Year 2
- Established pricing kicks in ~Month 18 (increases all numbers ~60-100%)
- Game Night is free and acts as the primary user acquisition funnel
- Every feature feeds the directory. The directory feeds everything else.

**The price increase justification story:**
1. Launch: "We're new, try us cheap"
2. 6 months: "Here's the data proving your ROI"
3. 12 months: "Price goes up for new customers, you're locked at launch rate for 6 more months"
4. 18 months: "Everyone's at established pricing now — and here's the 3 new features that make it worth it"

This is the standard SaaS playbook. Grandfather early adopters, prove value, then raise prices with new features as the justification.

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
- [ ] "Previously On..." AI opener for returning groups
- [ ] Public shareable recap pages (`/recap/[id]`) with privacy enforcement
- [ ] Family member stats page (`/account/family/[memberId]`)
- [ ] Per-child privacy toggles in account settings
- [ ] XP system + leveling (`player_xp` table)
- [ ] Achievement badges — context-aware, surprise discovery (`player_achievements`)
- [ ] Live AI Commentary during score entry ("The Color Commentator")
- [ ] Predictions — pick the winner before each game for bonus XP
- [ ] Rivalry tracking between players and groups (`rivalries` table)
- [ ] Streak system (weekly streaks, rivalry records, monthly MVPs)
- [ ] Game Night Score (group health metric)
- [ ] **TV/Cast Mode** (`/game-night/[id]/tv`) — full-screen scoreboard for big screens
  - [ ] WebSocket sync: phone controls → server → TV display
  - [ ] 10ft UI: giant scores, player avatars, high-contrast dark theme
  - [ ] Sound effects via Web Audio API (score ding, lead change horn, achievement unlock)
  - [ ] Turn timer with visual countdown and escalating tick sound
  - [ ] "Previously On..." cinematic opener on TV
  - [ ] Live AI commentary scrolling ticker
  - [ ] Between-game intermission screen (results, MVP, fun stats)
  - [ ] Evening recap display with trading card reveals
  - [ ] Auto-dim for screen burn prevention
  - [ ] No auth on TV — session-scoped access token in URL
- [ ] **Community Hub** (`/community`) — public game night activity center
  - [ ] City leaderboard — top groups by Game Night Score
  - [ ] Activity feed — real-time events from opted-in groups
  - [ ] Rising stars, rivalry of the week, tournament corner
  - [ ] Community visibility opt-in for groups (private/leaderboard/public)
- [ ] **Community Leaderboards** (`/community/leaderboards`) — filtered views (monthly, all-time, by game)
- [ ] **Public Group Pages** (`/community/groups/[slug]`) — shareable group profiles for opted-in groups

### Phase 2.75: Gamification Polish
- [ ] Game Night Modifiers / Spice Wheel (optional twists before each game)
- [ ] Digital Trading Cards for MVP of each session
- [ ] Seasonal Events (Harvest Tournament, Holiday Championship, etc.)
- [ ] Seasonal leaderboard resets with special badges
- [ ] Card collection gallery on player profiles
- [ ] Rivalry narrative generation (AI-written sports journalist style)
- [ ] Community rivalries page (`/community/rivalries`)
- [ ] Scorecard photo scanning — Gemini Vision best-effort parsing for any game
- [ ] User correction training loop — corrections improve future accuracy per game

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
- [ ] Community Hall of Fame (`/community/hall-of-fame`) — all-time records, legendary moments

### Phase 3.5: Game Maker Partnerships & Scorecard Intelligence
- [ ] Partner registration system (`partners` table)
- [ ] Partner API endpoints (register games, get anonymized play data)
- [ ] QR code scanning — scan game box QR to auto-detect and load game template
- [ ] Official scorecard format integration — AI knows exact layout for partner games
- [ ] Game-specific stats schemas (Monopoly properties, Scrabble word scores, etc.)
- [ ] Partner branding on scoring experience (logo, colors)
- [ ] Partner analytics dashboard (play counts, city distribution, trending data)
- [ ] Scorecard recognition training pipeline — community corrections improve accuracy
- [ ] Featured game placement in Game Library for Premium/Enterprise partners

### Phase 3.75: Platform Revenue Expansion
- [ ] **Loyalty Program Engine**
  - [ ] `loyalty_programs` table (business_id, reward tiers, visit thresholds)
  - [ ] `loyalty_visits` table (user_id, business_id, visited_at, qr_scan_id)
  - [ ] `loyalty_rewards` table (earned rewards, redeemed status, expiry)
  - [ ] QR scan → loyalty visit auto-logging (extends existing Blast Deals QR)
  - [ ] Business portal: create/manage loyalty program
  - [ ] Consumer view: loyalty card in Identity Passport, progress bars
  - [ ] Push notification: "1 more visit until your free coffee!"
  - [ ] Pricing integration: Basic ($15/mo), Standard ($29/mo), Premium ($49/mo)
  - [ ] Include Basic loyalty free in Directory Premium ($89/mo) tier
- [ ] **Sponsorship Layer**
  - [ ] `sponsorships` table (business_id, type, target, start/end, amount)
  - [ ] Sponsor display component (logo + deal, context-aware placement)
  - [ ] Game Night sponsor: show sponsor on session pages within radius
  - [ ] League sponsor: logo on leaderboard + mention in AI recaps
  - [ ] Tournament title sponsor: branded tournament pages
  - [ ] Community hub sponsor: featured in activity feed
  - [ ] Business portal: browse & purchase sponsorship packages
  - [ ] Pricing: Game Night ($39/mo), League ($79/mo), Tournament ($149/event), Hub ($199/mo), Bundle ($399/mo)
- [ ] **Event Check-In System**
  - [ ] Session type: 'event' with attendee capacity tiers
  - [ ] Event creation page (`/events/new`) — name, date, venue, capacity
  - [ ] Event QR code generation (scan to check in)
  - [ ] Real-time headcount dashboard for organizers
  - [ ] Attendee list export (CSV, PDF)
  - [ ] Post-event AI recap generation
  - [ ] Pricing: Single ($19-$79/event by size), Monthly ($69/mo), Annual ($549/yr)
- [ ] **City Passport Challenges**
  - [ ] `challenges` table (name, type, stops, sponsor, reward)
  - [ ] `challenge_progress` table (user_id, challenge_id, stops_completed)
  - [ ] Challenge creation flow (multi-stop, single-category or mixed)
  - [ ] Consumer challenge browser + progress tracker
  - [ ] QR scan at each stop → auto-progress update
  - [ ] Badge/XP reward on challenge completion
  - [ ] Business portal: sponsor a challenge ($99/challenge launch price)
  - [ ] Featured challenges on community hub

### Phase 4: Loops MVP
- [ ] Loop template creator
- [ ] Fog of War map component
- [ ] QR check-in at venues
- [ ] Self-healing route logic (weather/traffic)
- [ ] AI-generated loop recap
- [ ] Loop stop sponsorship integration ($99/mo per sponsored stop)

### Phase 4.5: Creator Marketplace & Real Estate
- [ ] **Creator & Services Marketplace**
  - [ ] Extended directory profile for gig/artisan categories: portfolio, booking calendar
  - [ ] "Request a Quote" flow → CRM lead capture
  - [ ] Creator Pro features ($25/mo): up to 20 portfolio items, booking calendar
  - [ ] Creator Premium features ($45/mo): AI profile writing, featured search placement
  - [ ] Lead fee tracking ($2/lead at launch)
- [ ] **Real Estate Open House Check-In**
  - [ ] Session type: 'open_house' with realtor-specific fields
  - [ ] Open house QR code generation
  - [ ] Attendee capture with contact info
  - [ ] AI follow-up email draft generation ($5/event add-on)
  - [ ] Agent dashboard: all open houses, lead lists, export
  - [ ] Brokerage accounts: multi-agent management ($199/mo up to 10 agents)

### Phase 5: Community Layer & Neighborhoods
- [ ] Community Badge for non-profits
- [ ] Public resource data connectors (Parks API, Transit API)
- [ ] Volunteer matching via Scout Agent
- [ ] Civic Loops (History, Volunteer, Support Local)
- [ ] **Neighborhood Safety & Community Groups**
  - [ ] Neighborhood group type with location/boundary definition
  - [ ] Safety alert posting (suspicious activity, lost pets, weather)
  - [ ] Verified Neighborhood tier ($2.99/mo/household): admin tools, resident verification
  - [ ] HOA/Property Management integration ($49/mo): bulk management, announcements, surveys
  - [ ] Sponsored safety features ($199/mo): brand placement on safety tools

### Phase 5.5: Civic & Government Partnerships
- [ ] **Parks & Rec Scheduling**
  - [ ] Facility/court booking system (calendar, time slots, capacity)
  - [ ] Rec league signup integration (extends existing league system)
  - [ ] Public recreation portal (embeddable widget for .gov sites)
  - [ ] Single facility tier ($199/mo), City-wide tier ($999/mo)
- [ ] **City Intelligence Data Products**
  - [ ] Anonymized data aggregation pipeline (privacy-first, no PII)
  - [ ] Standard city report template (neighborhood foot traffic, activity trends)
  - [ ] Custom analytics query builder (internal tool for generating reports)
  - [ ] Ongoing dashboard subscription product ($499/mo)
  - [ ] Tourism board seasonal impact reports ($799/quarter)
  - [ ] API access for enterprise data consumers ($1,499/mo)
  - [ ] **Requires 50K+ active users before selling** — data must be meaningful

---

*Last updated: 2026-02-27*
