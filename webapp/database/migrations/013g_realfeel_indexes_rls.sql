-- PART 7: Create indexes and enable RLS
-- Run this LAST

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);

-- Indexes for call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);

-- Indexes for other tables
CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);

-- Enable RLS
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON call_logs TO authenticated;
GRANT ALL ON call_logs TO service_role;
GRANT SELECT ON call_audits TO authenticated;
GRANT ALL ON call_audits TO service_role;
GRANT SELECT ON weather_alerts TO authenticated;
GRANT ALL ON weather_alerts TO service_role;
GRANT SELECT ON warm_transfer_queue TO authenticated;
GRANT ALL ON warm_transfer_queue TO service_role;
