import { Metaplex } from "@metaplex-foundation/js";
import { Connection } from "@solana/web3.js";
import { addNFTMetadata } from "db";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { notEmpty, tryPublicKey } from "utils";
import { clusterApiUrl, network } from "utils/network";
import { Constants } from "models/constants";
import { cacheMint } from "utils/cacheMint";

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
  const mintAddress = req.query.mintAddress?.toString();

  try {
    if (
      !req.headers["authorization"] ||
      req.headers["authorization"] !== HELIUS_AUTHORIZATION_SECRET
    ) {
      console.warn(
        "Received webhook with invalid/missing authorization header"
      );
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!mintAddress) {
      res.status(400).json({
        success: false,
        message: `mintAddress is required`,
      });
      return;
    }

    const cacheRes = await cacheMint(mintAddress);
    if (cacheRes.isErr()) {
      res.status(500).json({
        success: false,
        message: cacheRes.error.message,
      });
    }

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.log(`error caching ${mintAddress}`);
    console.log(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
