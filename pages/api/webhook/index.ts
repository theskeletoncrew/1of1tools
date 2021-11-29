import { Solana } from "@dialectlabs/blockchain-sdk-solana";
import { DialectSdk } from "@dialectlabs/sdk";
import {
  getSubscribersToNotificationsForCreator,
  getSubscribersToNotificationsForNft,
} from "db";
import { EnrichedTransaction } from "models/enrichedTransaction";
import {
  CreatorNotificationSetting,
  NftNotificationSetting,
  NotificationSetting,
} from "models/notificationSetting";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  createDialectSdk,
  findOrCreateSolanaThread,
  sendMessage,
} from "utils/dialect";
import { humanReadableTransaction } from "utils/helius";

function unique(array: any[], propertyName: string) {
  return array.filter(
    (e, i) => array.findIndex((a) => a[propertyName] === e[propertyName]) === i
  );
}

const apiRoute = nextConnect<NextApiRequest, NextApiResponse<any | Error>>({
  onError(error, req, res) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

// NFT_AUCTION_CREATED
// NFT_BID
// NFT_LISTING
// NFT_SALE

apiRoute.post(async (req, res) => {
  try {
    const transactions = req.body as EnrichedTransaction[];

    const dialect = createDialectSdk();

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]!;

      const customDescription = humanReadableTransaction(transaction);

      const nftEvent = transaction.events.nft ? transaction.events.nft : null;
      const nft = nftEvent?.nfts?.length ?? 0 > 0 ? nftEvent?.nfts[0] : null;

      console.log(nftEvent);
      if (!nftEvent || !nft) {
        continue;
      }

      let recipients: NotificationSetting[] = [];

      if (nft.mint && nft.mint.length > 0) {
        const recipientsSubscribedToNft = await nftSubscribers(
          nft.mint,
          transaction.source
        );
        if (recipientsSubscribedToNft.length > 0) {
          console.log(
            `found ${recipientsSubscribedToNft.length} subscribed to ${nft.mint}`
          );
        }
        recipients = recipients.concat(recipientsSubscribedToNft);
      }

      if (nftEvent.seller && nftEvent.seller.length > 0) {
        const recipientsSubscribedToCreator = await creatorSubscribers(
          nftEvent.seller,
          transaction.source
        );
        if (recipientsSubscribedToCreator.length > 0) {
          console.log(
            `found ${recipientsSubscribedToCreator.length} subscribed to ${nftEvent.seller}`
          );
        }
        recipients = recipients.concat(recipientsSubscribedToCreator);
      }

      await sendMessagesForRecipients(
        dialect,
        unique(recipients, "deliveryAddress"),
        customDescription
      );
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

const sendMessagesForRecipients = async (
  dialect: DialectSdk<Solana>,
  recipients: NotificationSetting[],
  message: string
) => {
  for (let j = 0; j < recipients.length; j++) {
    const recipient = recipients[j]!;
    const { thread, isNew } = await findOrCreateSolanaThread(
      dialect,
      recipient.deliveryAddress
    );
    if (!thread) {
      console.log("Failed to send message - no thread");
      continue;
    }

    await sendMessage(thread, message);
  }
};

const nftSubscribers = async (
  mintAddress: string,
  source: string
): Promise<NftNotificationSetting[]> => {
  const recipientsRes = await getSubscribersToNotificationsForNft(mintAddress);
  if (!recipientsRes.isOk()) {
    return [];
  }
  return recipientsRes.value.filter((r) =>
    recipientIsValidForSource(r, source)
  );
};

const creatorSubscribers = async (
  creatorAddress: string,
  source: string
): Promise<CreatorNotificationSetting[]> => {
  const recipientsRes = await getSubscribersToNotificationsForCreator(
    creatorAddress
  );
  if (!recipientsRes.isOk()) {
    return [];
  }
  return recipientsRes.value.filter((r) =>
    recipientIsValidForSource(r, source)
  );
};

const recipientIsValidForSource = (
  recipient: NotificationSetting,
  source: string
): boolean => {
  if (!recipient.exchangeArtNotifications && source === "EXCHANGE_ART") {
    return false;
  }
  if (!recipient.formfunctionNotifications && source === "FORM_FUNCTION") {
    return false;
  }
  return true;
};

export default apiRoute;
