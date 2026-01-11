-- Email System for GreenLine365
-- Run this in Supabase SQL Editor

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Template Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'transactional', 'newsletter', 'custom')),
  
  -- Content
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  plain_content TEXT,
  
  -- Variables available in this template
  variables JSONB DEFAULT '[]',
  
  -- Design
  design_json JSONB,
  thumbnail_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Campaign Info
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES email_templates(id),
  
  -- Audience
  recipient_list TEXT CHECK (recipient_list IN ('waitlist', 'customers', 'all', 'custom')),
  custom_recipients JSONB DEFAULT '[]',
  total_recipients INTEGER DEFAULT 0,
  
  -- Content (can override template)
  subject TEXT,
  html_content TEXT,
  
  -- Scheduling
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_unsubscribed INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Sends Log (individual email tracking)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  
  -- Recipient
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  sendgrid_message_id TEXT,
  
  -- Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  
  -- Error info
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant ON email_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to email_templates" ON email_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to email_campaigns" ON email_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all access to email_sends" ON email_sends FOR ALL USING (true);

-- Insert Default Templates
INSERT INTO email_templates (name, slug, description, category, subject, preview_text, html_content, variables, is_default) VALUES
(
  'Welcome to Waitlist',
  'welcome-waitlist',
  'Sent when someone joins the waitlist',
  'transactional',
  'Welcome to GreenLine365! You''re on the list 🎉',
  'Thanks for joining our waitlist. We''ll notify you when it''s your turn.',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { color: #39FF14; font-size: 28px; font-weight: bold; }
    .content { background: #ffffff; padding: 40px; border: 1px solid #e5e5e5; }
    .btn { display: inline-block; background: #39FF14; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">GreenLine365</div>
    </div>
    <div class="content">
      <h1>Welcome, {{name}}! 👋</h1>
      <p>You''re officially on the GreenLine365 waitlist. We''re excited to have you!</p>
      <p>You''re <strong>#{{position}}</strong> in line. We''re letting people in gradually to ensure everyone gets a great experience.</p>
      <p>In the meantime, here''s what you can do:</p>
      <ul>
        <li>Follow us on social media for updates</li>
        <li>Check out our blog for marketing tips</li>
        <li>Share with friends (they''ll thank you later)</li>
      </ul>
      <a href="{{website_url}}" class="btn">Explore GreenLine365</a>
      <p>Questions? Just reply to this email.</p>
      <p>- The GreenLine365 Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GreenLine365. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "position", "website_url", "unsubscribe_url"]',
  true
),
(
  'Booking Confirmation',
  'booking-confirmation',
  'Sent when a booking is confirmed',
  'transactional',
  'Your Demo is Booked! 📅 {{date}}',
  'Your demo with GreenLine365 is confirmed for {{date}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { color: #39FF14; font-size: 28px; font-weight: bold; }
    .content { background: #ffffff; padding: 40px; border: 1px solid #e5e5e5; }
    .booking-card { background: #f9f9f9; border: 2px solid #39FF14; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .btn { display: inline-block; background: #39FF14; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">GreenLine365</div>
    </div>
    <div class="content">
      <h1>You''re All Set, {{name}}! ✅</h1>
      <p>Your demo has been confirmed. Here are the details:</p>
      <div class="booking-card">
        <p><strong>📅 Date:</strong> {{date}}</p>
        <p><strong>⏰ Time:</strong> {{time}}</p>
        <p><strong>📍 Location:</strong> {{location}}</p>
        <p><strong>👤 With:</strong> {{host_name}}</p>
      </div>
      <a href="{{calendar_link}}" class="btn">Add to Calendar</a>
      <p>Need to reschedule? <a href="{{reschedule_url}}">Click here</a></p>
      <p>See you soon!</p>
      <p>- The GreenLine365 Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GreenLine365. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "date", "time", "location", "host_name", "calendar_link", "reschedule_url"]',
  true
),
(
  'Weekly Newsletter',
  'weekly-newsletter',
  'Weekly marketing tips and updates',
  'newsletter',
  '🚀 This Week in Local Marketing | GreenLine365',
  'Your weekly dose of marketing tips and local business insights',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { color: #39FF14; font-size: 28px; font-weight: bold; }
    .content { background: #ffffff; padding: 40px; border: 1px solid #e5e5e5; }
    .article { border-bottom: 1px solid #eee; padding: 20px 0; }
    .article:last-child { border-bottom: none; }
    .btn { display: inline-block; background: #39FF14; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">GreenLine365</div>
      <p style="color: #ccc; margin-top: 10px;">Weekly Marketing Insights</p>
    </div>
    <div class="content">
      <h1>Hey {{name}}! 👋</h1>
      <p>Here''s what''s happening in local marketing this week:</p>
      
      {{newsletter_content}}
      
      <hr style="border: none; border-top: 2px solid #39FF14; margin: 30px 0;">
      <p><strong>Quick Tip of the Week:</strong></p>
      <p>{{tip_of_week}}</p>
      
      <a href="{{cta_url}}" class="btn">{{cta_text}}</a>
      
      <p style="margin-top: 30px;">Keep crushing it!</p>
      <p>- Jared & The GreenLine365 Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GreenLine365. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Preferences</a></p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "newsletter_content", "tip_of_week", "cta_url", "cta_text", "unsubscribe_url", "preferences_url"]',
  true
),
(
  'Product Launch Announcement',
  'product-launch',
  'Announce new features or product launches',
  'marketing',
  '🎉 Big News: {{feature_name}} is Here!',
  'We''ve been working on something special. Check it out!',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 60px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { color: #39FF14; font-size: 28px; font-weight: bold; }
    .announcement { font-size: 48px; margin: 20px 0; }
    .content { background: #ffffff; padding: 40px; border: 1px solid #e5e5e5; }
    .feature-box { background: linear-gradient(135deg, #39FF14 0%, #0CE293 100%); color: #000; padding: 30px; border-radius: 12px; margin: 20px 0; }
    .btn { display: inline-block; background: #000; color: #39FF14; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">GreenLine365</div>
      <div class="announcement">🎉</div>
      <h1 style="color: #fff; margin: 0;">Something Big Just Dropped</h1>
    </div>
    <div class="content">
      <h2>Hey {{name}},</h2>
      <p>We''ve been working on something special, and we''re thrilled to share it with you:</p>
      
      <div class="feature-box">
        <h2 style="margin-top: 0;">{{feature_name}}</h2>
        <p>{{feature_description}}</p>
      </div>
      
      <h3>What This Means for You:</h3>
      <ul>
        {{benefits_list}}
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{cta_url}}" class="btn">{{cta_text}}</a>
      </p>
      
      <p>As always, we''re here to help you grow your business.</p>
      <p>- The GreenLine365 Team</p>
    </div>
    <div class="footer">
      <p>© 2026 GreenLine365. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "feature_name", "feature_description", "benefits_list", "cta_url", "cta_text", "unsubscribe_url"]',
  true
);

-- Verify
SELECT 'Email system tables created!' as status;
SELECT name, category, is_default FROM email_templates ORDER BY category, name;
