/**
 * Analytics API Client
 * 
 * Read-only client for aggregate metrics, insights, and analytics.
 * All responses include `meta` with freshness and source info.
 * 
 * Usage:
 * - CRM Dashboard: analyticsApi.getCrmMetrics() for KPIs
 * - Analytics Page: analyticsApi.getPlatformMetrics() for activity
 * - Drill actions: analyticsApi.getSampleRecords() -> then coreApi for details
 */

export interface AnalyticsMeta {
  source: 'supabase' | 'aggregator' | 'cache';
  lastProcessedAt: string;
  cacheTtlSec: number;
  queryId?: string;
}

export interface AnalyticsResponse<T> {
  data: T;
  meta: AnalyticsMeta;
}

// ============================================
// CRM ANALYTICS TYPES
// ============================================

export interface CrmKPIs {
  totalLeads: number;
  newLeads: number;
  verifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  verificationRate: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealValue: number;
  pipelineValue: number;
}

export interface CrmFunnel {
  stages: {
    name: string;
    count: number;
    value: number;
  }[];
}

export interface CrmTrend {
  date: string;
  newLeads: number;
  conversions: number;
  revenue: number;
}

export interface CrmSourceBreakdown {
  source: string;
  count: number;
  converted: number;
  conversionRate: number;
  revenue: number;
}

// ============================================
// PLATFORM ANALYTICS TYPES (existing)
// ============================================

export interface PlatformOverview {
  totalEvents: number;
  totalBlogs: number;
  publishedBlogs: number;
  imagesGenerated: number;
  emailsSent: number;
  smsSent: number;
  knowledgeChunks: number;
}

export interface ActivityPattern {
  patterns: string[];
  insights: string[];
  stats: {
    totalEvents: number;
    uniqueDays: number;
    topEventTypes: [string, number][];
  };
}

// ============================================
// UNIQUE GREENLINE ANALYTICS (your differentiator)
// ============================================

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  avgTimeToBook: number; // hours
  peakBookingHours: { hour: number; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
}

export interface ContentPerformance {
  totalPosts: number;
  totalViews: number;
  totalShares: number;
  totalClicks: number;
  avgEngagementRate: number;
  topPerformingPosts: {
    id: string;
    title: string;
    views: number;
    shares: number;
    clicks: number;
  }[];
}

export interface AIReceptionistAnalytics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgCallDuration: number;
  appointmentsBooked: number;
  conversionRate: number;
  topIntents: { intent: string; count: number }[];
}

export interface EmailCampaignAnalytics {
  totalCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  unsubscribes: number;
  topCampaigns: {
    id: string;
    name: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }[];
}

// ============================================
// API CLIENT
// ============================================

const API_BASE = '/api';

async function fetchWithMeta<T>(
  endpoint: string,
  options?: RequestInit
): Promise<AnalyticsResponse<T>> {
  const startTime = Date.now();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }
  
  const rawData = await response.json();
  
  // Wrap response with meta if not already present
  if (rawData.meta) {
    return rawData as AnalyticsResponse<T>;
  }
  
  return {
    data: rawData as T,
    meta: {
      source: 'supabase',
      lastProcessedAt: new Date().toISOString(),
      cacheTtlSec: 60,
      queryId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
  };
}

export const analyticsApi = {
  // ============================================
  // CRM ANALYTICS
  // ============================================
  
  async getCrmKPIs(dateRange: string = '30d'): Promise<AnalyticsResponse<CrmKPIs>> {
    return fetchWithMeta<CrmKPIs>(`/analytics/crm?type=kpis&range=${dateRange}`);
  },
  
  async getCrmFunnel(dateRange: string = '30d'): Promise<AnalyticsResponse<CrmFunnel>> {
    return fetchWithMeta<CrmFunnel>(`/analytics/crm?type=funnel&range=${dateRange}`);
  },
  
  async getCrmTrends(dateRange: string = '30d'): Promise<AnalyticsResponse<CrmTrend[]>> {
    return fetchWithMeta<CrmTrend[]>(`/analytics/crm?type=trends&range=${dateRange}`);
  },
  
  async getCrmSourceBreakdown(dateRange: string = '30d'): Promise<AnalyticsResponse<CrmSourceBreakdown[]>> {
    return fetchWithMeta<CrmSourceBreakdown[]>(`/analytics/crm?type=sources&range=${dateRange}`);
  },
  
  // ============================================
  // PLATFORM ANALYTICS
  // ============================================
  
  async getPlatformOverview(dateRange: string = '30d'): Promise<AnalyticsResponse<PlatformOverview>> {
    return fetchWithMeta<PlatformOverview>(`/analytics?range=${dateRange}`);
  },
  
  async getPatterns(dateRange: string = '30d'): Promise<AnalyticsResponse<ActivityPattern>> {
    return fetchWithMeta<ActivityPattern>('/analytics', {
      method: 'POST',
      body: JSON.stringify({ action: 'patterns', dateRange }),
    });
  },
  
  // ============================================
  // UNIQUE GREENLINE ANALYTICS
  // ============================================
  
  async getBookingAnalytics(dateRange: string = '30d'): Promise<AnalyticsResponse<BookingAnalytics>> {
    return fetchWithMeta<BookingAnalytics>(`/analytics/bookings?range=${dateRange}`);
  },
  
  async getContentPerformance(dateRange: string = '30d'): Promise<AnalyticsResponse<ContentPerformance>> {
    return fetchWithMeta<ContentPerformance>(`/analytics/content?range=${dateRange}`);
  },
  
  async getAIReceptionistAnalytics(dateRange: string = '30d'): Promise<AnalyticsResponse<AIReceptionistAnalytics>> {
    return fetchWithMeta<AIReceptionistAnalytics>(`/analytics/ai-receptionist?range=${dateRange}`);
  },
  
  async getEmailCampaignAnalytics(dateRange: string = '30d'): Promise<AnalyticsResponse<EmailCampaignAnalytics>> {
    return fetchWithMeta<EmailCampaignAnalytics>(`/analytics/email?range=${dateRange}`);
  },
  
  // ============================================
  // DRILL-DOWN (Get sample record IDs for drill)
  // ============================================
  
  async getSampleRecords(
    metric: string,
    filters: Record<string, string>,
    limit: number = 10
  ): Promise<AnalyticsResponse<{ ids: string[] }>> {
    const params = new URLSearchParams({ metric, limit: limit.toString(), ...filters });
    return fetchWithMeta<{ ids: string[] }>(`/analytics/sample?${params}`);
  },
};

export default analyticsApi;
