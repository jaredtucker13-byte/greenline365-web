# Trust Network Roadmap
## GL365 Badge & Reputation Embed System

**Last Updated:** February 21, 2026

---

## DONE

### Database Audit (Feb 21, 2026)
- [x] Deep codebase audit — discovered `directory_badges` and `payment_transactions` tables already existed
- [x] Created migration `032_payment_events.sql`
- [x] Ran migration 032 in Supabase production
- [x] Updated `schema.sql` with `payment_events` block

### Trust Network Phase 1 — Badge API & Embed Engine (Feb 21, 2026)
4 files, 415 lines:
- [x] `webapp/app/api/badges/[partnerId]/route.ts` — Public badge JSON API (CORS, 5min CDN cache, slug/UUID lookup, queries directory_listings + directory_badges + businesses)
- [x] `webapp/app/api/badges/[partnerId]/embed/route.ts` — HTML embed snippet endpoint (3 styles: default, minimal, compact)
- [x] `webapp/public/badge.js` — Zero-dep vanilla JS badge renderer (IntersectionObserver lazy load, XHR cross-origin, star ratings, badge pills, hover tooltip, click-to-booking, grayscale when inactive)
- [x] `webapp/app/api/badges/route.ts` — Authenticated internal badge API for portal snippet generator UI
- [x] Subscription-aware gating — badges marked `badgeStatus: "inactive"` when business tier = free
- [x] Inactive visual treatment — grayscale + 50% opacity + pointer-events disabled via CSS

---

## IN PROGRESS

### Review Widget
- [ ] Extend `/api/directory/reviews` with `?embed=true&limit=5&sort=recent` params
- [ ] Return embeddable review snippet data alongside badge data

---

## TODO (Next Steps in Sequence)

### Portal Snippet Generator UI
- [ ] Build snippet generator component in `/portal`
- [ ] Copy-to-clipboard for embed code
- [ ] Live preview of badge in 3 styles
- [ ] Auto-generate `<div data-gl365-badge>` + `<script>` snippet

### /trust Page Enhancement
- [ ] Badge immutability content explaining the Trust Network
- [ ] Visual timeline of how badges are earned
- [ ] FAQ: "What does an inactive badge mean?"

### /use-cases Vertical Content
- [ ] HVAC industry use case page
- [ ] Roofing industry use case page
- [ ] Remodeling industry use case page
- [ ] Badge + reputation value prop per vertical

### /status (Uptime Page)
- [ ] System status dashboard
- [ ] API health checks (badge API, booking API, directory API)
- [ ] Incident history

### /docs Knowledge Vault
- [ ] Public developer documentation
- [ ] Badge embed integration guide
- [ ] API reference for `/api/badges/*` endpoints
- [ ] Webhook documentation

---

## Architecture

```
External Partner Site                    GL365 Infrastructure
┌─────────────────────┐                 ┌──────────────────────────┐
│                     │                 │                          │
│  <div              │   badge.js      │  /api/badges/[partnerId] │
│    data-gl365-badge │ ──── XHR ────> │  (public, CORS, cached)  │
│    data-partner-id  │                 │         │                │
│    data-style>      │                 │         ├─ directory_listings
│  </div>             │                 │         ├─ directory_badges
│                     │                 │         └─ businesses.tier
│  <script            │                 │                          │
│    src="badge.js">  │                 │  /api/badges             │
│                     │                 │  (authenticated, portal) │
└─────────────────────┘                 └──────────────────────────┘
```

### Badge Response Shape
```json
{
  "partnerId": "slug",
  "businessName": "Company Name",
  "tier": "professional",
  "subscriptionActive": true,
  "badges": [
    {
      "badge_type": "verified",
      "badge_label": "Intelligence Verified",
      "badge_color": "#39FF14",
      "earned_at": "2026-02-01T00:00:00Z"
    }
  ],
  "stats": {
    "avgRating": 4.8,
    "reviewCount": 42,
    "trustScore": 92,
    "jobsLogged": 156
  },
  "profileUrl": "https://greenline365.com/directory/slug",
  "bookingUrl": "https://greenline365.com/listing/slug"
}
```

### Embed Styles
| Style | Description |
|-------|-------------|
| `default` | Full badge with name, stars, badge pills, tooltip |
| `minimal` | Compact badge, no pill badges, smaller text |
| `compact` | Icon only, no text, tooltip hidden |

---

*Owner: Jared Tucker | jared.tucker13@gmail.com*
