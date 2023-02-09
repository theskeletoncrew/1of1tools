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
    const creatorAddress = req.query.creatorAddress as string;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 100;
    const page: PaginationToken | undefined = req.query.page?.toString();

    if (!creatorAddress || creatorAddress.length == 0) {
      res.status(400).json({ message: "Creator address is required." });
      return;
    }

    const response = await fetch(
      `https://api.helius.xyz/v1/nft-events?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            accounts: [creatorAddress],
            types: ["NFT_LISTING", "NFT_MINT"],
            nftCollectionFilters: {
              firstVerifiedCreator: [creatorAddress],
            },
          },
          options: {
            limit: limit,
            paginationToken: page,
          },
        }),
      }
    );

    const responseJSON = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        events: responseJSON.result,
        paginationToken: responseJSON.paginationToken,
      });
    } else {
      res.status(500).json({
        success: false,
        message: responseJSON.error,
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