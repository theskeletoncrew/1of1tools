import { EnrichedTransaction } from "models/enrichedTransaction";
import { OneOfOneNFTEvent, oneOfOneNFTEvent } from "models/nftEvent";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  addBoutiqueCollectionEventForUnmonitoredNFT,
  addBoutiqueCollectionEventIfMonitoredAndUpdateStats,
  getDialectSubscribersToBoutiqueNotifications,
  getDiscordSubscribersToBoutiqueNotifications,
  getNFTsMetadata,
} from "db";
import {
  DialectNotificationSetting,
  DiscordSubscriptionsContainer,
} from "models/notificationSetting";
import {
  createDialectSdk,
  findOrCreateSolanaThread,
  sendMessage,
} from "utils/dialect";
import { humanReadableTransaction } from "utils/helius";
import { discordEmbedForTransaction } from "utils/discord";
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import { Constants } from "models/constants";
import { DialectSdk } from "@dialectlabs/sdk";
import { Solana } from "@dialectlabs/blockchain-sdk-solana";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import { cacheMint } from "utils/cacheMint";
import { Helius } from "helius-sdk";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_WEBHOOK_ID = process.env.HELIUS_WEBHOOK_ID || "";

function unique(array: any[], propertyName: string) {
  return array.filter(
    (e, i) => array.findIndex((a) => a[propertyName] === e[propertyName]) === i
  );
}

let dialect: DialectSdk<Solana> | undefined;
let discordClient: Client | undefined;

const HELIUS_AUTHORIZATION_SECRET =
  process.env.HELIUS_AUTHORIZATION_SECRET || "";

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

// NFT_BID
// NFT_SALE
// NFT_LISTING
// NFT_MINT
// NFT_BID_CANCELLED
// NFT_CANCEL_LISTING
// NFT_AUCTION_CREATED
// NFT_AUCTION_UPDATED
// NFT_AUCTION_CANCELLED
// BURN

apiRoute.post(async (req, res) => {
  try {
    if (
      !req.headers["authorization"] ||
      req.headers["authorization"] !== HELIUS_AUTHORIZATION_SECRET
    ) {
      console.warn(
        "Received webhook with invalid/missing authorization header"
      );
      console.warn(JSON.stringify(req.body));
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const transaction = req.body as EnrichedTransaction;
    const event = transaction.events.nft
      ? oneOfOneNFTEvent(transaction.events.nft)
      : null;
    if (!event) {
      console.log(
        `Unexpected payload - nft event missing for ${transaction.signature}`
      );
      console.log(transaction);
      res.status(500).json({
        success: false,
        message: `Unexpected payload - nft event missing for ${transaction.signature}`,
      });
      return;
    }

    let isNewlyFoundNFT = false;
    let isUnmonitored = false;

    const addRes = await addBoutiqueCollectionEventIfMonitoredAndUpdateStats(
      event
    );
    if (addRes.isOk()) {
      console.log("Monitored Event");
      console.log(event);

      isNewlyFoundNFT = addRes.value.isNewlyTracked;

      if (addRes.value.shouldIgnore) {
        // end here if this is an nft that we dont track
        // and it belongs to a collection thats not tracked
        // or its an edition
        res.status(201).json({
          success: true,
        });
        return;
      }

      if (isNewlyFoundNFT) {
        // subscribe webhook to events about this mint address
        const helius = new Helius(HELIUS_API_KEY);
        await helius.appendAddressesToWebhook(HELIUS_WEBHOOK_ID, [event.mint]);
      }
    } else {
      console.log("Unmonitored Event");
      console.log(event);

      await addBoutiqueCollectionEventForUnmonitoredNFT(event);
      isNewlyFoundNFT = true;
      isUnmonitored = true;
    }

    if (isNewlyFoundNFT) {
      const cacheRes = await cacheMint(event.mint);
      if (!cacheRes.isOk()) {
        res.status(200).json({
          success: true,
        });
        return;
      }
    }

    const nftMetadataRes = await getNFTsMetadata([event.mint]);
    const nftMetadata = nftMetadataRes.isOk() ? nftMetadataRes.value[0]! : null;
    await sendNotifications(transaction, nftMetadata, isUnmonitored);

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

const sendNotifications = async (
  transaction: EnrichedTransaction,
  metadata: OneOfOneNFTMetadata | null = null,
  isUnmonitored: boolean = false
): Promise<null | Error> => {
  let lastError: Error | null = null;

  try {
    const customDescription = humanReadableTransaction(
      transaction,
      !isUnmonitored
    );

    const recipientsSubscribedToDialect = await dialectSubscribers();

    if (!dialect) {
      dialect = createDialectSdk();
    }

    await sendDialectMessagesForRecipients(
      dialect,
      unique(recipientsSubscribedToDialect, "deliveryAddress"),
      customDescription
    );
  } catch (error) {
    if (error instanceof Error) {
      lastError = error;
      console.error("Error sending dialect messages: " + error.message);
    } else {
      console.error("Error sending dialect messages: " + error);
    }
  }

  // for now short circuit for unmonitored
  if (isUnmonitored) {
    return lastError;
  }

  try {
    const recipientsSubscribedToDiscord = await discordSubscribers();
    const discordEmbed = await discordEmbedForTransaction(
      transaction,
      metadata,
      true,
      isUnmonitored
    );

    if (!discordClient) {
      discordClient = new Client({
        intents: [GatewayIntentBits.Guilds],
      });
      await discordClient.login(Constants.DISCORD_BOT_TOKEN);
    }

    await sendDiscordMessagesForRecipients(
      discordClient,
      recipientsSubscribedToDiscord,
      discordEmbed
    );
  } catch (error) {
    if (error instanceof Error) {
      lastError = error;
      console.error("Error sending discord messages: " + error.message);
    } else {
      console.error("Error sending discord messages: " + error);
    }
  }

  return lastError;
};

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
  recipients: DiscordSubscriptionsContainer[],
  discordEmbed: EmbedBuilder
) => {
  for (let j = 0; j < recipients.length; j++) {
    const recipient = recipients[j]!;

    for (let k = 0; k < recipient.discords.length; k++) {
      const discord = recipient.discords[k]!;
      const guild = await discordClient.guilds.fetch(discord.guildId);
      if (!guild) {
        console.error(
          "Failed to get discord " +
            discord.guildId +
            " for recipient " +
            recipient.subscriberAddress
        );
        continue;
      }

      const channel = (await discordClient.channels.fetch(
        discord.channelId
      )) as TextChannel;
      if (!channel) {
        console.error(
          "Failed to get channel " +
            discord.channelId +
            " for discord " +
            discord.guildId +
            " and recipient " +
            recipient.subscriberAddress
        );
        continue;
      }

      await channel.send({ embeds: [discordEmbed] });
    }
  }
};

const dialectSubscribers = async (): Promise<DialectNotificationSetting[]> => {
  const recipientsRes = await getDialectSubscribersToBoutiqueNotifications();
  if (!recipientsRes.isOk()) {
    return [];
  }
  return recipientsRes.value;
};

const discordSubscribers = async (): Promise<
  DiscordSubscriptionsContainer[]
> => {
  const recipientsRes = await getDiscordSubscribersToBoutiqueNotifications();
  if (!recipientsRes.isOk()) {
    return [];
  }
  return recipientsRes.value;
};

export default apiRoute;
