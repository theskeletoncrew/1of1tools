import { CollectionSortType } from "components/CollectionSort/CollectionSort";
import { addBoutiqueCollection, getBoutiqueCollections } from "db";
import { Collection } from "models/collection";
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
    const { cursor, limit: limitStr, sort: sortStr } = req.query;
    const limit = limitStr ? parseInt(limitStr.toString()) : 0;
    const sort = sortStr
      ? (sortStr.toString() as CollectionSortType)
      : CollectionSortType.TOTAL_VOLUME_DESC;

    const collectionsRes = await getBoutiqueCollections({
      cursor: cursor?.toString(),
      limit: limit > 0 ? limit : null,
      sort,
    });
    if (!collectionsRes.isOk()) {
      res
        .status(500)
        .json({ success: false, message: collectionsRes.error.message });
      return;
    }

    res.status(200).json({
      success: true,
      collections: collectionsRes.value,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

apiRoute.post(async (req, res) => {
  try {
    const collection: Collection = req.body.collection;
    if (!collection) {
      res.status(400).json({ message: "Collection is required." });
      return;
    }

    collection.approved = false;

    collection.slug = collection.slug
      .toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    collection.nameLowercase = collection.name.toLowerCase();

    const collectionsRes = await addBoutiqueCollection(collection);
    if (!collectionsRes.isOk()) {
      res
        .status(500)
        .json({ success: false, message: collectionsRes.error.message });
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
