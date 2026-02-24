/**
 * Slack Integration Library
 *
 * Handles all Slack API communication:
 * - Signature verification for incoming webhooks
 * - Sending messages to channels
 * - Deleting messages (for anonymous feedback)
 * - Channel-based routing
 */

import crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────────────

export interface SlackEvent {
  type: string;
  event_id?: string;
  team_id?: string;
  event?: SlackMessageEvent;
  challenge?: string;
}

export interface SlackMessageEvent {
  type: string;
  subtype?: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  files?: SlackFile[];
  bot_id?: string;
}

export interface SlackFile {
  id: string;
  name: string;
  mimetype: string;
  url_private: string;
  url_private_download: string;
  size: number;
  filetype: string;
}

export interface SlackPostMessageParams {
  channel: string;
  text: string;
  thread_ts?: string;
  blocks?: any[];
}

// ── Configuration ──────────────────────────────────────────────────

function getSlackConfig() {
  return {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    feedbackChannelId: process.env.SLACK_FEEDBACK_CHANNEL_ID || '',
    brainChannelId: process.env.SLACK_BRAIN_CHANNEL_ID || '',
  };
}

// ── Signature Verification ─────────────────────────────────────────

/**
 * Verify that an incoming request is genuinely from Slack.
 * Uses HMAC-SHA256 with the Slack signing secret.
 */
export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Reject requests older than 5 minutes (replay protection)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

// ── Slack API Calls ────────────────────────────────────────────────

const SLACK_API_BASE = 'https://slack.com/api';

async function slackApiCall(method: string, body: Record<string, any>): Promise<any> {
  const { botToken } = getSlackConfig();
  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN not configured');
  }

  const response = await fetch(`${SLACK_API_BASE}/${method}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error(`[Slack API] ${method} failed:`, data.error, data.response_metadata);
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}

/**
 * Post a message to a Slack channel.
 */
export async function postMessage(params: SlackPostMessageParams): Promise<{ ts: string; channel: string }> {
  const data = await slackApiCall('chat.postMessage', params);
  return { ts: data.ts, channel: data.channel };
}

/**
 * Delete a message from a Slack channel.
 * Used for anonymous feedback — delete the original so identity is erased.
 */
export async function deleteMessage(channel: string, ts: string): Promise<void> {
  await slackApiCall('chat.delete', { channel, ts });
}

/**
 * Add a reaction to a message (used for acknowledgment).
 */
export async function addReaction(channel: string, ts: string, name: string): Promise<void> {
  await slackApiCall('reactions.add', { channel, timestamp: ts, name });
}

/**
 * Get info about a Slack channel by ID.
 */
export async function getChannelInfo(channelId: string): Promise<{ name: string; id: string }> {
  const data = await slackApiCall('conversations.info', { channel: channelId });
  return { name: data.channel.name, id: data.channel.id };
}

/**
 * Download a file from Slack (requires bot token for authentication).
 */
export async function downloadSlackFile(url: string): Promise<Buffer> {
  const { botToken } = getSlackConfig();
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${botToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download Slack file: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Channel Routing Helpers ────────────────────────────────────────

/**
 * Determine which brain/system a Slack message should route to
 * based on the channel it came from.
 */
export function classifyChannel(channelId: string): 'brain' | 'feedback' | 'unknown' {
  const config = getSlackConfig();

  if (channelId === config.brainChannelId) return 'brain';
  if (channelId === config.feedbackChannelId) return 'feedback';

  return 'unknown';
}

// ── Message Formatting ─────────────────────────────────────────────

/**
 * Format a brain classification result as a Slack message with blocks.
 */
export function formatBrainAckBlocks(classification: {
  bucket: string;
  confidence: number;
  title?: string;
}): any[] {
  const bucketEmoji: Record<string, string> = {
    people: ':busts_in_silhouette:',
    projects: ':hammer_and_wrench:',
    ideas: ':bulb:',
    admin: ':clipboard:',
  };

  const emoji = bucketEmoji[classification.bucket] || ':brain:';
  const confidence = Math.round(classification.confidence * 100);

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *Captured → ${classification.bucket}* (${confidence}% confidence)\n>${classification.title || 'Thought captured'}`,
      },
    },
  ];
}

/**
 * Format an anonymous feedback acknowledgment.
 */
export function formatFeedbackAckBlocks(): any[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':lock: *Anonymous feedback received.* Your message has been recorded and your identity has been removed. Thank you for helping improve the team.',
      },
    },
  ];
}
