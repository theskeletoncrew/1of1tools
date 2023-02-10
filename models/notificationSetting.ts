export interface DialectCreatorNotificationSetting
  extends DialectNotificationSetting {
  creatorAddress: string;
}

export interface DialectNftNotificationSetting
  extends DialectNotificationSetting {
  mintAddress: string;
}

export interface DialectNotificationSetting {
  subscriberAddress: string;
  deliveryAddress: string;
  formfunctionNotifications: boolean;
  exchangeArtNotifications: boolean;
}

export interface DiscordGuildCreatorNotificationSetting
  extends DiscordGuildNotificationSetting {
  creatorAddress: string;
}

export interface DiscordGuildNotificationSetting {
  subscriberAddress: string;
  guildId: string;
  channelId: string;
  formfunctionNotifications?: boolean;
  exchangeArtNotifications?: boolean;
}
