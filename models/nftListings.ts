export interface NFTListings {
  mint: string;
  name: string;
  firstVerifiedCreator: string;
  verifiedCollectionAddress: string;
  activeListings: NFTListing[];
}

export interface NFTListing {
  signature: string;
  marketplace: string;
  amount: number;
  seller: string;
}
