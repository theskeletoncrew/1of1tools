export interface NFTEvent {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  description: string;
  amount: number;
  saleType: string;
  buyer: string;
  seller: string;
  nfts: NFTDetails[];
}

export interface NFTDetails {
  mint: string;
  name: string;
  firstVerifiedCreator?: string;
  verifiedCollectionAddress?: string;
  burned?: boolean;
  tokenStandard?: string;
}

export interface OneOfOneNFTEvent {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  description: string;
  amount: number;
  saleType: string;
  buyer: string;
  seller: string;
  mint: string;
  name: string;
  firstVerifiedCreator?: string;
  verifiedCollectionAddress?: string;
  burned?: boolean;
}

export const oneOfOneNFTEvent = (
  nftEvent: NFTEvent
): OneOfOneNFTEvent | undefined => {
  const nft = nftEvent.nfts?.length ?? 0 > 0 ? nftEvent.nfts[0] : null;
  if (!nft) {
    console.log("No NFT for event:");
    console.log(nftEvent);
    return undefined;
  }

  return {
    signature: nftEvent.signature,
    timestamp: nftEvent.timestamp,
    type: nftEvent.type,
    source: nftEvent.source,
    description: nftEvent.description,
    amount: nftEvent.amount,
    saleType: nftEvent.saleType,
    buyer: nftEvent.buyer,
    seller: nftEvent.seller,
    mint: nft.mint,
    name: nft.name,
    firstVerifiedCreator: nft.firstVerifiedCreator,
    verifiedCollectionAddress: nft.verifiedCollectionAddress,
    burned: nft.burned,
  };
};
