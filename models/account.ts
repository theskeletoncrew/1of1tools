export interface Account {
  walletAddresses: string[];
  isCreator: string;
  username: string;
  email: string;

  discordAccount?: DiscordAccount | null;
  discordGuilds?: DiscordGuild[] | null;
}

export interface DiscordAccount {
  id?: string | null;
  username: string;
  discriminator: string;
  avatarId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  iconURL: string | null;
  channels: DiscordChannel[];
  selectedChannelId: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
}

export interface DiscordGuildChannelIdPair {
  guildId: string;
  channelId: string;
}
