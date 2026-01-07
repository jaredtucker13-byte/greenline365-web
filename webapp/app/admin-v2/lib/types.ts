/**
 * Tactical Multi-Command Center - Type Definitions
 * GreenLine365 Admin V2
 */

// ============================================
// BOOKING TYPES
// ============================================
export interface Booking {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  business_name?: string;
  preferred_datetime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  needs?: string[];
  notes?: string;
  created_at: string;
  source?: string;
}

// ============================================
// CONTENT SCHEDULE TYPES
// ============================================
export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  content_type: 'photo' | 'product' | 'blog' | 'newsletter' | 'social';
  image_url?: string;
  scheduled_datetime: string;
  platforms: ('instagram' | 'twitter' | 'facebook')[];
  hashtags?: string[];
  status: 'draft' | 'scheduled' | 'review' | 'published';
  created_at: string;
  campaign_id?: string;
}

// ============================================
// LOCAL TRENDS TYPES
// ============================================
export interface LocalTrend {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  expected_traffic: 'low' | 'medium' | 'high';
  category: string;
  suggested_action?: string;
  created_at: string;
}

// ============================================
// CLIENT CONFIG TYPES
// ============================================
export interface ClientConfig {
  id: string;
  business_name: string;
  location: string;
  timezone: string;
  branding: {
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
  };
  social_accounts: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  created_at: string;
}

// ============================================
// CALENDAR EVENT (Unified View)
// ============================================
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: 'booking' | 'content' | 'review' | 'launch';
  status: string;
  color: string;
  glowColor: string;
  data: Booking | ContentItem;
}

// ============================================
// ANALYTICS TYPES
// ============================================
export interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  metric?: number;
}

export interface TeamMetrics {
  label: string;
  value: number;
  percentage: number;
}

export interface PipelineStage {
  name: string;
  count: number;
  percentage: number;
}

export interface BookingTrend {
  day: string;
  current: number;
  previous: number;
}
