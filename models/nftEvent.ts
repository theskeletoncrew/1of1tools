export interface NFTEvent {
  signature: string;
  timestamp: number;
  slot: number;
  type: string;
  source: string;
  description: string;
  amount: number;
  fee: number;
  feePayer: string;
  saleType: string;
  buyer: string;
  seller: string;
  staker: string;
  nfts: NFTDetails[];
  tokenTransfers: TokenTransfer[];
  nativeTransfers: NativeTransfer[];
}

export interface NFTDetails {
  mint: string;
  name: string;
  firstVerifiedCreator?: string;
  verifiedCollectionAddress?: string;
  burned?: boolean;
  tokenStandard?: string;
}

export interface TokenTransfer {
  fromTokenAccount: string;
  toTokenAccount: string;
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}
