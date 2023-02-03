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
import { authOptions } from "../../auth/[...nextauth]";
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

apiRoute.post(async (req, res) => {
  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const discordAccessToken = req.body.discordAccessToken;
    const discordTokenType = req.body.discordTokenType;
    const discordRefreshToken = req.body.discordRefreshToken;
    const botToken = Constants.DISCORD_BOT_TOKEN;
    const guildId = req.body.guildId;

    if (!discordAccessToken || !discordTokenType) {
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

    const userResponse = await fetch(`${Constants.DISCORD_API}/users/@me`, {
      headers: {
        authorization: `${discordTokenType} ${discordAccessToken}`,
      },
    });
    const userResult = await userResponse.json();
    if (!userResponse.ok) {
      console.log("userResponse error");
      console.log(userResponse);
      console.log(userResult);
      res
        .status(500)
        .json({ success: false, message: "Failed to get Discord user info" });
      return;
    }

    const discordData = {
      id: userResult.id,
      username: userResult.username,
      discriminator: userResult.discriminator,
      avatarId: userResult.avatar,
      accessToken: discordAccessToken,
      refreshToken: discordRefreshToken,
    } as DiscordAccount;

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    // Log in to Discord with your client's token
    await client.login(Constants.DISCORD_BOT_TOKEN);

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(500).json({
        success: false,
        message: "Failed to get Discord server details.",
      });
      return;
    }

    const channels = await guild.channels.fetch();
    const textChannels = channels.filter(
      (c) => c && c.type === ChannelType.GuildText
    );

    if (!textChannels) {
      res.status(500).json({
        success: false,
        message: "Failed to get Discord server's channels.",
      });
      return;
    }

    console.log(channels);

    const discordGuild: DiscordGuild = {
      id: guild.id,
      name: guild.name,
      iconURL: guild.iconURL(),
      channels: textChannels.filter(notEmpty).map(
        (channel) =>
          ({
            id: channel.id,
            name: channel.name,
          } as DiscordChannel)
      ),
      selectedChannelId: null,
    };

    let updatedGuilds = account.discordGuilds ?? [];
    const foundIndex = updatedGuilds.findIndex((guild) => guild.id === guildId);
    if (foundIndex !== -1) {
      updatedGuilds[foundIndex] = discordGuild;
    } else {
      updatedGuilds = updatedGuilds.concat(discordGuild);
    }

    const updateRes = await connectAccountWithDiscord(
      account.username,
      discordData
    );

    if (!updateRes.isOk()) {
      console.log("updateRes error");
      console.log(updateRes);
      res
        .status(500)
        .json({ success: false, message: "Failed to update user account" });
      return;
    }

    const update2Res = await setDiscordGuilds(account.username, updatedGuilds);
    if (!update2Res.isOk()) {
      console.log("update2Res error");
      console.log(update2Res);
      res.status(500).json({
        success: false,
        message: "Failed to update user Discord servers",
      });
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
