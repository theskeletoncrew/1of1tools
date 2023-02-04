import { Firestore } from "@google-cloud/firestore";
import { randomUUID } from "crypto";
import { Account, DiscordAccount, DiscordGuild } from "models/account";
import { Collection, CollectionFloor } from "models/collection";
import {
  DialectCreatorNotificationSetting,
  DialectNftNotificationSetting,
  DiscordGuildCreatorNotificationSetting,
  DiscordGuildNotificationSetting,
} from "models/notificationSetting";
import { err, ok, Result } from "neverthrow";
import { COLLECTIONS_PER_PAGE } from "utils/config";

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
});

export async function getDialectCreatorNotificationsByUser(
  creatorAddress: string,
  subscriberAddress: string,
  environment: string = "mainnet"
): Promise<Result<DialectCreatorNotificationSetting | null, Error>> {
  try {
    const doc = await db
      .collection(
        `${environment}/creator-notifications-dialect/${creatorAddress}`
      )
      .doc(subscriberAddress)
      .get();

    const setting = doc.data() as DialectCreatorNotificationSetting;
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

export async function setDialectCreatorNotificationsByUser(
  creatorAddress: string,
  subscriberAddress: string,
  deliveryAddress: string,
  formfunctionNotifications: boolean,
  exchangeArtNotifications: boolean,
  environment: string = "mainnet"
): Promise<Result<string, Error>> {
  try {
    await db
      .collection(
        `${environment}/creator-notifications-dialect/${creatorAddress}`
      )
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

export async function getDialectSubscribersToNotificationsForCreator(
  creatorAddress: string,
  environment: string = "mainnet"
): Promise<Result<DialectCreatorNotificationSetting[], Error>> {
  try {
    const query = await db
      .collection(
        `${environment}/creator-notifications-dialect/${creatorAddress}`
      )
      .get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as DialectCreatorNotificationSetting;
      notification.creatorAddress = doc.id;
      return notification;
    });

    return ok(subscribers);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDialectNftNotificationsByMint(
  mintAddress: string,
  subscriberAddress: string,
  environment: string = "mainnet"
): Promise<Result<DialectNftNotificationSetting | null, Error>> {
  try {
    const doc = await db
      .collection(`${environment}/nft-notifications-dialect/${mintAddress}`)
      .doc(subscriberAddress)
      .get();

    const setting = doc.data() as DialectNftNotificationSetting;
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

export async function setDialectNftNotificationsByUser(
  mintAddress: string,
  subscriberAddress: string,
  deliveryAddress: string,
  formfunctionNotifications: boolean,
  exchangeArtNotifications: boolean,
  environment: string = "mainnet"
): Promise<Result<string, Error>> {
  try {
    await db
      .collection(`${environment}/nft-notifications-dialect/${mintAddress}`)
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

export async function getDialectSubscribersToNotificationsForNft(
  mintAddress: string,
  environment: string = "mainnet"
): Promise<Result<DialectNftNotificationSetting[], Error>> {
  try {
    const query = await db
      .collection(`${environment}/nft-notifications-dialect/${mintAddress}`)
      .get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as DialectNftNotificationSetting;
      notification.mintAddress = doc.id;
      return notification;
    });

    return ok(subscribers);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDiscordCreatorNotificationsByUser(
  creatorAddress: string,
  subscriberAddress: string,
  environment: string = "mainnet"
): Promise<Result<DiscordGuildCreatorNotificationSetting[] | null, Error>> {
  try {
    const query = await db
      .collection(
        `${environment}/creator-notifications-discord/${creatorAddress}/${subscriberAddress}/discords`
      )
      .get();

    const subscriptions = query.docs.map((doc) => {
      const subscription = doc.data() as DiscordGuildCreatorNotificationSetting;
      subscription.creatorAddress = creatorAddress;
      subscription.subscriberAddress = subscriberAddress;
      subscription.guildId = doc.id;
      return subscription;
    });

    return ok(subscriptions);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setDiscordCreatorNotificationsByUser(
  creatorAddress: string,
  subscriberAddress: string,
  subscriptions: DiscordGuildNotificationSetting[],
  environment: string = "mainnet"
): Promise<Result<null, Error>> {
  try {
    let batch = db.batch();

    const query = await db
      .collection(
        `${environment}/creator-notifications-discord/${creatorAddress}/${subscriberAddress}/discords`
      )
      .get();

    query.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = subscriptions[i]!;
      const query = await db
        .collection(
          `${environment}/creator-notifications-discord/${creatorAddress}/${subscriberAddress}/discords`
        )
        .doc(subscription.guildId);
      batch.set(query, {
        channelId: subscription.channelId,
        formfunctionNotifications: subscription.formfunctionNotifications,
        exchangeArtNotifications: subscription.exchangeArtNotifications,
      });
    }
    await batch.commit();

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDiscordSubscribersToNotificationsForCreator(
  creatorAddress: string,
  environment: string = "mainnet"
): Promise<Result<DiscordGuildCreatorNotificationSetting[], Error>> {
  try {
    const query = await db
      .collection(
        `${environment}/creator-notifications-discord/${creatorAddress}`
      )
      .get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as DiscordGuildCreatorNotificationSetting;
      notification.creatorAddress = doc.id;
      return notification;
    });

    return ok(subscribers);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getAccountByUsername(
  username: string
): Promise<Result<Account | null, Error>> {
  try {
    const doc = await db.collection(`accounts`).doc(username).get();

    const account = doc.data() as Account;
    if (!doc) {
      return ok(null);
    }

    account.username = doc.id;

    return ok(account);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getAccountByWallet(
  walletAddress: string
): Promise<Result<Account, Error>> {
  try {
    const query = await db
      .collection(`accounts`)
      .where("walletAddresses", "array-contains", walletAddress)
      .get();

    const accounts = query.docs.map((doc) => {
      const account = doc.data() as Account;
      account.username = doc.id;
      return account;
    });

    if (accounts.length === 1) {
      return ok(accounts[0]!);
    }

    return err(new Error("Failed to find account for the provided wallet."));
  } catch (error) {
    return err(error as Error);
  }
}

export async function createAccount(
  walletAddress: string,
  isCreator: boolean,
  username: string,
  email: string | undefined,
  discordId: string | undefined
): Promise<Result<null, Error>> {
  try {
    await db
      .collection("accounts")
      .doc(username)
      .set({
        walletAddresses: [walletAddress],
        isCreator: isCreator,
        email: email,
        discordId: discordId,
      });

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function connectAccountWithDiscord(
  username: string,
  discordAccount: DiscordAccount
): Promise<Result<null, Error>> {
  try {
    await db.collection("accounts").doc(username).update({
      discordAccount: discordAccount,
    });

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setDiscordGuilds(
  username: string,
  discordGuilds: DiscordGuild[]
): Promise<Result<null, Error>> {
  try {
    await db.collection("accounts").doc(username).update({
      discordGuilds: discordGuilds,
    });

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getBoutiqueCollections(
  cursor: string | null | undefined,
  limit: number | null = COLLECTIONS_PER_PAGE
): Promise<Result<Collection[], Error>> {
  try {
    let query = db
      .collection("boutique-collections")
      .where("approved", "==", true)
      .orderBy("totalVolume", "desc");

    if (cursor) {
      query = query.startAfter(cursor);
    }
    if (limit !== null) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    const collections = snapshot.docs.map((doc) => {
      const collection = doc.data() as Collection;
      collection.slug = doc.id;
      return collection;
    });

    return ok(collections);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getBoutiqueCollection(
  slug: string
): Promise<Result<Collection | null, Error>> {
  try {
    const collectionDoc = await db
      .collection("boutique-collections")
      .doc(encodeURIComponent(slug))
      .get();

    if (collectionDoc.exists) {
      const collection = collectionDoc.data() as Collection;
      collection.slug = collectionDoc.id;
      if (collection.approved) {
        return ok(collection);
      }
    }

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function addBoutiqueCollection(
  collection: Collection
): Promise<Result<null, Error>> {
  try {
    const { slug, ...collectionDetails } = collection;

    const existingCollection = await db
      .collection("boutique-collections")
      .doc(encodeURIComponent(slug))
      .get();

    if (existingCollection.exists) {
      const collection = existingCollection.data() as Collection;
      if (collection.approved) {
        return err(new Error("This collection has already been submitted."));
      }
    }

    await db
      .collection("boutique-collections")
      .doc(existingCollection.exists ? slug + "---" + randomUUID() : slug)
      .set(collectionDetails);

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setBoutiqueCollectionFloor(
  slug: string,
  floor: CollectionFloor | null
): Promise<Result<null, Error>> {
  try {
    await db
      .collection("boutique-collections")
      .doc(slug)
      .update({ floor: floor });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setBoutiqueCollectionFilters(
  slug: string,
  collectionAddress: string | null,
  firstVerifiedCreator: string | null
): Promise<Result<null, Error>> {
  try {
    await db.collection("boutique-collections").doc(slug).update({
      collectionAddress: collectionAddress,
      firstVerifiedCreator: firstVerifiedCreator,
    });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setBoutiqueCollectionTotalVolume(
  slug: string,
  totalVolume: number
): Promise<Result<null, Error>> {
  try {
    await db.collection("boutique-collections").doc(slug).update({
      totalVolume: totalVolume,
    });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}
