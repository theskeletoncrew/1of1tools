import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

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
    const walletAddress: string = req.body.walletAddress;
    if (!walletAddress || walletAddress.length == 0) {
      res.status(400).json({ message: "Wallet address is required." });
      return;
    }

    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/names?api-key=${HELIUS_API_KEY}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const responseJSON = await response.json();

    if (response.ok) {
      res.status(200).json({
        success: true,
        domainNames: responseJSON.domainNames,
      });
    } else {
      res.status(500).json({
        success: false,
        message: responseJSON.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
