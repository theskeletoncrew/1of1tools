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
    const collectionAddress: string = req.body.collectionAddress;
    if (!collectionAddress || collectionAddress.length == 0) {
      res.status(400).json({ message: "Collection address is required." });
      return;
    }

    let result: any[] = [];
    let paginationToken = null;

    do {
      let options: { [key: string]: any } = {
        limit: 10000,
      };
      if (paginationToken) {
        options["paginationToken"] = paginationToken;
      }
      const response = await fetch(
        `https://api.helius.xyz/v1/mintlist?api-key=${HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: {
              verifiedCollectionAddresses: [collectionAddress],
            },
            options: options,
          }),
        }
      );

      const responseJSON: any = await response.json();

      if (!response.ok) {
        res.status(500).json({
          success: false,
          message: responseJSON.error,
        });
        return;
      }

      result = result.concat(responseJSON.result);
      paginationToken = responseJSON.paginationToken;
    } while (paginationToken);

    res.status(200).json({
      success: true,
      mintlist: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
