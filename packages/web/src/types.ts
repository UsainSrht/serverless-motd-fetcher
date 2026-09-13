export type UpdateType = 'channel_name' | 'message' | 'embed';

export interface Server {
  id: number;
  name: string;
  mc_address: string;
  discord_channel_id: string;
  discord_message_id: string | null;
  update_type: UpdateType;
  format_template: string;
  is_active: number;
  last_synced_at: string | null;
  last_status: 'online' | 'offline' | 'error' | null;
  last_error: string | null;
  last_name_or_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateServerInput {
  name: string;
  mc_address: string;
  discord_channel_id: string;
  discord_message_id?: string | null;
  update_type: UpdateType;
  format_template: string;
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
  };
  version: string;
  motd: {
    raw: string[];
    clean: string[];
  };
  icon?: string | null;
  retrieved_at: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  thumbnail?: { url: string };
}

export interface PreviewResponse {
  status: MinecraftStatus;
  replacements: Record<string, string>;
  preview: {
    channelName?: string;
    messagePayload?: {
      content?: string;
      embeds?: DiscordEmbed[];
    };
  };
}

export interface BotHealth {
  status: string;
  timestamp: string;
  config: {
    hasDiscordToken: boolean;
    hasApiSecret: boolean;
    hasDb: boolean;
  };
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
