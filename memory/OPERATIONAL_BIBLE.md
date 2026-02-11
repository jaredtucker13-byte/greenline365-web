# Greenline365 Operational Bible
## Version 2.0 | Core Philosophy: The Address-Centric Truth Layer

---

## I. THE PROPERTY INTELLIGENCE ENGINE (THE MOAT)

The core value is the **Property Passport** — a "Carfax for Homes" tracking a property's history from construction to resale.

### 1. The Lightweight Property Portal
- **No-Login Access**: Every property has a unique hash-based URL (e.g., `greenline365.com/p/xh82j`) accessible via physical QR code on-site
- **"Day One" Construction**: Builders log assets (HVAC, Electrical, Plumbing) before drywall
  - **Pre-Drywall Checklist**: Mandatory photo uploads of "hidden" infrastructure + AI-parsed serial numbers for all major equipment
- **Multi-User Relationship Map**: Primary Owner can link Spouses, Tenants, or Property Managers. AI Receptionist recognizes each caller by name and role

### 2. The Incident & Clearance Protocol
- **Tiered Authority**: Technicians/Tenants can report incidents, but only **Command-Level Managers** can officially "Clear" them after reviewing photo/video proof
- **Clean Bill of Health (CBoH)**: Verified document issued when all incidents are cleared — used by homeowners to increase property value during sale

---

## II. THE REPUTATION & BADGE SYSTEM

A psychological and gamified directory where badges must be **earned** through sentiment, not just purchased.

### 1. Earned vs. Integrated Badges
- **Integrated** ("Intelligence Verified" Badge): Unlocked automatically for businesses on Command Tier
- **Earned** (Poll-to-Badge Loop):
  - QR Trigger Points: "Mirror" QR (Cleanliness), "Front Door" QR (Vibe), "Invoice" QR (Expertise)
  - Industry Logic: Home services aren't rated on "bathroom cleanliness" — AI assigns badge requirements based on industry bucket

### 2. The "Negative Light" & Badge Decay
- **Ghost States**: Free Tier shows all 7 badges as Grayscale with Padlock icon. Clicking triggers paywall
- **Time-Weighted Decay**: Recent reviews carry more weight. If business stops collecting feedback, badges gray out again
- **Reputation Incidents**: Negative feedback triggers automated incident that "Freezes" badge progress until manager clears it

### 3. The Badge Threshold Table

| Badge Name | Category | Threshold | How it's Earned |
|---|---|---|---|
| Intelligence Verified | Service / Destinations | Subscription-Based | Activated immediately upon purchasing Intelligence Layer |
| Spotless Pro | Dining / Nightlife / Health | 50+ Polls (Avg 4.7) | Earned via "Mirror" QR code (Cleanliness Poll) |
| Local Vibe Elite | Ent. / Dining / Nightlife | 100+ Polls (Avg 4.8) | Earned via "Front Door" QR code (Atmosphere Poll) |
| Master Technician | Services | 25+ Resolution Reports | Earned via Command-Level "Clearance" of incident reports |

### 4. The Poll Template Engine (Higher-Tier Feature)

**Standard Tier**: General "How was your experience?" polls
**Command Tier**: Industry-specific templates designed to trigger specific badges:
- "Spotless" Template: Cleanliness/safety focus (Nightclubs, Daycares)
- "Expert" Template: Technical knowledge focus (HVAC, Electricians)

**"Earned" Logic**:
- **Threshold Scoring**: Requires "Reputation Quotient" (e.g., 25+ positive responses with avg > 4.7/5 in specific category)
- **Automatic Implementation**: Once score hit → Supabase Edge Function triggers webhook → updates business's public JSON → badge "lights up" instantly

### 5. Badge Decay Formula

Time-Weighted Decay ensures only recent performance counts:
- Review from 30 days ago = 100% weight
- Review from 180 days ago = ~20% weight
- **Rolling Window**: Last 90 days for badge eligibility calculation
- **Fall-Off Warning**: 30 days before badge expires → automated SMS: "Your 'Elite Vibe' Badge is at risk. Deploy a new Poll Template now."
- **Badge States**: `ACTIVE` (Color) → `EXPIRING` (Pulsing Yellow) → `LOCKED` (Grayscale/Negative Light)

### 6. Resolution Loop for Negative Feedback

1. **Negative Trigger**: Poll/review below 3-star → AI creates "Reputation Incident"
2. **Impact**: Incident "Freezes" badge progress OR applies penalty to current badge score
3. **Clearance Required**: Command-Level Manager must:
   - Respond via AI Review Responder
   - Mark incident as "Resolved" (Refund issued / Staff retrained / Technical fix verified)
4. **Result**: Negative weight mitigated (stays on record but no longer pulls down Elite calculation)

### 7. The "Grayed-Out" Display Logic

**For Free Tier businesses**:
- All 7 badges always visible, unearned ones at **0.2 opacity** with 🔒 "Locked" icon
- **Click triggers paywall**: "Reputation Locked: This business is not yet collecting [Category] Feedback. Upgrade to Command Tier to unlock Poll Templates."
- **Hover tooltip on directory**: "This business has not yet met the Greenline365 standard for [Category]. [Link: Rate this business to help them earn it]"

