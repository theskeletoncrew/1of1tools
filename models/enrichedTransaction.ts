import { NFTEvent } from "./nftEvent";

export interface EnrichedTransaction {
  accountData: any[][];
  description: string;
  events: { nft: NFTEvent };
  fee: number;
  feePayer: string;
  instructions: any[][];
  nativeTransfers: any[][];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: any[][];
  transactionError: any;
  type: string;
}
