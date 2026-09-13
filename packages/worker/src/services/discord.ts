import { DiscordMessagePayload } from '../types';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface DiscordChannelResponse {
  id: string;
  type: number;
  name: string;
  guild_id?: string;
  position?: number;
}

export interface DiscordMessageResponse {
  id: string;
  channel_id: string;
  content: string;
  author: {
    id: string;
    username: string;
    bot?: boolean;
  };
}

export interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot: boolean;
}

/**
 * Validates bot token and retrieves bot metadata
 */
export async function testBotToken(token: string): Promise<DiscordUserResponse> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bot ${token}`,
      'User-Agent': 'CloudflareWorker-MinecraftMOTDFetcher/1.0',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Discord authentication failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Fetches Discord channel details
 */
export async function getChannel(token: string, channelId: string): Promise<DiscordChannelResponse> {
  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
    headers: {
      Authorization: `Bot ${token}`,
      'User-Agent': 'CloudflareWorker-MinecraftMOTDFetcher/1.0',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Discord channel ${channelId} (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Updates channel name.
 * Note: Discord imposes a rate limit of 2 updates per 10 minutes per channel.
 */
export async function updateChannelName(
  token: string,
  channelId: string,
  name: string
): Promise<DiscordChannelResponse> {
  // Truncate to Discord's maximum 100 character channel name limit
  const sanitizedName = name.slice(0, 100);

  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CloudflareWorker-MinecraftMOTDFetcher/1.0',
    },
    body: JSON.stringify({ name: sanitizedName }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update Discord channel name (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Updates existing Discord message content or embed
 */
export async function updateMessage(
  token: string,
  channelId: string,
  messageId: string,
  payload: DiscordMessagePayload
): Promise<DiscordMessageResponse> {
  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CloudflareWorker-MinecraftMOTDFetcher/1.0',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update Discord message (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Creates a new message in channel (useful for auto-generating message ID)
 */
export async function createMessage(
  token: string,
  channelId: string,
  payload: DiscordMessagePayload
): Promise<DiscordMessageResponse> {
  const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CloudflareWorker-MinecraftMOTDFetcher/1.0',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send Discord message (${res.status}): ${errorText}`);
  }

  return await res.json();
}
