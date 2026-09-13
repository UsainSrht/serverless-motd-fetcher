-- Cloudflare D1 Database Schema for Minecraft MOTD Discord Bot

CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Minecraft Server',
  mc_address TEXT NOT NULL,
  discord_channel_id TEXT NOT NULL,
  discord_message_id TEXT,
  update_type TEXT NOT NULL CHECK(update_type IN ('channel_name', 'message', 'embed')),
  format_template TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_synced_at TEXT,
  last_status TEXT,
  last_error TEXT,
  last_name_or_content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_servers_active ON servers(is_active);
CREATE INDEX IF NOT EXISTS idx_servers_channel ON servers(discord_channel_id);
