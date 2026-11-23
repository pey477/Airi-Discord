import {
  AudioPlayerStatus,
  EndBehaviorType,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel
} from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";
import { Readable } from "node:stream";
import { once } from "node:events";
import prism from "prism-media";
import { askAiri, synthesizeSpeech, transcribePcmWav } from "./ai.js";
import { pcmToWav } from "./audio.js";
import { config } from "./config.js";

type GuildVoice = {
  connection: ReturnType<typeof joinVoiceChannel>;
  player: ReturnType<typeof createAudioPlayer>;
  speechQueue: Promise<void>;
};

const sessions = new Map<string, GuildVoice>();
const busySpeakers = new Set<string>();

export async function joinVoice(channel: VoiceBasedChannel): Promise<void> {
  const guildId = channel.guild.id;
  leaveVoice(guildId);

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
  connection.subscribe(player);
  const session: GuildVoice = { connection, player, speechQueue: Promise.resolve() };
  sessions.set(guildId, session);

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (error) {
    leaveVoice(guildId);
    throw error;
  }

  connection.receiver.speaking.on("start", (userId) => {
    if (userId === channel.client.user.id) return;
    const speakerKey = guildId + ":" + userId;
    if (busySpeakers.has(speakerKey)) return;
    busySpeakers.add(speakerKey);

    const audio = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: config.VOICE_SILENCE_MS }
    });
    const decoder = new prism.opus.Decoder({ rate: 48_000, channels: 2, frameSize: 960 });
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let tooLong = false;
    let processing = false;

    audio.pipe(decoder);
    decoder.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > config.VOICE_MAX_SECONDS * 48_000 * 2 * 2) {
        tooLong = true;
        audio.destroy();
        decoder.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });

    decoder.once("error", (error: Error) => {
      console.warn("Voice decoder error:", error.message);
      busySpeakers.delete(speakerKey);
    });

    decoder.once("close", () => {
      if (!processing) busySpeakers.delete(speakerKey);
    });

    decoder.once("end", () => {
      processing = true;
      void (async () => {
        try {
          if (tooLong || totalBytes < 8_000 || !sessions.has(guildId)) return;
          const transcript = await transcribePcmWav(pcmToWav(Buffer.concat(chunks)));
          if (!transcript || !sessions.has(guildId)) return;
          const reply = await askAiri(guildId, userId, transcript);
          const mp3 = await synthesizeSpeech(reply);
          await queueSpeech(session, mp3);
        } catch (error) {
          console.error("Voice turn failed:", error);
        } finally {
          busySpeakers.delete(speakerKey);
        }
      })();
    });
  });
}

async function queueSpeech(session: GuildVoice, mp3: Buffer): Promise<void> {
  session.speechQueue = session.speechQueue.then(async () => {
    if (session.connection.state.status !== VoiceConnectionStatus.Ready) return;
    const resource = createAudioResource(Readable.from([mp3]), { inputType: StreamType.Arbitrary });
    const finished = once(session.player, AudioPlayerStatus.Idle);
    session.player.play(resource);
    await finished;
  }).catch((error: unknown) => {
    console.error("Voice playback failed:", error);
  });
  await session.speechQueue;
}

export function leaveVoice(guildId: string): void {
  const session = sessions.get(guildId);
  if (!session) return;
  session.player.stop(true);
  session.connection.destroy();
  sessions.delete(guildId);
}
