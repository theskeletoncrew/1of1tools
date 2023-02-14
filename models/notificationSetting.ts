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
  formfunctionNotifications?: boolean;
  exchangeArtNotifications?: boolean;
}

export interface DiscordSubscriptionsContainer {
  subscriberAddress: string;
  discords: DiscordGuildNotificationSetting[];
}

export interface DiscordGuildNotificationSetting {
  guildId: string;
  channelId: string;
  formfunctionNotifications?: boolean;
  exchangeArtNotifications?: boolean;
}

export interface DiscordCreatorSubscriptionsContainer
  extends DiscordSubscriptionsContainer {
  creatorAddress: string;
}
