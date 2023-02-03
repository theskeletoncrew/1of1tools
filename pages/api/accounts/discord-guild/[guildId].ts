import { getAccountByWallet, setDiscordGuilds } from "db";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import nextConnect from "next-connect";
import { authOptions } from "../../auth/[...nextauth]";

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

apiRoute.delete(async (req, res) => {
  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const { guildId: gId } = req.query;
    const guildId = gId?.toString();

    if (!guildId) {
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

    let updatedGuilds = account.discordGuilds ?? [];
    const foundIndex = updatedGuilds.findIndex((guild) => guild.id === guildId);
    if (foundIndex === -1) {
      res.status(400).json({ message: "Invalid server." });
      return;
    }

    updatedGuilds.splice(foundIndex, 1);

    const updateRes = await setDiscordGuilds(account.username, updatedGuilds);

    if (!updateRes.isOk()) {
      console.log("updateRes error");
      console.log(updateRes);
      res
        .status(500)
        .json({ success: false, message: "Failed to update Discord servers" });
      return;
    }

    res.status(200).json({ success: true });
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
