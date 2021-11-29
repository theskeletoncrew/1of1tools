import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import ImageKit from "imagekit";

const IMAGEKIT_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_ENDPOINT || "";
const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "";

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
    var imagekit = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_ENDPOINT,
    });

    var authenticationParameters = imagekit.getAuthenticationParameters();

    res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json(authenticationParameters);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
