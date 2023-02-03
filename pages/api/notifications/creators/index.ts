import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "pages/api/auth/[...nextauth]";
import {
  setDialectCreatorNotificationsByUser,
  setDiscordCreatorNotificationsByUser,
} from "db";
import {
  createDialectSdk,
  findOrCreateSolanaThread,
  sendMessage,
} from "utils/dialect";
import { shortenedAddress, shortPubKey } from "utils";
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import { Constants } from "models/constants";
import { DiscordGuildNotificationSetting } from "models/notificationSetting";

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

apiRoute.put(async (req, res) => {
  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const accountAddress = req.body.accountAddress?.toString();
    if (!accountAddress || accountAddress.length == 0) {
      res.status(400).json({ message: "Account address is required." });
      return;
    }

    const deliveryType = req.body.deliveryType?.toString() ?? "dialect";

    if (deliveryType === "dialect") {
      const formfunctionNotifications = req.body.formfunctionNotifications;
      if (formfunctionNotifications === null) {
        res
          .status(400)
          .json({ message: "Formfunction preference is required." });
        return;
      }

      const exchangeArtNotifications = req.body.exchangeArtNotifications;
      if (exchangeArtNotifications === null) {
        res
          .status(400)
          .json({ message: "Exchange Art preference is required." });
        return;
      }

      let deliveryAddress = req.body.deliveryAddress?.toString();
      if (!deliveryAddress || deliveryAddress.length == 0) {
        deliveryAddress = uid;
      }

      const notifRes = await setDialectCreatorNotificationsByUser(
        accountAddress,
        uid,
        deliveryAddress,
        formfunctionNotifications,
        exchangeArtNotifications
      );

      if (notifRes.isOk()) {
        const dialect = createDialectSdk();
        const { thread, isNew } = await findOrCreateSolanaThread(
          dialect,
          deliveryAddress
        );
        if (!thread) {
          res.status(500).json({
            success: false,
            message: "Unable to find or create thread on Dialect.",
          });
          return;
        }
        if (isNew) {
          await sendMessage(
            thread,
            `one / one: You are now setup to receive notifications about the creator ${shortenedAddress(
              accountAddress
            )}! Change your preferences at any time on https://1of1.tools`
          );
        } else {
          await sendMessage(
            thread,
            `one / one: Your notification preferences about the creator ${shortenedAddress(
              accountAddress
            )} have been updated. Change them again at any time on https://1of1.tools`
          );
        }

        res.status(200).json({
          success: true,
        });
      } else {
        res.status(500).json({
          success: false,
          message: notifRes.error.message,
        });
      }
    } else if (deliveryType === "discord") {
      let guildSubscriptions = req.body
        .guildSubscriptions as DiscordGuildNotificationSetting[];
      if (!guildSubscriptions) {
        res.status(400).json({ message: "Discord details are required." });
        return;
      }

      const notifRes = await setDiscordCreatorNotificationsByUser(
        accountAddress,
        uid,
        guildSubscriptions
      );

      if (notifRes.isOk()) {
        const discordClient = new Client({
          intents: [GatewayIntentBits.Guilds],
        });
        await discordClient.login(Constants.DISCORD_BOT_TOKEN);

        for (let i = 0; i < guildSubscriptions.length; i++) {
          const guildSubscription = guildSubscriptions[i]!;
          const guild = discordClient.guilds.cache.get(
            guildSubscription.guildId
          );
          if (!guild) {
            res.status(500).json({
              success: false,
              message: "Unable to find Discord server",
            });
            return;
          }
          await guild.channels.fetch();
          const channel = guild.channels.cache.get(
            guildSubscription.channelId
          ) as TextChannel;

          if (!channel) {
            res.status(500).json({
              success: false,
              message: "Unable to find channel on Discord server",
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setColor(0x3730a3)
            .setTitle(shortPubKey(accountAddress))
            .setURL(`https://1of1.tools/creator/${accountAddress}`)
            .setAuthor({
              name: "Creator Subscription",
            })
            .setDescription(
              `Your notification preferences for creator ${shortPubKey(
                accountAddress
              )} have been updated.`
            )
            .setTimestamp()
            .setFooter({
              text: "Powered by 1of1.tools",
            });

          await channel.send({ embeds: [embed] });
        }

        res.status(200).json({
          success: true,
        });
      } else {
        res.status(500).json({
          success: false,
          message: notifRes.error.message,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
