import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { setCreatorNotificationsByUser } from "db";
import {
  createDialectSdk,
  findOrCreateSolanaThread,
  sendMessage,
} from "utils/dialect";
import { shortenedAddress } from "utils";

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
    const uid = session?.user?.name;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const accountAddress = req.body.accountAddress?.toString();
    if (!accountAddress || accountAddress.length == 0) {
      res.status(400).json({ message: "Account address is required." });
      return;
    }

    let deliveryAddress = req.body.deliveryAddress?.toString();
    if (!deliveryAddress || deliveryAddress.length == 0) {
      deliveryAddress = uid;
    }

    const formfunctionNotifications = req.body.formfunctionNotifications;
    if (formfunctionNotifications === null) {
      res.status(400).json({ message: "Formfunction preference is required." });
      return;
    }

    const exchangeArtNotifications = req.body.exchangeArtNotifications;
    if (exchangeArtNotifications === null) {
      res.status(400).json({ message: "Exchange Art preference is required." });
      return;
    }

    const notifRes = await setCreatorNotificationsByUser(
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
      if (thread) {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
