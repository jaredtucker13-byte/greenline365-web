-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 8: Seed Data
-- Run this LAST (after 015g)
-- ============================================

-- Seed Industry Configs
INSERT INTO industry_configs (industry_type, industry_name, decay_logic, asset_metadata_schema, verification_prompt, emergency_keywords, is_default) VALUES
(
  'hvac',
  'HVAC / Air Conditioning',
  '{"stale_years": 8, "unreliable_years": 15}'::jsonb,
  '{"required": ["brand", "tonnage", "fuel_type"], "optional": ["seer_rating", "filter_size"]}'::jsonb,
  'I see we have a {{brand}} unit on file from {{install_year}}. Is that still the system we''re looking at today?',
  ARRAY['no air', 'no heat', 'smoke', 'burning smell', 'gas leak', 'carbon monoxide'],
  true
),
(
  'plumbing',
  'Plumbing',
  '{"stale_years": 8, "unreliable_years": 12}'::jsonb,
  '{"required": ["brand", "gallons", "fuel_type"], "optional": ["warranty_expiry"]}'::jsonb,
  'Our records show a {{brand}} water heater from {{install_year}}. Is that still the unit giving you trouble today?',
  ARRAY['flooding', 'burst pipe', 'sewage', 'no water', 'gas smell'],
  true
),
(
  'roofing',
  'Roofing',
  '{"stale_years": 15, "unreliable_years": 25}'::jsonb,
  '{"required": ["material", "color"], "optional": ["last_permit_year", "warranty_expiry"]}'::jsonb,
  'I see the last roof permit was from {{install_year}}. Have you had a full replacement since then, or are we looking at a repair?',
  ARRAY['leak', 'storm damage', 'tree fell', 'hole in roof'],
  true
),
(
  'lawn_care',
  'Lawn Care / Irrigation',
  '{"stale_years": 2, "unreliable_years": 5}'::jsonb,
  '{"required": ["zone_count"], "optional": ["controller_brand", "spray_head_count"]}'::jsonb,
  'We have you down for {{zone_count}} zones from our last visit. Have you added any landscaping or zones since then?',
  ARRAY['broken main', 'flooding', 'no water pressure'],
  true
),
(
  'security',
  'Home Security',
  '{"stale_years": 5, "unreliable_years": 8}'::jsonb,
  '{"required": ["panel_brand", "panel_type"], "optional": ["sensor_count", "camera_count"]}'::jsonb,
  'I see you''re on the {{panel_brand}} system. Have you upgraded to a newer panel since then?',
  ARRAY['break in', 'alarm going off', 'intruder', 'fire alarm'],
  true
),
(
  'electrical',
  'Electrical',
  '{"stale_years": 10, "unreliable_years": 25}'::jsonb,
  '{"required": ["panel_amps"], "optional": ["panel_brand", "last_inspection_year"]}'::jsonb,
  'Our records show a {{panel_amps}} amp panel. Is that still the current setup?',
  ARRAY['sparks', 'burning smell', 'no power', 'electrical fire', 'shock'],
  true
)
ON CONFLICT DO NOTHING;

-- Seed Location Flavors
INSERT INTO location_flavors (location_name, region, states, cities, climate_quirk, witty_hooks) VALUES
(
  'Tampa, FL',
  'Southeast',
  ARRAY['FL'],
  ARRAY['Tampa', 'St. Petersburg', 'Clearwater', 'Brandon'],
  'Humidity / "Wet Blanket"',
  '[
    "I know that humidity feels like wearing a warm, wet blanket! Luckily, I live in a server room kept at a crisp 68 degrees, or my circuits would be as fried as a grouper sandwich.",
    "Oh my goodness, that Florida humidity is no joke! It''s the kind of heat that makes you want to move into your refrigerator.",
    "I''d come help you myself, but I''m an AI—I don''t have skin to sweat, just code to run in the cloud!"
  ]'::jsonb
),
(
  'Phoenix, AZ',
  'Southwest',
  ARRAY['AZ'],
  ARRAY['Phoenix', 'Scottsdale', 'Mesa', 'Tempe', 'Chandler'],
  'Dry Heat / "The Oven"',
  '[
    "I hear it''s a ''dry heat'' out there, but so is an oven! I''d come help you myself, but I''m an AI—I don''t have skin to tan, just code to run.",
    "Phoenix summers are like living inside a convection oven. Good thing I''m made of silicon and not wax!",
    "They say you can fry an egg on the sidewalk there. I''m just glad I live in a nice, cool data center!"
  ]'::jsonb
),
(
  'Denver, CO',
  'Mountain',
  ARRAY['CO'],
  ARRAY['Denver', 'Aurora', 'Lakewood', 'Boulder', 'Fort Collins'],
  'Thin Air / "Mile High"',
  '[
    "That mountain air is beautiful, but it sure makes the furnace work for its living! I''m just an AI, so I don''t get winded, but I''ll make sure a human tech gets there to help you breathe easy.",
    "A mile high and temperatures can drop fast! Good thing I don''t need a jacket—just a stable internet connection.",
    "I hear the altitude takes some getting used to. Luckily, my processing power works just the same at any elevation!"
  ]'::jsonb
),
(
  'Dallas, TX',
  'South Central',
  ARRAY['TX'],
  ARRAY['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving'],
  'Summer Heat / "The Griddle"',
  '[
    "Everything is bigger in Texas, including that electric bill when the AC quits! My program says it''s a scorcher today—good thing I''m made of silicon and not wax!",
    "Texas heat doesn''t mess around. I''d offer to fan you, but I''m just a bunch of ones and zeros!",
    "They say Texans are tough, but even the toughest need a working AC. Let''s get you fixed up!"
  ]'::jsonb
),
(
  'Miami, FL',
  'Southeast',
  ARRAY['FL'],
  ARRAY['Miami', 'Miami Beach', 'Hialeah', 'Fort Lauderdale', 'Coral Gables'],
  'Tropical Heat / "Paradise Problems"',
  '[
    "Miami heat is legendary—it''s the kind that makes your AC work overtime! Good thing I live in the cloud where it''s always 72 degrees.",
    "Living in paradise has its challenges, especially when the AC decides to take a vacation too!",
    "I don''t need sunscreen or a cafecito, but I''ll make sure your home stays cool enough for both!"
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Seed data inserted successfully!' as status;
