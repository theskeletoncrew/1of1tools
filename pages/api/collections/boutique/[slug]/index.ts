import { getBoutiqueCollection } from "db";
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

    if (collectionRes.value === null) {
      res.status(404).json({
        success: false,
      });
      return;
    }

    res.status(200).json({
      success: true,
      collection: collectionRes.value,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
