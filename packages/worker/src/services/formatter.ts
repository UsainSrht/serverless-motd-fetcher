import { DiscordEmbed, DiscordMessagePayload, MinecraftStatus, ServerRecord, UpdateType } from '../types';

export interface FormatContext {
  server: Pick<ServerRecord, 'name' | 'mc_address' | 'update_type' | 'format_template'>;
  status: MinecraftStatus;
}

/**
 * Returns replacement map for all supported template placeholders
 */
export function getTemplateReplacements(serverName: string, status: MinecraftStatus): Record<string, string> {
  const isOnline = status.online;
  const statusEmoji = isOnline ? '🟢' : '🔴';
  const onlineText = isOnline ? 'Online' : 'Offline';
  const playersOnline = status.players.online.toString();
  const playersMax = status.players.max.toString();
  const percent = status.players.max > 0
    ? Math.round((status.players.online / status.players.max) * 100).toString()
    : '0';

  const cleanMotdLines = status.motd.clean.filter(line => line.trim().length > 0);
  const motdFull = cleanMotdLines.join('\n');
  const motdSingle = cleanMotdLines.join(' ');
  const motdLine1 = cleanMotdLines[0] || (isOnline ? 'A Minecraft Server' : 'Server is offline');
  const motdLine2 = cleanMotdLines[1] || '';

  const dateObj = new Date(status.retrieved_at);
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';

  return {
    '{name}': serverName || 'Minecraft Server',
    '{ip}': status.ip,
    '{port}': status.port.toString(),
    '{address}': `${status.ip}${status.port !== 25565 ? `:${status.port}` : ''}`,
    '{online}': onlineText,
    '{status_emoji}': statusEmoji,
    '{players_online}': playersOnline,
    '{players_max}': playersMax,
    '{players_percent}': percent,
    '{version}': status.version,
    '{motd}': motdSingle,
    '{motd_multiline}': motdFull,
    '{motd_line1}': motdLine1,
    '{motd_line2}': motdLine2,
    '{timestamp}': formattedTime,
  };
}

/**
 * Replaces all placeholders in template with actual values
 */
export function interpolateTemplate(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}

/**
 * Formats channel name according to Discord rules:
 * - Max 100 chars
 * - No line breaks
 * - Cleaned whitespace
 */
export function formatChannelName(template: string, serverName: string, status: MinecraftStatus): string {
  const replacements = getTemplateReplacements(serverName, status);
  let name = interpolateTemplate(template, replacements);

  // Strip line breaks & control characters
  name = name.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();

  // Enforce Discord channel name length limit
  if (name.length > 100) {
    name = name.slice(0, 100);
  }

  return name || `${status.online ? '🟢' : '🔴'}-mc-${status.players.online}`;
}

/**
 * Formats plain text message
 */
export function formatTextMessage(template: string, serverName: string, status: MinecraftStatus): string {
  const replacements = getTemplateReplacements(serverName, status);
  let content = interpolateTemplate(template, replacements);

  if (content.length > 2000) {
    content = content.slice(0, 1997) + '...';
  }

  return content;
}

/**
 * Builds an attractive Discord rich embed for the Minecraft server status
 */
export function buildStatusEmbed(template: string, serverName: string, status: MinecraftStatus): DiscordEmbed {
  const replacements = getTemplateReplacements(serverName, status);
  const isOnline = status.online;

  // Green 0x22C55E for online, Red 0xEF4444 for offline
  const color = isOnline ? 2278750 : 15680580;

  // Custom user description or MOTD
  const customDesc = template ? interpolateTemplate(template, replacements) : status.motd.clean.join('\n');

  // Player progress bar
  const totalBars = 10;
  const ratio = status.players.max > 0 ? Math.min(1, status.players.online / status.players.max) : 0;
  const filledBars = Math.round(ratio * totalBars);
  const emptyBars = totalBars - filledBars;
  const progressBar = '🟩'.repeat(filledBars) + '⬛'.repeat(emptyBars);

  const embed: DiscordEmbed = {
    title: `🎮 ${serverName || 'Minecraft Server'}`,
    description: customDesc.slice(0, 4096),
    color,
    timestamp: status.retrieved_at,
    fields: [
      {
        name: '📡 Status',
        value: `${status.online ? '🟢 Online' : '🔴 Offline'}`,
        inline: true,
      },
      {
        name: '👥 Players',
        value: `${status.players.online.toLocaleString()} / ${status.players.max.toLocaleString()}\n${progressBar}`,
        inline: true,
      },
      {
        name: '🏷️ Version',
        value: `\`${status.version}\``,
        inline: true,
      },
      {
        name: '🌐 Server Address',
        value: `\`${status.hostname || status.ip}${status.port !== 25565 ? `:${status.port}` : ''}\``,
        inline: true,
      },
    ],
    footer: {
      text: 'Cloudflare Serverless MOTD Bot',
    },
  };

  // If server has an icon data URI or URL, attach it as thumbnail
  if (status.icon && status.icon.startsWith('http')) {
    embed.thumbnail = { url: status.icon };
  }

  return embed;
}

/**
 * Builds the final Discord payload based on UpdateType
 */
export function buildDiscordPayload(
  updateType: UpdateType,
  template: string,
  serverName: string,
  status: MinecraftStatus
): { channelName?: string; messagePayload?: DiscordMessagePayload } {
  if (updateType === 'channel_name') {
    return {
      channelName: formatChannelName(template, serverName, status),
    };
  }

  if (updateType === 'embed') {
    const embed = buildStatusEmbed(template, serverName, status);
    return {
      messagePayload: {
        content: '',
        embeds: [embed],
      },
    };
  }

  // updateType === 'message'
  return {
    messagePayload: {
      content: formatTextMessage(template, serverName, status),
    },
  };
}
