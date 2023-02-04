import { NFTListing } from "./nftListings";

export interface Collection {
  name: string;
  slug: string;
  collectionAddress?: string | null;
  firstVerifiedCreator?: string | null;
  imageURL: string | null;
  twitterURL: string | null;
  discordURL: string | null;
  webURL: string | null;
  approved: boolean;
  mintAddresses: string[];
  floor?: CollectionFloor | null;
  totalVolume?: number | null;
}

export interface CollectionFloor {
  mint: string;
  name: string;
  listing: NFTListing;
}
