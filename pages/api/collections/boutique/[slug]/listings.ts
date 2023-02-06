import { getBoutiqueCollection } from "db";
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
    const { slug: slugStr } = req.query;
    const slug = slugStr?.toString();

    if (!slug || slug.length == 0) {
      res.status(400).json({
        success: false,
        message: "Slug is required.",
      });
      return;
    }

    const collectionRes = await getBoutiqueCollection(slug);
    if (!collectionRes.isOk()) {
      res
        .status(500)
        .json({ success: false, message: collectionRes.error.message });
      return;
    }

    const collection = collectionRes.value;
    if (collection === null) {
      res.status(404).json({
        success: false,
      });
      return;
    }

    let searchFilter = {};

    if (collection.collectionAddress) {
      searchFilter = {
        verifiedCollectionAddresses: [collection.collectionAddress],
      };
    } else if (collection.firstVerifiedCreator) {
      searchFilter = {
        firstVerifiedCreators: [collection.firstVerifiedCreator],
      };
    } else {
      console.log(
        `Collection ${collection.name} has neither a verified collection address or verified creator address`
      );
      res.status(500).json({
        success: false,
        message: "Failed to load listings",
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
          query: searchFilter,
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

    res.status(200).json({
      success: true,
      listings: listings.filter((item) => item.activeListings.length > 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
