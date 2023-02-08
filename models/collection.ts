import { NFTEvent, OneOfOneNFTEvent } from "./nftEvent";
import { NFTListing } from "./nftListings";

export interface Collection {
  name: string;
  nameLowercase: string;
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
  dayVolume?: number | null;
  weekVolume?: number | null;
  totalVolume?: number | null;
  athSale?: OneOfOneNFTEvent | null;
}

export interface CollectionFloor {
  mint: string;
  name: string;
  listing: NFTListing;
}

export interface CollectionNFT {
  address: string;
  collectionSlug: string;
  name?: string | null;
  localImage?: string | null;
  metadata?: any | null;
}
