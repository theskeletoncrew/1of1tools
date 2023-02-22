import {
  getBoutiqueCollectionEvent,
  getBoutiqueCollectionEvents,
  getNFTsMetadata,
} from "db";
import { PaginationToken } from "models/paginationToken";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

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
    const signature = req.query.signature as string;
    const isImported = req.query.isImported?.toString() === "1";

    if (!signature) {
      res.status(400).json({ message: "Signature is required." });
      return;
    }

    if (!isImported) {
      // const response = await fetch(
      //   `https://api.helius.xyz/v1/nft-events?api-key=${HELIUS_API_KEY}`,
      //   {
      //     method: "POST",
      //     headers: {
      //       Accept: "application/json",
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       query: {
      //         accounts: [mintAddress],
      //       },
      //       options: {
      //         limit: limit,
      //         paginationToken: page,
      //       },
      //     }),
      //   }
      // );

      // const responseJSON = await response.json();

      // if (response.ok) {
      //   res.status(200).json({
      //     success: true,
      //     events: responseJSON.result,
      //     paginationToken: responseJSON.paginationToken,
      //   });
      // } else {
      res.status(500).json({
        success: false,
        message: "Not implemented", //responseJSON.error,
      });
      // }
    } else {
      const eventRes = await getBoutiqueCollectionEvent(signature);
      let lastError: Error | null = null;

      if (eventRes.isOk()) {
        const event = eventRes.value;
        const nftRes = await getNFTsMetadata([event.mint]);
        if (nftRes.isOk()) {
          res.status(200).json({
            success: true,
            event: event,
            nft: nftRes.value[0],
          });
          return;
        } else {
          lastError = nftRes.error;
        }
      } else {
        lastError = eventRes.error;
      }

      res.status(500).json({
        success: false,
        message: lastError.message,
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
