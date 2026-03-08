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
  /** Child items for collapsible groups */
  children?: NavItem[];
}

/** A collapsible group of nav items */
export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  /** Children nav items inside this group */
  children: NavItem[];
  /** If true, group is expanded by default */
  defaultOpen?: boolean;
  /** Permission restrictions */
  adminOnly?: boolean;
  whiteLabelOnly?: boolean;
  platformOwnerOnly?: boolean;
}

/** Top-level nav structure: standalone items + groups */
export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry && Array.isArray((entry as NavGroup).children) && !('href' in entry && (entry as NavItem).href);
}

/**
 * Command Center (admin-v2) navigation — grouped structure.
 * Order matters — rendered top-to-bottom.
 */
export const commandCenterNavGrouped: NavEntry[] = [
  // Top-level items (always visible, no group)
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/admin-v2', feature: null },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', href: '/admin-v2?view=schedule', feature: 'calendar' },

  // ─── CONTENT FORGE ──────────────────────────────────────────────
  {
    id: 'group-content',
    label: 'CONTENT FORGE',
    icon: 'edit',
    defaultOpen: true,
    children: [
      { id: 'content-forge', label: 'Content Forge', icon: 'sparkles', href: '/admin-v2/content-forge', feature: null },
      { id: 'blog', label: 'Blog Polish', icon: 'edit', href: '/admin-v2/blog-polish', feature: 'blog' },
      { id: 'brand-voice', label: 'Brand Voice', icon: 'voice', href: '/admin-v2/brand-voice', feature: 'knowledge_base' },
      { id: 'knowledge', label: 'Knowledge Base', icon: 'database', href: '/admin-v2/knowledge', feature: 'knowledge_base' },
      { id: 'ingredients', label: 'Ingredients', icon: 'cabinet', href: '/admin-v2/ingredients', feature: null },
    ],
  },

  // ─── CREATIVE STUDIO ────────────────────────────────────────────
  {
    id: 'group-creative',
    label: 'CREATIVE STUDIO',
    icon: 'sparkles',
    children: [
      { id: 'creative-studio', label: 'Mockup Generator', icon: 'sparkles', href: '/admin-v2/creative-studio', feature: 'mockup_generator' },
      { id: 'website-builder', label: 'Website Builder', icon: 'paint', href: '/admin-v2/website-analyzer', feature: 'mockup_generator' },
      { id: 'code-studio', label: 'Code Studio', icon: 'code', href: '/admin-v2/code-studio', feature: 'mockup_generator' },
    ],
  },

  // ─── OUTREACH ───────────────────────────────────────────────────
  {
    id: 'group-outreach',
    label: 'OUTREACH',
    icon: 'campaign',
    children: [
      { id: 'campaigns', label: 'Campaigns', icon: 'campaign', href: '/admin-v2/campaigns', feature: null },
      { id: 'email', label: 'Email Engine', icon: 'mail', href: '/admin-v2/email-engine', feature: 'email' },
      { id: 'sms', label: 'SMS', icon: 'phone', href: '/admin-v2/sms', feature: 'sms' },
      { id: 'crm', label: 'CRM', icon: 'users', href: '/admin-v2/crm-dashboard', feature: 'crm' },
    ],
  },

  // ─── INTELLIGENCE ───────────────────────────────────────────────
  {
    id: 'group-intel',
    label: 'INTELLIGENCE',
    icon: 'commander',
    children: [
      { id: 'commander', label: 'Commander', icon: 'commander', href: '/admin-v2/commander', feature: null },
      { id: 'property-passport', label: 'Passports', icon: 'home', href: '/admin-v2/property-passport', feature: null },
      { id: 'filing-cabinet', label: 'Filing Cabinet', icon: 'cabinet', href: '/admin-v2/filing-cabinet', feature: null },
      { id: 'referral-network', label: 'Referral Network', icon: 'network', href: '/admin-v2/referral-network', feature: null },
      { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/admin-v2/analytics', feature: 'analytics' },
      { id: 'incidents', label: 'Incidents', icon: 'alert', href: '/admin-v2/incidents', feature: null },
    ],
  },

  // ─── ADMIN ──────────────────────────────────────────────────────
  {
    id: 'group-admin',
    label: 'ADMIN',
    icon: 'cog',
    children: [
      { id: 'settings', label: 'Settings', icon: 'cog', href: '/admin-v2/settings', feature: null },
      { id: 'access-codes', label: 'Access Codes', icon: 'ticket', href: '/admin-v2/access-codes', feature: null, adminOnly: true },
      { id: 'theme-settings', label: 'Theme Settings', icon: 'palette', href: '/admin-v2/theme-settings', feature: null, whiteLabelOnly: true },
      { id: 'platform-costs', label: 'API Costs', icon: 'dollar', href: '/admin-v2/platform-costs', feature: null, platformOwnerOnly: true },
      { id: 'audit', label: 'Audit Logs', icon: 'shield', href: '/admin-v2/audit', feature: null, adminOnly: true },
    ],
  },

  // ─── PLATFORM (HQ only) ────────────────────────────────────────
  {
    id: 'group-platform',
    label: 'PLATFORM',
    icon: 'shield',
    platformOwnerOnly: true,
    children: [
      { id: 'hq', label: 'Greenline HQ', icon: 'shield', href: '/admin-v2/hq', feature: null, platformOwnerOnly: true },
    ],
  },
];

/**
 * Flat list for backwards compatibility — used by any code that still
 * expects commandCenterNav as NavItem[].
 */
