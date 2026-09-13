import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CreateServerInput, Env, ServerRecord, SyncResult, UpdateServerInput } from './types';
import { fetchMinecraftStatus } from './services/minecraft';
import { createMessage, getChannel, testBotToken, updateChannelName, updateMessage } from './services/discord';
import { buildDiscordPayload, getTemplateReplacements, interpolateTemplate } from './services/formatter';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend web dashboard
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    maxAge: 86400,
  })
);

// Auth middleware for /api/* routes (excluding /api/health and /api/auth/verify)
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api/health' || path === '/api/auth/verify') {
    return next();
  }

  const expectedSecret = c.env.API_SECRET;
  // If API_SECRET is set, validate client credentials
  if (expectedSecret && expectedSecret.trim().length > 0) {
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('X-API-Key');

    let providedKey = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.slice(7).trim();
    } else if (apiKeyHeader) {
      providedKey = apiKeyHeader.trim();
    }

    if (!providedKey || providedKey !== expectedSecret) {
      return c.json({ error: 'Unauthorized: Invalid or missing API key' }, 401);
    }
  }

  await next();
});

// Root & Health Check
app.get('/', (c) => {
  return c.json({
    name: 'serverless-motd-fetcher',
    version: '1.0.0',
    status: 'healthy',
    documentation: 'https://github.com/UsainSrht/serverless-motd-fetcher',
  });
});

app.get('/api/health', (c) => {
  const hasDiscordToken = Boolean(c.env.DISCORD_TOKEN && c.env.DISCORD_TOKEN.length > 10);
  const hasApiSecret = Boolean(c.env.API_SECRET && c.env.API_SECRET.length > 0);
  const hasDb = Boolean(c.env.DB);

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      hasDiscordToken,
      hasApiSecret,
      hasDb,
    },
  });
});

// Verify API Secret
app.post('/api/auth/verify', async (c) => {
  const expectedSecret = c.env.API_SECRET;
  if (!expectedSecret || expectedSecret.trim().length === 0) {
    return c.json({ valid: true, message: 'No API secret is configured in worker' });
  }

  try {
    const body = await c.req.json<{ apiKey?: string }>();
    const isValid = body.apiKey === expectedSecret;
    return c.json({ valid: isValid });
  } catch {
    return c.json({ valid: false, error: 'Invalid request body' }, 400);
  }
});

// List All Tracked Servers
app.get('/api/servers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM servers ORDER BY created_at DESC'
    ).all<ServerRecord>();

    return c.json({ servers: results || [] });
  } catch (err: any) {
    return c.json({ error: `Database error: ${err.message}` }, 500);
  }
});

