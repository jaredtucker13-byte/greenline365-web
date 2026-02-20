-- ============================================
-- Migration 029: Seed Subscription Tier Data
-- Plans, Feature Flags, Overrides, Roles, Permissions
-- ============================================

-- ============================================
-- PLANS
-- ============================================
INSERT INTO plans (slug, product_type, name, description, price_monthly_cents, price_annual_cents, trial_days, sort_order)
VALUES
  ('free', 'directory', 'Free Listing', 'Basic directory listing with limited features', 0, 0, 0, 0),
  ('directory_pro', 'directory', 'Directory Pro', 'Enhanced listing with verified badge, menu editor, priority placement, and more', 2900, 29000, 14, 1),
  ('command_center', 'command_center', 'Command Center', 'Full business management suite: bookings, AI automation, content, and integrations', 7900, 79000, 14, 2),
  ('bundle', 'bundle', 'Complete Bundle', 'Directory Pro + Command Center at a discounted rate', 9900, 99000, 14, 3)
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
-- ============================================

-- directory_pro overrides
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('photos_max', '20'),
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

-- command_center overrides (all directory_pro features + command center features)
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('photos_max', '20'),
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
JOIN plans p ON p.slug = 'command_center'
JOIN feature_flags f ON f.slug = v.flag_slug
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- bundle overrides (same as command_center — inherits all)
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, v.val
FROM (VALUES
  ('photos_max', '20'),
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
