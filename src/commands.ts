import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Chat with Airi")
    .addStringOption((option) =>
      option.setName("message").setDescription("What do you want to say?").setRequired(true).setMaxLength(1500)
    ),
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Invite Airi to your current voice channel"),
  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Make Airi leave the voice channel"),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether Airi is responding"),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show Airi commands and usage"),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Clear your conversation history with Airi")
].map((command) => command.toJSON());

export const voiceChannelType = ChannelType.GuildVoice;
export const manageGuildPermission = PermissionFlagsBits.ManageGuild;
