export interface CreatorNotificationSetting extends NotificationSetting {
  creatorAddress: string;
}

export interface NftNotificationSetting extends NotificationSetting {
  mintAddress: string;
}

export interface NotificationSetting {
  subscriberAddress: string;
  deliveryAddress: string;
  formfunctionNotifications: boolean;
  exchangeArtNotifications: boolean;
}
