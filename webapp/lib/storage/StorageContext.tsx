'use client';

/**
 * Storage Tracking Context
 * 
 * Tracks storage usage per tenant with:
 * - Real-time usage monitoring
 * - Quota alerts (50%, 80%, 90%, 100%)
 * - Enforcement (soft/hard block)
 * - Platform owner visibility
 * - Tenant dashboard widget
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useBusiness } from '@/lib/business';

// ============================================
// TYPES
// ============================================

export interface StorageUsage {
  bytesUsed: number;
  bytesLimit: number;
  bytesAvailable: number;
  usagePercent: number;
  isBlocked: boolean;
  blockReason: string | null;
  
  // Breakdown by type
  breakdown: {
    images: number;
    mockups: number;
    documents: number;
    other: number;
  };
  
  // Plan info
  planName: string;
  includedGB: number;
  overageRatePerGB: number;
  
  // Billing
  overageGB: number;
  estimatedOverageCost: number;
}

export interface StorageAlert {
  id: string;
  type: '50_percent' | '80_percent' | '90_percent' | '100_percent' | 'blocked';
  thresholdPercent: number;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface StorageContextType {
  usage: StorageUsage | null;
  alerts: StorageAlert[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshUsage: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  checkCanUpload: (fileSize: number) => { canUpload: boolean; reason?: string };
  trackUpload: (objectId: string, fileName: string, fileSize: number, fileType: string) => Promise<void>;
  trackDelete: (objectId: string, fileSize: number) => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024;
}

// ============================================
// CONTEXT
// ============================================

const StorageContext = createContext<StorageContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const { activeBusiness } = useBusiness();
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [alerts, setAlerts] = useState<StorageAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch storage usage for current tenant
  const refreshUsage = useCallback(async () => {
    if (!activeBusiness) {
      setUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/storage/usage?businessId=${activeBusiness.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch storage usage');
      }

      const data = await response.json();
      setUsage(data.usage);
      setAlerts(data.alerts || []);
      
    } catch (err: any) {
      console.error('Storage usage fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeBusiness]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/storage/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, []);

  // Check if upload is allowed (enforcement)
  const checkCanUpload = useCallback((fileSize: number): { canUpload: boolean; reason?: string } => {
    if (!usage) {
      return { canUpload: true }; // Allow if no usage data yet
    }

    // Hard block at 110%
    if (usage.isBlocked) {
      return { 
        canUpload: false, 
        reason: usage.blockReason || 'Storage limit exceeded. Please upgrade or delete files.'
      };
    }

    // Check if this upload would exceed limit
    const newUsage = usage.bytesUsed + fileSize;
    const newPercent = (newUsage / usage.bytesLimit) * 100;

    if (newPercent > 110) {
      return {
        canUpload: false,
        reason: `This upload (${formatBytes(fileSize)}) would exceed your storage limit. Please upgrade or delete files.`
      };
    }

    // Soft warning at 100%
    if (newPercent > 100) {
      return {
        canUpload: true,
        reason: `Warning: You are over your storage limit. Overage charges will apply ($${usage.overageRatePerGB}/GB).`
      };
    }

    return { canUpload: true };
  }, [usage]);

  // Track a new upload
  const trackUpload = useCallback(async (
    objectId: string,
    fileName: string,
    fileSize: number,
    fileType: string
  ) => {
    if (!activeBusiness) return;

    try {
      await fetch('/api/storage/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          eventType: 'upload',
          objectId,
          objectName: fileName,
          deltaBytes: fileSize,
          storageType: getStorageType(fileType),
          mimeType: fileType,
        }),
      });

      // Refresh usage after tracking
      await refreshUsage();
    } catch (err) {
      console.error('Failed to track upload:', err);
    }
  }, [activeBusiness, refreshUsage]);

  // Track a delete
  const trackDelete = useCallback(async (objectId: string, fileSize: number) => {
    if (!activeBusiness) return;

    try {
      await fetch('/api/storage/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          eventType: 'delete',
          objectId,
          deltaBytes: -fileSize, // Negative for delete
        }),
      });

      // Refresh usage after tracking
      await refreshUsage();
    } catch (err) {
      console.error('Failed to track delete:', err);
    }
  }, [activeBusiness, refreshUsage]);

  // Determine storage type from MIME type
  function getStorageType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      if (mimeType.includes('mockup') || mimeType.includes('generated')) {
        return 'mockup';
      }
      return 'image';
    }
    if (mimeType.startsWith('application/pdf') || 
        mimeType.includes('document') ||
        mimeType.includes('word') ||
        mimeType.includes('excel')) {
      return 'document';
    }
    return 'other';
  }

  // Fetch usage when business changes
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const value: StorageContextType = {
    usage,
    alerts,
    isLoading,
    error,
    refreshUsage,
    acknowledgeAlert,
    checkCanUpload,
    trackUpload,
    trackDelete,
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export default StorageProvider;
