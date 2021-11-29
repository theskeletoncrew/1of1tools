export interface NFTMetadata {
  mint: string;
  onChainData: NFTMetadataOnChain | null;
  offChainData: NFTMetadataOffChain | null;
}

export interface NFTMetadataOnChain {
  collection: {
    key: string;
    verified: boolean;
  } | null;
  collectionDetails: {
    size: number;
  } | null;
  data: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: NFTCreator[];
  };
  editionNonce: number;
  isMutable: boolean;
  key: string;
  mint: string;
  primarySaleHappened: boolean;
  tokenStandard: string;
  updateAuthority: string;
  uses: number | null;
}

export interface NFTMetadataOffChain {
  attributes: NFTAttribute[] | null;
  description: string;
  image: string | null;
  name: string;
  properties: {
    category: string;
    creators: NFTCreator[];
    files: NFTFile[];
  };
  sellerFeeBasisPoints: number;
  symbol: string;
}

export interface NFTCreator {
  address: string;
  share: number;
  verified?: boolean;
}

export interface NFTFile {
  type: string;
  uri: string;
}

export interface NFTAttribute {
  traitType: string;
  value: string;
}
