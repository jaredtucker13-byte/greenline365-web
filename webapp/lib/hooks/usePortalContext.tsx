'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { ResolvedFeatures } from '@/lib/types/subscription';

interface DirectoryListing {
  id: string;
  business_name: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  industry: string | null;
  subcategories: string[] | null;
  tags: string[] | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  business_hours: Record<string, { open: string; close: string }> | null;
  tier: string;
  is_published: boolean;
  is_claimed: boolean;
  slug: string | null;
  metadata: Record<string, unknown> | null;
  trust_score: number;
  total_feedback_count: number;
  avg_feedback_rating: number;
  is_mobile_service: boolean;
  service_area_radius_miles: number | null;
  private_address: string | null;
  service_area_label: string | null;
  service_area_display: string | null;
  is_public_resource: boolean;
}

interface SubscriptionInfo {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: {
    slug: string;
    product_type: string;
    name: string;
    price_monthly_cents: number;
    price_annual_cents: number;
  };
}

interface PortalContextValue {
  user: User | null;
  listings: DirectoryListing[];
  activeListing: DirectoryListing | null;
  features: ResolvedFeatures;
  subscriptions: SubscriptionInfo[];
  directorySubscription: SubscriptionInfo | null;
  commandCenterSubscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setActiveListingId: (id: string) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [features, setFeatures] = useState<ResolvedFeatures>({});
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      setUser(currentUser);

      // Fetch listings, features, and subscriptions in parallel
      const [listingsRes, featuresRes, subsRes] = await Promise.all([
        fetch('/api/portal/listing'),
        fetch('/api/features/resolved'),
        fetch('/api/subscriptions'),
      ]);

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        const fetchedListings = listingsData.listings || [];
        setListings(fetchedListings);
        if (fetchedListings.length > 0 && !activeListingId) {
          setActiveListingId(fetchedListings[0].id);
        }
      }

      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setFeatures(featuresData.features || {});
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(subsData.subscriptions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal data');
    } finally {
      setIsLoading(false);
    }
  }, [activeListingId]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const activeListing =
    listings.find((l) => l.id === activeListingId) || listings[0] || null;

  const directorySubscription =
    subscriptions.find(
      (s) =>
        (s.plan.product_type === 'directory' || s.plan.product_type === 'bundle') &&
        (s.status === 'active' || s.status === 'trialing')
    ) || null;

  const commandCenterSubscription =
    subscriptions.find(
      (s) =>
        (s.plan.product_type === 'command_center' || s.plan.product_type === 'bundle') &&
        (s.status === 'active' || s.status === 'trialing')
    ) || null;

  return (
    <PortalContext.Provider
      value={{
        user,
        listings,
        activeListing,
        features,
        subscriptions,
        directorySubscription,
        commandCenterSubscription,
        isLoading,
        error,
        refresh: loadPortalData,
        setActiveListingId,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalContext(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortalContext must be used within a PortalProvider');
  }
  return ctx;
}

export type { DirectoryListing, SubscriptionInfo, PortalContextValue };
