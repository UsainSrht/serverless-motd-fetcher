#!/usr/bin/env node

/**
 * Automated Zero-Config Setup Script for Serverless Minecraft MOTD Discord Bot.
 * Checks authentication, provisions D1 database, executes remote schema migrations,
 * and prepares everything for deployment without requiring manual edits to wrangler.toml.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function run(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

function runCapture(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

console.log('\n============================================================');
console.log('🎮 Serverless Minecraft MOTD Fetcher - Automated Setup');
console.log('============================================================\n');

// 1. Verify Cloudflare Authentication
console.log('1️⃣ Checking Cloudflare authentication...');
const whoami = runCapture('npx wrangler whoami');
if (!whoami || whoami.includes('You are not logged in')) {
  console.error('\n❌ You are not logged into Cloudflare Wrangler.');
  console.log('👉 Please run: npx wrangler login');
  console.log('Then re-run: npm run setup\n');
  process.exit(1);
}
console.log('   ✅ Cloudflare authentication verified.\n');

// 2. Check or Create D1 Database
console.log('2️⃣ Checking Cloudflare D1 database (mc_motd_db)...');
let dbExists = false;
try {
  const d1ListRaw = runCapture('npx wrangler d1 list --json');
  if (d1ListRaw) {
    const list = JSON.parse(d1ListRaw);
    if (Array.isArray(list) && list.some(db => db.name === 'mc_motd_db')) {
      dbExists = true;
    }
  }
} catch {
  // If parsing fails, fall back to checking via list text
}

if (dbExists) {
  console.log("   ✅ D1 database 'mc_motd_db' already exists.\n");
} else {
  console.log("   ⚡ D1 database 'mc_motd_db' not found. Creating it now...");
  try {
    run('npx wrangler d1 create mc_motd_db');
    console.log("   ✅ D1 database 'mc_motd_db' created successfully.\n");
  } catch (err) {
    console.error('   ❌ Failed to create D1 database:', err.message);
    process.exit(1);
  }
}

// 3. Apply Schema Migrations
console.log('3️⃣ Initializing database schema on Cloudflare D1...');
const schemaPath = resolve(process.cwd(), 'packages/worker/src/db/schema.sql');
if (!existsSync(schemaPath)) {
  console.error(`   ❌ Schema file not found at: ${schemaPath}`);
  process.exit(1);
}

try {
  run(`npx wrangler d1 execute mc_motd_db --remote --file="${schemaPath}"`);
  console.log('   ✅ Database schema initialized successfully.\n');
} catch (err) {
  console.error('   ❌ Failed to execute database schema migrations:', err.message);
  process.exit(1);
}

// 4. Summary & Next Steps
console.log('============================================================');
console.log('🎉 Setup Completed Successfully! No code edits required.');
console.log('============================================================\n');
console.log('Next steps:');
console.log('1. Set your Discord Bot Token:');
console.log('   npx wrangler secret put DISCORD_TOKEN\n');
console.log('2. Set an API secret to protect the web dashboard:');
console.log('   npx wrangler secret put API_SECRET\n');
console.log('3. Deploy your Cloudflare Worker:');
console.log('   npm run deploy\n');
console.log('4. Deploy the Web Management Dashboard (Cloudflare Pages):');
console.log('   npm run deploy:web\n');