**The Psychological Gap**: Free Tier business looks "incomplete" next to Command Tier business with 5 glowing badges → makes free user look like "secondary" choice

---

## III. THE ELITE 365 SEAL OF APPROVAL

The "Grand Badge" — awarded only when 100% of industry-specific badges are active.

### Industry-Specific Requirements

| Industry Bucket | Required Badges | Notes |
|---|---|---|
| Home Services | Intelligence Verified, Master Tech, Local Vibe, Expert Safety, Response Time | Cleanliness excluded — focus on "Property Truth" and reliability |
| Dining & Nightlife | Spotless Pro, Local Vibe Elite, Service 5-Star, Safety Verified, Intelligence Verified | Cleanliness mandatory — focus on "Vibe" and physical environment |
| Entertainment | Safety Verified, Local Vibe, Booking Pro, Intelligence Verified | Focus on user experience and equipment safety |
| Health/Wellness | Spotless Pro, Local Vibe, Expert Safety, Intelligence Verified | Focus on hygiene and professional expertise |

### Seal Benefits
- **Visual Upgrade**: Animated "Greenline 365 Certified" gold-and-green digital wax seal at top of listing
- **Super Featured Placement**: Pinned at absolute top of directory in "Certified Experts" carousel
- **"Verified Authority" Pop-up**: Corner notification on their pages: "Greenline 365 Certified: Met 100% of [Industry] standards"
- **SEO Dominance**: Auto-generated press release/blog post backlinking to boost Google ranking
- **Lower Platform Fees**: 10% subscription discount as "Grand Reward"

### Zero-Tolerance Policy
- Losing ONE badge → instant Seal revocation → dropped from Super Featured list
- **Grace Period**: 48-hour "Code Red" alert before losing Elite status
- Makes subscription feel like "Insurance" for reputation

### Developer Implementation

```javascript
// industry_requirements table
{ industry_id: 1, required_badges: ['intel_verified', 'master_tech', 'vibe', 'safety'] }

// Trigger on every badge earn/decay
const isCertified = required_badges.every(badge => active_badges.includes(badge));
if (isCertified) {
  updateStatus('ELITE_365');
  triggerCelebrationSMS(owner);
}
```

---

## IV. THE DIGITAL INFRASTRUCTURE AUDIT ($400/Audit)

See: `/app/memory/AUDIT_SYSTEM_SPEC.md`

- **Dual-Search**: Google Places API (Public Reputation) + Greenline DB (Market Opportunity)
- **The "Neighbor Effect"**: Even if prospect isn't in DB, properties in their service area likely ARE
- **Compatibility Score**: AI counts open incidents in business's category + geography
- **PDF Generation**: Supabase Edge Function → high-end report with "Missed Revenue" calculator

---

## V. THE UNIFIED MARKETING HUB

See: `/app/memory/MARKETING_DASHBOARD_SPEC.md`

- **Coupon Engine**: Create, distribute, track QR-based deals
- **Content Sync**: Mirror AI-Polished Blogs and SendGrid Newsletters to directory
- **Review Responder**: Brand Voice AI for Google + Directory reviews

---

## VI. DEVELOPER TECHNICAL STACK

| Component | Technology |
|---|---|
| Database | Supabase (PostgreSQL) with Real-Time for live incident alerts |
| Edge Functions | Deno-based for PDF generation and AI analysis |
| AI Engine | GPT-4o Vision (asset parsing) + Perplexity API (web scraping/audits) |
| Communication | Twilio (SMS/Voice) + SendGrid (Email) |
| Geo-Fencing | Automatic mapping of Service Areas to Address-Centric Index |
| Frontend | Next.js (App Router) with Tailwind CSS |
| Deployment | Vercel |

---

## VII. TECHNICAL IMPLEMENTATION REFERENCE

### Badge Widget (Embeddable)
- JS snippet (similar to Trustpilot widget) pulling `badge_status` from API
- CSS: `.badge-active` (Full color) vs `.badge-locked` (Grayscale filter + Opacity)

### Database Columns Needed
- `is_paying_tier` (boolean)
- `sentiment_score_category` (float per category)
- `industry_requirements` table (industry_id → required_badges array)
- `sentiment_feedback` table (poll responses)

### Frontend Logic
```
if (is_paying_tier == false) → grayscale(100%) + pointer-events: trigger-paywall
if (is_paying_tier == true && sentiment_score > threshold) → filter: none + animation: glow
```

### Directory Penalty for Decayed Badges
- Businesses with "Decayed" or "Unresolved" badges automatically ranked below "Active" badge businesses in search results

---

## VIII. THE SALES LOOP SUMMARY

| Tier | What They See | What They Feel | What They Do |
|---|---|---|---|
| Free | 7 grayed-out badges, "Locked" icons | "I look incomplete" | Pay to upgrade |
| Pro | Tools to start earning badges | "I'm building something" | Collect feedback, deploy polls |
| Command | Lit-up badges, Seal potential | "I'm elite, I need to stay here" | Keep subscription active, clear incidents |
| Elite 365 | Gold Seal, Super Featured, SEO boost | "I'm the best in my area" | Defend status, fear losing it |
