# GL365 Badge & Consumer Platform Specification
> Canonical source of truth — March 2026
> See also: `docs/specs/pricing.md` for tier pricing

---

## Overview

GL365 has two parallel badge systems and a consumer engagement platform:

1. **Business Badges (Track 1)** — Earned through QR feedback, reviews, and sentiment scores
2. **Community Poll Badges (Track 2)** — Awarded by GL365 through community voting
3. **Consumer Accounts** — Verified profiles that power reviews, votes, and gamification

---

## 1. Consumer Account System

### 1.1 Auth Methods
| Method | Email Verified? | Notes |
|--------|----------------|-------|
| Email/password | Manual verification required | Verification email sent on signup |
| Google OAuth | Auto-verified | One-click, lowest friction |
| Apple Sign-In | Auto-verified | iOS users, privacy-forward |

### 1.2 Access Rules
| Action | Account Required? |
|--------|------------------|
| Browse directory | No |
| View listings | No |
| View polls | No |
| Leave a review | **Yes (verified email)** |
| Vote in a poll | **Yes (verified email)** |
| Claim blast deals | **Yes (verified email)** |
| Earn consumer points | **Yes (verified email)** |

### 1.3 Consumer Profile Fields
| Field | Required | Notes |
|-------|----------|-------|
| email | Yes | Must be verified |
| full_name | Yes | For display on reviews |
| display_name | Optional | Public-facing alias |
| avatar_url | Optional | Profile picture |
| city | Recommended | Local polls, "near me" |
| state | Recommended | Location context |
| zip_code | Recommended | Granular location |
| phone | Optional | Deal redemption SMS |

### 1.4 Consumer Permissions
| Permission | Required | Purpose |
|-----------|----------|---------|
| Email (verified) | Yes | Account identity |
| Name | Yes | Review attribution |
| City/Zip | Recommended | Local polls, leaderboards |
| GPS Location | Optional | Verified-location reviews (higher trust weight) |
| Push notifications | Optional | New polls, deal alerts |
| Marketing emails | Optional | GL365 newsletters |

### 1.5 Consumer Settings
- Profile editing (name, display name, avatar, city/zip)
- Notification preferences: poll alerts, deal alerts, marketing
- Privacy: show/hide reviews, badges, leaderboard presence
- Connected accounts (Google, Apple)
- Account deletion

### 1.6 Consumer Pages
| Route | Purpose |
|-------|---------|
| `/join` | Consumer signup (email, Google, Apple) |
| `/account` | Profile dashboard |
| `/account/settings` | Settings + privacy |
| `/reviewer/[id]` | Public reviewer profile |

---

## 2. Business Badges — Track 1 (QR/Review-Earned)

### 2.1 How Badges Are Earned

Badges are earned through **verified customer feedback**:

1. Customer scans QR code at business → lands on feedback form
2. Customer must be logged in (consumer account) to submit
3. Feedback form is **industry-matched** (restaurant gets dining questions, plumber gets service questions)
4. Submission writes to `sentiment_logs` table
5. Database trigger auto-recalculates badge progress
6. When thresholds met → badge auto-awarded

### 2.2 Badge Display Rules
| Tier | Display |
|------|---------|
| Free | ALL badges grayed out with padlock + "Upgrade to earn badges" CTA |
| Pro | Badges visible, grayed out + "Upgrade to Premium to earn" |
| Premium | Full badge earning — earned badges glow, unearned badges grayed |

### 2.3 Badge Decay
- **90-day rolling window** — recent reviews weighted heavier
- No fresh positive feedback → badge fades to grayscale
- **30-day warning** notification before badge expires
- Scheduled function runs decay checks daily

### 2.4 Industry-Specific Badge Library

#### Universal Badges (All Industries)
| Key | Label | Required Scans | Required Sentiment % | Category |
|-----|-------|---------------|---------------------|----------|
| legendary_service | Legendary Service | 50 | 90% | service |
| fair_pricing | Fair Pricing | 40 | 85% | value |
| clean_space | Clean Space | 50 | 90% | cleanliness |
| community_favorite | Community Favorite | 100 | 80% | community |
| network_leader | Network Leader | 200 | 95% | leadership |
| eco_friendly | Eco Friendly | 30 | 85% | sustainability |

#### Dining (`dining`)
| Key | Label | Scans | Sentiment | Notes |
|-----|-------|-------|-----------|-------|
| sparkling_restrooms | Sparkling Restrooms | 30 | 85% | Also: health-wellness, style-shopping |
| expert_baristas | Expert Baristas | 30 | 90% | Cafes & bakeries subcategory |
| great_ambiance | Great Ambiance | 40 | 85% | Also: nightlife, style-shopping |
| fresh_delicious | Fresh & Delicious | 40 | 90% | |
| speedy_service | Speedy Service | 30 | 85% | |

