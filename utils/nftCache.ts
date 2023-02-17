import { CloudTasksClient } from "@google-cloud/tasks";

const HELIUS_AUTHORIZATION_SECRET =
  process.env.HELIUS_AUTHORIZATION_SECRET || "";

const cloudTasksClient = new CloudTasksClient({
  credentials: {
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
});
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || "";
const location = "us-central1";
const queue = "nft-cache-offchain";
const tasksParent = cloudTasksClient.queuePath(project, location, queue);

export const addOffchainCachingTaskForMint = async (mintAddress: string) => {
  await cloudTasksClient.createTask({
    parent: tasksParent,
    task: {
      httpRequest: {
        url: `https://1of1.tools/api/nfts/${mintAddress}/cache`,
        headers: {
          "Content-Type": "application/json",
          Authorization: HELIUS_AUTHORIZATION_SECRET,
        },
        httpMethod: "POST",
      },
    },
  });
};
