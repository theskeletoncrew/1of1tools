import { ATHSale } from "./athSale";
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
  athSale?: ATHSale | null;
}

export interface CollectionFloor {
  mint: string;
  name: string;
  listing: NFTListing;
}
