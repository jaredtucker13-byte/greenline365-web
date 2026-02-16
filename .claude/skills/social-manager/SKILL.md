---
name: social-manager
description: "Automate business page creation, directory listing management, and social media posting for GreenLine365"
version: 1.0.0
triggers:
  - "create a business page"
  - "automate directory listing"
  - "post to social media"
  - "manage business directory presence"
  - "set up social connections"
inputs:
  - action: string (create-listing | claim-listing | connect-social | create-post | capture-screenshot)
  - business_id: string (UUID of the business)
  - platform: string (directory | instagram | facebook | twitter | linkedin)
outputs:
  - listing: json (directory listing record)
  - post: json (social media post record)
  - screenshot: base64 (captured business page image)
---

# Social Manager — Business Page and Social Automation Skill

## Purpose

The Social Manager skill automates the lifecycle of business pages within the GreenLine365 directory and manages cross-platform social media connections. It covers directory listing creation, claiming, tier upgrades, social account linking, content posting workflows, and Google Maps screenshot capture for business profiles.

## When to Use

- Creating a new directory listing for a business
- Claiming an existing unclaimed listing
- Connecting social media accounts (Instagram, Facebook, X, LinkedIn)
- Automating post creation workflows
- Capturing Google Maps screenshots for business profiles
- Managing directory add-ons (coupons, polls, featured boosts)

## Existing Infrastructure Reference

Before implementing any social/directory feature, read these files:

| File | Purpose |
|------|---------|
| `webapp/app/api/directory/route.ts` | Main directory search and listing retrieval with tier-based photo gating |
| `webapp/app/api/directory/claim/route.ts` | Business listing claim flow |
| `webapp/app/api/directory/my-listing/route.ts` | Authenticated listing management |
| `webapp/app/api/directory/photos/route.ts` | Photo upload/management |
| `webapp/app/api/directory/addons/route.ts` | Add-on marketplace (coupons, polls, featured, analytics, photos) |
| `webapp/app/api/directory/discover/route.ts` | Business discovery |
| `webapp/app/api/directory/discover/screenshot/route.ts` | Google Maps screenshot via Playwright |
| `webapp/app/api/directory/feedback/route.ts` | Review/feedback management |
| `webapp/app/api/directory/reviews/route.ts` | Review data access |
| `webapp/app/api/directory/stats/route.ts` | Directory statistics |
| `webapp/app/api/social/route.ts` | Social media account connections (OAuth) |
| `webapp/app/api/capture-screenshot/route.ts` | Fallback screenshot services |
| `webapp/app/api/businesses/route.ts` | Business CRUD operations |

### Directory Database Tables

| Table | Purpose |
|-------|---------|
| `directory_listings` | Core listing records with tier, slug, contact info, metadata |
| `businesses` | Business entities linked to listings |
| `social_connections` | OAuth connections per user/platform |
| `memory_event_journal` | Audit trail for social connection events |

### Directory Tier System

| Tier | Photo Access | Badges | Features |
|------|-------------|--------|----------|
| Free (unclaimed) | 1 photo, rest grayed | Grayed out | Basic listing only |
| Pro ($45/mo) | 5 photos | Active | Coupons, polls |
| Premium ($89/mo) | Unlimited | Active + Featured | All add-ons, analytics |
| Property Intelligence | Unlimited | All + PI badge | Full Property Passport |

## Procedure

### 1. Creating a New Directory Listing

#### Step 1: Create the Business Entity

```typescript
// Use existing pattern from webapp/app/api/businesses/route.ts
const { data: business } = await supabase
  .from('businesses')
  .insert({
    name: businessName,
    industry: industry,
    // ... other fields
  })
  .select()
  .single();
```

#### Step 2: Create the Directory Listing

```typescript
// Follow the directory listing creation pattern
const slug = generateSlug(businessName, city); // kebab-case unique slug

const { data: listing } = await supabase
  .from('directory_listings')
  .insert({
    business_id: business.id,
    name: businessName,
    slug,
    industry,
    city,
    state,
    zip,
    phone,
    email,
    website,
    tier: 'free',
    is_claimed: false,
    metadata: {},
  })
  .select()
  .single();
```

#### Step 3: Capture Google Maps Screenshot

Follow the pattern in `webapp/app/api/directory/discover/screenshot/route.ts`:

```typescript
// Playwright-based Google Maps screenshot
const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(businessName + ' ' + city)}`;
await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

