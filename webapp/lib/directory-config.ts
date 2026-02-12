/**
 * Industry-specific placeholder images for free tier listings.
 * Used when a listing has no custom photos or is on the free tier.
 */

export const PLACEHOLDER_IMAGES: Record<string, string> = {
  'services': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/433e824b6f91751093de179d3a4f1fbf6bfb1d803373d48229062bd5de7bee90.png',
  'dining': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/3ed2bd102dc43732e925e049585f090d6aef166a029d6210d6b0c276962d7c41.png',
  'health-wellness': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/f2721225e4b030854540cd5fc38bf2dc1d69a7599d3fe2fe48665d128425ec6c.png',
  'style-shopping': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/77bed9f041c32f37a364c58fe0a0562aa73b6c183b85f55ca5f035d8e8dfb3ad.png',
  'nightlife': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/689ec3dcbbc4b408a63e3e832699d00a959d504f1d0ea95cc7fee21e2c72e1b2.png',
  'family-entertainment': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/2bad0d9c928a57d5d3b00a6e159c3d51e7a55c5af8c40d5f146dc0b11313c4bb.png',
  'destinations': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/2bad0d9c928a57d5d3b00a6e159c3d51e7a55c5af8c40d5f146dc0b11313c4bb.png',
  'hotels-lodging': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/56db76a66af0d978931f7baca924f64a23006e9883e7b45fb677b52c5f62be79.png',
  'professional-services': 'https://static.prod-images.emergentagent.com/jobs/b5fc704f-5976-4877-a35c-beeb0ec1a989/images/3b64d4ebcbbef46cdb773ebe76236d63854da48d419c53bd9a49daa1cfc42ef5.png',
};

export function getPlaceholderImage(industry: string): string {
  return PLACEHOLDER_IMAGES[industry] || PLACEHOLDER_IMAGES['services'];
}

/**
 * Non-claimable business types — chain stores, convenience stores, etc.
 * These exist for directory completeness but aren't outreach targets.
 */
const NON_CLAIMABLE_KEYWORDS = [
  'walgreens', 'cvs', 'walmart', 'target', 'publix', 'winn-dixie',
  'mcdonald', 'burger king', 'wendy', 'taco bell', 'subway',
  'shell', 'bp', 'chevron', 'exxon', '7-eleven', 'circle k',
  'dollar general', 'dollar tree', 'family dollar',
  'starbucks', 'dunkin',
  'hospital', 'police', 'fire station', 'fire department',
  'post office', 'usps', 'library', 'dmv',
  'costco', 'sam\'s club', 'aldi', 'trader joe',
  'home depot', 'lowe\'s', 'lowes',
];

export function isClaimable(businessName: string): boolean {
  const lower = businessName.toLowerCase();
  return !NON_CLAIMABLE_KEYWORDS.some(kw => lower.includes(kw));
}
