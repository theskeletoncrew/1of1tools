import { Firestore, FieldValue } from "@google-cloud/firestore";
import { isNftPrintEdition, Metaplex, Nft } from "@metaplex-foundation/js";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CollectionSortType } from "components/CollectionSort/CollectionSort";
import { randomUUID } from "crypto";
import { TransactionType } from "helius-sdk";
import { Account, DiscordAccount, DiscordGuild } from "models/account";
import { Collection, CollectionFloor, CollectionNFT } from "models/collection";
import { OneOfOneNFTEvent } from "models/nftEvent";
import {
  DialectCreatorNotificationSetting,
  DialectNftNotificationSetting,
  DialectNotificationSetting,
  DiscordCreatorSubscriptionsContainer,
  DiscordGuildNotificationSetting,
  DiscordSubscriptionsContainer,
} from "models/notificationSetting";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import { PaginationToken } from "models/paginationToken";
import { err, ok, Result } from "neverthrow";
import { notEmpty } from "utils";
import { COLLECTIONS_PER_PAGE } from "utils/config";
import { recalculateFloorPrice } from "utils/floorPrice";
import { clusterApiUrl, network } from "utils/network";

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

export async function getDialectBoutiqueNotificationsByUser(
  subscriberAddress: string
): Promise<Result<DialectNotificationSetting | null, Error>> {
  try {
    const doc = await db
      .collection(`boutique-notifications-dialect`)
      .doc(subscriberAddress)
      .get();

    const setting = doc.data() as DialectNotificationSetting;
    if (!setting) {
      return ok(null);
    }

    setting.subscriberAddress = subscriberAddress;

    return ok(setting);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setDialectBoutiqueNotificationsByUser(
  subscriberAddress: string,
  deliveryAddress: string
): Promise<Result<string, Error>> {
  try {
    await db
      .collection(`boutique-notifications-dialect`)
      .doc(subscriberAddress)
      .set({
        deliveryAddress: deliveryAddress,
      });

    return ok(subscriberAddress);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDiscordBoutiqueNotificationsByUser(
  subscriberAddress: string
): Promise<Result<DiscordSubscriptionsContainer | null, Error>> {
  try {
    const doc = await db
      .collection(`boutique-notifications-discord`)
      .doc(subscriberAddress)
      .get();

    const subscriptions = doc.data() as DiscordSubscriptionsContainer;

    if (!subscriptions) {
      return ok(null);
    }

    subscriptions.subscriberAddress = subscriberAddress;

    return ok(subscriptions);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setDiscordBoutiqueNotificationsByUser(
  subscriberAddress: string,
  subscriptions: DiscordGuildNotificationSetting[]
): Promise<Result<null, Error>> {
  try {
    const docRef = await db
      .collection(`boutique-notifications-discord`)
      .doc(subscriberAddress)
      .set({
        discords: subscriptions,
      });

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDiscordSubscribersToBoutiqueNotifications(): Promise<
  Result<DiscordSubscriptionsContainer[], Error>
> {
  try {
    const query = await db.collection(`boutique-notifications-discord`).get();

    const subscribers = query.docs
      .map((doc) => {
        const subscriptions = doc.data() as DiscordSubscriptionsContainer;
        subscriptions.subscriberAddress = doc.id;
        return subscriptions;
      })
      .filter(notEmpty);

    return ok(subscribers);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDialectSubscribersToBoutiqueNotifications(): Promise<
  Result<DialectNotificationSetting[], Error>
> {
  try {
    const query = await db.collection(`boutique-notifications-dialect`).get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as DialectNotificationSetting;
      notification.subscriberAddress = doc.id;
      return notification;
    });

    return ok(subscribers);
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
): Promise<Result<DiscordCreatorSubscriptionsContainer | null, Error>> {
  try {
    const doc = await db
      .collection(
        `${environment}/creator-notifications-discord/${creatorAddress}`
      )
      .doc(subscriberAddress)
      .get();

    const subscriptions = doc.data() as DiscordCreatorSubscriptionsContainer;

    if (!subscriptions) {
      return ok(null);
    }

    subscriptions.subscriberAddress = doc.id;
    subscriptions.creatorAddress = creatorAddress;

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
    await db
      .collection(
        `${environment}/creator-notifications-discord/${creatorAddress}`
      )
      .doc(subscriberAddress)
      .set({
        discords: subscriptions,
      });

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getDiscordSubscribersToNotificationsForCreator(
  creatorAddress: string,
  environment: string = "mainnet"
): Promise<Result<DiscordCreatorSubscriptionsContainer[], Error>> {
  try {
    const query = await db
      .collection(
        `${environment}/creator-notifications-discord/${creatorAddress}`
      )
      .get();

    const subscribers = query.docs.map((doc) => {
      const notification = doc.data() as DiscordCreatorSubscriptionsContainer;
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

export async function getBoutiqueCollections(options?: {
  cursor?: string | null; // default: null,
  limit?: number | null; // default: COLLECTIONS_PER_PAGE,
  sort?: CollectionSortType | null; // default: CollectionSortType.TOTAL_VOLUME_DESC
}): Promise<Result<Collection[], Error>> {
  try {
    let query = db
      .collection("boutique-collections")
      .where("approved", "==", true);

    const resolvedSort = options?.sort ?? CollectionSortType.TOTAL_VOLUME_DESC;
    switch (resolvedSort) {
      case CollectionSortType.ATH_SALE_DESC:
        query = query.orderBy("athSale.amount", "desc");
        break;
      case CollectionSortType.DAILY_VOLUME_DESC:
        query = query.orderBy("dayVolume", "desc");
        break;
      case CollectionSortType.FLOOR_DESC:
        query = query.orderBy("floor.listing.amount", "desc");
        break;
      case CollectionSortType.SIZE_ASC:
        query = query.orderBy("numItems", "asc");
        break;
      case CollectionSortType.TOTAL_VOLUME_DESC:
        query = query.orderBy("totalVolume", "desc");
        break;
      case CollectionSortType.WEEKLY_VOLUME_DESC:
        query = query.orderBy("weekVolume", "desc");
        break;
      case CollectionSortType.NAME_ASC:
        query = query.orderBy("nameLowercase", "asc");
        break;
      default:
        console.log("no sort matching " + resolvedSort);
    }

    if (options?.cursor && options?.cursor.length > 0) {
      const docRef = await db
        .collection("boutique-collections")
        .doc(options.cursor)
        .get();
      if (docRef) {
        query = query.startAfter(docRef);
      }
    }

    const resolvedLimit =
      options && options.limit !== undefined
        ? options.limit
        : COLLECTIONS_PER_PAGE;

    if (resolvedLimit) {
      query = query.limit(resolvedLimit);
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

export async function addAllMintsAsTracked(
  collection: Collection
): Promise<Result<null, Error>> {
  try {
    const batch = db.batch();

    collection.mintAddresses.forEach((address) => {
      var docRef = db.collection("boutique-collection-items").doc(address);
      batch.set(docRef, {
        collectionSlug: collection.slug,
      });
    });

    await batch.commit();

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function addMintAsTracked(
  mintAddress: string,
  collectionSlug: string
): Promise<Result<null, Error>> {
  try {
    await db.collection("boutique-collection-items").doc(mintAddress).set({
      collectionSlug: collectionSlug,
    });

    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setBoutiqueCollectionExtras(
  slug: string,
  collectionAddress: string | null,
  firstVerifiedCreator: string | null,
  numItems: number,
  cachedImage: string | null
): Promise<Result<null, Error>> {
  try {
    await db.collection("boutique-collections").doc(slug).update({
      collectionAddress: collectionAddress,
      firstVerifiedCreator: firstVerifiedCreator,
      numItems: numItems,
      cachedImage: cachedImage,
    });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function setBoutiqueCollectionStats(
  slug: string,
  totalVolume: number,
  monthVolume: number,
  weekVolume: number,
  dayVolume: number,
  athSale: OneOfOneNFTEvent | null,
  floor: CollectionFloor | null
): Promise<Result<null, Error>> {
  try {
    await db.collection("boutique-collections").doc(slug).update({
      totalVolume: totalVolume,
      monthVolume: monthVolume,
      weekVolume: weekVolume,
      dayVolume: dayVolume,
      athSale: athSale,
      floor: floor,
    });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function addBoutiqueCollectionCachedImage(
  slug: string,
  cachedImage: string | null
): Promise<Result<null, Error>> {
  try {
    await db.collection("boutique-collections").doc(slug).update({
      cachedImage: cachedImage,
    });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getBoutiqueCollectionEvents(
  mintAddress: string,
  limit: number = 100,
  cursor: PaginationToken | undefined
): Promise<Result<OneOfOneNFTEvent[], Error>> {
  try {
    console.log("getting firebase events for " + mintAddress);
    let query = await db
      .collection(`boutique-collection-events`)
      .where("mint", "==", mintAddress)
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (cursor && cursor.length > 0) {
      const docRef = await db
        .collection("boutique-collection-events")
        .doc(cursor)
        .get();
      if (docRef) {
        query = query.startAfter(docRef);
      }
    }

    const snapshot = await query.get();

    const events = snapshot.docs.map((doc) => {
      const event = doc.data() as OneOfOneNFTEvent;
      event.signature = doc.id;
      return event;
    });

    return ok(events);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getLatestBoutiqueCollectionEvents(
  limit: number = 8
): Promise<Result<OneOfOneNFTEvent[], Error>> {
  try {
    let query = await db
      .collection(`boutique-collection-events`)
      .orderBy("timestamp", "desc")
      .limit(limit * 4);

    const snapshot = await query.get();

    let uniqueEvents: { [nftAddress: string]: OneOfOneNFTEvent } = {};

    snapshot.docs.reverse().forEach((doc) => {
      const event = doc.data() as OneOfOneNFTEvent;
      event.signature = doc.id;
      uniqueEvents[event.mint] = event;
    });

    const events = Object.values(uniqueEvents)
      .sort((e1, e2) => e2.timestamp - e1.timestamp)
      .slice(0, limit);

    return ok(events);
  } catch (error) {
    return err(error as Error);
  }
}

export async function addBoutiqueCollectionEvent(
  slug: string,
  event: OneOfOneNFTEvent
): Promise<Result<null, Error>> {
  try {
    const { signature, ...eventDetails } = event;

    // add the event
    await db
      .collection(`boutique-collection-events`)
      .doc(signature)
      .set({
        ...eventDetails,
        ...{ collectionSlug: slug },
      });
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function addBoutiqueCollectionEventIfMonitoredAndUpdateStats(
  event: OneOfOneNFTEvent
): Promise<Result<{ isNewlyTracked: boolean; shouldIgnore: boolean }, Error>> {
  try {
    const nftRef = await db
      .collection("boutique-collection-items")
      .doc(event.mint)
      .get();

    let nft: CollectionNFT | undefined;
    let isNewlyTrackedNFT = false;

    if (nftRef.exists) {
      nft = nftRef.data() as CollectionNFT;
    } else {
      const nftRes = await trackNewMintIfPartOfCollection(event);
      // its something we're not going to track because it does belong to a collection
      // but its not one of the boutique collections
      if (nftRes.shouldIgnore) {
        return ok({ isNewlyTracked: false, shouldIgnore: true });
      }
      nft = nftRes.collectionNFT;
      isNewlyTrackedNFT = true;
    }
    if (!nft) {
      return err(new Error("NFT is not tracked."));
    }

    const slug = nft.collectionSlug;

    const { signature, ...eventDetails } = event;

    await db.runTransaction(async (transaction) => {
      let collection: Collection | null = null;

      // NOTE: ALL READS MUST COME BEFORE WRITES IN FIRESTORE TRANSACTION
      if (
        [
          TransactionType.NFT_LISTING ||
            TransactionType.NFT_CANCEL_LISTING ||
            TransactionType.NFT_SALE ||
            TransactionType.NFT_MINT ||
            TransactionType.BURN ||
            TransactionType.BURN_NFT,
        ].includes(event.type as TransactionType)
      ) {
        const collectionRes = await getBoutiqueCollection(slug);
        collection = collectionRes.isOk() ? collectionRes.value : null;
      }

      // add the event
      const eventRef = db
        .collection(`boutique-collection-events`)
        .doc(signature);
      await transaction.set(eventRef, {
        ...eventDetails,
        ...{ collectionSlug: slug },
      });

      // for mints and sales, update stats as part of the same transaction
      if (
        collection &&
        [TransactionType.NFT_MINT, TransactionType.NFT_SALE].includes(
          event.type as TransactionType
        )
      ) {
        // get all events in the collection for the last 30 days
        const nowInSeconds = new Date().getTime() / 1000.0;
        const dayInSeconds = 60 * 60 * 24;
        const snapshot = await transaction.get(
          db
            .collection("boutique-collection-events")
            .where("collectionSlug", "==", slug)
            .where("timestamp", ">", nowInSeconds - 30 * dayInSeconds)
        );

        const events = snapshot.docs.map((doc) => {
          const event = doc.data() as OneOfOneNFTEvent;
          event.signature = doc.id;
          return event;
        });

        // recalculate 30d, 7d, 1d volume, and we'll just increment total volume
        const monthVolume = events.reduce(
          (prev, current) => prev + current.amount / LAMPORTS_PER_SOL,
          0
        );
        const weekVolume = events
          .filter((e) => e.timestamp > nowInSeconds - 7 * dayInSeconds)
          .reduce(
            (prev, current) => prev + current.amount / LAMPORTS_PER_SOL,
            0
          );
        const dayVolume = events
          .filter((e) => e.timestamp > nowInSeconds - dayInSeconds)
          .reduce(
            (prev, current) => prev + current.amount / LAMPORTS_PER_SOL,
            0
          );

        const update: any = {
          monthVolume: monthVolume,
          weekVolume: weekVolume,
          dayVolume: dayVolume,
          totalVolume: FieldValue.increment(event.amount / LAMPORTS_PER_SOL),
        };

        // change ATH sale if this event qualifies
        if (!collection.athSale || event.amount > collection.athSale.amount) {
          update.athSale = {
            amount: event.amount,
            buyer: event.buyer,
            mint: event.mint,
            name: event.name,
            seller: event.seller,
            signature: event.signature,
            source: event.source,
            timestamp: event.timestamp,
          };
        }

        // update 30d, 7d, 1d, increment total volume
        await transaction.set(
          db.collection(`boutique-collections`).doc(slug),
          update
        );
      }

      // for events that could effect floor price, recalculate floor price
      if (
        collection &&
        [
          TransactionType.NFT_LISTING ||
            TransactionType.NFT_CANCEL_LISTING ||
            TransactionType.NFT_SALE ||
            TransactionType.NFT_MINT ||
            TransactionType.BURN ||
            TransactionType.BURN_NFT,
        ].includes(event.type as TransactionType)
      ) {
        const floorRes = await recalculateFloorPrice(collection);
        if (floorRes.isOk()) {
          const floor = floorRes.value;
          await transaction.update(
            db.collection("boutique-collections").doc(slug),
            { floor: floor }
          );
          console.log(
            `Saved floor of collection: ${collection.name} as ${floor?.listing.amount}`
          );
        }
      }
    });

    return ok({
      isNewlyTracked: isNewlyTrackedNFT,
      shouldIgnore: false,
    });
  } catch (error) {
    console.error(error);
    return err(error as Error);
  }
}

export async function addBoutiqueCollectionEventForUnmonitoredNFT(
  event: OneOfOneNFTEvent
): Promise<Result<null, Error>> {
  try {
    const { signature, ...eventDetails } = event;

    // add the event
    await db
      .collection(`boutique-collection-unmonitored-events`)
      .doc(signature)
      .set({
        ...eventDetails,
      });

    return ok(null);
  } catch (error) {
    console.error(error);
    return err(error as Error);
  }
}

export async function getAllEvents(): Promise<
  Result<OneOfOneNFTEvent[], Error>
> {
  try {
    const snapshot = await db.collection(`boutique-collection-events`).get();

    const events = snapshot.docs.map((doc) => {
      const event = doc.data() as OneOfOneNFTEvent;
      event.signature = doc.id;
      return event;
    });

    return ok(events);
  } catch (error) {
    return err(error as Error);
  }
}

export async function trackNewMintIfPartOfCollection(
  event: OneOfOneNFTEvent
): Promise<{
  collectionNFT: CollectionNFT | undefined;
  shouldIgnore: boolean;
}> {
  const endpoint = clusterApiUrl(network);
  const connection = new Connection(endpoint);
  const mx = Metaplex.make(connection);
  const nftDetails = (await mx
    .nfts()
    .findByMint({ mintAddress: new PublicKey(event.mint) })) as Nft;

  if (isNftPrintEdition(nftDetails.edition)) {
    return {
      collectionNFT: undefined,
      shouldIgnore: true,
    };
  }

  if (nftDetails.collection?.address) {
    const collectionRef = await db
      .collection("boutique-collections")
      .where(
        "collectionAddress",
        "==",
        nftDetails.collection.address.toString()
      )
      .limit(1)
      .get();

    if (collectionRef.docs.length == 1) {
      const collection = collectionRef.docs[0]!.data() as Collection;
      collection.slug = collectionRef.docs[0]!.id;
      const updatedMints = collection.mintAddresses.concat(event.mint);

      // add mint address to collection
      await db.collection(`boutique-collections`).doc(collection.slug).set(
        {
          mintAddresses: updatedMints,
        },
        { merge: true }
      );

      // add all of the mint addresses to the list of tracked addresses
      await addMintAsTracked(event.mint, collection.slug);

      return {
        collectionNFT: {
          address: event.mint,
          collectionSlug: collection.slug,
        } as CollectionNFT,
        shouldIgnore: nftDetails.collection?.address !== null,
      };
    }
  }

  return {
    collectionNFT: undefined,
    shouldIgnore: false,
  };
}

export async function addNewTrackedMint(
  mintAddress: string,
  collectionSlug?: string
): Promise<{ collection: Collection; nft: CollectionNFT } | undefined> {
  let collection: Collection | null = null;

  if (!collectionSlug) {
    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint);
    const mx = Metaplex.make(connection);
    const nftDetails = (await mx
      .nfts()
      .findByMint({ mintAddress: new PublicKey(mintAddress) })) as Nft;
    if (nftDetails.collection?.address) {
      const collectionRef = await db
        .collection("boutique-collections")
        .where(
          "collectionAddress",
          "==",
          nftDetails.collection.address.toString()
        )
        .limit(1)
        .get();
      if (collectionRef.docs.length == 1) {
        collection = collectionRef.docs[0]!.data() as Collection;
        collection.slug = collectionRef.docs[0]!.id;
      }
    }
  } else {
    const res = await getBoutiqueCollection(collectionSlug);
    if (res.isOk()) {
      collection = res.value;
    }
  }

  if (!collection) {
    return undefined;
  }

  if (!collection.mintAddresses.includes(mintAddress)) {
    const updatedMints = collection.mintAddresses.concat(mintAddress);
    // add mint address to collection
    await db.collection(`boutique-collections`).doc(collection.slug).set(
      {
        mintAddresses: updatedMints,
      },
      { merge: true }
    );

    // add the mint address to the list of tracked addresses
    await addMintAsTracked(mintAddress, collection.slug);
  }

  const nft = {
    address: mintAddress,
    collectionSlug: collection.slug,
  } as CollectionNFT;

  return { collection, nft };
}

export async function addNFTMetadata(
  mintAddress: string,
  metadata: { [key: string]: any },
  environment: string = "mainnet"
): Promise<Result<null, Error>> {
  try {
    // add the metadata
    await db
      .collection(`${environment}/nfts/metadata`)
      .doc(mintAddress)
      .set(metadata);
    return ok(null);
  } catch (error) {
    return err(error as Error);
  }
}

export async function getNFTsMetadata(
  mintAddresses: string[],
  environment: string = "mainnet"
): Promise<Result<OneOfOneNFTMetadata[], Error>> {
  try {
    const refs = mintAddresses.map((mintAddress) =>
      db.doc(`${environment}/nfts/metadata/${mintAddress}`)
    );
    const results = await db.getAll(...refs);

    const metadata = results.map((doc) => {
      const data = doc.data() as OneOfOneNFTMetadata;
      data.mint = doc.id;
      return data;
    });
    return ok(metadata);
  } catch (error) {
    return err(error as Error);
  }
}
