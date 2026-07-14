Discord registration prototype

Overview
- Node.js + discord.js bot that shows a modal to collect `birthdate` and `region` and POSTs the result to an Apps Script WebApp URL.

Quick start
1. Copy `.env.example` to `.env` and fill values: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `APPS_SCRIPT_WEBAPP_URL`, `APPS_SCRIPT_SECRET`.
2. Install dependencies:
```bash
cd discord-bot
npm install
```
3. Run the bot:
```bash
npm start
```

Notes
- This prototype registers a guild-scoped `/register` command for testing. For production, register globally or automate command deployment.
- The Apps Script WebApp should accept POST JSON with `userId`, `birthdate`, `region`, and optional `secret`.
- The bot sends `x-webapp-secret` as a header and also includes `secret` in the payload for compatibility.
- The Apps Script handler also supports legacy LINE webhook payloads if `events` are present.
