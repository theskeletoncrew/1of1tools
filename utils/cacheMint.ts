import { Metaplex } from "@metaplex-foundation/js";
import { Connection } from "@solana/web3.js";
import { addNFTMetadata } from "db";
import { Constants } from "models/constants";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import { ok, err, Result } from "neverthrow";
import { notEmpty, tryPublicKey } from "utils";
import { clusterApiUrl, network } from "./network";

export const cacheMint = async (
  mintAddress: string
): Promise<Result<null, Error>> => {
  const mintAddressPublicKey = tryPublicKey(mintAddress);
  if (!mintAddressPublicKey) {
    return err(new Error(`mintAddress is not a valid public key`));
  }
  const endpoint = clusterApiUrl(network);
  const connection = new Connection(endpoint);
  const mx = Metaplex.make(connection);
  const nft = await mx.nfts().findByMint({ mintAddress: mintAddressPublicKey });

  const metadata: OneOfOneNFTMetadata = {
    mint: mintAddress,
    updateAuthorityAddress: nft.updateAuthorityAddress.toString(),
    name: nft.name,
    symbol: nft.symbol,
    uri: nft.uri,
    isMutable: nft.isMutable,
    sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
    editionNonce: nft.editionNonce ?? null,
    creators: nft.creators.map((creator) => ({
      address: creator.address.toString(),
      verified: creator.verified,
      share: creator.share,
    })),
    collection: nft.collection
      ? {
          address: nft.collection.address.toString(),
          verified: nft.collection.verified,
        }
      : null,
    collectionDetails: nft.collectionDetails
      ? {
          size: nft.collectionDetails.size.toString(),
        }
      : null,
    uses: nft.uses
      ? {
          useMethod: nft.uses.useMethod,
          remaining: nft.uses.remaining.toString(),
          total: nft.uses.total.toString(),
        }
      : null,

    description: nft.json?.description ?? null,
    externalURL: nft.json?.external_url ?? null,
    image: nft.json?.image ?? null,
    cachedImage: null,
    attributes: [],
  };

  nft.json?.attributes?.forEach((attribute, i) => {
    if (attribute.trait_type && attribute.value) {
      const safeTraitName = attribute.trait_type.toLowerCase();
      if (safeTraitName && safeTraitName.length > 0) {
        metadata["_attrib__" + safeTraitName] = attribute.value;
      }
    }
  });

  metadata["attributes"] =
    nft.json?.attributes
      ?.map((attribute) => attribute.trait_type)
      .filter(notEmpty) ?? null;

  if (nft.json?.image) {
    const imageRes = await fetch(
      `${
        Constants.SERVER_URL
      }/api/assets/nft/${mintAddress}/640?originalURL=${encodeURIComponent(
        nft.json?.image
      )}&returnType=json`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (imageRes.ok) {
      const responseJSON = await imageRes.json();
      const cachedImageURI = responseJSON.url as string;
      if (cachedImageURI) {
        metadata.cachedImage = cachedImageURI;
      }
    } else {
      console.error(imageRes.statusText);
    }
  }

  const addRes = await addNFTMetadata(mintAddress, metadata);
  if (!addRes.isOk()) {
    console.log(`Failed to add metadata for ${mintAddress}`);
    return err(addRes.error);
  }

  return ok(null);
};
