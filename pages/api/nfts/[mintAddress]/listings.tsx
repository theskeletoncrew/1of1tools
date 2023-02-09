import { NFTListings } from "models/nftListings";
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
    const mintAddress = req.query.mintAddress?.toString();
    const firstVerifiedCreator = req.query.firstVerifiedCreator?.toString();

    if (!mintAddress || mintAddress.length == 0) {
      res.status(400).json({
        success: false,
        message: "Mint address is required.",
      });
      return;
    }

    if (!firstVerifiedCreator || firstVerifiedCreator.length == 0) {
      res.status(400).json({
        success: false,
        message: "First verified creator is required.",
      });
      return;
    }

    const response = await fetch(
      `https://api.helius.xyz/v1/active-listings?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: { firstVerifiedCreators: [firstVerifiedCreator] },
          options: {
            limit: 250,
          },
        }),
      }
    );
    const responseJSON = await response.json();

    if (!response.ok) {
      res.status(500).json({
        success: false,
        message: "Failed to load listings",
      });
    }

    const listings = responseJSON.result as NFTListings[];

    const listing = listings
      .filter((item) => item.activeListings.length > 0)
      .find((l) => l.mint === mintAddress);

    res.status(200).json({
      success: true,
      listings: listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
