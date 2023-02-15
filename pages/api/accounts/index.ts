import { createAccount, getAccountByUsername, getAccountByWallet } from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import nextConnect from "next-connect";
import { authOptions } from "../auth/[...nextauth]";

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

    const accountRes = await getAccountByWallet(uid);

    if (accountRes.isOk()) {
      res.status(200).json({
        success: true,
        account: accountRes.value,
      });
    } else {
      res.status(500).json({
        success: false,
        message: accountRes.error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

apiRoute.post(async (req, res) => {
  try {
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const isCreator: boolean = req.body.isCreator;
    if (isCreator === undefined) {
      res
        .status(400)
        .json({ message: "Account type (Creator or Collector) is required." });
      return;
    }

    const username: string = req.body.username
      ?.toString()
      .toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    if (username === undefined || username.length < 3) {
      res
        .status(400)
        .json({ message: "A username of 3 or more characters is required." });
      return;
    }

    const email: string = req.body.email;
    if (email && (!email.includes("@") || !email.includes("."))) {
      res
        .status(400)
        .json({ message: "The provided email address is invalid." });
      return;
    }

    const discordId: string = req.body.discordId;
    if (discordId) {
      const parts = discordId.split("#");
      if (parts.length != 2 || parts[0]!.length < 1 || parts[1]!.length < 1) {
        res
          .status(400)
          .json({ message: "The provided Discord Id is invalid." });
        return;
      }
    }

    const accountRes = await getAccountByUsername(username);
    if (accountRes.isOk()) {
      res
        .status(400)
        .json({ message: "The provided username is already taken." });
      return;
    }

    const createResult = await createAccount(
      uid,
      isCreator,
      username,
      email,
      discordId
    );

    if (createResult.isOk()) {
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(500).json({
        success: false,
        message: createResult.error.message,
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