// Handle consent dialog
const acceptButton = page.locator('button:has-text("Accept all")');
if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
  await acceptButton.click();
  await page.waitForTimeout(1000);
}

const screenshot = await page.screenshot({ type: 'jpeg', quality: 70 });
await browser.close();

const base64 = screenshot.toString('base64');
```

### 2. Claiming an Existing Listing

Follow the claim flow pattern:

1. User finds unclaimed listing in directory
2. User initiates claim via `/api/directory/claim`
3. System verifies business ownership (email/phone verification)
4. On verification: `is_claimed: true`, link to user's business
5. User can then upgrade tier via Stripe checkout

### 3. Connecting Social Media Accounts

Follow the pattern in `webapp/app/api/social/route.ts`:

```typescript
// Supported platforms and their validation endpoints
const PLATFORM_VALIDATORS = {
  instagram: 'https://graph.facebook.com/me?access_token={token}',
  facebook: 'https://graph.facebook.com/me?access_token={token}',
  twitter: 'https://api.twitter.com/2/users/me',
  linkedin: 'https://api.linkedin.com/v2/me',
};

// Connection flow:
// 1. User provides OAuth token from platform
// 2. Server validates token against platform API
// 3. Store connection in social_connections table
// 4. Log event to memory_event_journal

const { data } = await supabase.from('social_connections').insert({
  user_id: user.id,
  platform,
  access_token: token,       // TODO: encrypt in production
  refresh_token: refreshToken,
  expires_at: expiresAt,
  account_id: platformAccountId,
  account_name: platformAccountName,
  profile_url: profileUrl,
  is_active: true,
  connected_at: new Date().toISOString(),
});
```

### 4. Managing Directory Add-Ons

Follow the add-on catalog pattern from `webapp/app/api/directory/addons/route.ts`:

| Add-On | Price | Type | Duration |
|--------|-------|------|----------|
| Coupon Engine | $19/mo | Subscription | Ongoing |
| Custom Poll Template | $150 | One-time | Permanent |
| Featured Boost | $29 | One-time | 7 days |
| Additional Photos (5-pack) | $9/mo | Subscription | Ongoing |
| Analytics Pro | $19/mo | Subscription | Ongoing |

### 5. Creating Social Posts (Future Feature)

When implementing automated posting:

```typescript
// Post creation schema
const CreatePostSchema = z.object({
  business_id: z.string().uuid(),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin']),
  content: z.string().min(1).max(2200),  // Instagram limit
  media_urls: z.array(z.string().url()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

// Flow:
// 1. Validate post content per platform limits
// 2. Upload media if provided
// 3. Schedule or immediately post via platform API
// 4. Record post in database
// 5. Track engagement metrics
```

## Photo Gating Logic

The directory uses tier-based photo gating — this is critical for monetization:

```typescript
// From webapp/app/api/directory/route.ts pattern
// Free/unclaimed listings: only first photo visible, rest grayed
// Pro: up to 5 photos
// Premium: unlimited photos

function gatePhotos(photos: string[], tier: string, isClaimed: boolean): GatedPhoto[] {
  if (!isClaimed || tier === 'free') {
    return photos.map((url, i) => ({
      url: i === 0 ? url : null,
      gated: i > 0,
    }));
  }
  if (tier === 'pro') {
    return photos.map((url, i) => ({
      url: i < 5 ? url : null,
      gated: i >= 5,
    }));
  }
  // Premium: all visible
  return photos.map(url => ({ url, gated: false }));
}
```

## Security Checklist

- [ ] All directory queries scoped by `business_id` for authenticated operations
- [ ] Public directory search does NOT expose private business data
- [ ] Social tokens stored securely (encrypt at rest in production)
- [ ] Screenshot API rate-limited to prevent abuse
- [ ] Playwright browser launched headless only
- [ ] File uploads validated for type and size
- [ ] Claim verification prevents unauthorized claiming
- [ ] Add-on purchases verified via Stripe before activation

## Validation

- [ ] New listing appears in directory search
- [ ] Claim flow verifies ownership before linking
- [ ] Social connections validate tokens against platform APIs
- [ ] Photo gating enforces tier limits correctly
- [ ] Add-on checkout creates valid Stripe sessions
- [ ] Google Maps screenshot captures current business state
- [ ] RLS prevents cross-tenant directory management
