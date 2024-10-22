import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "pages/api/auth/[...nextauth]";
import {
  getDialectCreatorNotificationsByUser,
  getDiscordCreatorNotificationsByUser,
} from "db";

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

apiRoute.get(async (req, res) => {
  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const { accountAddress, deliveryType: type } = req.query;
    const creatorAddress = accountAddress?.toString();
    const deliveryType = type?.toString() ?? "dialect";

    if (!creatorAddress || creatorAddress.length == 0) {
      res.status(400).json({ message: "Account address is required." });
      return;
    }

    if (deliveryType === "dialect") {
      const notifRes = await getDialectCreatorNotificationsByUser(
        creatorAddress,
        uid
      );

      if (notifRes.isOk()) {
        res.status(200).json({
          success: true,
          settings: notifRes.value,
        });
      } else {
        res.status(500).json({
          success: false,
          message: notifRes.error.message,
        });
      }
    } else if (deliveryType === "discord") {
      const notifRes = await getDiscordCreatorNotificationsByUser(
        creatorAddress,
        uid
      );

      if (notifRes.isOk()) {
        res.status(200).json({
          success: true,
          settings: notifRes.value,
        });
      } else {
        res.status(500).json({
          success: false,
          message: notifRes.error.message,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
