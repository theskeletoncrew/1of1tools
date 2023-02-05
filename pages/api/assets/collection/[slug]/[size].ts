import { Storage } from "@google-cloud/storage";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import axios from "axios";
import { proxyImgUrl } from "utils/imgproxy";
import { tryPublicKey } from "utils";
const httpAdapter = require("axios/lib/adapters/http");

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
});
const bucketName = "1of1-thumbnails";
const bucket = storage.bucket(bucketName);

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
    const {
      slug: slugStr,
      originalURL: originalURLStr,
      size: sizeStr,
    } = req.query;

    const slug = slugStr?.toString();
    if (!slug || slug.length == 0) {
      res.status(400).json({ message: "NFT address is required." });
      return;
    }
    const originalURL = originalURLStr?.toString();
    if (!originalURL || originalURL.length == 0) {
      res.status(400).json({ message: "Original URL is required." });
      return;
    }
    const size = sizeStr ? parseInt(sizeStr.toString()) : 640;
    const imageURL = proxyImgUrl(originalURL, size, size);

    const fileName = `collection/${slug}/${size}`;

    const [cachedFileExists] = await storage
      .bucket(bucketName)
      .file(fileName)
      .exists();

    if (cachedFileExists) {
      const gcsUrl = bucket.file(fileName).publicUrl();
      res.redirect(gcsUrl);
      return;
    }

    console.log(imageURL);

    const response = await axios.get(imageURL, {
      responseType: "stream",
      adapter: httpAdapter,
    });

    if (response.status != 200) {
      res.status(400).json({ success: false });
      return;
    }

    const remoteWriteStream = bucket.file(fileName).createWriteStream({
      gzip: true,
      metadata: {
        contentType: response.headers["content-type"],
      },
    });

    const stream = response.data;

    await new Promise<null>(async (resolve, reject) => {
      stream
        .pipe(remoteWriteStream)
        .on("error", function (error: any) {
          res.status(400).json({ message: (error as Error).message });
        })
        .on("finish", function () {
          const gcsUrl = bucket.file(fileName).publicUrl();
          res.redirect(gcsUrl);
        });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;