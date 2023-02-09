import { EnrichedTransaction } from "models/enrichedTransaction";
import { oneOfOneNFTEvent } from "models/nftEvent";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { addBoutiqueCollectionEventIfMonitoredAndUpdateStats } from "db";

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

    console.log(event);
    const addRes = await addBoutiqueCollectionEventIfMonitoredAndUpdateStats(
      event
    );
    if (!addRes.isOk()) {
      // not a monitored NFT for creator or collection address
      res.status(200).json({
        success: true,
      });
      return;
    }

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

export default apiRoute;
