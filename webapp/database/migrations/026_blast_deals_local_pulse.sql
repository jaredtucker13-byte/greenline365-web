-- ============================================
-- BLAST DEALS & LOCAL PULSE SYSTEM
-- Migration 026: Flash promotions, QR claims, consumer profiles
-- B2C retail focus (coffee shops, food, beauty, fitness, entertainment)
-- Single thank-you email with optional next-visit discount + review CTA
-- Home services follow-up is a SEPARATE system — not included here
-- ============================================

-- ============================================
-- CONSUMER PROFILES TABLE
-- People who scan QR codes / claim deals
-- This is how businesses build their clientele list through GL365
-- ============================================
CREATE TABLE IF NOT EXISTS consumer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  zip_code TEXT,
  preferences JSONB DEFAULT '{}',
  -- Track which businesses they've interacted with
  first_business_id UUID,
  total_claims INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  opted_in_marketing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_consumer_profiles_email ON consumer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_consumer_profiles_zip ON consumer_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_consumer_profiles_first_biz ON consumer_profiles(first_business_id);

ALTER TABLE consumer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage consumer profiles" ON consumer_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- BLAST DEALS TABLE
-- Time-limited, claim-based flash promotions
-- Created from Local Pulse trend suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS blast_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Who created it
  business_id UUID NOT NULL,
  listing_id UUID,
  created_by UUID,

  -- Deal content
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('bogo', 'percent_off', 'dollar_off', 'free_item', 'bundle', 'custom')),
  deal_value TEXT NOT NULL, -- e.g. "50%", "$5", "Buy 1 Get 1", "Free Haircut"
  terms TEXT, -- Fine print / conditions

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  time_window TEXT, -- Human-readable: "2-5pm today", "This weekend only"

  -- Claim settings
  claim_required BOOLEAN DEFAULT false, -- false = open coupon, true = must claim a spot
  max_claims INTEGER, -- NULL = unlimited (open deals). Set for limited-spot deals.
  current_claims INTEGER DEFAULT 0,
  arrival_window_minutes INTEGER, -- How long they have to arrive after claiming (10, 15, 30, 60 min)

  -- QR Code
  qr_code_url TEXT, -- Generated QR code image URL or data URI
  claim_code TEXT NOT NULL, -- Short code: "BLAST-COFFEE-2X4K"
  claim_url TEXT, -- Full URL: greenline365.com/claim/BLAST-COFFEE-2X4K

  -- Source (what trend inspired this)
  source_trend_id TEXT, -- References the trend that sparked this deal
  source_trend_title TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'sold_out')),

  -- Distribution channels
  channels JSONB DEFAULT '["directory"]', -- ["directory", "email", "sms", "social"]

  -- Engagement metrics
  views INTEGER DEFAULT 0,
  scans INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  -- Thank-you email config (single email sent on behalf of the business)
  email_enabled BOOLEAN DEFAULT true,
  email_template TEXT DEFAULT 'deal_claim_thankyou',

  -- Next-visit discount (owner-controlled, included in the thank-you email)
  followup_discount_enabled BOOLEAN DEFAULT false,
  followup_discount_type TEXT CHECK (followup_discount_type IN ('percent_off', 'dollar_off', 'free_item', 'custom')),
  followup_discount_value TEXT, -- e.g. "10%", "$5 off", "Free coffee"
  followup_discount_terms TEXT, -- e.g. "Valid within 30 days of your visit"
  followup_discount_expires_days INTEGER DEFAULT 30, -- Days from claim until discount expires

  -- Review request (included in the thank-you email)
  review_link_enabled BOOLEAN DEFAULT true,
  review_link_url TEXT, -- Owner's Google/Yelp/custom review page URL
  review_link_text TEXT DEFAULT 'Your feedback means the world to us! Leave us a review.',

  -- Metadata
  category TEXT, -- "food", "beauty", "fitness", etc.
  business_type TEXT DEFAULT 'retail' CHECK (business_type IN ('retail', 'food', 'beauty', 'fitness', 'entertainment', 'other')),
  tags JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blast_deals_business ON blast_deals(business_id);
CREATE INDEX IF NOT EXISTS idx_blast_deals_listing ON blast_deals(listing_id);
CREATE INDEX IF NOT EXISTS idx_blast_deals_status ON blast_deals(status);
CREATE INDEX IF NOT EXISTS idx_blast_deals_expires ON blast_deals(expires_at);
CREATE INDEX IF NOT EXISTS idx_blast_deals_claim_code ON blast_deals(claim_code);
CREATE INDEX IF NOT EXISTS idx_blast_deals_active ON blast_deals(status, expires_at)
  WHERE status = 'active';

