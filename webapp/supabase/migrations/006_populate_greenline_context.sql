-- =====================================================
-- POPULATE GREENLINE365 TENANT WITH DYNAMIC CONTEXT
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Update GreenLine365 tenant with rich context for Aiden
UPDATE tenants 
SET 
  -- Industry & Context
  industry = 'Marketing Technology / SaaS',
  industry_context = 'GreenLine365 is an AI-powered marketing platform specifically designed for local service businesses like barbershops, salons, restaurants, contractors, and home services. We turn their phone into a complete marketing command center with AI that creates content, manages social media, books appointments, and handles customer communication 24/7.',
  
  -- Target Customer Profile
  target_customer = 'Small to medium local service business owners who are great at their craft but struggle with marketing, social media, and customer communication. They are typically working 60+ hours a week, wearing every hat in their business, and losing customers to competitors who have better online presence. They want to grow but cannot afford to hire a marketing team.',
  
  -- Pain Points (what keeps them up at night)
  pain_points = '1) No time for marketing - too busy running the actual business. 2) Competitors stealing customers with better social media presence. 3) Missing calls and leads because they cannot answer the phone while working. 4) Spending thousands on marketing agencies with little ROI. 5) Social media feels overwhelming and inauthentic. 6) No consistent way to get reviews and testimonials. 7) Struggling to stand out in a crowded local market.',
  
  -- Value Proposition (why choose GreenLine365)
  value_proposition = 'GreenLine365 is like having a full marketing team in your pocket for less than the cost of one employee. Our AI handles everything: creates scroll-stopping content from your phone photos, manages posting schedules, responds to customers 24/7, books appointments automatically, and even makes outbound sales calls. Business owners save 15+ hours per week and see an average of 40% increase in bookings within 90 days. No contracts, no BS - just results.',
  
  -- Owner Info
  owner_name = 'Jared',
  
  -- Services offered
  services = '[
    {"name": "Discovery Call", "duration": "15 min", "price": "Free", "description": "Quick chat to see if GreenLine365 is right for your business"},
    {"name": "Strategy Session", "duration": "45 min", "price": "Free", "description": "Deep dive into your business with a custom marketing roadmap"},
    {"name": "Full Platform Demo", "duration": "60 min", "price": "Free", "description": "Hands-on walkthrough of all GreenLine365 features"},
    {"name": "Onboarding Call", "duration": "90 min", "price": "Included", "description": "White-glove setup of your entire marketing system"}
  ]'::jsonb,
  
  -- Business Hours
  business_hours = '{
    "monday": "9:00 AM - 6:00 PM",
    "tuesday": "9:00 AM - 6:00 PM", 
    "wednesday": "9:00 AM - 6:00 PM",
    "thursday": "9:00 AM - 6:00 PM",
    "friday": "9:00 AM - 6:00 PM",
    "saturday": "10:00 AM - 2:00 PM",
    "sunday": "Closed (AI available 24/7)"
  }'::jsonb
  
WHERE business_name = 'GreenLine365';

-- Also add some additional context columns if they don't exist
-- Run these ALTER statements if needed:

-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pricing_info TEXT;
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS competitors TEXT;
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS testimonials JSONB;
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS objection_handlers JSONB;

-- Optional: Add pricing info
-- UPDATE tenants SET pricing_info = 'Starter: $97/month (1 location, core features). Pro: $197/month (unlimited locations, all features, priority support). Enterprise: Custom pricing for franchises and multi-location businesses. All plans include: AI content creation, social media scheduling, 24/7 AI assistant, appointment booking, lead capture. No contracts - cancel anytime.' WHERE business_name = 'GreenLine365';

-- Optional: Add objection handlers for Aiden
-- UPDATE tenants SET objection_handlers = '[
--   {"objection": "Too expensive", "response": "I hear you. What is it costing you right now to miss calls, lose customers to competitors, and spend hours on marketing? Most of our clients make back their investment in the first month from just the time savings alone."},
--   {"objection": "I need to think about it", "response": "Absolutely, it is a big decision. What specifically would help you feel confident about moving forward? I want to make sure I address any concerns."},
--   {"objection": "I tried marketing software before", "response": "I get it - there is a lot of garbage out there. What made you stop using the last one? GreenLine365 is different because we actually do the work for you, not just give you another tool to figure out."},
--   {"objection": "I do not have time to learn new software", "response": "That is exactly why we built this. You literally just take a photo on your phone and our AI does everything else. Plus we have a white-glove onboarding where we set everything up for you."}
-- ]'::jsonb WHERE business_name = 'GreenLine365';

-- Verify the update
SELECT 
  business_name,
  industry,
  LEFT(target_customer, 50) as target_customer_preview,
  LEFT(value_proposition, 50) as value_prop_preview,
  owner_name
FROM tenants 
WHERE business_name = 'GreenLine365';
