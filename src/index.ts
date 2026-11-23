import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags
} from "discord.js";
import { askAiri, clearHistory } from "./ai.js";
import { config } from "./config.js";
import { joinVoice, leaveVoice } from "./voice.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log("Airi is online as " + readyClient.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.guildId) return;

  try {
    if (interaction.commandName === "ask") {
      const prompt = interaction.options.getString("message", true);
      await interaction.deferReply();
      const answer = await askAiri(interaction.guildId, interaction.user.id, prompt);
      await interaction.editReply(answer.slice(0, 2000));
      return;
    }

    if (interaction.commandName === "join") {
      const channel = interaction.guild?.members.me?.voice.channel
        ? interaction.guild.members.me.voice.channel
        : interaction.member && "voice" in interaction.member
          ? interaction.member.voice.channel
          : null;
      if (!channel || !("guild" in channel)) {
        await interaction.reply({ content: "Masuk ke voice channel dulu, lalu jalankan /join ya.", flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await joinVoice(channel);
      await interaction.editReply("Airi sudah bergabung! Aku akan mendengarkan setelah ada yang berbicara.");
      return;
    }

    if (interaction.commandName === "leave") {
      leaveVoice(interaction.guildId);
      await interaction.reply({ content: "Oke, Airi keluar dari voice channel.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (interaction.commandName === "ping") {
      await interaction.reply({ content: "Pong! Airi aktif dan siap menerima pesan. 💗", flags: MessageFlags.Ephemeral });
      return;
    }

    if (interaction.commandName === "help") {
      await interaction.reply({
        content: "**Perintah Airi**\n`/ask message` — ngobrol dengan Airi lewat teks.\n`/join` — gabungkan Airi ke voice channel kamu.\n`/leave` — keluarkan Airi dari voice channel.\n`/reset` — hapus konteks percakapanmu.\n`/ping` — cek status respons bot.\n`/help` — tampilkan bantuan ini.\n\nVoice bersifat turn-based dan memproses audio ketika Airi berada di voice channel.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (interaction.commandName === "reset") {
      clearHistory(interaction.guildId, interaction.user.id);
      await interaction.reply({ content: "Riwayat percakapanmu sudah direset.", flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error("Interaction failed:", error);
    const message = "Maaf, terjadi kesalahan saat memproses perintah. Coba lagi sebentar ya.";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message).catch(() => undefined);
    } else {
      await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch(() => undefined);
    }
  }
});

client.on(Events.Error, (error) => console.error("Discord client error:", error));
process.on("unhandledRejection", (error) => console.error("Unhandled rejection:", error));

await client.login(config.DISCORD_TOKEN);
