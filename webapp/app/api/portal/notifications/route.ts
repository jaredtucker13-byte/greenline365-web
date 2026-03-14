import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'action';
  title: string;
  message: string;
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * GET /api/portal/notifications — Get actionable notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const service = createServerClient();
    const notifications: Notification[] = [];

    // Get user's claimed listings
    const { data: listings } = await service
      .from('directory_listings')
      .select('id, business_name, cover_image_url, description, phone, website, logo_url')
      .eq('claimed_by', user.id);

    if (!listings || listings.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Check listing completeness for each listing
    for (const listing of listings) {
      const prefix = listings.length > 1 ? `${listing.business_name}: ` : '';

      if (!listing.cover_image_url) {
        notifications.push({
          id: `missing-cover-${listing.id}`,
          type: 'warning',
          title: `${prefix}Add a cover photo`,
          message: 'Listings with photos get 2x more views',
          actionUrl: '/portal/photos',
          priority: 'high',
        });
      }

      if (!listing.description) {
        notifications.push({
          id: `missing-description-${listing.id}`,
          type: 'warning',
          title: `${prefix}Add a business description`,
          message: 'A description helps customers understand what you offer',
          actionUrl: '/portal/listing',
          priority: 'high',
        });
      }

      if (!listing.phone) {
        notifications.push({
          id: `missing-phone-${listing.id}`,
          type: 'info',
          title: `${prefix}Add a phone number`,
          message: 'Make it easy for customers to contact you',
          actionUrl: '/portal/listing',
          priority: 'medium',
        });
      }

      if (!listing.website) {
        notifications.push({
          id: `missing-website-${listing.id}`,
          type: 'info',
          title: `${prefix}Add your website`,
          message: 'Drive traffic from your listing to your website',
          actionUrl: '/portal/listing',
          priority: 'medium',
        });
      }

      if (!listing.logo_url) {
        notifications.push({
          id: `missing-logo-${listing.id}`,
          type: 'info',
          title: `${prefix}Add a logo`,
          message: 'A logo makes your listing stand out in search results',
          actionUrl: '/portal/photos',
          priority: 'medium',
        });
      }
    }

    // Check for business hours on each listing
    const listingIds = listings.map((l) => l.id);

    const { data: hoursData } = await service
      .from('listing_hours')
      .select('listing_id')
      .in('listing_id', listingIds);

    const listingsWithHours = new Set((hoursData || []).map((h) => h.listing_id));
    for (const listing of listings) {
      if (!listingsWithHours.has(listing.id)) {
        const prefix = listings.length > 1 ? `${listing.business_name}: ` : '';
        notifications.push({
          id: `missing-hours-${listing.id}`,
          type: 'warning',
          title: `${prefix}Set your business hours`,
          message: 'Customers want to know when you are open',
          actionUrl: '/portal/hours',
          priority: 'high',
        });
      }
    }

    // Check subscription status
    const { data: subscriptions } = await service
      .from('subscriptions')
      .select('id, status, current_period_end, trial_end, plan:plans!inner(name)')
      .eq('account_id', user.id)
      .in('status', ['active', 'trialing']);

    if (subscriptions) {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const sub of subscriptions) {
        // Check trial ending soon
        if (sub.status === 'trialing' && sub.trial_end) {
          const trialEnd = new Date(sub.trial_end);
          if (trialEnd <= sevenDaysFromNow) {
            const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            notifications.push({
              id: `trial-ending-${sub.id}`,
              type: 'warning',
              title: 'Trial ending soon',
              message: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Add a payment method to continue.`,
              actionUrl: '/portal/billing',
              priority: 'high',
            });
          }
        }

        // Check subscription expiring soon
        if (sub.status === 'active' && sub.current_period_end) {
          const periodEnd = new Date(sub.current_period_end);
          if (periodEnd <= sevenDaysFromNow) {
            notifications.push({
              id: `sub-expiring-${sub.id}`,
              type: 'warning',
              title: 'Subscription expiring soon',
              message: 'Your subscription is about to renew. Make sure your payment method is up to date.',
              actionUrl: '/portal/billing',
              priority: 'medium',
            });
          }
        }
      }
    }

    // Check for unanswered reviews (sentiment_logs without owner_response)
    const { data: unansweredLogs } = await service
      .from('sentiment_logs')
      .select('id, listing_id')
      .in('listing_id', listingIds)
      .is('owner_response', null);

    const unansweredCount = unansweredLogs?.length || 0;
    if (unansweredCount > 0) {
      notifications.push({
        id: 'unanswered-reviews',
        type: 'action',
        title: `${unansweredCount} review${unansweredCount !== 1 ? 's' : ''} need${unansweredCount === 1 ? 's' : ''} a response`,
        message: 'Responding to reviews builds trust and improves your listing ranking',
        actionUrl: '/portal/reviews',
        priority: 'high',
      });
    }

    // Sort by priority: high > medium > low
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PORTAL/NOTIFICATIONS] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
