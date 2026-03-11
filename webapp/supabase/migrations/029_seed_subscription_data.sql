-- ============================================
-- Migration 029: Seed Subscription Tier Data
-- Plans, Feature Flags, Overrides, Roles, Permissions
-- ============================================

-- ============================================
-- PLANS
-- ============================================
-- ============================================
-- DIRECTORY TIERS (Public — /pricing page)
-- Free / Pro ($45/mo) / Premium ($89/mo)
-- See docs/specs/pricing.md Layer 1A
-- ============================================
INSERT INTO plans (slug, product_type, name, description, price_monthly_cents, price_annual_cents, trial_days, sort_order)
VALUES
  ('free', 'directory', 'Free Listing', 'Basic directory listing — name, address, phone, hours, basic search visibility', 0, 0, 0, 0),
  ('directory_pro', 'directory', 'Directory Pro', 'Enhanced listing with verified badge, direct CTA buttons, business description, priority search ranking, marketplace add-on access', 4500, 45000, 14, 1),
  ('directory_premium', 'directory', 'Directory Premium', 'Everything in Pro + all Google Business photos auto-synced, featured homepage placement, AI Review Response engine, lead capture forms, priority support', 8900, 89000, 14, 2),

  -- ============================================
  -- COMMAND CENTER TIERS (Private — email outreach only)
  -- Operator ($1,500/mo) / Commander ($2,500/mo) / Sovereign ($3,500/mo)
  -- Setup fees are one-time, milestone-based (50% Day 1 / 50% on Technical Completion)
  -- Operator setup: $2,500 | Commander setup: $3,500 | Sovereign setup: $5,500
  -- See docs/specs/pricing.md Layer 1B
  -- ============================================
  ('command_center_operator', 'command_center', 'Command Center — Operator', 'Solo or small teams plugging into their existing CRM. No GL365 CRM included. Setup: $2,500 (milestone-based).', 150000, 1500000, 0, 10),
  ('command_center_commander', 'command_center', 'Command Center — Commander', 'Multi-staff businesses with full GL365 CRM + Property Intelligence system. Setup: $3,500 (milestone-based).', 250000, 2500000, 0, 11),
  ('command_center_sovereign', 'command_center', 'Command Center — Sovereign', 'Enterprise operations with external CRM integration (bridge builder). Setup: $5,500 (milestone-based).', 350000, 3500000, 0, 12),

  -- ============================================
  -- BUNDLE (Directory + Command Center combined)
  -- Bundle price TBD — always strictly less than sum of individual prices
  -- See docs/specs/pricing.md Layer 2
  -- ============================================
  ('bundle', 'bundle', 'Complete Bundle', 'Directory + Command Center at a bundled discount rate. Bundle pricing TBD.', 0, 0, 0, 20)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FEATURE FLAGS (defaults = free tier values)
-- ============================================
INSERT INTO feature_flags (slug, name, description, value_type, default_value, category)
VALUES
  -- Portal features
  ('photos_max', 'Max Photos', 'Maximum number of photos allowed on listing', 'integer', '3', 'portal'),
  ('description_long', 'Long Description', 'Allow extended listing description', 'boolean', 'false', 'portal'),
  ('menu_editor', 'Menu Editor', 'Access to the menu/services editor', 'boolean', 'false', 'portal'),
  ('priority_placement', 'Priority Placement', 'Boosted visibility in directory search results', 'boolean', 'false', 'portal'),
  ('verified_badge', 'Verified Badge', 'Display verified badge on listing', 'boolean', 'false', 'portal'),
  ('custom_branding', 'Custom Branding', 'Custom colors and branding on listing', 'boolean', 'false', 'portal'),

  -- Shared features
  ('analytics_basic', 'Basic Analytics', 'View count and basic engagement metrics', 'boolean', 'true', 'shared'),
  ('analytics_advanced', 'Advanced Analytics', 'Detailed analytics with export and trends', 'boolean', 'false', 'shared'),
  ('team_members_max', 'Max Team Members', 'Maximum number of team members allowed', 'integer', '0', 'shared'),

  -- Command Center features
  ('booking_engine', 'Booking Engine', 'Online booking and appointment management', 'boolean', 'false', 'command_center'),
  ('calendar_sync', 'Calendar Sync', 'Sync with Google Calendar, Outlook, etc.', 'boolean', 'false', 'command_center'),
  ('ai_automation', 'AI Automation', 'AI-powered workflow automation', 'boolean', 'false', 'command_center'),
  ('ai_review_reply', 'AI Review Reply', 'AI-assisted review response generation', 'boolean', 'false', 'command_center'),
  ('content_manager', 'Content Manager', 'Content creation and scheduling tools', 'boolean', 'false', 'command_center'),
  ('integrations_hub', 'Integrations Hub', 'Third-party service integrations', 'boolean', 'false', 'command_center')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PLAN FEATURE OVERRIDES
-- See docs/specs/pricing.md "Tier-Based Feature Flags"
-- ============================================

