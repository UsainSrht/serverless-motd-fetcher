// Types definition for Cloudflare Worker & Discord Minecraft MOTD Fetcher

export interface Env {
  DB: D1Database;
  DISCORD_TOKEN?: string;
  API_SECRET?: string;
  ENVIRONMENT?: string;
  DEFAULT_CRON_INTERVAL?: string;
}

export type UpdateType = 'channel_name' | 'message' | 'embed';

export interface ServerRecord {
  id: number;
  name: string;
  mc_address: string;
  discord_channel_id: string;
  discord_message_id: string | null;
  update_type: UpdateType;
  format_template: string;
  is_active: number; // 1 or 0
  last_synced_at: string | null;
  last_status: 'online' | 'offline' | 'error' | null;
  last_error: string | null;
  last_name_or_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateServerInput {
  name?: string;
  mc_address: string;
  discord_channel_id: string;
  discord_message_id?: string | null;
  update_type: UpdateType;
  format_template: string;
  is_active?: number;
}

export interface UpdateServerInput {
  name?: string;
  mc_address?: string;
  discord_channel_id?: string;
  discord_message_id?: string | null;
  update_type?: UpdateType;
  format_template?: string;
  is_active?: number;
}

export interface MinecraftStatus {
  online: boolean;
  ip: string;
  port: number;
  hostname?: string;
  players: {
    online: number;
    max: number;
    list?: Array<{ name: string; uuid?: string }>;
  };
  version: string;
  motd: {
    raw: string[];
    clean: string[];
    html?: string[];
  };
  icon?: string | null;
  protocol?: number;
  retrieved_at: string;
}

export interface DiscordEmbedFooter {
  text: string;
  icon_url?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface DiscordEmbedImage {
  url: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: DiscordEmbedFooter;
  image?: DiscordEmbedImage;
  thumbnail?: DiscordEmbedImage;
  author?: DiscordEmbedAuthor;
  fields?: DiscordEmbedField[];
}

export interface DiscordMessagePayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

export interface SyncResult {
  serverId: number;
  name: string;
  address: string;
  success: boolean;
  online: boolean;
  updateType: UpdateType;
  targetChanged: boolean;
  error?: string;
  executedAt: string;
}
