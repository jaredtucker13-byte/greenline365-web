/**
 * Universal QR Code Generator — GL365
 *
 * Self-hosted QR generation for every entity type:
 * - Blast Deals (claim URLs)
 * - Identity Passports (personal QR wristband)
 * - Events (check-in)
 * - Game Nights (session join)
 * - Loyalty Programs (visit tracking)
 * - Challenges (stop check-in)
 * - Groups (invite / handshake)
 * - Open Houses (visitor sign-in)
 * - Game Maker QR (box scan → auto-detect game)
 *
 * No external API dependency — generates SVG and PNG locally via `qrcode` lib.
 */
import QRCode from 'qrcode';

// GL365 brand colors
const GL365_GOLD = '#C9A96E';
const GL365_BLACK = '#0A0A0A';
const GL365_WHITE = '#FFFFFF';

// ─── Entity Types ────────────────────────────────────────────────
export type QREntityType =
  | 'deal'            // Blast Deal claim
  | 'identity'        // Identity Passport
  | 'event'           // Event check-in
  | 'session'         // Game Night join
  | 'loyalty'         // Loyalty visit scan
  | 'challenge_stop'  // City Passport challenge stop
  | 'group_invite'    // Group invite / handshake
  | 'open_house'      // Real estate open house sign-in
  | 'game_box'        // Game Maker QR (on physical box)
  | 'facility'        // Parks & Rec facility booking
  | 'custom';         // Freeform URL

// ─── Options ─────────────────────────────────────────────────────
export interface QRGenerateOptions {
  /** The entity type — determines the URL path prefix */
  type: QREntityType;
  /** Unique identifier for the entity (deal ID, passport code, etc.) */
  entityId: string;
  /** Output format */
  format?: 'svg' | 'png' | 'dataurl';
  /** QR image size in pixels (default 256) */
  size?: number;
  /** Color scheme */
  theme?: 'brand' | 'dark' | 'light' | 'print';
  /** Error correction level (L=7%, M=15%, Q=25%, H=30%) */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  /** Optional custom URL override (bypasses automatic URL building) */
  customUrl?: string;
  /** Margin (quiet zone) in modules (default 2) */
  margin?: number;
}

export interface QRGenerateResult {
  /** The encoded URL */
  url: string;
  /** QR code image data (SVG string, PNG buffer, or data URL) */
  image: string | Buffer;
  /** Output format */
  format: 'svg' | 'png' | 'dataurl';
  /** Image dimensions */
  size: number;
  /** Entity metadata */
  entity: {
    type: QREntityType;
    id: string;
  };
}

// ─── URL Builder ─────────────────────────────────────────────────

/**
 * Build the scan URL for a given entity type.
 * All QR codes point to a /scan/[type]/[id] route that handles
 * the redirect/action based on entity type.
 */
function buildScanUrl(type: QREntityType, entityId: string, customUrl?: string): string {
  if (customUrl) return customUrl;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

  const pathMap: Record<QREntityType, string> = {
    deal:           `/claim/${entityId}`,
    identity:       `/scan/identity/${entityId}`,
    event:          `/scan/event/${entityId}`,
    session:        `/scan/session/${entityId}`,
    loyalty:        `/scan/loyalty/${entityId}`,
    challenge_stop: `/scan/challenge/${entityId}`,
    group_invite:   `/invite/${entityId}`,
    open_house:     `/scan/openhouse/${entityId}`,
    game_box:       `/scan/game/${entityId}`,
    facility:       `/scan/facility/${entityId}`,
    custom:         `/${entityId}`,
  };

  return `${baseUrl}${pathMap[type]}`;
}

// ─── Theme Colors ────────────────────────────────────────────────