-- Directory Pro ($45/mo) overrides
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('photos_max', '2'),
  ('description_long', 'true'),
  ('menu_editor', 'true'),
  ('priority_placement', 'true'),
  ('verified_badge', 'true'),
  ('analytics_advanced', 'true'),
  ('team_members_max', '3'),
  ('custom_branding', 'true')
) AS v(flag_slug, val)
JOIN plans p ON p.slug = 'directory_pro'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- Directory Premium ($89/mo) overrides
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('photos_max', '10'),
  ('description_long', 'true'),
  ('menu_editor', 'true'),
  ('priority_placement', 'true'),
  ('verified_badge', 'true'),
  ('analytics_advanced', 'true'),
  ('team_members_max', '5'),
  ('custom_branding', 'true'),
  ('ai_review_reply', 'true')
) AS v(flag_slug, val)
JOIN plans p ON p.slug = 'directory_premium'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- Command Center Operator ($1,500/mo) overrides
-- No GL365 CRM included. Hub-and-spoke calendar dashboard only.
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('booking_engine', 'true'),
  ('calendar_sync', 'true'),
  ('ai_automation', 'true'),
  ('content_manager', 'true'),
  ('integrations_hub', 'true'),
  ('team_members_max', '3')
) AS v(flag_slug, val)
JOIN plans p ON p.slug = 'command_center_operator'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- Command Center Commander ($2,500/mo) overrides
-- Full GL365 CRM + Property Intelligence system
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('booking_engine', 'true'),
  ('calendar_sync', 'true'),
  ('ai_automation', 'true'),
  ('ai_review_reply', 'true'),
  ('content_manager', 'true'),
  ('integrations_hub', 'true'),
  ('team_members_max', '10')
) AS v(flag_slug, val)
JOIN plans p ON p.slug = 'command_center_commander'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- Command Center Sovereign ($3,500/mo) overrides
-- Enterprise with external CRM integration (bridge builder)
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('booking_engine', 'true'),
  ('calendar_sync', 'true'),
  ('ai_automation', 'true'),
  ('ai_review_reply', 'true'),
  ('content_manager', 'true'),
  ('integrations_hub', 'true'),
  ('team_members_max', '25')
) AS v(flag_slug, val)
JOIN plans p ON p.slug = 'command_center_sovereign'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- Bundle overrides (Directory + Command Center combined — inherits all)
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('photos_max', '10'),
  ('description_long', 'true'),
  ('menu_editor', 'true'),
  ('priority_placement', 'true'),
  ('verified_badge', 'true'),
  ('analytics_advanced', 'true'),
  ('custom_branding', 'true'),
  ('booking_engine', 'true'),
  ('calendar_sync', 'true'),
  ('ai_automation', 'true'),
  ('ai_review_reply', 'true'),
  ('content_manager', 'true'),
  ('integrations_hub', 'true'),
  ('team_members_max', '10')
) AS v(flag_slug, val)
JOIN plans p ON p.slug = 'bundle'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- ============================================
-- ROLES
-- ============================================
INSERT INTO roles (slug, name, description, is_system)
VALUES
  ('owner', 'Owner', 'Full access to all features and settings', true),
  ('manager', 'Manager', 'Manage operations but cannot change billing or team settings', true),
  ('staff', 'Staff', 'View access plus listing edits and booking management', true),
  ('viewer', 'Viewer', 'Read-only access to all areas', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PERMISSIONS
-- ============================================
INSERT INTO permissions (slug, product_scope, description)
VALUES
  -- Portal permissions
  ('listing.view', 'portal', 'View listing details'),
  ('listing.edit', 'portal', 'Edit listing information'),
  ('listing.photos', 'portal', 'Manage listing photos'),
  ('listing.menu', 'portal', 'Manage listing menu/services'),
  ('listing.hours', 'portal', 'Manage business hours'),
  ('listing.stats', 'portal', 'View listing statistics'),

  -- Command Center permissions
  ('booking.view', 'command_center', 'View bookings'),
  ('booking.manage', 'command_center', 'Create and manage bookings'),
  ('calendar.view', 'command_center', 'View calendar'),
  ('calendar.manage', 'command_center', 'Manage calendar events and sync'),
  ('ai.view', 'command_center', 'View AI features'),
  ('ai.configure', 'command_center', 'Configure AI automation settings'),
  ('content.view', 'command_center', 'View content'),
  ('content.manage', 'command_center', 'Create and manage content'),
  ('integrations.view', 'command_center', 'View integrations'),
  ('integrations.manage', 'command_center', 'Configure integrations'),
  ('analytics.view', 'command_center', 'View analytics dashboards'),
  ('analytics.export', 'command_center', 'Export analytics data'),

  -- Shared permissions (both products)
  ('billing.view', 'both', 'View billing information'),
  ('billing.manage', 'both', 'Manage billing and subscriptions'),
  ('team.view', 'both', 'View team members'),
  ('team.manage', 'both', 'Invite and manage team members')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROLE_PERMISSIONS
-- ============================================

-- Owner: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: all except billing.manage, team.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'manager'
  AND p.slug NOT IN ('billing.manage', 'team.manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff: *.view permissions + listing.edit, booking.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'staff'
  AND (p.slug LIKE '%.view' OR p.slug IN ('listing.edit', 'booking.manage'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: *.view permissions only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'viewer'
  AND p.slug LIKE '%.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;