ALTER TABLE blast_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage own deals" ON blast_deals
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Public can view active deals" ON blast_deals
  FOR SELECT USING (status = 'active' AND expires_at > NOW());

CREATE POLICY "Service can manage all deals" ON blast_deals
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- DEAL CLAIMS TABLE
-- Every time a consumer claims/scans a blast deal
-- Triggers a single thank-you email on behalf of the business
-- (B2C retail/food/beauty — NOT home services, that's a separate system)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES blast_deals(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumer_profiles(id),

  -- Consumer info (captured at claim time)
  consumer_email TEXT NOT NULL,
  consumer_name TEXT,
  consumer_phone TEXT,

  -- Claim details
  claim_code TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ, -- When they actually used the deal in-store

  -- Thank-you email status (single email, not a drip sequence)
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN (
    'pending',   -- Claim just happened, email not sent yet
    'sent',      -- Thank-you email sent (with discount + review link)
    'failed',    -- Email failed to send
    'opted_out'  -- Consumer unsubscribed
  )),
  email_sent_at TIMESTAMPTZ,

  -- Followup discount tracking (if the owner included one in the thank-you email)
  followup_discount_code TEXT, -- Generated code for their next-visit discount
  followup_discount_redeemed_at TIMESTAMPTZ, -- Did they actually come back?
  followup_discount_expires_at TIMESTAMPTZ, -- When the next-visit discount expires

  -- Review tracking
  review_link_clicked BOOLEAN DEFAULT false,

  -- Attribution
  source TEXT DEFAULT 'qr_scan' CHECK (source IN ('qr_scan', 'link', 'directory', 'email', 'sms')),

  -- Metadata
  device_info JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_claims_deal ON deal_claims(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_claims_consumer ON deal_claims(consumer_id);
CREATE INDEX IF NOT EXISTS idx_deal_claims_email ON deal_claims(consumer_email);
CREATE INDEX IF NOT EXISTS idx_deal_claims_pending_email ON deal_claims(email_status)
  WHERE email_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_deal_claims_claimed ON deal_claims(claimed_at DESC);

ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view claims on own deals" ON deal_claims
  FOR SELECT USING (
    deal_id IN (SELECT id FROM blast_deals WHERE created_by = auth.uid())
  );

CREATE POLICY "Service can manage all claims" ON deal_claims
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- CONSUMER-BUSINESS RELATIONSHIPS TABLE
-- Tracks which consumers belong to which businesses
-- This is the business's clientele list built through GL365
-- ============================================
CREATE TABLE IF NOT EXISTS consumer_business_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consumer_id UUID NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  listing_id UUID,

  -- Relationship
  first_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  total_claims INTEGER DEFAULT 1,
  total_visits INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,

  -- Communication preferences (for this business)
  email_opted_in BOOLEAN DEFAULT true,
  sms_opted_in BOOLEAN DEFAULT false,

  -- Segment tags the business can assign
  tags JSONB DEFAULT '[]',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(consumer_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_cb_links_consumer ON consumer_business_links(consumer_id);
CREATE INDEX IF NOT EXISTS idx_cb_links_business ON consumer_business_links(business_id);
CREATE INDEX IF NOT EXISTS idx_cb_links_listing ON consumer_business_links(listing_id);

ALTER TABLE consumer_business_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own clientele" ON consumer_business_links
  FOR ALL USING (
    business_id IN (
      SELECT id FROM directory_listings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage all links" ON consumer_business_links
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- DEAL EMAIL TEMPLATES TABLE
-- Single thank-you email sent ON BEHALF of the business (not GL365)
-- B2C retail focus: thank you + optional next-visit discount + review CTA
-- Home services will have their own separate follow-up system
-- ============================================
CREATE TABLE IF NOT EXISTS deal_email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,

  -- Email content (with merge fields)
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  -- Merge fields: {{business_name}}, {{consumer_name}}, {{deal_title}},
  --   {{deal_description}}, {{deal_expires}}, {{claim_code}}, {{claim_date}},
  --   {{followup_discount_section}}, {{review_section}}

  -- Sender config (appears FROM the business)
  sender_name_template TEXT DEFAULT '{{business_name}}',

  -- Which business types use this template
  business_type TEXT DEFAULT 'retail' CHECK (business_type IN ('retail', 'food', 'beauty', 'fitness', 'entertainment', 'other')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default: single thank-you email with discount offer + review CTA
INSERT INTO deal_email_templates (template_name, subject_template, body_template, business_type) VALUES
(
  'deal_claim_thankyou',
  'Thank you for your business at {{business_name}}!',
  'Hi {{consumer_name}},

Thank you for choosing {{business_name}}! We truly appreciate your business.

Here''s your deal details:
{{deal_description}}

Valid until: {{deal_expires}}
Your claim code: {{claim_code}}

Just show this email or your QR code when you visit.

{{followup_discount_section}}

{{review_section}}

We look forward to seeing you again!

Warm regards,
The {{business_name}} Team',
  'retail'
);

-- Followup discount section template (injected when owner has enabled it):
-- "As a thank you, here''s a little something for your next visit:
--  {{followup_discount_value}} — use code {{followup_discount_code}}
--  {{followup_discount_terms}}"
--
-- Review section template (injected when owner has enabled it):
-- "Your feedback is very important to us!
--  {{review_link_text}}
--  [Leave a Review]({{review_link_url}})"

ALTER TABLE deal_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage email templates" ON deal_email_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- AI FEEDBACK LOOP TABLE
-- Tracks which trend suggestions business owners accepted/rejected
-- The AI reads this to get smarter about what to suggest
-- Also tracks: which suggestions came from the knowledge base
-- ============================================
CREATE TABLE IF NOT EXISTS pulse_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Who
  business_id UUID NOT NULL,
  user_id UUID,

  -- What was suggested
  trend_id TEXT NOT NULL,
  trend_title TEXT NOT NULL,
  trend_category TEXT,
  suggested_deal_type TEXT,
  suggested_deal_title TEXT,

  -- What the owner did
  action TEXT NOT NULL CHECK (action IN (
    'accepted',          -- Owner created a deal from this suggestion
    'rejected',          -- Owner saw it but did not act
    'modified',          -- Owner liked the idea but changed the deal
    'dismissed'          -- Owner explicitly dismissed it
  )),

  -- If they created a deal, what did they actually create?
  resulting_deal_id UUID REFERENCES blast_deals(id),
  modifications_made JSONB DEFAULT '{}',

  -- Performance of the resulting deal (updated after the deal runs)
  deal_claims INTEGER DEFAULT 0,
  deal_redemptions INTEGER DEFAULT 0,
  deal_revenue NUMERIC DEFAULT 0,

  -- Context (for the AI to learn patterns)
  business_category TEXT,
  zip_code TEXT,
  day_of_week INTEGER,
  time_of_day TEXT,
  season TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pulse_fb_business ON pulse_feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_pulse_fb_category ON pulse_feedback(business_category, action);
CREATE INDEX IF NOT EXISTS idx_pulse_fb_trend_cat ON pulse_feedback(trend_category, action);
CREATE INDEX IF NOT EXISTS idx_pulse_fb_zip ON pulse_feedback(zip_code);

ALTER TABLE pulse_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own feedback" ON pulse_feedback
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service can manage all feedback" ON pulse_feedback
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- UPDATE local_trends to support new source types
-- ============================================
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'positive';
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS vibe_score INTEGER DEFAULT 80 CHECK (vibe_score >= 0 AND vibe_score <= 100);
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS suggested_deal JSONB DEFAULT '{}';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Blast Deals & Local Pulse system created!';
  RAISE NOTICE '📊 Tables created:';
  RAISE NOTICE '   - consumer_profiles (GL365 consumer accounts)';
  RAISE NOTICE '   - blast_deals (flash promotions + QR codes + owner-controlled discount & review settings)';
  RAISE NOTICE '   - deal_claims (claim tracking + single thank-you email + followup discount tracking)';
  RAISE NOTICE '   - consumer_business_links (business clientele tracking)';
  RAISE NOTICE '   - deal_email_templates (single thank-you email template)';
  RAISE NOTICE '   - pulse_feedback (AI learning feedback loop)';
  RAISE NOTICE '🔐 RLS policies enabled on all tables';
  RAISE NOTICE '📧 Single thank-you email: thank you + next-visit discount + review CTA';
  RAISE NOTICE '🏪 B2C retail focus (coffee shops, food, beauty, etc.)';
  RAISE NOTICE '🏠 Home services follow-up is a SEPARATE system (not included here)';
  RAISE NOTICE '🤖 AI feedback loop ready for learning';
END $$;
