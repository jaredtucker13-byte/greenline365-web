/**
 * Universal QR Code API
 *
 * GET /api/qr?type=deal&id=BLAST-COFFEE-2X4K
 * GET /api/qr?type=identity&id=usr_abc123
 * GET /api/qr?type=event&id=evt_123&format=png
 * GET /api/qr?type=session&id=sess_abc&theme=dark&size=512
 *
 * Returns QR code as SVG (default), PNG, or JSON with data URL.
 * Self-hosted — no external API dependency.
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateQR, type QREntityType, type QRGenerateOptions } from '@/lib/qr/generate';

const VALID_TYPES: QREntityType[] = [
  'deal', 'identity', 'event', 'session', 'loyalty',
  'challenge_stop', 'group_invite', 'open_house', 'game_box',
  'facility', 'custom',
];

const VALID_FORMATS = ['svg', 'png', 'dataurl', 'json'] as const;
const VALID_THEMES = ['brand', 'dark', 'light', 'print'] as const;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    // Required params
    const type = params.get('type') as QREntityType;
    const entityId = params.get('id');

    if (!type || !entityId) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and id' },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Optional params
    const rawFormat = params.get('format') || 'svg';
    const returnJson = rawFormat === 'json';
    const format = returnJson ? 'dataurl' : rawFormat;

    if (!VALID_FORMATS.includes(rawFormat as any)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    const theme = (params.get('theme') || 'brand') as QRGenerateOptions['theme'];
    if (!VALID_THEMES.includes(theme as any)) {
      return NextResponse.json(
        { error: `Invalid theme. Must be one of: ${VALID_THEMES.join(', ')}` },
        { status: 400 }
      );
    }

    const size = Math.min(Math.max(parseInt(params.get('size') || '256'), 64), 2048);
    const errorCorrection = (params.get('ec') || 'M') as QRGenerateOptions['errorCorrection'];
    const customUrl = params.get('url') || undefined;

    const result = await generateQR({
      type,
      entityId,
      format: format as 'svg' | 'png' | 'dataurl',
      size,
      theme,
      errorCorrection,
      customUrl,
    });

    // Return based on format
    if (returnJson) {
      return NextResponse.json({
        success: true,
        qr: {
          type: result.entity.type,
          entity_id: result.entity.id,
          url: result.url,
          image_data_url: result.image as string,
          size: result.size,
          format: 'dataurl',
        },
      });
    }

    if (format === 'svg') {
      return new NextResponse(result.image as string, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (format === 'png') {
      const buffer = result.image as Buffer;
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // dataurl format (not json)
    return NextResponse.json({
      success: true,
      qr: {
        type: result.entity.type,
        entity_id: result.entity.id,
        url: result.url,
        image_data_url: result.image as string,
        size: result.size,
        format: 'dataurl',
      },
    });
  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error.message },
      { status: 500 }
    );
  }
}
