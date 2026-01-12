import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Social Connections API
 * 
 * Framework for users to connect their own social media accounts.
 * Users provide their own OAuth credentials/tokens.
 * 
 * Supported platforms:
 * - Instagram (via Meta Business API)
 * - Facebook Pages (via Meta Business API)
 * - X/Twitter
 * - LinkedIn
 */

interface SocialConnection {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  accountName?: string;
  profileUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'connect':
        return connectAccount(supabase, user.id, body.connection as SocialConnection);
      case 'disconnect':
        return disconnectAccount(supabase, user.id, body.platform);
      case 'list':
        return listConnections(supabase, user.id);
      case 'verify':
        return verifyConnection(supabase, user.id, body.platform);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Social API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function connectAccount(supabase: any, userId: string, connection: SocialConnection) {
  if (!connection.platform || !connection.accessToken) {
    return NextResponse.json({ error: 'Platform and accessToken required' }, { status: 400 });
  }

  // Validate token by making a test API call based on platform
  const validation = await validateToken(connection);
  if (!validation.valid) {
    return NextResponse.json({ 
      error: 'Invalid access token', 
      details: validation.error 
    }, { status: 400 });
  }

  // Store connection (encrypted in production)
  const { data, error } = await supabase
    .from('social_connections')
    .upsert({
      user_id: userId,
      platform: connection.platform,
      access_token: connection.accessToken, // Should be encrypted in production
      refresh_token: connection.refreshToken,
      expires_at: connection.expiresAt,
      account_id: validation.accountId,
      account_name: validation.accountName,
      profile_url: validation.profileUrl,
      connected_at: new Date().toISOString(),
      is_active: true,
    }, { 
      onConflict: 'user_id,platform' 
    })
    .select('platform, account_name, profile_url, connected_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the connection event
  await supabase.from('memory_event_journal').insert({
    user_id: userId,
    event_type: 'social_connected',
    event_category: 'social',
    title: `Connected ${connection.platform}`,
    metadata: { platform: connection.platform, accountName: validation.accountName },
  });

  return NextResponse.json({
    success: true,
    connection: data,
  });
}

async function disconnectAccount(supabase: any, userId: string, platform: string) {
  if (!platform) {
    return NextResponse.json({ error: 'Platform required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('social_connections')
    .update({ is_active: false, disconnected_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('platform', platform);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function listConnections(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('social_connections')
    .select('platform, account_name, profile_url, connected_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // List of all platforms with connection status
  const platforms = ['instagram', 'facebook', 'twitter', 'linkedin'];
  const connections = platforms.map(platform => {
    const existing = data?.find((c: any) => c.platform === platform);
    return {
      platform,
      connected: !!existing,
      accountName: existing?.account_name,
      profileUrl: existing?.profile_url,
      connectedAt: existing?.connected_at,
    };
  });

  return NextResponse.json({ connections });
}

async function verifyConnection(supabase: any, userId: string, platform: string) {
  const { data, error } = await supabase
    .from('social_connections')
    .select('access_token, platform')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ 
      valid: false, 
      error: 'Connection not found' 
    });
  }

  const validation = await validateToken({
    platform: data.platform,
    accessToken: data.access_token,
  });

  return NextResponse.json({
    valid: validation.valid,
    accountName: validation.accountName,
    error: validation.error,
  });
}

async function validateToken(connection: Partial<SocialConnection>): Promise<{
  valid: boolean;
  accountId?: string;
  accountName?: string;
  profileUrl?: string;
  error?: string;
}> {
  try {
    switch (connection.platform) {
      case 'instagram':
      case 'facebook':
        // Meta Graph API validation
        const metaResponse = await fetch(
          `https://graph.facebook.com/me?access_token=${connection.accessToken}`
        );
        if (!metaResponse.ok) {
          return { valid: false, error: 'Invalid Meta access token' };
        }
        const metaData = await metaResponse.json();
        return {
          valid: true,
          accountId: metaData.id,
          accountName: metaData.name,
          profileUrl: `https://facebook.com/${metaData.id}`,
        };

      case 'twitter':
        // Twitter API v2 validation
        const twitterResponse = await fetch(
          'https://api.twitter.com/2/users/me',
          {
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
            },
          }
        );
        if (!twitterResponse.ok) {
          return { valid: false, error: 'Invalid Twitter access token' };
        }
        const twitterData = await twitterResponse.json();
        return {
          valid: true,
          accountId: twitterData.data?.id,
          accountName: twitterData.data?.username,
          profileUrl: `https://twitter.com/${twitterData.data?.username}`,
        };

      case 'linkedin':
        // LinkedIn API validation
        const linkedinResponse = await fetch(
          'https://api.linkedin.com/v2/me',
          {
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
            },
          }
        );
        if (!linkedinResponse.ok) {
          return { valid: false, error: 'Invalid LinkedIn access token' };
        }
        const linkedinData = await linkedinResponse.json();
        return {
          valid: true,
          accountId: linkedinData.id,
          accountName: `${linkedinData.localizedFirstName} ${linkedinData.localizedLastName}`,
          profileUrl: `https://linkedin.com/in/${linkedinData.id}`,
        };

      default:
        return { valid: false, error: 'Unsupported platform' };
    }
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

// GET endpoint for listing connections
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return listConnections(supabase, user.id);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