#### Home Services (`services`)
| Key | Label | Scans | Sentiment | Subcategories |
|-----|-------|-------|-----------|--------------|
| fast_response | Fast Response | 30 | 90% | plumbing, electrical, hvac, roofing |
| safety_first | Safety First | 1 | 100% | electrical, plumbing, roofing (pro stamp) |
| verified_air | Verified Air | 1 | 100% | hvac (pro stamp) |
| clean_worker | Clean Worker | 30 | 85% | All trades |
| on_time_pro | On-Time Pro | 40 | 90% | All trades |
| transparent_quotes | Transparent Quotes | 30 | 85% | All trades |

#### Automotive (`automotive`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| honest_mechanic | Honest Mechanic | 40 | 90% |
| quick_turnaround | Quick Turnaround | 30 | 85% |
| fair_estimate | Fair Estimate | 30 | 85% |

#### Health & Wellness (`health-wellness`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| caring_staff | Caring Staff | 40 | 90% |
| comfortable_facility | Comfortable Facility | 30 | 85% |
| easy_booking | Easy Booking | 30 | 85% |

#### Professional Services (`professional-services`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| clear_communicator | Clear Communicator | 40 | 90% |
| results_driven | Results Driven | 30 | 90% |
| trustworthy_advisor | Trustworthy Advisor | 50 | 95% |

#### Style & Shopping (`style-shopping`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| talented_stylist | Talented Stylist | 30 | 90% |
| welcoming_vibe | Welcoming Vibe | 30 | 85% |

#### Pets (`pets`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| pet_whisperer | Pet Whisperer | 30 | 90% |
| gentle_handling | Gentle Handling | 30 | 90% |

#### Education (`education`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| patient_educator | Patient Educator | 30 | 90% |
| safe_environment | Safe Environment | 30 | 90% |

#### Marine & Outdoor (`marine-outdoor`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| skilled_captain | Skilled Captain | 30 | 90% |
| well_maintained_gear | Well-Maintained Gear | 30 | 85% |

#### Mobile Services (`mobile-services`)
| Key | Label | Scans | Sentiment |
|-----|-------|-------|-----------|
| reliable_arrival | Reliable Arrival | 30 | 90% |
| mobile_ready | Mobile Ready | 30 | 85% |

### 2.5 Industry Vocabulary Bridge

The `badge_library.applicable_industries` field uses **directory category slugs** (e.g., `dining`, `services`, `automotive`) plus optional **subcategory keywords** for granular matching.

Matching logic:
1. If `applicable_industries` is empty → badge is universal (all industries)
2. If listing's `industry` slug is in `applicable_industries` → eligible
3. For subcategory-specific badges, also check listing's `subcategories` array

### 2.6 Business Owner Badge Selection

- Premium tier businesses select up to **5 active badge goals** in their portal
- Portal shows all badges available for their industry
- Progress bar shows current scans / required scans and sentiment %
- Owners can swap goals (deactivate one, activate another)
- **Enforced in database**: max 5 active goals per listing

---

## 3. Community Poll Badges — Track 2 (GL365-Awarded)

### 3.1 How Poll Badges Work

1. GL365 creates community polls on the landing page ("Best Plumber in Tampa 2026")
2. **Verified consumers** vote (one vote per person per poll)
3. When GL365 closes the poll, the winner **automatically receives a custom badge**
4. Badge displays on the winner's listing page under "Community Awards"

### 3.2 Poll Recurrence
| Type | Frequency | Example |
|------|-----------|---------|
| one-time | Never repeats | "Best New Restaurant 2026" |
| quarterly | Every 3 months | "Best HVAC Service Q1 2026" |
| yearly | Once per year | "Best Plumber in Tampa 2026" |

### 3.3 Win History & Streaks
- Every poll win is recorded in `poll_winners` table
- Consecutive wins on recurring polls tracked as streaks
- Streak labels auto-generated: "2 Years Running", "3 Years Running", etc.
- Historical badges remain on listings as a permanent trophy case

### 3.4 Poll Badge Display
- Separate section from QR badges: **"Community Awards"**
- Gold trophy icon + poll title + year
- Streak indicator with flame icon if applicable
- Links to poll results page

### 3.5 Badge Label Templates
Polls define a `badge_label_template` that generates the badge text:
- `"Best {category} in {destination} {year}"` → "Best Plumber in Tampa 2026"
- `"Voted #1 {category} {year}"` → "Voted #1 Restaurant 2026"

