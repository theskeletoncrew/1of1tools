import {
  connectAccountWithDiscord,
  getAccountByWallet,
  setDiscordGuilds,
} from "db";
import { DiscordAccount, DiscordChannel, DiscordGuild } from "models/account";
import { Constants } from "models/constants";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import nextConnect from "next-connect";
import { authOptions } from "../auth/[...nextauth]";
import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import { notEmpty } from "utils";

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

apiRoute.patch(async (req, res) => {
  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const guildId = req.body.guildId;
    const channelId = req.body.channelId;

    if (!guildId || !channelId) {
      res.status(400).json({ message: "Requirements not met." });
      return;
    }

    const accountRes = await getAccountByWallet(uid);
    if (!accountRes.isOk()) {
      res.status(500).json({
        success: false,
        message: accountRes.error.message,
      });
      return;
    }
    const account = accountRes.value;

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    // Log in to Discord with your client's token
    await client.login(Constants.DISCORD_BOT_TOKEN);

    let updatedGuilds = account.discordGuilds ?? [];
    const foundIndex = updatedGuilds.findIndex((guild) => guild.id === guildId);
    if (foundIndex === -1) {
      res.status(400).json({ message: "Invalid server." });
      return;
    }

    let guild = updatedGuilds[foundIndex]!;
    let channel = guild?.channels.find((channel) => channel.id === channelId);
    if (!channel) {
      res.status(400).json({ message: "Invalid channel." });
      return;
    }
    guild.selectedChannelId = channelId;
    updatedGuilds[foundIndex] = guild;

    const updateRes = await setDiscordGuilds(account.username, updatedGuilds);

    if (!updateRes.isOk()) {
      console.log("updateRes error");
      console.log(updateRes);
      res
        .status(500)
        .json({ success: false, message: "Failed to update selected channel" });
      return;
    }

    res.status(200).json({ success: true, guild: guild });
  } catch (error) {
    console.log("generic error");
    console.log(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
