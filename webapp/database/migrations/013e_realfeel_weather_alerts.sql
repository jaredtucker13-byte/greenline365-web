-- PART 5: Create weather_alerts table
-- Run this FIFTH

CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity_level INTEGER DEFAULT 1,
  zip_code TEXT,
  city TEXT,
  weather_data JSONB NOT NULL,
  forecast_summary TEXT,
  affected_appointments INTEGER DEFAULT 0,
  auto_reschedule_triggered BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