---

## 4. Consumer Gamification

### 4.1 Points System
| Action | Points | Daily Limit |
|--------|--------|-------------|
| Verify email | 50 | Once |
| Complete profile (all fields) | 25 | Once |
| Leave a review | 10 | 5/day |
| Review with photo | 15 | 5/day |
| Vote in community poll | 5 | 1/poll |
| GPS-verified review | +5 bonus | — |
| First review in new category | +10 bonus | 10 categories max |
| Daily login streak (7+ days) | +5/day | — |

### 4.2 Reviewer Levels
| Level | Points Required |
|-------|----------------|
| Newcomer | 0 |
| Regular | 100 |
| Trusted | 500 |
| Expert | 1,500 |
| Legend | 5,000 |

### 4.3 Consumer Badges
| Key | Label | Requirement |
|-----|-------|-------------|
| first_review | First Review | Submit 1 review |
| local_explorer | Local Explorer | Review businesses in 3+ categories |
| neighborhood_expert | Neighborhood Expert | 10+ reviews in same city |
| trusted_reviewer | Trusted Reviewer | 25+ reviews |
| poll_enthusiast | Poll Enthusiast | Vote in 10+ polls |
| streak_master | Streak Master | 30-day login streak |
| category_specialist | Category Specialist | 10+ reviews in one category |
| founding_reviewer | Founding Reviewer | Among first 500 consumer accounts |

### 4.4 Leaderboard
- **Page**: `/community/leaderboard`
- **Filters**: By city, by category, all-time, this month
- **Columns**: Rank, display name, avatar, points, badge count, review count
- **Privacy**: Only consumers who opt in via `privacy_settings.show_leaderboard`
- **Refresh**: Calculated on page load from `consumer_accounts` + `consumer_points_log`

---

## 5. QR Feedback Pipeline

### 5.1 Flow
1. Business generates QR code (type: `feedback`) from portal
2. Customer scans QR → lands on `/scan/feedback/[listingId]`
3. Page shows industry-matched feedback form (from `poll-templates.ts`)
4. If not logged in → prompt to sign up / sign in
5. Consumer submits form → writes to `sentiment_logs`
6. DB trigger `update_goal_progress()` recalculates badge progress
7. If threshold met → badge auto-created in `directory_badges`
8. Consumer earns points (10 base + 5 GPS bonus if applicable)

### 5.2 Feedback Form Structure
Forms are industry-specific (7 templates in `lib/poll-templates.ts`):
- **Restaurant**: Food quality, service speed, recommend?, favorite thing, comment
- **Services**: Work quality, on time?, pricing fair?, hire again?, comment
- **Nightlife**: Atmosphere, crowd, come back?, best thing, comment
- **Wellness**: Cleanliness, staff professionalism, booking ease, recommend?, comment
- **Hospitality**: Room rating, check-in, location, stay again?, comment
- **General**: Overall experience, customer service, easy to find?, use again?, comment
- **Cleanliness**: Restroom, maintenance, supplies stocked?, affect return?, comment

### 5.3 Dual-Write Bridge
When feedback is submitted through `/api/directory/feedback`:
- Write to `directory_feedback` (existing, for public review display)
- Write to `sentiment_logs` (badge engine, triggers progress calculation)
- This ensures both systems stay in sync without deprecating either table

---

## 6. Database Schema Summary

### New Tables
| Table | Purpose |
|-------|---------|
| `consumer_accounts` | Verified consumer profiles tied to auth.users |
| `consumer_points_log` | Points transaction history |
| `consumer_badges` | Consumer achievement badges |
| `poll_winners` | Poll win history + streak tracking |

### Extended Tables
| Table | New Columns |
|-------|------------|
| `community_polls` | recurrence, badge_label_template, badge_color, badge_icon, edition_number, parent_poll_id |
| `badge_library` | Updated applicable_industries to use directory slugs |

### New Badges Added to `badge_library`
18 new industry-specific badges (see Section 2.4) bringing total from 12 to 30.

---

## 7. GreenLine365 Seal of Approval

The **ultimate authority marker** (from OPERATIONAL_BIBLE_V2):
- Requires completion of industry-specific badge matrix
- Elite carousel with featured placement
- **Zero tolerance**: one decayed badge = instant seal revocation
- Implementation: future phase after badge system is live and proven

---

## Changelog
| Date | Change |
|------|--------|
| 2026-03-11 | Initial spec created — consolidates badge system, consumer accounts, gamification |
