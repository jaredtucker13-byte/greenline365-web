/**
 * Address display helper for directory listings.
 * Mobile/service-area businesses show a radius description instead of a street address.
 * Brick-and-mortar businesses show the full street address with a map pin.
 */

interface ListingAddressInput {
  is_mobile_service?: boolean;
  service_area_display?: string | null;
  service_area_radius_miles?: number | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

export interface ListingDisplayAddress {
  /** Human-readable address or service area text */
  displayText: string;
  /** Whether to show the street address (false for mobile businesses) */
  showStreetAddress: boolean;
  /** Map display type: 'pin' for brick-and-mortar, 'circle' for mobile/service area */
  mapType: 'pin' | 'circle';
  /** Radius in miles for circle overlay (only meaningful when mapType is 'circle') */
  mapRadius: number;
}

export function getListingDisplayAddress(listing: ListingAddressInput): ListingDisplayAddress {
  if (listing.is_mobile_service) {
    const fallback = [listing.city, listing.state].filter(Boolean).join(', ');
    const displayText =
      listing.service_area_display ||
      (fallback ? `Servicing: ${fallback} & Surrounding Areas` : 'Mobile Service — Area Varies');

    return {
      displayText,
      showStreetAddress: false,
      mapType: 'circle',
      mapRadius: listing.service_area_radius_miles || 25,
    };
  }

  const parts = [listing.address_line1, listing.city, listing.state].filter(Boolean);
  if (listing.zip_code) {
    // Append zip to last part (e.g. "FL 33040")
    if (parts.length > 0) {
      parts[parts.length - 1] = `${parts[parts.length - 1]} ${listing.zip_code}`;
    } else {
      parts.push(listing.zip_code);
    }
  }

  return {
    displayText: parts.join(', '),
    showStreetAddress: true,
    mapType: 'pin',
    mapRadius: 0,
  };
}
