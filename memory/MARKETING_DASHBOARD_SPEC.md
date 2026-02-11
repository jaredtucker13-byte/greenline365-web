# Marketing & Reputation Dashboard - Feature Spec
## "The Unified Marketing Command Center"

### Overview
This dashboard gives business owners a "Command Center" view of their entire digital footprint. It integrates real-time feedback from Google with internal Property Intelligence and Content Forge metrics.

---

## 1. Reputation & Sentiment Hub
Monitors the "Pulse" of the business across all platforms.

| Feature | Description |
|---|---|
| Google Maps Integration | Live feed of recent Google reviews with AI "Draft Response" button powered by Brand Voice AI |
| Greenline Directory Reviews | Direct feedback from local users, tracking Cleanliness and Vibe scores |
| Active Badges | Visual display of "Earned" and "Integrated" badges (e.g., Intelligence Verified, Elite Service) |

## 2. Conversion & Lead Engine
Tracks the ROI of automated workflows.

| Feature | Description |
|---|---|
| Coupon Performance | Real-time counter: [Number] Claimed / [Number] Redeemed |
| Booking Activity | Total appointments via AI Booking Agent and directory widgets |
| Intelligence Lead Capture | Counter for new Property Passports created/updated this month |

## 3. The Content Pipeline
"Hands-Free" view of authority-building activities.

| Feature | Description |
|---|---|
| Blog Sync Status | Last 3 blog posts synced from AI Polish engine to directory |
| Newsletter Archive | Preview of most recent SendGrid campaign on public profile |
| Social Schedule | Calendar view of upcoming automated posts for the week |

## 4. Advanced "Property Intelligence" Metrics
Only visible for Command-Tier service providers.

| Feature | Description |
|---|---|
| Incident Resolution Rate | % of technical incidents "Cleared" by managers this month |
| Asset Density | Total high-value units (HVAC, Electrical, etc.) tracked in Address-Centric Index |

---

## Data Flow Architecture

| Feature | Data Source | Frequency |
|---|---|---|
| Reviews | Google Business API + Internal Directory Table | Real-Time Sync |
| Coupons | Internal Promotions Table linked to CRM | Live Tracking |
| Blogs | Supabase Posts table synced via Webhook | Instant on Publish |
| Assets | Property Intelligence Engine Assets table | Monthly Aggregate |

---

## Sub-Features Detail

### Coupon & Deal Engine
- **Creation**: Business owner sets discount, expiration date, usage limit via dashboard
- **Distribution**: Auto-featured on Public Directory Listing + pushed via Campaign Manager (SMS/Email)
- **Redemption**: Unique QR code scanned at POS, data logged to CRM for ROI tracking

### Content Sync (Blogs & Newsletters)
- **Blog Sync**: AI Polish Blog Engine "Auto-Publish" to directory "Latest News" section
- **Newsletter Archive**: SendGrid integration scrapes HTML of sent newsletter, posts as community update
- **Social Mirroring**: Social Media Scheduling posts mirrored onto directory listing

### Review Monitoring & Google API
- **Direct Directory Reviews**: Users leave reviews on GL365 listing, contributing to Earned badges (Vibe, Cleanliness)
- **Google Maps API Integration**: Pulls all Google reviews into GL365 CRM
- **Centralized Monitoring**: All reviews (Google + Directory) in one Analytics Dashboard
- **AI Reputation Management**: Brand Voice AI auto-drafts professional responses, owner clicks "Approve & Post"

---

## Capabilities Summary

| Feature | Capability |
|---|---|
| Inbound | AI Receptionist captures calls; Directory Listing captures search traffic |
| Retention | Property Intelligence remembers every asset; Reviews build long-term trust |
| Growth | Coupon Engine drives new leads; Campaign Manager (SMS/Email) nurtures existing |
| Authority | AI Content Forge and Blog Sync keep business relevant and "Local-Elite" |

---

## Sales Value
Shows business owners they no longer need five different logins for marketing. Everything—from Google reputation to property data—is managed in one place by Greenline365.

## Implementation Dependencies
- Google Business Profile API
- Twilio (SMS)
- SendGrid (Email campaigns)
- Supabase (Posts, Promotions, CRM tables)
- Brand Voice AI (Content generation)
- Property Intelligence Engine
