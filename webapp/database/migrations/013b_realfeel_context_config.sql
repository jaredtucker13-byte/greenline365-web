-- PART 2: Add context_config column
-- Run this SECOND

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS context_config JSONB DEFAULT '{"industry_type": "indoor", "weather_gate": {"enabled": false, "rain_threshold": 50, "heat_threshold": 95, "cold_threshold": 32, "severe_weather_only": true}, "booking_rules": {"nudge_cancellations": true, "max_availability_options": 3, "require_reschedule_id": true}, "warm_transfer": {"enabled": false, "research_on_hold": true, "whisper_duration_seconds": 10}}'::jsonb;
