# Airi-Discord

Airi is a multilingual, anime-inspired AI companion for Discord. It supports text chat and turn-based voice conversations in multiple servers.

## Features

- `/ask` — chat with Airi in the language you use.
- `/join` — join the voice channel you're currently in, transcribe speech, generate an answer, and speak it back.
- `/leave` — leave the current voice channel.
- `/reset` — clear your conversation history for the current server, including Supabase when configured.
- `/ping` — check bot responsiveness.
- `/help` — show the command guide.
- Per-server, per-user conversation context (in memory by default; optional Supabase persistence).
- Voice responses are queued per server to avoid overlapping playback.

## Requirements

- Node.js 22+
- FFmpeg available on PATH for MP3 playback
- A Discord application and bot token
- An OpenAI API key with access to chat, audio transcription, and text-to-speech models

## Setup

1. Create a Discord application in the Discord Developer Portal and add a bot.
2. Enable the **Message Content Intent is not required** for this slash-command implementation. Invite the bot with the `bot` and `applications.commands` scopes and permissions to view channels, send messages, connect, and speak.
3. Copy `.env.example` to `.env` and fill in the credentials. Never commit `.env` or share tokens in chat.
4. Install and build:

   ```bash
   npm install
   npm test
   npm run typecheck
   npm run build
   ```

5. Register slash commands:

   ```bash
   npm run register
   ```

   Set `DISCORD_GUILD_ID` for fast registration in one test server. Leave it empty for global registration.

6. Start the bot with `npm start`.

For local development, use `npm run dev`.

## Docker

Build and run:

```bash
docker build -t airi-discord .
docker run --env-file .env airi-discord
```

## Voice behavior and privacy

Voice mode is turn-based, not continuous full-duplex conversation. Airi receives a speaker's audio while connected, waits for a silence boundary, transcribes it, generates a reply, then plays synthesized speech. Users should be informed when voice capture is active. Do not deploy voice capture in a channel without the participants' knowledge and consent.

Voice capture is capped by `VOICE_MAX_SECONDS`. Without Supabase credentials, conversation history stays in process memory. With Supabase configured, Airi stores up to 12 user/assistant turns per Discord server and user. The bot uses a server-side Supabase secret key; never put it in a public client or commit it.

## Current limitations

- No persistent database; restart clears conversation context.
- Voice receive behavior depends on Discord voice networking and should be tested in a real server.
- Only one bot voice session per server is supported.
- The bot does not automatically join voice channels.
- The initial version has no dashboard or web control panel.

## Configuration

See `.env.example` for all supported environment variables.
