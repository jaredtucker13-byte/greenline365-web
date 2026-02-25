-- ============================================
-- BLAST DEALS & LOCAL PULSE SYSTEM
-- Migration 026: Flash promotions, QR redemptions, consumer profiles
-- B2C retail focus (coffee shops, food, beauty, fitness, entertainment)
-- Home services follow-up is a SEPARATE system — not included here
--
-- TWO EMAILS (not a sequence — two independent triggers):
--   Email 1: Deal distribution — owner approves a deal, it goes out to clientele
--   Email 2: Post-purchase thank you — triggered by QR scan at register (~5 min delay)
--
-- THE QR CODE IS THE COUPON:
--   Customer scans QR at register → discount applied → consumer captured → thank-you fires
-- ============================================

-- ============================================
-- CONSUMER PROFILES TABLE
-- People who scan QR codes at the register
-- This is how businesses build their clientele list through GL365
-- Captured at the moment of QR scan (register checkout)
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
  total_redemptions INTEGER DEFAULT 0,
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
-- The coupon itself. Lives inside a QR code.
-- Created when owner approves a Local Pulse suggestion.
-- Distributed via Email 1 (deal email) to the business's clientele.
-- Redeemed when customer scans QR at the register.
-- ============================================
CREATE TABLE IF NOT EXISTS blast_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Who created it
  business_id UUID NOT NULL,
  listing_id UUID,
  created_by UUID,

  -- Deal / coupon content
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('bogo', 'percent_off', 'dollar_off', 'free_item', 'bundle', 'custom')),
  deal_value TEXT NOT NULL, -- e.g. "50%", "$5", "Buy 1 Get 1", "Free Haircut"
  terms TEXT, -- Fine print / conditions

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  time_window TEXT, -- Human-readable: "2-5pm today", "This weekend only"

  -- Redemption limits
  max_redemptions INTEGER, -- NULL = unlimited. Set for limited-quantity deals.
  current_redemptions INTEGER DEFAULT 0,

  -- QR Code (THE coupon — this is what the customer scans at the register)
  qr_code_url TEXT, -- Generated QR code image URL or data URI
  qr_code_data TEXT, -- Raw data encoded in the QR (deal ID + validation hash)
  deal_code TEXT NOT NULL, -- Short human-readable code: "BLAST-COFFEE-2X4K"

  -- Source (what Local Pulse trend inspired this deal)
  source_trend_id TEXT,
  source_trend_title TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'sold_out')),

  -- ===== EMAIL 1: DEAL DISTRIBUTION =====
  -- When owner approves, this deal gets emailed to their clientele
  distribution_channels JSONB DEFAULT '["email"]', -- ["email", "directory", "sms", "social"]
  distribution_email_sent_at TIMESTAMPTZ, -- When the deal email went out
  distribution_email_count INTEGER DEFAULT 0, -- How many consumers received it

  -- ===== EMAIL 2: THANK-YOU CONFIG (owner controls these) =====
  -- Fires ~5 min after QR scan at register. Co-branded: business + GL365.
  thankyou_email_enabled BOOLEAN DEFAULT true,
  thankyou_delay_minutes INTEGER DEFAULT 5, -- Delay after QR scan before sending

  -- Next-visit discount (included in thank-you email, owner's discretion)
  followup_discount_enabled BOOLEAN DEFAULT false,
  followup_discount_type TEXT CHECK (followup_discount_type IN ('percent_off', 'dollar_off', 'free_item', 'custom')),
  followup_discount_value TEXT, -- e.g. "10%", "$5 off", "Free coffee"
  followup_discount_terms TEXT, -- e.g. "Valid within 30 days of your visit"
  followup_discount_expires_days INTEGER DEFAULT 30,

  -- Review request (included in thank-you email, owner's discretion)
  review_link_enabled BOOLEAN DEFAULT true,
  review_link_url TEXT, -- Owner's Google/Yelp/custom review page URL
  review_link_text TEXT DEFAULT 'Your feedback means the world to us! Leave us a review.',

  -- Engagement metrics
  email_opens INTEGER DEFAULT 0, -- Deal email opens
  email_clicks INTEGER DEFAULT 0, -- Deal email click-throughs
  qr_scans INTEGER DEFAULT 0, -- Total QR scans at register (= redemptions)
  thankyou_opens INTEGER DEFAULT 0, -- Thank-you email opens
  review_clicks INTEGER DEFAULT 0, -- Review link clicks from thank-you

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
CREATE INDEX IF NOT EXISTS idx_blast_deals_deal_code ON blast_deals(deal_code);
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
-- DEAL REDEMPTIONS TABLE
-- Every QR scan at the register = one redemption row.
-- This is the PURCHASE EVENT. The customer scanned the QR to apply
-- their coupon at checkout. This one scan:
--   1. Applies the discount to their purchase
--   2. Captures their info (email, name) into consumer_profiles
--   3. Links them to this business in consumer_business_links
--   4. Schedules the thank-you email (~5 min later)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES blast_deals(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumer_profiles(id),

  -- Consumer info (captured at QR scan)
  consumer_email TEXT NOT NULL,
  consumer_name TEXT,
  consumer_phone TEXT,

  -- Redemption details
  deal_code TEXT NOT NULL, -- The code from the QR
  scanned_at TIMESTAMPTZ DEFAULT NOW(), -- The moment they scanned at the register
  discount_applied TEXT, -- What discount was actually applied: "50% off", "$5 off", etc.

  -- ===== THANK-YOU EMAIL (Email 2) tracking =====
  thankyou_status TEXT DEFAULT 'scheduled' CHECK (thankyou_status IN (
    'scheduled',  -- QR scanned, thank-you email queued (~5 min delay)
    'sent',       -- Thank-you email delivered (co-branded: business + GL365)
    'failed',     -- Email failed to send
    'opted_out'   -- Consumer had previously unsubscribed
  )),
  thankyou_scheduled_for TIMESTAMPTZ, -- scanned_at + delay (e.g. 5 min)
  thankyou_sent_at TIMESTAMPTZ,

  -- Followup discount tracking (if owner included one in thank-you email)
  followup_discount_code TEXT, -- Generated code for their next-visit discount
  followup_discount_redeemed_at TIMESTAMPTZ, -- Did they come back and use it?
  followup_discount_expires_at TIMESTAMPTZ,

  -- Review tracking
  review_link_clicked_at TIMESTAMPTZ,

  -- Attribution (how did they originally get the deal?)
  attribution TEXT DEFAULT 'email' CHECK (attribution IN ('email', 'directory', 'sms', 'social', 'walk_in')),

  -- Metadata
  device_info JSONB DEFAULT '{}',
  scan_location JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_redemptions_deal ON deal_redemptions(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_redemptions_consumer ON deal_redemptions(consumer_id);
CREATE INDEX IF NOT EXISTS idx_deal_redemptions_email ON deal_redemptions(consumer_email);
CREATE INDEX IF NOT EXISTS idx_deal_redemptions_scheduled ON deal_redemptions(thankyou_status, thankyou_scheduled_for)
  WHERE thankyou_status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_deal_redemptions_scanned ON deal_redemptions(scanned_at DESC);

ALTER TABLE deal_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view redemptions on own deals" ON deal_redemptions
  FOR SELECT USING (
    deal_id IN (SELECT id FROM blast_deals WHERE created_by = auth.uid())
  );

CREATE POLICY "Service can manage all redemptions" ON deal_redemptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- CONSUMER-BUSINESS RELATIONSHIPS TABLE
-- Built automatically when a consumer scans a QR at a business.
-- This IS the business's clientele list, grown through GL365.
-- ============================================
CREATE TABLE IF NOT EXISTS consumer_business_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consumer_id UUID NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  listing_id UUID,

  -- Relationship
  first_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  total_redemptions INTEGER DEFAULT 1,
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
-- Two separate templates for two separate emails:
--   1. deal_distribution — the deal/coupon announcement (sent to clientele list)
--   2. post_purchase_thankyou — co-branded thank-you (sent ~5 min after QR scan)
-- These are NOT a sequence. Different triggers, different purposes.
-- Home services will have their own separate templates.
-- ============================================
CREATE TABLE IF NOT EXISTS deal_email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL CHECK (template_type IN ('deal_distribution', 'post_purchase_thankyou')),

  -- Email content (with merge fields)
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,

  -- Sender / branding config
  sender_name_template TEXT DEFAULT '{{business_name}}',
  -- For deal_distribution: appears from the business only
  -- For post_purchase_thankyou: co-branded business + GL365
  co_branded BOOLEAN DEFAULT false,

  -- Which business types use this template
  business_type TEXT DEFAULT 'retail' CHECK (business_type IN ('retail', 'food', 'beauty', 'fitness', 'entertainment', 'other')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== EMAIL 1: Deal Distribution =====
-- Sent when the owner approves a deal. Goes to their clientele list.
-- The coupon/QR code is embedded in this email.
INSERT INTO deal_email_templates (template_name, template_type, subject_template, body_template, co_branded, business_type) VALUES
(
  'deal_distribution',
  'deal_distribution',
  '{{business_name}} has a deal for you: {{deal_title}}!',
  'Hi {{consumer_name}},

Great news from {{business_name}}!

{{deal_title}}
{{deal_description}}

{{deal_value}} — valid until {{deal_expires}}.
{{deal_terms}}

Scan this QR code at the register to redeem:
{{qr_code_image}}

Or use code: {{deal_code}}

See you soon!

— The {{business_name}} Team',
  false, -- Appears from the business only
  'retail'
);

-- ===== EMAIL 2: Post-Purchase Thank You =====
-- Sent ~5 min after QR scan at the register.
-- CO-BRANDED: business name + GreenLine 365.
-- GL365 gets brand visibility with every transaction.
INSERT INTO deal_email_templates (template_name, template_type, subject_template, body_template, co_branded, business_type) VALUES
(
  'post_purchase_thankyou',
  'post_purchase_thankyou',
  'Thank you for your purchase at {{business_name}}!',
  'Hi {{consumer_name}},

Thank you for choosing {{business_name}}! We truly appreciate your business.

Today''s deal: {{deal_title}}
Discount applied: {{discount_applied}}

{{followup_discount_section}}

{{review_section}}

We look forward to seeing you again!

Warm regards,
The {{business_name}} Team
Powered by GreenLine 365',
  true, -- Co-branded: business + GL365
  'retail'
);

-- Followup discount section (injected when owner has it enabled):
-- "As a thank you, here''s something for your next visit:
--  {{followup_discount_value}}
--  Use code: {{followup_discount_code}}
--  {{followup_discount_terms}}"
--
-- Review section (injected when owner has it enabled):
-- "Your feedback is very important to us!
--  {{review_link_text}}
--  [Leave a Review]({{review_link_url}})"

ALTER TABLE deal_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage email templates" ON deal_email_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- AI FEEDBACK LOOP TABLE
-- Tracks which Local Pulse suggestions owners accepted/rejected
-- The AI reads this to get smarter about what to suggest
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
    'accepted',          -- Owner approved the deal suggestion
    'rejected',          -- Owner saw it but did not act
    'modified',          -- Owner liked it but tweaked the deal
    'dismissed'          -- Owner explicitly dismissed it
  )),

  -- If they created a deal, what did they actually create?
  resulting_deal_id UUID REFERENCES blast_deals(id),
  modifications_made JSONB DEFAULT '{}',

  -- Performance of the resulting deal (updated after the deal runs)
  deal_redemptions INTEGER DEFAULT 0,
  deal_revenue NUMERIC DEFAULT 0,
  followup_discount_redemptions INTEGER DEFAULT 0, -- How many came back with the next-visit discount
  review_clicks INTEGER DEFAULT 0,

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
  RAISE NOTICE '=== Blast Deals & Local Pulse system created ===';
  RAISE NOTICE 'Tables:';
  RAISE NOTICE '  consumer_profiles — GL365 consumer accounts (built from QR scans)';
  RAISE NOTICE '  blast_deals — coupons that live in QR codes (owner-approved from Local Pulse)';
  RAISE NOTICE '  deal_redemptions — QR scan at register = purchase event + thank-you trigger';
  RAISE NOTICE '  consumer_business_links — business clientele (grown through GL365)';
  RAISE NOTICE '  deal_email_templates — 2 templates: deal distribution + post-purchase thank-you';
  RAISE NOTICE '  pulse_feedback — AI feedback loop for smarter suggestions';
  RAISE NOTICE '';
  RAISE NOTICE 'Email 1: Deal distribution (owner approves deal -> sent to clientele)';
  RAISE NOTICE 'Email 2: Post-purchase thank-you (QR scan at register -> 5 min delay)';
  RAISE NOTICE '  - Co-branded: business name + GreenLine 365';
  RAISE NOTICE '  - Optional next-visit discount (owner discretion)';
  RAISE NOTICE '  - Review CTA (owner provides their review link)';
  RAISE NOTICE '';
  RAISE NOTICE 'B2C retail focus. Home services is a separate system.';
  RAISE NOTICE 'RLS enabled on all tables.';
END $$;
