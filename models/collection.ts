export interface Collection {
  name: string;
  slug: string;
  collectionAddress: string;
  imageURL: string | null;
  twitterURL: string | null;
  discordURL: string | null;
  webURL: string | null;
  approved: boolean;
  mintAddresses: string[];
}
