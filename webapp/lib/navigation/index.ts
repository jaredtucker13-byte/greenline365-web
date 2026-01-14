/**
 * Navigation Module
 * 
 * Hub-and-spoke navigation system for GreenLine365 admin.
 * 
 * Usage:
 * 1. Wrap app with <NavigationProvider>
 * 2. Use useNavigation() hook for navigation actions
 * 3. Use <NavLink> for tracked navigation links
 * 4. Use <Breadcrumbs> to show current location
 * 5. Use <BackButton> for consistent back behavior
 */

export { NavigationProvider, useNavigation, createReturnLink, getReturnToFromUrl, getPageInfo } from './NavigationContext';
export { NavLink } from './NavLink';
export { Breadcrumbs } from './Breadcrumbs';
export { BackButton } from './BackButton';
