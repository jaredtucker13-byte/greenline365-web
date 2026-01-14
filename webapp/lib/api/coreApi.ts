/**
 * Core API Client
 * 
 * CRUD operations for records: leads, contacts, deals, tasks, activities.
 * Use this for record-level operations and drill-down from analytics.
 * 
 * Supports:
 * - ETag/If-Match for optimistic concurrency
 * - Field selection for partial responses
 * - Bulk operations
 */

// ============================================
// TYPES
// ============================================

export interface Lead {
  id: string;
  user_id?: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  status: 'new' | 'pending' | 'verified' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'archived';
  source: string;
  value?: number;
  first_contact_at?: string;
  last_contact_at?: string;
  converted_at?: string;
  lost_at?: string;
  lost_reason?: string;
  tags: string[];
  notes?: string;
  assigned_to?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeadCreateInput {
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  source?: string;
  value?: number;
  tags?: string[];
  notes?: string;
  status?: Lead['status'];
}

export interface LeadUpdateInput {
  id: string;
  name?: string;
  phone?: string;
  company?: string;
  status?: Lead['status'];
  value?: number;
  tags?: string[];
  notes?: string;
  assigned_to?: string;
  lost_reason?: string;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  source?: string;
  fields?: string[];
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: Record<string, number>;
}

export interface CoreApiError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// API CLIENT
// ============================================

const API_BASE = '/api';

class CoreApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit & { etag?: string }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (options?.etag) {
      headers['If-Match'] = options.etag;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // ============================================
  // LEADS
  // ============================================
  
  async listLeads(options: ListOptions = {}): Promise<ListResponse<Lead>> {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options.search) params.set('search', options.search);
    if (options.status) params.set('status', options.status);
    if (options.source) params.set('source', options.source);
    if (options.fields) params.set('fields', options.fields.join(','));
    
    const response = await this.request<any>(`/crm/leads?${params}`);
    
    return {
      data: response.leads || [],
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 50,
      totalPages: response.totalPages || 1,
      stats: response.stats,
    };
  }
  
  async getLead(id: string): Promise<Lead> {
    const response = await this.request<{ lead: Lead }>(`/crm/leads/${id}`);
    return response.lead;
  }
  
  async createLead(data: LeadCreateInput): Promise<Lead> {
    const response = await this.request<{ lead: Lead }>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.lead;
  }
  
  async updateLead(data: LeadUpdateInput, etag?: string): Promise<Lead> {
    const response = await this.request<{ lead: Lead }>('/crm/leads', {
      method: 'PUT',
      body: JSON.stringify(data),
      etag,
    });
    return response.lead;
  }
  
  async deleteLead(id: string, permanent: boolean = false): Promise<void> {
    await this.request(`/crm/leads?id=${id}&action=${permanent ? 'delete' : 'archive'}`, {
      method: 'DELETE',
    });
  }
  
  async bulkUpdateLeads(ids: string[], update: Partial<LeadUpdateInput>): Promise<void> {
    await Promise.all(
      ids.map(id => this.updateLead({ id, ...update }))
    );
  }
  
  // ============================================
  // RECORD FETCH FOR DRILL-DOWN
  // ============================================
  
  async getRecordsByIds(type: 'lead', ids: string[]): Promise<Lead[]> {
    // For now, fetch individually. Could be optimized with bulk endpoint.
    const results = await Promise.all(
      ids.map(id => this.getLead(id).catch(() => null))
    );
    return results.filter((r): r is Lead => r !== null);
  }
}

export const coreApi = new CoreApiClient();
export default coreApi;
