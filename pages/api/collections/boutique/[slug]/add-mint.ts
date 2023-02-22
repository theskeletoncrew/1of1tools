import {
  getBoutiqueCollection,
  addNewTrackedMint,
  migrateUntrackedEventsToTracked,
} from "db";
import { Helius } from "helius-sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { cacheMint } from "utils/cacheMint";

const HELIUS_AUTHORIZATION_SECRET =
  process.env.HELIUS_AUTHORIZATION_SECRET || "";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_WEBHOOK_ID = process.env.HELIUS_WEBHOOK_ID || "";

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
  const { slug: slugStr, mint: mintStr } = req.query;
  const slug = slugStr?.toString();
  const mint = mintStr?.toString();

  try {
    if (
      !req.headers["authorization"] ||
      req.headers["authorization"] !== HELIUS_AUTHORIZATION_SECRET
    ) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!slug || slug.length == 0) {
      res.status(400).json({ message: "slug is required." });
      return;
    }

    if (!mint || mint.length == 0) {
      res.status(400).json({ message: "mint is required." });
      return;
    }

    const collectionRes = await getBoutiqueCollection(slug);
    if (!collectionRes.isOk() || !collectionRes.value) {
      res
        .status(404)
        .json({ success: false, message: "Collection not found." });
      return;
    }

    const collection = collectionRes.value;
    if (collection.mintAddresses.length == 0) {
      res
        .status(500)
        .json({ success: false, message: "No known mint addresses." });
      return;
    }

    // add the mint address to the list of tracked addresses
    const addRes = await addNewTrackedMint(mint, slug);
    if (!addRes) {
      res.status(500).json({
        success: false,
        message: "Failed",
      });
      return;
    }

    // cache the image and metadata for the mint immediately
    await cacheMint(mint);

    // migrate the captured untracked events to tracked
    await migrateUntrackedEventsToTracked(mint);

    // subscribe webhook to events about this mint address
    const helius = new Helius(HELIUS_API_KEY);
    await helius.appendAddressesToWebhook(HELIUS_WEBHOOK_ID, [mint]);

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

export default apiRoute;
