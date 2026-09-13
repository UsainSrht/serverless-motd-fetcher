import { MinecraftStatus } from '../types';

/**
 * Fetches status for a Minecraft Java or Bedrock server using public REST APIs
 * Designed to run smoothly inside Cloudflare Workers without requiring raw TCP sockets.
 */
export async function fetchMinecraftStatus(address: string, timeoutMs: number = 6000): Promise<MinecraftStatus> {
  const cleanAddress = address.trim();
  const timestamp = new Date().toISOString();

  // Try Primary Provider: api.mcsrvstat.us (v3)
  try {
    const status = await fetchWithTimeout(`https://api.mcsrvstat.us/3/${encodeURIComponent(cleanAddress)}`, timeoutMs);
    if (status) {
      return parseMcsrvstatResponse(cleanAddress, status, timestamp);
    }
  } catch (err) {
    console.warn(`[Minecraft] Primary API failed for ${cleanAddress}, attempting fallback...`, err);
  }

  // Try Secondary Provider: api.mcstatus.io (v2)
  try {
    const status = await fetchWithTimeout(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(cleanAddress)}`, timeoutMs);
    if (status) {
      return parseMcstatusIoResponse(cleanAddress, status, timestamp);
    }
  } catch (err) {
    console.error(`[Minecraft] Secondary API also failed for ${cleanAddress}`, err);
  }

  // Fallback offline status when unreachable
  const [host, portStr] = cleanAddress.split(':');
  return {
    online: false,
    ip: host || cleanAddress,
    port: portStr ? parseInt(portStr, 10) : 25565,
    hostname: cleanAddress,
    players: {
      online: 0,
      max: 0,
      list: [],
    },
    version: 'Unknown',
    motd: {
      raw: ['Server Unreachable'],
      clean: ['Server Unreachable'],
      html: ['<span style="color:red">Server Unreachable</span>'],
    },
    icon: null,
    retrieved_at: timestamp,
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CloudflareWorker-MinecraftMOTDFetcher/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseMcsrvstatResponse(address: string, data: any, timestamp: string): MinecraftStatus {
  const isOnline = Boolean(data.online);
  const [host, portStr] = address.split(':');
  const defaultPort = portStr ? parseInt(portStr, 10) : 25565;

  const motdClean = Array.isArray(data.motd?.clean)
    ? data.motd.clean
    : typeof data.motd?.clean === 'string'
    ? [data.motd.clean]
    : isOnline ? ['A Minecraft Server'] : ['Server Offline'];

  const motdRaw = Array.isArray(data.motd?.raw)
    ? data.motd.raw
    : [motdClean.join(' ')];

  return {
    online: isOnline,
    ip: data.ip || host || address,
    port: data.port || defaultPort,
    hostname: data.hostname || address,
    players: {
      online: data.players?.online ?? 0,
      max: data.players?.max ?? 0,
      list: Array.isArray(data.players?.list) ? data.players.list : [],
    },
    version: data.version || (isOnline ? '1.20+' : 'Offline'),
    motd: {
      raw: motdRaw,
      clean: motdClean,
      html: Array.isArray(data.motd?.html) ? data.motd.html : undefined,
    },
    icon: data.icon || null,
    protocol: data.protocol?.version,
    retrieved_at: timestamp,
  };
}

function parseMcstatusIoResponse(address: string, data: any, timestamp: string): MinecraftStatus {
  const isOnline = Boolean(data.online);
  const [host, portStr] = address.split(':');
  const defaultPort = portStr ? parseInt(portStr, 10) : 25565;

  const motdClean = data.motd?.clean
    ? data.motd.clean.split('\n')
    : isOnline ? ['A Minecraft Server'] : ['Server Offline'];

  const motdRaw = data.motd?.raw
    ? [data.motd.raw]
    : motdClean;

  return {
    online: isOnline,
    ip: data.ip_address || host || address,
    port: data.port || defaultPort,
    hostname: data.host || address,
    players: {
      online: data.players?.online ?? 0,
      max: data.players?.max ?? 0,
      list: Array.isArray(data.players?.list) ? data.players.list : [],
    },
    version: data.version?.name_clean || (isOnline ? '1.20+' : 'Offline'),
    motd: {
      raw: motdRaw,
      clean: motdClean,
      html: data.motd?.html ? [data.motd.html] : undefined,
    },
    icon: data.icon || null,
    protocol: data.version?.protocol,
    retrieved_at: timestamp,
  };
}
