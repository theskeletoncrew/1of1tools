import { NFTCreator } from "./nftMetadata";

export interface OneOfOneNFTMetadata {
  mint: string;
  updateAuthorityAddress: string;
  name: string;
  symbol: string;
  uri: string;
  isMutable: boolean;
  sellerFeeBasisPoints: number;
  editionNonce: number | null;
  description: string | null;
  image: string | null;
  cachedImage: string | null;
  externalURL: string | null;
  creators: NFTCreator[];
  collection: {
    address: string;
    verified: boolean;
  } | null;
  collectionDetails: {
    size: string; //bignumber
  } | null;
  uses: {
    useMethod: number;
    remaining: string; //bignumber
    total: string; //bignumber
  } | null;
  attributes: string[] | null;
  // _attrib__{ATTRIB_NAME} = {ATTRIB_VALUE}
  [key: string]: unknown;
}
