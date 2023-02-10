import {
  addNewTrackedMint,
  getBoutiqueCollections,
  trackNewMintIfPartOfCollection,
} from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { importAllEventsForCollection } from "utils/import";

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
    // const collectionsRes = await getBoutiqueCollections(null);
    // if (!collectionsRes.isOk()) {
    //   res.status(500).json({
    //     success: false,
    //     message: collectionsRes.error,
    //   });
    //   return;
    // }

    // const collections = collectionsRes.value;

    // for (let i = 0; i < collections.length; i++) {
    //   const collection = collections[i]!;
    //   // await updateVolumeForCollection(collection);
    // }

    console.log("Adding new tracked mint");

    const result = await addNewTrackedMint(
      "4f8Ny3U4nE51vMi8qujdugwzP7YaKHtXz3KxUyW481to",
      "noomads"
    );
    if (!result) {
      res.status(500).json({
        success: false,
        message: "failed to add new tracked mint",
      });
      return;
    }

    console.log("Importing events");

    const updateRes = await importAllEventsForCollection(result.collection);
    if (!updateRes.isOk()) {
      res.status(500).json({
        success: false,
        message: updateRes.error.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      nft: result.nft,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
