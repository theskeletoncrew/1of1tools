import { Metaplex, Nft } from "@metaplex-foundation/js";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getBoutiqueCollection,
  setBoutiqueCollectionFilters,
  setBoutiqueCollectionTotalVolume,
} from "db";
import { NFTEvent } from "models/nftEvent";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { clusterApiUrl, network } from "utils/network";

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

apiRoute.post(async (req, res) => {
  try {
    const { slug: slugStr } = req.query;
    const slug = slugStr?.toString();

    if (!slug || slug.length == 0) {
      res.status(400).json({ message: "slug is required." });
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

    let collectionAddress = collection.collectionAddress;
    let firstVerifiedCreator = collection.firstVerifiedCreator;

    if (!collectionAddress || !firstVerifiedCreator) {
      const endpoint = clusterApiUrl(network);
      const connection = new Connection(endpoint);
      const mx = Metaplex.make(connection);
      const nft = (await mx.nfts().findByMint({
        mintAddress: new PublicKey(collection.mintAddresses[0]!),
      })) as Nft;

      collectionAddress = nft.collection?.address?.toString() ?? null;
      firstVerifiedCreator = nft.creators
        .find((c) => c.verified)
        ?.address?.toString();

      if (!firstVerifiedCreator) {
        res
          .status(500)
          .json({ success: false, message: "No verified creators." });
        return;
      }

      if (
        (!collection.collectionAddress && collectionAddress) ||
        !collection.firstVerifiedCreator
      ) {
        const setVerifiedCreatorRes = await setBoutiqueCollectionFilters(
          slug,
          collectionAddress,
          firstVerifiedCreator
        );
        if (!setVerifiedCreatorRes.isOk()) {
          res.status(500).json({
            success: false,
            message:
              "Failed to set collection address / first verified creator.",
          });
          return;
        }
      }
    }

    let totalVolume = 0;
    let paginationToken = null;

    let query: any = {
      types: ["NFT_SALE"],
      nftCollectionFilters: {},
    };

    if (collectionAddress) {
      query.nftCollectionFilters.verifiedCollectionAddress = [
        collectionAddress,
      ];
    } else {
      query.nftCollectionFilters.firstVerifiedCreator = [firstVerifiedCreator];
    }
    let options: { [key: string]: any } = {
      limit: 1000,
    };

    do {
      if (paginationToken) {
        options["paginationToken"] = paginationToken;
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
            query: query,
            options: options,
          }),
        }
      );

      const responseJSON: any = await response.json();

      if (!response.ok) {
        res.status(500).json({
          success: false,
          message: responseJSON.error,
        });
        return;
      }

      const events = responseJSON.result as NFTEvent[];
      events.forEach((event) => {
        const nft = event.nfts[0];
        if (nft && collection.mintAddresses.includes(nft.mint)) {
          totalVolume += event.amount / LAMPORTS_PER_SOL;
        }
      });

      paginationToken = responseJSON.paginationToken;
    } while (paginationToken);

    const setTotalVolumeRes = await setBoutiqueCollectionTotalVolume(
      slug,
      totalVolume
    );
    if (!setTotalVolumeRes.isOk()) {
      res.status(500).json({
        success: false,
        message: "Failed to set collection total volume.",
      });
      return;
    }

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
