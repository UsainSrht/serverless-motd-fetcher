# 🎮 Serverless Discord Minecraft MOTD Fetcher

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/UsainSrht/serverless-motd-fetcher)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1_SQLite-F38020?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Discord API v10](https://img.shields.io/badge/Discord-REST_API_v10-5865F2?logo=discord&logoColor=white)](https://discord.com/developers/docs/reference)
[![React + Vite](https://img.shields.io/badge/Frontend-React_18_%2B_TailwindCSS-61DAFB?logo=react&logoColor=black)](https://vitejs.dev/)

An open-source, serverless Discord bot and web management dashboard that periodically fetches Minecraft server status and MOTDs to update Discord channel names, text messages, or rich embeds.

**100% Free Tier Compatible**: Runs entirely within Cloudflare Workers, Cloudflare D1 (Serverless SQLite), and Cloudflare Pages with zero monthly server costs.

---

## ✨ Features

- **Multi-Target Updating Modes**:
  - 🏷️ **Channel Names**: Live counter directly in your server sidebar (e.g. `🟢・mc-42/100` or `🟢-survival-online`).
  - 🎨 **Rich Discord Embeds**: Dynamic embeds with player count progress bars (`🟩🟩🟩⬛⬛`), live MOTD, version, and server icon thumbnail.
  - 💬 **Plain Text Messages**: Clean markdown status messages.
- **Intelligent Rate-Limit Protection**:
  - Discord enforces a strict limit of **2 channel name updates per 10 minutes**.
  - The worker compares formatted output against cached D1 state and **skips redundant PATCH requests** if nothing changed.
- **REST-Based Minecraft Querying**:
  - Uses `api.mcsrvstat.us` with automatic fallback to `api.mcstatus.io`, completely bypassing Cloudflare Worker TCP socket restrictions.
- **Modern Management Dashboard (React + Vite + TailwindCSS)**:
  - Add, edit, test, and delete tracked servers with a sleek dark-mode glassmorphic UI.
  - **Live Discord Preview Simulator**: See exact Discord output before saving.
  - One-click **"Sync All"** and per-server **"Sync Now"** manual triggers.
  - Automated **"Initialize Message"** button to auto-post the initial Discord message and bind its Message ID.
- **Zero-Trust Shared Secret Authentication**:
  - API endpoints protected with `X-API-Key` / Bearer token authentication.

---

## 🏗️ Architecture

```
                      +-----------------------------+
                      |   Cloudflare Cron Trigger   |
                      |       (Every 5 Minutes)     |
                      +--------------+--------------+
                                     |
                                     v
+------------------+         +-------------------------------+
|  Cloudflare      |  CRUD   |      Cloudflare Worker        |
|  Pages (React)   | <-----> |           (Hono)              |
|  Web Dashboard   |  REST   +-------+---------------+-------+
+------------------+                 |               |
                                     |               |
                  Query Minecraft    v               v   Update Status
                       +-------------------+   +--------------------+
                       | api.mcsrvstat.us  |   | Discord REST API   |
                       |   (REST API)      |   | (v10 Channels /    |
                       +-------------------+   |  Messages PATCH)   |
                                 ^             +--------------------+
                                 | D1 Query
                       +---------+---------+
                       |   Cloudflare D1   |
                       | (SQLite Database) |
                       +-------------------+
```

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. **Node.js**: Version `18.0.0` or higher installed (`node -v`).
2. **Cloudflare Account**: [Free Cloudflare Sign-up](https://dash.cloudflare.com/sign-up).
3. **Discord Developer Account**: [Discord Developer Portal](https://discord.com/developers/applications).
4. **Cloudflare Wrangler CLI**: Installed globally or run via `npx wrangler`.

---

## 🤖 Step 1: Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **"New Application"**.
2. Give your application a name (e.g., `Minecraft MOTD Bot`) and agree to the terms.
3. In the left sidebar, navigate to the **"Bot"** tab:
   - Click **"Reset Token"** and copy your **Bot Token**. *Save this securely — this will be your `DISCORD_TOKEN` secret.*
   - Disable **"Public Bot"** if you only want to use it in your own Discord servers.
4. Navigate to **"OAuth2"** ➔ **"URL Generator"**:
   - In **Scopes**, check `bot`.
   - In **Bot Permissions**, check:
     - ✅ **Manage Channels** (`0x10`) — *Required to update channel names*
     - ✅ **View Channels** (`0x400`) — *Required to locate channels*
     - ✅ **Send Messages** (`0x800`) — *Required to post new status messages*
     - ✅ **Embed Links** (`0x4000`) — *Required to send rich embed cards*
5. Copy the generated **OAuth2 URL** at the bottom, paste it into your browser, and authorize the bot into your Discord server.
6. Ensure the bot's role is placed **above the channels/messages** it is managing in Discord Server Settings ➔ Roles.

> [!TIP]
> **Getting Discord IDs**: Turn on **Developer Mode** in Discord (`User Settings` ➔ `Advanced` ➔ `Developer Mode`). Then right-click any channel to click **"Copy Channel ID"** or right-click any message to click **"Copy Message ID"**.

---

## 🚀 Step 2: One-Click Cloudflare Deployment

Click the button below to fork and deploy directly onto Cloudflare Workers:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/UsainSrht/serverless-motd-fetcher)

Cloudflare will prompt you to authorize GitHub, create the worker, and prompt for environment secrets.

---

## 💻 Step 3: Deployment (CLI via Wrangler)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/UsainSrht/serverless-motd-fetcher.git
cd serverless-motd-fetcher
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Automated One-Command Setup (Recommended)

Run the automated setup script to provision the D1 database and apply the database schema in one shot:

```bash
npm run setup
```

> [!TIP]
> **Zero Code Editing Required**: Thanks to Wrangler v4, Cloudflare automatically resolves your D1 database by its name (`mc_motd_db`). You **do not** need to edit `wrangler.toml` or copy/paste any database UUIDs!

<details>
<summary><b>Or run the steps manually:</b></summary>

1. **Create the D1 database:**
   ```bash
   npx wrangler d1 create mc_motd_db
   ```
   *(Note: Cloudflare outputs a suggested TOML snippet with a `database_id`, but you don't need to paste it—Wrangler automatically resolves it by name).*

2. **Execute the database schema migration:**
   ```bash
   npx wrangler d1 execute mc_motd_db --remote --file=./packages/worker/src/db/schema.sql
   ```
</details>

### 4. Configure Cloudflare Secrets

Set your Discord Bot token and a secret API key to secure the web UI:

```bash
# 1. Your Discord bot token from the Developer Portal
npx wrangler secret put DISCORD_TOKEN --name serverless-motd-fetcher-worker

# 2. A random secure string of your choice for Web UI authentication
npx wrangler secret put API_SECRET --name serverless-motd-fetcher-worker
```

### 5. Deploy the Worker Backend

```bash
npm run deploy
# Or: npm run deploy:worker
```

Your worker is now live with its cron trigger running every 5 minutes! Note the deployed worker URL (e.g. `https://serverless-motd-fetcher-worker.usainsrht.workers.dev`).

### 6. Deploy the Web Dashboard (Cloudflare Pages)

You can deploy the web dashboard using Cloudflare Pages:

```bash
# Build the production frontend bundle
npm run build:web

# Deploy the dist directory directly to Cloudflare Pages
npx wrangler pages deploy packages/web/dist --project-name mc-motd-dashboard
```

Alternatively, connect your GitHub repository in the **Cloudflare Dashboard ➔ Pages** with:
- **Build command**: `npm run build:web`
- **Build output directory**: `packages/web/dist`

---

## 🔑 Environment Variables & Secrets

| Variable Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `DISCORD_TOKEN` | Secret | Discord Bot token (`Bot <token>`) from Discord Developer Portal. | **Yes** |
| `API_SECRET` | Secret | Shared secret protecting management REST endpoints from unauthorized access. | **Yes** |
| `DB` | D1 Binding | Bound to Cloudflare D1 database `mc_motd_db`. | **Yes** |
| `ENVIRONMENT` | Var | Environment mode (e.g. `production` or `development`). | No |
| `DEFAULT_CRON_INTERVAL` | Var | Cron description label (default: `5m`). | No |

---

## 📝 Format Template Syntax Cheat Sheet

You can customize the formatting for Channel Names, Plain Messages, and Rich Embeds using the following placeholders:

| Placeholder Tag | Description | Example Output |
| :--- | :--- | :--- |
| `{status_emoji}` | Dynamic status indicator emoji | `🟢` (online) or `🔴` (offline) |
| `{online}` | Text status | `Online` or `Offline` |
| `{players_online}` | Current number of connected players | `42` |
| `{players_max}` | Maximum player capacity | `100` |
| `{players_percent}` | Percentage of capacity filled | `42` |
| `{name}` | Friendly server name | `Survival Hub` |
| `{ip}` | Server hostname or IP | `play.hypixel.net` |
| `{port}` | Server port | `25565` |
| `{version}` | Minecraft server version | `1.21.1` |
| `{motd}` | Cleaned, single-line server MOTD | `Welcome to the Realm!` |
| `{motd_multiline}` | Multiline MOTD | Line 1 \n Line 2 |
| `{motd_line1}` | First line of server MOTD | `Welcome to our server` |
| `{timestamp}` | UTC check timestamp | `04:20 PM UTC` |

### Recommended Templates

- **Channel Name (Minimal)**:
  `{status_emoji}・{players_online}-online`
- **Channel Name (With Max Players)**:
  `{status_emoji}・mc-{players_online}/{players_max}`
- **Rich Embed Description**:
  `{motd}\n\nJoin our community at \`{ip}\`!\nUpdates every 5 minutes.`
- **Plain Message**:
  `🎮 **{name} Server Status**\nStatus: {status_emoji} **{online}**\nPlayers: **{players_online} / {players_max}** ({players_percent}%)\nMOTD: \`{motd}\`\n*Checked: {timestamp}*`

> [!WARNING]
> **Discord Channel Name Rate Limits**: Discord strictly permits only **2 channel name changes per 10 minutes** per channel. If you update channel names, ensure your cron schedule is `*/5 * * * *` or `*/10 * * * *`. The bot will automatically skip PATCH requests if the channel name has not changed.

---

## 🛠️ Local Development

Run the Worker and Web Dashboard locally side-by-side:

```bash
# Terminal 1: Run Worker local dev server with local D1 emulation
npm run dev:worker

# Terminal 2: Run Vite web frontend dev server (proxies /api to worker)
npm run dev:web
```

- Web UI: `http://localhost:5173`
- Worker API: `http://localhost:8787`

### Run Verification Tests

```bash
npm test
```

---

## 📦 Project Structure

```
serverless-motd-fetcher/
├── packages/
│   ├── worker/                 # Cloudflare Worker Backend
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   └── schema.sql  # Cloudflare D1 Database schema
│   │   │   ├── services/
│   │   │   │   ├── minecraft.ts# REST Minecraft status fetcher (with fallback)
│   │   │   │   ├── discord.ts  # Discord REST API client
│   │   │   │   └── formatter.ts# Template interpolation & embed builder
│   │   │   ├── index.ts        # Hono REST API & Cloudflare Cron handler
│   │   │   └── types.ts        # TypeScript interfaces
│   │   ├── wrangler.toml       # Cloudflare Worker configuration & D1 binding
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Cloudflare Pages Frontend (React + Vite + Tailwind)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Navbar.tsx
│       │   │   ├── StatsOverview.tsx
│       │   │   ├── ServerCard.tsx
│       │   │   ├── ServerModal.tsx     # Add/Edit modal with Discord live preview
│       │   │   ├── ApiKeyModal.tsx     # API Key & Worker endpoint settings
│       │   │   └── TemplateGuideModal.tsx
│       │   ├── lib/
│       │   │   └── api.ts      # Worker API client with localStorage persistence
│       │   ├── App.tsx         # Main dashboard view
│       │   ├── main.tsx
│       │   ├── types.ts
│       │   └── index.css       # Tailwind & Glassmorphism styles
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/
│   └── verify.mjs              # Test suite for template formatting & status API
├── package.json                # Root workspace configuration
├── LICENSE                     # MIT License
└── README.md                   # Step-by-step documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Contributions, bug reports, and pull requests are welcome!
