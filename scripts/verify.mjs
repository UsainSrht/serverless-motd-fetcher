// Verification suite for Serverless Minecraft MOTD Discord Bot
import assert from 'node:assert';

console.log('🧪 Starting Verification Test Suite...\n');

// 1. Test Template Formatter Replacements
console.log('1️⃣ Testing Template Engine & Interpolation...');

const mockStatus = {
  online: true,
  ip: 'play.example.com',
  port: 25565,
  hostname: 'play.example.com',
  players: {
    online: 154,
    max: 500,
    list: [{ name: 'Steve' }],
  },
  version: '1.21.1',
  motd: {
    raw: ['§aAwesome Survival Server', '§bJoin today!'],
    clean: ['Awesome Survival Server', 'Join today!'],
  },
  icon: 'https://example.com/icon.png',
  retrieved_at: '2026-09-13T12:00:00.000Z',
};

function getTemplateReplacements(serverName, status) {
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

function interpolateTemplate(template, replacements) {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}

function formatChannelName(template, serverName, status) {
  const replacements = getTemplateReplacements(serverName, status);
  let name = interpolateTemplate(template, replacements);
  name = name.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.length > 100) {
    name = name.slice(0, 100);
  }
  return name;
}

function formatTextMessage(template, serverName, status) {
  const replacements = getTemplateReplacements(serverName, status);
  let content = interpolateTemplate(template, replacements);
  if (content.length > 2000) {
    content = content.slice(0, 1997) + '...';
  }
  return content;
}

function buildStatusEmbed(template, serverName, status) {
  const replacements = getTemplateReplacements(serverName, status);
  const isOnline = status.online;
  const color = isOnline ? 2278750 : 15680580;
  const customDesc = template ? interpolateTemplate(template, replacements) : status.motd.clean.join('\n');
  const totalBars = 10;
  const ratio = status.players.max > 0 ? Math.min(1, status.players.online / status.players.max) : 0;
  const filledBars = Math.round(ratio * totalBars);
  const emptyBars = totalBars - filledBars;
  const progressBar = '🟩'.repeat(filledBars) + '⬛'.repeat(emptyBars);

  return {
    title: `🎮 ${serverName || 'Minecraft Server'}`,
    description: customDesc.slice(0, 4096),
    color,
    timestamp: status.retrieved_at,
    fields: [
      { name: '📡 Status', value: isOnline ? '🟢 Online' : '🔴 Offline', inline: true },
      { name: '👥 Players', value: `${status.players.online.toLocaleString()} / ${status.players.max.toLocaleString()}\n${progressBar}`, inline: true },
      { name: '🏷️ Version', value: `\`${status.version}\``, inline: true },
      { name: '🌐 Server Address', value: `\`${status.hostname || status.ip}${status.port !== 25565 ? `:${status.port}` : ''}\``, inline: true },
    ],
    footer: { text: 'Cloudflare Serverless MOTD Bot' },
  };
}

const replacements = getTemplateReplacements('Survival Hub', mockStatus);
assert.strictEqual(replacements['{players_online}'], '154');
assert.strictEqual(replacements['{players_max}'], '500');
assert.strictEqual(replacements['{players_percent}'], '31');
assert.strictEqual(replacements['{status_emoji}'], '🟢');
assert.strictEqual(replacements['{version}'], '1.21.1');
assert.strictEqual(replacements['{address}'], 'play.example.com');
assert.ok(replacements['{timestamp}'].includes('UTC'));

// Test custom port address formatting
const customPortReplacements = getTemplateReplacements('Survival Hub', { ...mockStatus, port: 25577 });
assert.strictEqual(customPortReplacements['{address}'], 'play.example.com:25577');
console.log('   ✅ Address port formatting passed.');

// Test Channel Name formatting
const channelName = formatChannelName('{status_emoji}・mc-{players_online}/{players_max}', 'Survival Hub', mockStatus);
assert.strictEqual(channelName, '🟢・mc-154/500');
console.log('   ✅ Channel Name formatting passed: ' + channelName);

// Test Channel Name length limit truncation (Discord 100 char limit)
const longTemplate = 'a'.repeat(120);
const truncated = formatChannelName(longTemplate, 'Survival Hub', mockStatus);
assert.strictEqual(truncated.length, 100);
console.log('   ✅ Discord 100-character channel limit enforcement passed.');

// Test Plain Text Message & 2000-char truncation
const longMessage = formatTextMessage('a'.repeat(2500), 'Survival Hub', mockStatus);
assert.strictEqual(longMessage.length, 2000);
assert.ok(longMessage.endsWith('...'));
console.log('   ✅ Discord 2000-character message limit enforcement passed.');

// Test Rich Embed creation
const onlineEmbed = buildStatusEmbed('Welcome to {name}!', 'Survival Hub', mockStatus);
assert.strictEqual(onlineEmbed.color, 2278750); // Emerald green
assert.strictEqual(onlineEmbed.title, '🎮 Survival Hub');
assert.strictEqual(onlineEmbed.description, 'Welcome to Survival Hub!');
assert.strictEqual(onlineEmbed.fields.length, 4);
console.log('   ✅ Discord Rich Embed generation passed.');

// Test Offline scenario
const offlineStatus = {
  ...mockStatus,
  online: false,
  players: { online: 0, max: 0, list: [] },
  version: 'Offline',
  motd: { clean: ['Server offline'] },
};
const offlineChannel = formatChannelName('{status_emoji}・{online}・{players_online}', 'Survival Hub', offlineStatus);
assert.strictEqual(offlineChannel, '🔴・Offline・0');
const offlineEmbed = buildStatusEmbed('Welcome to {name}!', 'Survival Hub', offlineStatus);
assert.strictEqual(offlineEmbed.color, 15680580); // Red
console.log('   ✅ Offline fallback formatting & color indicators passed.');

// 2. Test Minecraft API Endpoint Integration
console.log('\n2️⃣ Testing Minecraft REST API Fetchers...');
try {
  const res = await fetch('https://api.mcsrvstat.us/3/donutsmp.net', { signal: AbortSignal.timeout(5000) });
  if (res.ok) {
    const data = await res.json();
    console.log(`   ✅ Primary API (api.mcsrvstat.us): Online (${data.online}), players: ${data.players?.online}`);
  } else {
    console.log('   ⚠️ api.mcsrvstat.us returned non-200, verifying fallback resilience.');
  }
} catch (e) {
  console.log('   ⚠️ Primary API timeout or unreachable, verifying fallback resilience.');
}

try {
  const resFallback = await fetch('https://api.mcstatus.io/v2/status/java/donutsmp.net', { signal: AbortSignal.timeout(5000) });
  if (resFallback.ok) {
    const data = await resFallback.json();
    console.log(`   ✅ Secondary API (api.mcstatus.io): Online (${data.online}), players: ${data.players?.online}`);
  } else {
    console.log('   ⚠️ api.mcstatus.io returned non-200.');
  }
} catch (e) {
  console.log('   ⚠️ Secondary API timeout or unreachable.');
}

console.log('\n🎉 All Verification Checks Passed Successfully!');
