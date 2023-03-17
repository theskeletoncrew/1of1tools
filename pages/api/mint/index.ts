import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "pages/api/auth/[...nextauth]";

const CROSSMINT_API_SECRET = process.env.CROSSMINT_PROD_API_SECRET || "";
const CROSSMINT_PROJECT_ID = process.env.CROSSMINT_PROD_PROJECT_ID || "";

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
    const session = await unstable_getServerSession(req, res, authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      res.status(401).json({ message: "You must be logged in." });
      return;
    }

    const metadata = req.body.metadata;
    const recipientEmail = req.body.recipientEmail;

    if (!metadata || metadata.length == 0) {
      res.status(400).json({ message: "Metadata is required." });
      return;
    }
    if (!recipientEmail || recipientEmail.length == 0) {
      res.status(400).json({ message: "Recipient email address is required." });
      return;
    }

    if (uid != "5awsmonFXxL4xCNQTYVgw8zGWXEzAcoTbirxYEYqxwh3") {
      res.status(500).json({
        success: false,
        message: "Crossmint minting is temporarily disabled",
      });
    }

    const response = await fetch(
      `https://www.crossmint.com/api/2022-06-09/collections/default-solana/nfts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-client-secret": CROSSMINT_API_SECRET,
          "x-project-id": CROSSMINT_PROJECT_ID,
        },
        body: JSON.stringify({
          metadata: metadata,
          recipient: `email:${recipientEmail}:solana`,
        }),
      }
    );

    const responseJSON = await response.json();

    console.log(responseJSON);

    if (response.ok) {
      res.status(200).json(responseJSON);
    } else {
      res.status(500).json({
        success: false,
        message: responseJSON.message ? responseJSON.message : "Minting Failed",
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
