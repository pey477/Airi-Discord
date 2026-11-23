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

## Deploy to Railway

Airi is a long-running Discord worker, not an HTTP web server. Deploy it as one Railway service and do not configure a public domain or HTTP healthcheck.

1. Sign in to [Railway](https://railway.com/), create a new project, choose **Deploy from GitHub repo**, and select `pey477/Airi-Discord`.
2. Keep the service root directory as `/`. Railway detects the root `Dockerfile`; it installs FFmpeg, builds the TypeScript app, and starts `node dist/index.js`.
3. Open the service's **Variables** page and add the required variables:

   | Variable | Value |
   | --- | --- |
   | `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
   | `DISCORD_CLIENT_ID` | Discord application ID |
   | `OPENAI_API_KEY` | OpenAI API key |

4. Add these optional variables only if Supabase persistence is configured:

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SECRET_KEY` | Supabase secret key; keep private |

   The Supabase SQL in `supabase/schema.sql` must be run in the Supabase SQL Editor before enabling persistence. Both Supabase variables must be set together or both left empty.
5. Optional model and voice settings can be added as Railway variables. Defaults are `OPENAI_CHAT_MODEL=gpt-4o-mini`, `OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe`, `OPENAI_TTS_MODEL=gpt-4o-mini-tts`, and `OPENAI_TTS_VOICE=nova`. Voice capture defaults to `VOICE_MAX_SECONDS=18` and `VOICE_SILENCE_MS=1100`.
6. In service deployment settings, set the restart policy to **On Failure** (or **Always**) and keep the replica count at **1**. Multiple replicas would create multiple Discord bot sessions using the same token.
7. Trigger deployment. Check the deployment logs for `Airi is online as ...`. If startup fails, verify the required variables and inspect the first error in the logs.
8. Register Discord slash commands from GitHub without needing a local computer: open the repository's **Actions** tab, select **Register Discord Commands**, choose **Run workflow**, then run it on `main`. This workflow uses the repository's `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `OPENAI_API_KEY` Actions secrets. For fast guild-only registration, optionally add a GitHub Actions variable named `DISCORD_GUILD_ID`; otherwise commands are registered globally.

**Important:** GitHub Actions repository secrets are not automatically copied to Railway. Add the required values in Railway Variables as well. Never put credentials in source files, commit messages, or chat.

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

- Without Supabase, restarting the bot clears conversation context.
- Voice receive behavior depends on Discord voice networking and should be tested in a real server.
- Only one bot voice session per server is supported.
- The bot does not automatically join voice channels.
- The initial version has no dashboard or web control panel.

## Configuration

See `.env.example` for all supported environment variables.
