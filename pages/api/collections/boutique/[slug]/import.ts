import { Metaplex, Nft } from "@metaplex-foundation/js";
import { Connection, PublicKey } from "@solana/web3.js";
import { getBoutiqueCollection, setBoutiqueCollectionFiltersAndSize } from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { clusterApiUrl, network } from "utils/network";
import { updateVolumeForCollection } from "utils/volume";

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
        const setVerifiedCreatorRes = await setBoutiqueCollectionFiltersAndSize(
          slug,
          collectionAddress,
          firstVerifiedCreator,
          collection.mintAddresses.length
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

      collection.collectionAddress = collectionAddress;
      collection.firstVerifiedCreator = firstVerifiedCreator;
    }

    const updateRes = await updateVolumeForCollection(collection);
    if (!updateRes.isOk()) {
      res.status(500).json({
        success: false,
        message: updateRes.error.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      totalVolume: updateRes.value.totalVolume,
      weekVolume: updateRes.value.weekVolume,
      dayVolume: updateRes.value.dayVolume,
      athSale: updateRes.value.athSale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
