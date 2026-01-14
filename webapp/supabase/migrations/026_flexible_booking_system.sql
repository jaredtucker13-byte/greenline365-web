-- ============================================================
-- FLEXIBLE BOOKING SYSTEM
-- Multi-tenant, service-based, 24/7 AI booking capability
-- ============================================================

-- ============================================
-- TENANT SERVICES TABLE
-- Each tenant defines their own services with custom durations
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Service Details
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Pricing (optional)
  price DECIMAL(10,2),
  price_type TEXT DEFAULT 'fixed', -- fixed, hourly, free, quote
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  requires_human BOOLEAN DEFAULT FALSE, -- If true, only book during business hours
  
  -- Booking Settings
  buffer_before_minutes INTEGER DEFAULT 0, -- Buffer time before appointment
  buffer_after_minutes INTEGER DEFAULT 0,  -- Buffer time after appointment
  max_daily_bookings INTEGER, -- NULL = unlimited
  
  -- Display
  color TEXT DEFAULT '#39FF14',
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_services_tenant ON tenant_services(tenant_id, is_active);

-- ============================================
-- TENANT AVAILABILITY TABLE
-- Defines when each tenant is available for bookings
-- Flexible: can have multiple time blocks per day
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Day of week (0=Sunday, 1=Monday, etc.)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Time block
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Optional: Link to specific service (NULL = applies to all)
  service_id UUID REFERENCES tenant_services(id) ON DELETE CASCADE,
  
  -- Is this a "closed" block? (for lunch breaks, etc.)
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_availability_tenant ON tenant_availability(tenant_id, day_of_week);

-- ============================================
-- BOOKINGS TABLE (Enhanced)
-- Add tenant_id and service linkage
-- ============================================
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES tenant_services(id),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booked_by TEXT DEFAULT 'ai', -- ai, human, self
ADD COLUMN IF NOT EXISTS confirmation_number TEXT,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_number);

-- ============================================
-- BLOCKED TIME SLOTS
-- For one-off blocks (vacation, special closures)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Block period
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Reason
  reason TEXT,
  block_type TEXT DEFAULT 'manual', -- manual, vacation, holiday, appointment
  
  -- If blocking for a specific service only
  service_id UUID REFERENCES tenant_services(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_times_tenant ON blocked_times(tenant_id, start_time, end_time);

-- ============================================
-- INSERT DEFAULT SERVICES FOR GREENLINE365
-- ============================================
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get GreenLine365 tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE business_name = 'GreenLine365' LIMIT 1;
  
  IF v_tenant_id IS NOT NULL THEN
    -- Insert services if they don't exist
    INSERT INTO tenant_services (tenant_id, name, description, duration_minutes, price, price_type, requires_human, sort_order)
    VALUES 
      (v_tenant_id, 'Quick Demo', 'See the AI receptionist in action', 10, 0, 'free', FALSE, 1),
      (v_tenant_id, 'Strategy Call', 'Discuss your business needs', 30, 0, 'free', FALSE, 2)
    ON CONFLICT DO NOTHING;
    
    -- Insert 24/7 availability (AI can book anytime)
    -- This represents when the AI can BOOK appointments, not when services are delivered
    INSERT INTO tenant_availability (tenant_id, day_of_week, start_time, end_time)
    SELECT v_tenant_id, d, '00:00'::TIME, '23:59'::TIME
    FROM generate_series(0, 6) AS d
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE tenant_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access services" ON tenant_services FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access availability" ON tenant_availability FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access blocked" ON blocked_times FOR ALL TO service_role USING (true);

-- Authenticated users can view
CREATE POLICY "Authenticated can view services" ON tenant_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view availability" ON tenant_availability FOR SELECT TO authenticated USING (true);

-- ============================================
-- HELPER FUNCTION: Get Available Slots for a Date
-- ============================================
CREATE OR REPLACE FUNCTION get_available_slots(
  p_tenant_id UUID,
  p_date DATE,
  p_service_id UUID DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_slot_interval INTERVAL;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  v_slot_interval := (p_duration_minutes || ' minutes')::INTERVAL;
  
  RETURN QUERY
  WITH availability_windows AS (
    -- Get all availability windows for this day
    SELECT 
      (p_date + ta.start_time) AS window_start,
      (p_date + ta.end_time) AS window_end
    FROM tenant_availability ta
    WHERE ta.tenant_id = p_tenant_id
      AND ta.day_of_week = v_day_of_week
      AND ta.is_active = TRUE
      AND ta.is_blocked = FALSE
      AND (ta.service_id IS NULL OR ta.service_id = p_service_id)
  ),
  existing_bookings AS (
    -- Get all bookings for this date
    SELECT 
      b.start_time AS booked_start,
      b.end_time AS booked_end
    FROM bookings b
    WHERE b.tenant_id = p_tenant_id
      AND b.start_time::DATE = p_date
      AND b.status NOT IN ('cancelled')
  ),
  blocked AS (
    -- Get blocked times
    SELECT 
      bt.start_time AS blocked_start,
      bt.end_time AS blocked_end
    FROM blocked_times bt
    WHERE bt.tenant_id = p_tenant_id
      AND bt.start_time::DATE <= p_date
      AND bt.end_time::DATE >= p_date
      AND (bt.service_id IS NULL OR bt.service_id = p_service_id)
  ),
  potential_slots AS (
    -- Generate all potential slot start times
    SELECT generate_series(
      aw.window_start,
      aw.window_end - v_slot_interval,
      '30 minutes'::INTERVAL -- Slot generation interval (could be configurable)
    ) AS potential_start
    FROM availability_windows aw
  )
  SELECT 
    ps.potential_start AS slot_start,
    ps.potential_start + v_slot_interval AS slot_end
  FROM potential_slots ps
  WHERE NOT EXISTS (
    -- Check for conflicts with existing bookings
    SELECT 1 FROM existing_bookings eb
    WHERE ps.potential_start < eb.booked_end
      AND (ps.potential_start + v_slot_interval) > eb.booked_start
  )
  AND NOT EXISTS (
    -- Check for conflicts with blocked times
    SELECT 1 FROM blocked bl
    WHERE ps.potential_start < bl.blocked_end
      AND (ps.potential_start + v_slot_interval) > bl.blocked_start
  )
  AND ps.potential_start > NOW() -- Only future slots
  ORDER BY ps.potential_start;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Flexible booking system created!' AS status;
