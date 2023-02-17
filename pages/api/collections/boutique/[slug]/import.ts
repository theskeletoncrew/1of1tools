import { Metaplex, Nft } from "@metaplex-foundation/js";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  addAllMintsAsTracked,
  getBoutiqueCollection,
  setBoutiqueCollectionExtras,
} from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { clusterApiUrl, network } from "utils/network";
import { importAllEventsForCollection } from "utils/import";
import { Helius } from "helius-sdk";
import { Constants } from "models/constants";
import { addOffchainCachingTaskForMint } from "utils/nftCache";

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

    // get and cache collection image
    let cachedImage: string | null = null;

    if (collection.imageURL) {
      const imageRes = await fetch(
        `${
          Constants.SERVER_URL
        }/api/assets/collection/${slug}/640?originalURL=${encodeURIComponent(
          collection.imageURL
        )}&returnType=json`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (imageRes.ok) {
        const responseJSON = await imageRes.json();
        const cachedImageURI = responseJSON.url as string;
        if (cachedImageURI) {
          cachedImage = cachedImageURI;
        }
      } else {
        console.error(imageRes.statusText);
      }
    }

    // determine the collection address and first creator address
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
        const setVerifiedCreatorRes = await setBoutiqueCollectionExtras(
          slug,
          collectionAddress,
          firstVerifiedCreator,
          collection.mintAddresses.length,
          cachedImage
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

    // add all of the mint addresses to the list of tracked addresses
    const addRes = await addAllMintsAsTracked(collection);
    if (!addRes.isOk()) {
      res.status(500).json({
        success: false,
        message: addRes.error.message,
      });
      return;
    }

    // create tasks to capture offchain data (images, metadata) for all mints
    const tasksPromises = collection.mintAddresses.map((mintAddress) =>
      addOffchainCachingTaskForMint(mintAddress)
    );
    await Promise.all(tasksPromises);

    // import all of the historical events and calculate stats
    const updateRes = await importAllEventsForCollection(collection);
    if (!updateRes.isOk()) {
      res.status(500).json({
        success: false,
        message: updateRes.error.message,
      });
      return;
    }

    // subscribe webhook to events about this creator address
    const helius = new Helius(HELIUS_API_KEY);
    await helius.appendAddressesToWebhook(HELIUS_WEBHOOK_ID, [
      firstVerifiedCreator,
    ]);

    res.status(200).json({
      success: true,
      totalVolume: updateRes.value.totalVolume,
      monthVolume: updateRes.value.monthVolume,
      weekVolume: updateRes.value.weekVolume,
      dayVolume: updateRes.value.dayVolume,
      athSale: updateRes.value.athSale ?? null,
      floor: updateRes.value.floor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
