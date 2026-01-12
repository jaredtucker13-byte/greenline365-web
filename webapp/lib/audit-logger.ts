/**
 * Audit Logger Service
 * Server-side utility for logging audit events
 * 
 * SOC2 Compliance: Tracks all significant actions
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type AuditActionCategory = 'auth' | 'data' | 'admin' | 'system' | 'security';

export type AuditStatus = 'success' | 'failure' | 'denied';

export interface AuditLogParams {
  action: string;
  actionCategory: AuditActionCategory;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  status?: AuditStatus;
  errorMessage?: string;
  isSensitive?: boolean;
  complianceFlags?: string[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  userId: string | null,
  params: AuditLogParams
): Promise<string | null> {
  try {
    // Get user email if we have userId
    let userEmail: string | null = null;
    if (userId) {
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      userEmail = user?.user?.email || null;
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        user_email: userEmail,
        action: params.action,
        action_category: params.actionCategory,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        description: params.description,
        changes: params.changes ? {
          old: params.changes.before,
          new: params.changes.after,
        } : null,
        metadata: params.metadata || {},
        status: params.status || 'success',
        error_message: params.errorMessage,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        is_sensitive: params.isSensitive || false,
        compliance_flags: params.complianceFlags || [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Audit] Failed to log event:', error);
      return null;
    }

    return data?.id || null;
  } catch (e) {
    console.error('[Audit] Exception logging event:', e);
    return null;
  }
}

/**
 * Pre-defined audit event loggers
 */
export const AuditLogger = {
  // Authentication events
  async loginSuccess(supabase: SupabaseClient, userId: string, ipAddress?: string, userAgent?: string) {
    return logAuditEvent(supabase, userId, {
      action: 'user.login',
      actionCategory: 'auth',
      description: 'User logged in successfully',
      ipAddress,
      userAgent,
      isSensitive: true,
      complianceFlags: ['gdpr'],
    });
  },

  async loginFailure(supabase: SupabaseClient, email: string, reason: string, ipAddress?: string) {
    return logAuditEvent(supabase, null, {
      action: 'user.login',
      actionCategory: 'auth',
      description: `Login failed for ${email}`,
      status: 'failure',
      errorMessage: reason,
      metadata: { attempted_email: email },
      ipAddress,
      isSensitive: true,
      complianceFlags: ['security'],
    });
  },

  async logout(supabase: SupabaseClient, userId: string) {
    return logAuditEvent(supabase, userId, {
      action: 'user.logout',
      actionCategory: 'auth',
      description: 'User logged out',
    });
  },

  async passwordReset(supabase: SupabaseClient, userId: string) {
    return logAuditEvent(supabase, userId, {
      action: 'user.password_reset',
      actionCategory: 'auth',
      description: 'Password reset requested',
      isSensitive: true,
      complianceFlags: ['security', 'gdpr'],
    });
  },

  // Data access events
  async dataExport(supabase: SupabaseClient, userId: string, dataType: string, recordCount: number) {
    return logAuditEvent(supabase, userId, {
      action: 'data.export',
      actionCategory: 'data',
      resourceType: dataType,
      description: `Exported ${recordCount} ${dataType} records`,
      metadata: { record_count: recordCount },
      isSensitive: true,
      complianceFlags: ['gdpr', 'ccpa'],
    });
  },

  async dataDelete(supabase: SupabaseClient, userId: string, resourceType: string, resourceId: string, reason?: string) {
    return logAuditEvent(supabase, userId, {
      action: 'data.delete',
      actionCategory: 'data',
      resourceType,
      resourceId,
      description: `Deleted ${resourceType}: ${resourceId}`,
      metadata: { reason },
      isSensitive: true,
      complianceFlags: ['gdpr'],
    });
  },

  // Admin events
  async adminAction(supabase: SupabaseClient, userId: string, action: string, details: Record<string, any>) {
    return logAuditEvent(supabase, userId, {
      action: `admin.${action}`,
      actionCategory: 'admin',
      description: `Admin action: ${action}`,
      metadata: details,
    });
  },

  async permissionChange(supabase: SupabaseClient, userId: string, targetUserId: string, oldRole: string, newRole: string) {
    return logAuditEvent(supabase, userId, {
      action: 'admin.permission_change',
      actionCategory: 'admin',
      resourceType: 'user',
      resourceId: targetUserId,
      description: `Changed user role from ${oldRole} to ${newRole}`,
      changes: { before: { role: oldRole }, after: { role: newRole } },
      isSensitive: true,
      complianceFlags: ['security'],
    });
  },

  // Security events
  async suspiciousActivity(supabase: SupabaseClient, userId: string | null, activityType: string, details: Record<string, any>) {
    return logAuditEvent(supabase, userId, {
      action: `security.${activityType}`,
      actionCategory: 'security',
      description: `Suspicious activity detected: ${activityType}`,
      metadata: details,
      status: 'denied',
      isSensitive: true,
      complianceFlags: ['security'],
    });
  },

  async accessDenied(supabase: SupabaseClient, userId: string, resource: string, reason: string) {
    return logAuditEvent(supabase, userId, {
      action: 'security.access_denied',
      actionCategory: 'security',
      resourceType: resource,
      description: `Access denied to ${resource}`,
      status: 'denied',
      errorMessage: reason,
      complianceFlags: ['security'],
    });
  },

  // System events
  async systemEvent(supabase: SupabaseClient, eventType: string, details: Record<string, any>) {
    return logAuditEvent(supabase, null, {
      action: `system.${eventType}`,
      actionCategory: 'system',
      description: `System event: ${eventType}`,
      metadata: details,
    });
  },

  // API events
  async apiCall(supabase: SupabaseClient, userId: string | null, endpoint: string, method: string, statusCode: number, responseTime?: number) {
    return logAuditEvent(supabase, userId, {
      action: 'api.call',
      actionCategory: 'system',
      resourceType: 'api_endpoint',
      resourceId: endpoint,
      description: `${method} ${endpoint} - ${statusCode}`,
      metadata: { method, status_code: statusCode, response_time_ms: responseTime },
      status: statusCode >= 400 ? 'failure' : 'success',
    });
  },
};

export default AuditLogger;
