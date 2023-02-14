import { CloudTasksClient } from "@google-cloud/tasks";
import { EnrichedTransaction } from "models/enrichedTransaction";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

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

// NFT_AUCTION_CREATED
// NFT_BID
// NFT_LISTING
// NFT_SALE

const cloudTasksClient = new CloudTasksClient({
  credentials: {
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
});
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || "";
const location = "us-central1";
const queue = "boutique-collections-activity";
const tasksParent = cloudTasksClient.queuePath(project, location, queue);

apiRoute.post(async (req, res) => {
  try {
    if (
      !req.headers["authorization"] ||
      req.headers["authorization"] !== HELIUS_AUTHORIZATION_SECRET
    ) {
      console.warn(
        "Received webhook with invalid/missing authorization header"
      );
      console.warn(JSON.stringify(req.body));
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const transactions = req.body as EnrichedTransaction[];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]!;

      const nftEvent = transaction.events.nft ? transaction.events.nft : null;
      if (!nftEvent || !nftEvent.nfts || nftEvent.nfts.length == 0) {
        continue;
      }

      const taskName = `projects/${project}/locations/${location}/queues/${queue}/tasks/${
        nftEvent.nfts[0]?.mint
      }-${
        transaction.signature.slice(0, 5) +
        "_" +
        transaction.signature.slice(-5)
      }`;

      const [response] = await cloudTasksClient.createTask({
        parent: tasksParent,
        task: {
          name: taskName,
          httpRequest: {
            url: "https://1of1.tools/api/collections/boutique/webhook/handle-task",
            headers: {
              "Content-Type": "application/json",
              Authorization: HELIUS_AUTHORIZATION_SECRET,
            },
            httpMethod: "POST",
            body: Buffer.from(JSON.stringify(transaction)).toString("base64"),
          },
        },
      });
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
