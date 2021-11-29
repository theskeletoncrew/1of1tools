import { Firestore } from "@google-cloud/firestore";
import {
  CreatorNotificationSetting,
  NftNotificationSetting,
} from "models/notificationSetting";
import { err, ok, Result } from "neverthrow";

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
});

export async function getCreatorNotificationsByUser(
  creatorAddress: string,
  subscriberAddress: string,
  environment: string = "mainnet"
): Promise<Result<CreatorNotificationSetting | null, Error>> {
  try {
    const doc = await db
      .collection(`${environment}/creator-notifications/${creatorAddress}`)
      .doc(subscriberAddress)
      .get();

    const setting = doc.data() as CreatorNotificationSetting;
    if (!setting) {
      return ok(null);
    }

    setting.creatorAddress = creatorAddress;
    setting.subscriberAddress = subscriberAddress;

    return ok(setting);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setCreatorNotificationsByUser(
  creatorAddress: string,
  subscriberAddress: string,
  deliveryAddress: string,
  formfunctionNotifications: boolean,
  exchangeArtNotifications: boolean,
  environment: string = "mainnet"
): Promise<Result<string, Error>> {
  try {
    await db
      .collection(`${environment}/creator-notifications/${creatorAddress}`)
      .doc(subscriberAddress)
      .set({
        deliveryAddress: deliveryAddress,
        formfunctionNotifications: formfunctionNotifications,
        exchangeArtNotifications: exchangeArtNotifications,
      });

    return ok(subscriberAddress);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getSubscribersToNotificationsForCreator(
  creatorAddress: string,
  environment: string = "mainnet"
): Promise<Result<CreatorNotificationSetting[], Error>> {
  try {
    const query = await db
      .collection(`${environment}/creator-notifications/${creatorAddress}`)
      .get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as CreatorNotificationSetting;
      notification.creatorAddress = doc.id;
      return notification;
    });

    return ok(subscribers);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getNftNotificationsByMint(
  mintAddress: string,
  subscriberAddress: string,
  environment: string = "mainnet"
): Promise<Result<NftNotificationSetting | null, Error>> {
  try {
    const doc = await db
      .collection(`${environment}/nft-notifications/${mintAddress}`)
      .doc(subscriberAddress)
      .get();

    const setting = doc.data() as NftNotificationSetting;
    if (!setting) {
      return ok(null);
    }

    setting.mintAddress = mintAddress;
    setting.subscriberAddress = subscriberAddress;

    return ok(setting);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setNftNotificationsByUser(
  mintAddress: string,
  subscriberAddress: string,
  deliveryAddress: string,
  formfunctionNotifications: boolean,
  exchangeArtNotifications: boolean,
  environment: string = "mainnet"
): Promise<Result<string, Error>> {
  try {
    await db
      .collection(`${environment}/nft-notifications/${mintAddress}`)
      .doc(subscriberAddress)
      .set({
        deliveryAddress: deliveryAddress,
        formfunctionNotifications: formfunctionNotifications,
        exchangeArtNotifications: exchangeArtNotifications,
      });

    return ok(subscriberAddress);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getSubscribersToNotificationsForNft(
  mintAddress: string,
  environment: string = "mainnet"
): Promise<Result<NftNotificationSetting[], Error>> {
  try {
    const query = await db
      .collection(`${environment}/nft-notifications/${mintAddress}`)
      .get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as NftNotificationSetting;
      notification.mintAddress = doc.id;
      return notification;
    });

    return ok(subscribers);
  } catch (error) {
    return err(error as Error);
  }
}
