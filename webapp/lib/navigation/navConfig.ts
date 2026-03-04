/**
 * Single-Source Navigation Configuration
 *
 * ALL dashboard nav items are defined here. Sidebar components import
 * from this file instead of defining their own inline arrays.
 *
 * Permission model:
 * - feature:           Feature flag key from BusinessContext (tier-gated)
 * - adminOnly:         Requires is_admin on profiles
 * - whiteLabelOnly:    Requires is_white_label on business
 * - platformOwnerOnly: Requires super_admin role (Greenline HQ)
 */

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  /** Feature flag key — item hidden if feature is disabled for the tenant */
  feature: string | null;
  /** Section divider (not a link) */
  isDivider?: boolean;
  /** Only visible to users with is_admin */
  adminOnly?: boolean;
  /** Only visible to white-label businesses */
  whiteLabelOnly?: boolean;
  /** Only visible to Greenline HQ operators (super_admin role) */
  platformOwnerOnly?: boolean;
}

/**
 * Command Center (admin-v2) navigation items.
 * Order matters — rendered top-to-bottom.
 */
export const commandCenterNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/admin-v2', feature: null },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', href: '/admin-v2?view=schedule', feature: 'calendar' },
  // --- Property Intelligence ---
  { id: 'divider-property', label: 'PROPERTY INTEL', icon: '', href: '', feature: null, isDivider: true },
  { id: 'commander', label: 'Commander', icon: 'commander', href: '/admin-v2/commander', feature: null },
  { id: 'property-passport', label: 'Passports', icon: 'home', href: '/admin-v2/property-passport', feature: null },
  { id: 'filing-cabinet', label: 'Filing Cabinet', icon: 'cabinet', href: '/admin-v2/filing-cabinet', feature: null },
  { id: 'referral-network', label: 'Referral Network', icon: 'network', href: '/admin-v2/referral-network', feature: null },
  // --- Content & Tools ---
  { id: 'divider-tools', label: 'TOOLS', icon: '', href: '', feature: null, isDivider: true },
  { id: 'creative-studio', label: 'Creative Studio', icon: 'sparkles', href: '/admin-v2/creative-studio', feature: 'mockup_generator' },
  { id: 'blog', label: 'Blog', icon: 'edit', href: '/admin-v2/blog-polish', feature: 'blog' },
  { id: 'website-builder', label: 'Website Builder', icon: 'paint', href: '/admin-v2/website-analyzer', feature: 'mockup_generator' },
  { id: 'code-studio', label: 'Code Studio', icon: 'code', href: '/admin-v2/code-studio', feature: 'mockup_generator' },
  { id: 'incidents', label: 'Incidents', icon: 'alert', href: '/admin-v2/incidents', feature: null },
  { id: 'campaigns', label: 'Campaigns', icon: 'campaign', href: '/admin-v2/campaigns', feature: null },
  { id: 'email', label: 'Email Engine', icon: 'mail', href: '/admin-v2/email-engine', feature: 'email' },
  { id: 'sms', label: 'SMS', icon: 'phone', href: '/admin-v2/sms', feature: 'sms' },
  { id: 'crm', label: 'CRM', icon: 'users', href: '/admin-v2/crm-dashboard', feature: 'crm' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/admin-v2/analytics', feature: 'analytics' },
  { id: 'access-codes', label: 'Access Codes', icon: 'ticket', href: '/admin-v2/access-codes', feature: null, adminOnly: true },
  { id: 'brand-voice', label: 'Brand Voice', icon: 'voice', href: '/admin-v2/brand-voice', feature: 'knowledge_base' },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'database', href: '/admin-v2/knowledge', feature: 'knowledge_base' },
  { id: 'theme-settings', label: 'Theme Settings', icon: 'palette', href: '/admin-v2/theme-settings', feature: null, whiteLabelOnly: true },
  { id: 'platform-costs', label: 'API Costs', icon: 'dollar', href: '/admin-v2/platform-costs', feature: null, platformOwnerOnly: true },
  { id: 'audit', label: 'Audit Logs', icon: 'shield', href: '/admin-v2/audit', feature: null, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'cog', href: '/admin-v2/settings', feature: null },
  // --- Greenline HQ ---
  { id: 'divider-platform', label: 'PLATFORM', icon: '', href: '', feature: null, isDivider: true, platformOwnerOnly: true },
  { id: 'hq', label: 'Greenline HQ', icon: 'shield', href: '/admin-v2/hq', feature: null, platformOwnerOnly: true },
];

/**
 * Public site navigation items (Navbar).
 * Audit 2026-03: Stripped to directory-only public nav.
 */
export const publicNav = [
  { href: '/', label: 'Destinations' },
  { href: '/categories', label: 'Categories' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Destination subpage navigation (replaces center links on /destination/* routes).
 */
export const destinationSubNav = [
  { href: '', label: 'Destinations', anchor: true },
  { href: '', label: 'Things to Do', section: 'things-to-do' },
  { href: '', label: 'Eat & Drink', section: 'eat-drink' },
  { href: '', label: 'Stay', section: 'stay' },
];

/**
 * Routes where the public Navbar and Footer should be hidden.
 */
export const dashboardRoutePatterns = ['/admin-v2', '/dashboard', '/greenline-hq'];

/**
 * Check if a pathname matches a dashboard route (hides Navbar/Footer).
 */
export function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return dashboardRoutePatterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Filter nav items based on user permissions.
 */
export function filterNavItems(
  items: NavItem[],
  permissions: {
    hasFeature: (key: string) => boolean;
    isAdmin: boolean;
    isWhiteLabel: boolean;
    isPlatformOwner: boolean;
  }
): NavItem[] {
  return items.filter(item => {
    if (item.isDivider) {
      if (item.platformOwnerOnly && !permissions.isPlatformOwner) return false;
      return true;
    }
    if (item.platformOwnerOnly && !permissions.isPlatformOwner) return false;
    if (item.adminOnly && !permissions.isAdmin) return false;
    if (item.whiteLabelOnly && !permissions.isWhiteLabel) return false;
    if (item.feature) return permissions.hasFeature(item.feature);
    return true;
  });
}