export const commandCenterNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/admin-v2', feature: null },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', href: '/admin-v2?view=schedule', feature: 'calendar' },
  // --- Content Forge ---
  { id: 'divider-content', label: 'CONTENT FORGE', icon: '', href: '', feature: null, isDivider: true },
  { id: 'content-forge', label: 'Content Forge', icon: 'sparkles', href: '/admin-v2/content-forge', feature: null },
  { id: 'blog', label: 'Blog Polish', icon: 'edit', href: '/admin-v2/blog-polish', feature: 'blog' },
  { id: 'brand-voice', label: 'Brand Voice', icon: 'voice', href: '/admin-v2/brand-voice', feature: 'knowledge_base' },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'database', href: '/admin-v2/knowledge', feature: 'knowledge_base' },
  { id: 'ingredients', label: 'Ingredients', icon: 'cabinet', href: '/admin-v2/ingredients', feature: null },
  // --- Creative Studio ---
  { id: 'divider-creative', label: 'CREATIVE STUDIO', icon: '', href: '', feature: null, isDivider: true },
  { id: 'creative-studio', label: 'Mockup Generator', icon: 'sparkles', href: '/admin-v2/creative-studio', feature: 'mockup_generator' },
  { id: 'website-builder', label: 'Website Builder', icon: 'paint', href: '/admin-v2/website-analyzer', feature: 'mockup_generator' },
  { id: 'code-studio', label: 'Code Studio', icon: 'code', href: '/admin-v2/code-studio', feature: 'mockup_generator' },
  // --- Outreach ---
  { id: 'divider-outreach', label: 'OUTREACH', icon: '', href: '', feature: null, isDivider: true },
  { id: 'campaigns', label: 'Campaigns', icon: 'campaign', href: '/admin-v2/campaigns', feature: null },
  { id: 'email', label: 'Email Engine', icon: 'mail', href: '/admin-v2/email-engine', feature: 'email' },
  { id: 'sms', label: 'SMS', icon: 'phone', href: '/admin-v2/sms', feature: 'sms' },
  { id: 'crm', label: 'CRM', icon: 'users', href: '/admin-v2/crm-dashboard', feature: 'crm' },
  // --- Intelligence ---
  { id: 'divider-intel', label: 'INTELLIGENCE', icon: '', href: '', feature: null, isDivider: true },
  { id: 'commander', label: 'Commander', icon: 'commander', href: '/admin-v2/commander', feature: null },
  { id: 'property-passport', label: 'Passports', icon: 'home', href: '/admin-v2/property-passport', feature: null },
  { id: 'filing-cabinet', label: 'Filing Cabinet', icon: 'cabinet', href: '/admin-v2/filing-cabinet', feature: null },
  { id: 'referral-network', label: 'Referral Network', icon: 'network', href: '/admin-v2/referral-network', feature: null },
  { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/admin-v2/analytics', feature: 'analytics' },
  { id: 'incidents', label: 'Incidents', icon: 'alert', href: '/admin-v2/incidents', feature: null },
  // --- Admin ---
  { id: 'divider-admin', label: 'ADMIN', icon: '', href: '', feature: null, isDivider: true },
  { id: 'settings', label: 'Settings', icon: 'cog', href: '/admin-v2/settings', feature: null },
  { id: 'access-codes', label: 'Access Codes', icon: 'ticket', href: '/admin-v2/access-codes', feature: null, adminOnly: true },
  { id: 'theme-settings', label: 'Theme Settings', icon: 'palette', href: '/admin-v2/theme-settings', feature: null, whiteLabelOnly: true },
  { id: 'platform-costs', label: 'API Costs', icon: 'dollar', href: '/admin-v2/platform-costs', feature: null, platformOwnerOnly: true },
  { id: 'audit', label: 'Audit Logs', icon: 'shield', href: '/admin-v2/audit', feature: null, adminOnly: true },
  // --- Platform ---
  { id: 'divider-platform', label: 'PLATFORM', icon: '', href: '', feature: null, isDivider: true, platformOwnerOnly: true },
  { id: 'hq', label: 'Greenline HQ', icon: 'shield', href: '/admin-v2/hq', feature: null, platformOwnerOnly: true },
];

/**
 * Public site navigation items (Navbar).
 */
export const publicNav = [
  { href: '/', label: 'Directory' },
  { href: '/loops', label: 'Experiences' },
  { href: '/home-ledger', label: 'Home Ledger' },
  { href: '/services', label: 'Our Services' },
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

/**
 * Filter grouped nav entries based on user permissions.
 */
export function filterNavEntries(
  entries: NavEntry[],
  permissions: {
    hasFeature: (key: string) => boolean;
    isAdmin: boolean;
    isWhiteLabel: boolean;
    isPlatformOwner: boolean;
  }
): NavEntry[] {
  return entries.reduce<NavEntry[]>((acc, entry) => {
    if (isNavGroup(entry)) {
      if (entry.platformOwnerOnly && !permissions.isPlatformOwner) return acc;
      if (entry.adminOnly && !permissions.isAdmin) return acc;
      if (entry.whiteLabelOnly && !permissions.isWhiteLabel) return acc;

      const filteredChildren = filterNavItems(entry.children, permissions);
      if (filteredChildren.length > 0) {
        acc.push({ ...entry, children: filteredChildren });
      }
    } else {
      const [item] = filterNavItems([entry], permissions);
      if (item) acc.push(item);
    }
    return acc;
  }, []);
}