// Create Tracked Server
app.post('/api/servers', async (c) => {
  try {
    const body = await c.req.json<CreateServerInput>();

    if (!body.mc_address || !body.discord_channel_id || !body.update_type || !body.format_template) {
      return c.json(
        { error: 'Missing required fields: mc_address, discord_channel_id, update_type, format_template' },
        400
      );
    }

    const name = body.name || body.mc_address;
    const isActive = body.is_active ?? 1;

    const result = await c.env.DB.prepare(
      `INSERT INTO servers (name, mc_address, discord_channel_id, discord_message_id, update_type, format_template, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        name,
        body.mc_address.trim(),
        body.discord_channel_id.trim(),
        body.discord_message_id ? body.discord_message_id.trim() : null,
        body.update_type,
        body.format_template,
        isActive
      )
      .run();

    const insertId = result.meta.last_row_id;
    const server = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?')
      .bind(insertId)
      .first<ServerRecord>();

    return c.json({ server }, 201);
  } catch (err: any) {
    return c.json({ error: `Failed to create server: ${err.message}` }, 500);
  }
});

// Get Single Server
app.get('/api/servers/:id', async (c) => {
  const id = c.req.param('id');
  const server = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?')
    .bind(id)
    .first<ServerRecord>();

  if (!server) {
    return c.json({ error: 'Server not found' }, 404);
  }

  return c.json({ server });
});

// Update Server
app.put('/api/servers/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<UpdateServerInput>();

  const existing = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?')
    .bind(id)
    .first<ServerRecord>();

  if (!existing) {
    return c.json({ error: 'Server not found' }, 404);
  }

  const name = body.name ?? existing.name;
  const mcAddress = (body.mc_address ?? existing.mc_address).trim();
  const channelId = (body.discord_channel_id ?? existing.discord_channel_id).trim();
  const messageId = body.discord_message_id !== undefined ? (body.discord_message_id ? body.discord_message_id.trim() : null) : existing.discord_message_id;
  const updateType = body.update_type ?? existing.update_type;
  const formatTemplate = body.format_template ?? existing.format_template;
  const isActive = body.is_active ?? existing.is_active;

  await c.env.DB.prepare(
    `UPDATE servers
     SET name = ?, mc_address = ?, discord_channel_id = ?, discord_message_id = ?,
         update_type = ?, format_template = ?, is_active = ?, updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(name, mcAddress, channelId, messageId, updateType, formatTemplate, isActive, id)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?')
    .bind(id)
    .first<ServerRecord>();

  return c.json({ server: updated });
});

// Delete Server
app.delete('/api/servers/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM servers WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: `Server ${id} deleted` });
});

// Test Minecraft Query & Render Preview (without modifying Discord)
app.post('/api/preview', async (c) => {
  try {
    const body = await c.req.json<{
      mc_address: string;
      format_template: string;
      update_type: 'channel_name' | 'message' | 'embed';
      name?: string;
    }>();

    if (!body.mc_address) {
      return c.json({ error: 'Missing mc_address' }, 400);
    }

    const status = await fetchMinecraftStatus(body.mc_address);
    const serverName = body.name || body.mc_address;
    const template = body.format_template || '{status_emoji} {name}: {players_online}/{players_max}';
    const updateType = body.update_type || 'channel_name';

    const replacements = getTemplateReplacements(serverName, status);
    const payload = buildDiscordPayload(updateType, template, serverName, status);

    return c.json({
      status,
      replacements,
      preview: payload,
    });
  } catch (err: any) {
    return c.json({ error: `Preview generation failed: ${err.message}` }, 500);
  }
});

// Initialize / Send initial Discord Message and auto-bind message ID
app.post('/api/servers/:id/init-message', async (c) => {
  const id = c.req.param('id');
  const token = c.env.DISCORD_TOKEN;

  if (!token) {
    return c.json({ error: 'DISCORD_TOKEN secret is not set in Cloudflare Worker' }, 400);
  }

  const server = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?')
    .bind(id)
    .first<ServerRecord>();

  if (!server) {
    return c.json({ error: 'Server not found' }, 404);
  }

  try {
    const status = await fetchMinecraftStatus(server.mc_address);
    const payload = buildDiscordPayload(server.update_type, server.format_template, server.name, status);

    if (!payload.messagePayload) {
      return c.json({ error: 'Cannot send message for channel_name update type' }, 400);
    }

    const sentMessage = await createMessage(token, server.discord_channel_id, payload.messagePayload);

    // Update server in D1 with the newly created message ID
    await c.env.DB.prepare(
      `UPDATE servers SET discord_message_id = ?, updated_at = datetime('now') WHERE id = ?`
    )
      .bind(sentMessage.id, id)
      .run();

    return c.json({
      success: true,
      messageId: sentMessage.id,
      channelId: sentMessage.channel_id,
    });
  } catch (err: any) {
    return c.json({ error: `Failed to initialize message: ${err.message}` }, 500);
  }
});

// Test Discord Token & Channel
app.post('/api/discord/test', async (c) => {
  const token = c.env.DISCORD_TOKEN;
  if (!token) {
    return c.json({ error: 'DISCORD_TOKEN secret is not set' }, 400);
  }

  try {
    const botUser = await testBotToken(token);
    const body = await c.req.json<{ channel_id?: string }>().catch(() => ({} as { channel_id?: string }));
    let channelInfo = null;

    if (body.channel_id) {
      channelInfo = await getChannel(token, body.channel_id);
    }

    return c.json({
      success: true,
      bot: botUser,
      channel: channelInfo,
    });
  } catch (err: any) {
    return c.json({ error: `Discord check failed: ${err.message}` }, 500);
  }
});

// Immediate sync for single server
app.post('/api/servers/:id/sync', async (c) => {
  const id = c.req.param('id');
  const server = await c.env.DB.prepare('SELECT * FROM servers WHERE id = ?')
    .bind(id)
    .first<ServerRecord>();

  if (!server) {
    return c.json({ error: 'Server not found' }, 404);
  }

  const result = await executeServerSync(server, c.env);
  return c.json({ result });
});

// Immediate sync for all active servers
app.post('/api/sync-all', async (c) => {
  const results = await syncAllServers(c.env);
  return c.json({ results });
});

/**
 * Synchronizes an individual server status to Discord
 */
async function executeServerSync(server: ServerRecord, env: Env): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  const token = env.DISCORD_TOKEN;

  if (!token) {
    const errorMsg = 'DISCORD_TOKEN is not configured in worker environment';
    await env.DB.prepare(
      `UPDATE servers SET last_synced_at = ?, last_status = 'error', last_error = ? WHERE id = ?`
    ).bind(timestamp, errorMsg, server.id).run();

    return {
      serverId: server.id,
      name: server.name,
      address: server.mc_address,
      success: false,
      online: false,
      updateType: server.update_type,
      targetChanged: false,
      error: errorMsg,
      executedAt: timestamp,
    };
  }

  try {
    // 1. Fetch Minecraft server status
    const status = await fetchMinecraftStatus(server.mc_address);
    const statusLabel = status.online ? 'online' : 'offline';

    // 2. Build Discord payload
    const payload = buildDiscordPayload(server.update_type, server.format_template, server.name, status);

    let targetChanged = false;

    // 3. Update Discord based on mode
    if (server.update_type === 'channel_name' && payload.channelName) {
      // Avoid Discord's 2 changes per 10 minutes limit if channel name is already set
      if (server.last_name_or_content === payload.channelName) {
        targetChanged = false;
      } else {
        await updateChannelName(token, server.discord_channel_id, payload.channelName);
        targetChanged = true;
      }

      await env.DB.prepare(
        `UPDATE servers
         SET last_synced_at = ?, last_status = ?, last_error = NULL, last_name_or_content = ?
         WHERE id = ?`
      )
        .bind(timestamp, statusLabel, payload.channelName, server.id)
        .run();
    } else if (payload.messagePayload) {
      let messageId = server.discord_message_id;

      // If no message ID exists yet, create the message first
      if (!messageId) {
        const sentMessage = await createMessage(token, server.discord_channel_id, payload.messagePayload);
        messageId = sentMessage.id;
        await env.DB.prepare(
          `UPDATE servers SET discord_message_id = ? WHERE id = ?`
        ).bind(messageId, server.id).run();
        targetChanged = true;
      } else {
        await updateMessage(token, server.discord_channel_id, messageId, payload.messagePayload);
        targetChanged = true;
      }

      const contentSignature = payload.messagePayload.content || JSON.stringify(payload.messagePayload.embeds);

      await env.DB.prepare(
        `UPDATE servers
         SET last_synced_at = ?, last_status = ?, last_error = NULL, last_name_or_content = ?
         WHERE id = ?`
      )
        .bind(timestamp, statusLabel, contentSignature.slice(0, 500), server.id)
        .run();
    }

    return {
      serverId: server.id,
      name: server.name,
      address: server.mc_address,
      success: true,
      online: status.online,
      updateType: server.update_type,
      targetChanged,
      executedAt: timestamp,
    };
  } catch (err: any) {
    console.error(`Error syncing server ${server.id} (${server.name}):`, err);
    await env.DB.prepare(
      `UPDATE servers SET last_synced_at = ?, last_status = 'error', last_error = ? WHERE id = ?`
    ).bind(timestamp, err.message, server.id).run();

    return {
      serverId: server.id,
      name: server.name,
      address: server.mc_address,
      success: false,
      online: false,
      updateType: server.update_type,
      targetChanged: false,
      error: err.message,
      executedAt: timestamp,
    };
  }
}

/**
 * Syncs all active servers sequentially to avoid burst rate-limits
 */
async function syncAllServers(env: Env): Promise<SyncResult[]> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM servers WHERE is_active = 1'
    ).all<ServerRecord>();

    if (!results || results.length === 0) {
      return [];
    }

    const syncResults: SyncResult[] = [];
    for (const server of results) {
      const res = await executeServerSync(server, env);
      syncResults.push(res);
    }

    return syncResults;
  } catch (err) {
    console.error('Failed to execute syncAllServers:', err);
    return [];
  }
}

// Cloudflare Worker Handler
export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Cron Trigger] Starting scheduled Minecraft MOTD sync at ${new Date().toISOString()}`);
    ctx.waitUntil(syncAllServers(env));
  },
};