function getColors(theme: QRGenerateOptions['theme'] = 'brand') {
  switch (theme) {
    case 'brand':
      return { dark: GL365_GOLD, light: GL365_BLACK };
    case 'dark':
      return { dark: GL365_WHITE, light: GL365_BLACK };
    case 'light':
      return { dark: GL365_BLACK, light: GL365_WHITE };
    case 'print':
      // High contrast for printed materials (game boxes, flyers, business cards)
      return { dark: '#000000', light: '#FFFFFF' };
    default:
      return { dark: GL365_GOLD, light: GL365_BLACK };
  }
}

// ─── Generator ───────────────────────────────────────────────────

/**
 * Generate a QR code for any GL365 entity.
 *
 * Usage:
 *   // SVG for web display
 *   const result = await generateQR({ type: 'deal', entityId: 'BLAST-COFFEE-2X4K' });
 *
 *   // PNG for email embedding
 *   const result = await generateQR({ type: 'deal', entityId: 'abc123', format: 'png' });
 *
 *   // Data URL for inline <img>
 *   const result = await generateQR({ type: 'identity', entityId: 'usr_abc', format: 'dataurl' });
 *
 *   // Print-friendly for physical materials
 *   const result = await generateQR({ type: 'game_box', entityId: 'catan-base', theme: 'print', size: 512 });
 */
export async function generateQR(options: QRGenerateOptions): Promise<QRGenerateResult> {
  const {
    type,
    entityId,
    format = 'svg',
    size = 256,
    theme = 'brand',
    errorCorrection = 'M',
    customUrl,
    margin = 2,
  } = options;

  const url = buildScanUrl(type, entityId, customUrl);
  const colors = getColors(theme);

  const qrOptions: QRCode.QRCodeRenderersOptions = {
    errorCorrectionLevel: errorCorrection,
    margin,
    width: size,
    color: {
      dark: colors.dark,
      light: colors.light,
    },
  };

  let image: string | Buffer;

  switch (format) {
    case 'svg':
      image = await QRCode.toString(url, { ...qrOptions, type: 'svg' });
      break;
    case 'png':
      image = await QRCode.toBuffer(url, { ...qrOptions, type: 'png' });
      break;
    case 'dataurl':
      image = await QRCode.toDataURL(url, qrOptions);
      break;
    default:
      image = await QRCode.toString(url, { ...qrOptions, type: 'svg' });
  }

  return {
    url,
    image,
    format,
    size,
    entity: { type, id: entityId },
  };
}

// ─── Convenience Functions ───────────────────────────────────────

/** Generate a Blast Deal QR code (SVG, brand colors) */
export async function generateDealQR(claimCode: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'deal', entityId: claimCode, ...options });
}

/** Generate an Identity Passport QR code */
export async function generatePassportQR(passportCode: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'identity', entityId: passportCode, errorCorrection: 'H', ...options });
}

/** Generate an Event check-in QR code */
export async function generateEventQR(eventId: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'event', entityId: eventId, ...options });
}

/** Generate a Game Night session QR code */
export async function generateSessionQR(sessionId: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'session', entityId: sessionId, ...options });
}

/** Generate a Loyalty scan QR code for a business */
export async function generateLoyaltyQR(businessSlug: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'loyalty', entityId: businessSlug, ...options });
}

/** Generate a Challenge stop QR code */
export async function generateChallengeStopQR(stopId: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'challenge_stop', entityId: stopId, ...options });
}

/** Generate a Group invite QR code */
export async function generateGroupInviteQR(inviteCode: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'group_invite', entityId: inviteCode, ...options });
}

/** Generate an Open House sign-in QR code */
export async function generateOpenHouseQR(openHouseId: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({ type: 'open_house', entityId: openHouseId, ...options });
}

/** Generate a Game Box QR code (high error correction for printed materials) */
export async function generateGameBoxQR(qrIdentifier: string, options?: Partial<QRGenerateOptions>) {
  return generateQR({
    type: 'game_box',
    entityId: qrIdentifier,
    theme: 'print',
    errorCorrection: 'H',
    size: 512,
    ...options,
  });
}
