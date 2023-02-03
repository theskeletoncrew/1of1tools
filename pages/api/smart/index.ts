import { Solana } from "@dialectlabs/blockchain-sdk-solana";
import { DialectSdk } from "@dialectlabs/sdk";
import {
  getDialectSubscribersToNotificationsForCreator,
  getDialectSubscribersToNotificationsForNft,
} from "db";
import {
  DialectCreatorNotificationSetting,
  DialectNftNotificationSetting,
  DialectNotificationSetting,
} from "models/notificationSetting";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  createDialectSdk,
  findOrCreateSolanaThread,
  sendMessage,
} from "utils/dialect";
import { humanReadableTransaction } from "utils/helius";

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

apiRoute.get(async (req, res) => {
  try {
    const dialect = createDialectSdk();

    const recipient = "7SRTXeUJNNqLSSs85F7p3zbbERKGyQMxdVA6L5cocwii";
    const { thread, isNew } = await findOrCreateSolanaThread(
      dialect,
      recipient
    );
    if (!thread) {
      console.log("Failed to send message - no thread");
      res.status(500).json({
        success: true,
      });
      return;
    }

    const amount = 1;
    const splTokenAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
    const label = "Subscribe";
    const message = "Subscribe to notifications about this creator.";
    const memo = "1of1.tools Subscription";

    await sendMessage(
      thread,

      "solana:https://1of1.tools/api/smart-test"
      // `solana:${recipient}?amount=${amount}&spl-token=${splTokenAddress}&label=${encodeURIComponent(
      //   label
      // )}&message=${encodeURIComponent(message)}&memo=${memo}`
    );

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
  recipients: DialectNotificationSetting[],
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
): Promise<DialectNftNotificationSetting[]> => {
  const recipientsRes = await getDialectSubscribersToNotificationsForNft(
    mintAddress
  );
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
): Promise<DialectCreatorNotificationSetting[]> => {
  const recipientsRes = await getDialectSubscribersToNotificationsForCreator(
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
  recipient: DialectNotificationSetting,
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
