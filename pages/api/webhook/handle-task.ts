import { Solana } from "@dialectlabs/blockchain-sdk-solana";
import { DialectSdk } from "@dialectlabs/sdk";
import {
  getDiscordSubscribersToNotificationsForCreator,
  getDialectSubscribersToNotificationsForCreator,
  getDialectSubscribersToNotificationsForNft,
} from "db";
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import { Constants } from "models/constants";
import { EnrichedTransaction } from "models/enrichedTransaction";
import {
  DialectCreatorNotificationSetting,
  DialectNftNotificationSetting,
  DialectNotificationSetting,
  DiscordGuildCreatorNotificationSetting,
  DiscordGuildNotificationSetting,
} from "models/notificationSetting";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  createDialectSdk,
  findOrCreateSolanaThread,
  sendMessage,
} from "utils/dialect";
import { discordEmbedForTransaction } from "utils/discord";
import { humanReadableTransaction } from "utils/helius";

function unique(array: any[], propertyName: string) {
  return array.filter(
    (e, i) => array.findIndex((a) => a[propertyName] === e[propertyName]) === i
  );
}

let dialect: DialectSdk<Solana> | undefined;
let discordClient: Client | undefined;

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
    const transaction = JSON.parse(req.body) as EnrichedTransaction;

    const customDescription = humanReadableTransaction(transaction);

    const nftEvent = transaction.events.nft ? transaction.events.nft : null;
    const nft = nftEvent?.nfts?.length ?? 0 > 0 ? nftEvent?.nfts[0] : null;

    if (!nftEvent || !nft) {
      console.log(
        `Unexpected payload - nft event or nft missing for ${transaction.signature}`
      );
      console.log(transaction);
      res.status(500).json({
        success: false,
        message: `Unexpected payload - nft event or nft missing for ${transaction.signature}`,
      });
      return;
    }

    console.log(nftEvent);

    let recipients: DialectNotificationSetting[] = [];

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

    if (!dialect) {
      dialect = createDialectSdk();
    }

    await sendDialectMessagesForRecipients(
      dialect,
      unique(recipients, "deliveryAddress"),
      customDescription
    );

    if (nftEvent.seller && nftEvent.seller.length > 0) {
      const discordsSubscribedToCreator = await discordCreatorSubscribers(
        nftEvent.seller,
        transaction.source
      );
      if (discordsSubscribedToCreator.length > 0) {
        console.log(
          `found ${discordsSubscribedToCreator.length} discords subscribed to ${nftEvent.seller}`
        );
      }

      const discordEmbed = discordEmbedForTransaction(transaction);

      if (!discordClient) {
        discordClient = new Client({
          intents: [GatewayIntentBits.Guilds],
        });
        await discordClient.login(Constants.DISCORD_BOT_TOKEN);
      }

      await sendDiscordMessagesForRecipients(
        discordClient,
        discordsSubscribedToCreator,
        discordEmbed
      );
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

const sendDialectMessagesForRecipients = async (
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

const sendDiscordMessagesForRecipients = async (
  discordClient: Client,
  recipients: DiscordGuildCreatorNotificationSetting[],
  discordEmbed: EmbedBuilder
) => {
  for (let j = 0; j < recipients.length; j++) {
    const recipient = recipients[j]!;

    const guild = discordClient.guilds.cache.get(recipient.guildId);
    if (!guild) {
      continue;
    }
    const channel = guild.channels.cache.get(
      recipient.channelId
    ) as TextChannel;

    await channel.send({ embeds: [discordEmbed] });
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

const discordCreatorSubscribers = async (
  creatorAddress: string,
  source: string
): Promise<DiscordGuildCreatorNotificationSetting[]> => {
  const recipientsRes = await getDiscordSubscribersToNotificationsForCreator(
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
  recipient: DialectNotificationSetting | DiscordGuildNotificationSetting,
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
