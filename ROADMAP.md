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

| Tier | Price | What They Get |
|---|---|---|
| Basic | Free | Game in library, community QR support, basic analytics |
| Premium | $500/mo | Official scorecard format, featured placement, full analytics |
| Enterprise | Custom | Co-branded experience, exclusive promotions, API access |

This is a **long-term play**. Build the scanning and template infrastructure now. Partnerships come when GL365 has critical mass.

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
