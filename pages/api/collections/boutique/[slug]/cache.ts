import { addBoutiqueCollectionCachedImage, getBoutiqueCollection } from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { Constants } from "models/constants";

const HELIUS_AUTHORIZATION_SECRET =
  process.env.HELIUS_AUTHORIZATION_SECRET || "";

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
  const slug = req.query.slug?.toString();

  try {
    if (
      !req.headers["authorization"] ||
      req.headers["authorization"] !== HELIUS_AUTHORIZATION_SECRET
    ) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!slug) {
      res.status(400).json({
        success: false,
        message: `collection is required`,
      });
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

    if (cachedImage) {
      const addRes = await addBoutiqueCollectionCachedImage(slug, cachedImage);
      if (!addRes.isOk()) {
        console.log(`Failed to add cached image for ${slug}`);
        res.status(500).json({
          success: false,
          message: addRes.error.message,
        });
        return;
      }
    }

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.log(`error caching ${slug}`);
    console.log(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
