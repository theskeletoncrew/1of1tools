import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Cluster } from "@solana/web3.js";

export const network =
  process.env.NEXT_PUBLIC_SOLANA_ENVIRONMENT == "devnet"
    ? WalletAdapterNetwork.Devnet
    : WalletAdapterNetwork.Mainnet;

export const clusterApiUrl = (cluster: Cluster): string => {
  return cluster == WalletAdapterNetwork.Devnet
    ? "https://api.devnet.solana.com"
    : process.env.NEXT_PUBLIC_SOLANA_MAINNET_ENDPOINT || "";
};
