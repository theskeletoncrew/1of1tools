import { getBoutiqueCollections } from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

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
    const collectionsRes = await getBoutiqueCollections(null);
    if (!collectionsRes.isOk()) {
      res.status(500).json({
        success: false,
        message: collectionsRes.error,
      });
      return;
    }

    const collections = collectionsRes.value;

    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i]!;
      // await updateVolumeForCollection(collection);
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
