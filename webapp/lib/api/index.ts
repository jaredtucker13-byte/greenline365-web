/**
 * API Clients Index
 * 
 * Two-API architecture:
 * - coreApi: CRUD operations on records
 * - analyticsApi: Read-only aggregates with meta
 */

export { coreApi } from './coreApi';
export type { Lead, LeadCreateInput, LeadUpdateInput, ListOptions, ListResponse } from './coreApi';

export { analyticsApi } from './analyticsApi';
export type {
  AnalyticsMeta,
  AnalyticsResponse,
  CrmKPIs,
  CrmFunnel,
  CrmTrend,
  CrmSourceBreakdown,
  PlatformOverview,
  ActivityPattern,
  BookingAnalytics,
  ContentPerformance,
  AIReceptionistAnalytics,
  EmailCampaignAnalytics,
} from './analyticsApi';
