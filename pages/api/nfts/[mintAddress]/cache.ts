import { Metaplex } from "@metaplex-foundation/js";
import { Connection } from "@solana/web3.js";
import { addNFTMetadata } from "db";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { notEmpty, tryPublicKey } from "utils";
import { clusterApiUrl, network } from "utils/network";

const HELIUS_AUTHORIZATION_SECRET =
  process.env.HELIUS_AUTHORIZATION_SECRET || "";

const apiRoute = nextConnect<NextApiRequest, NextApiResponse<any | Error>>({
  onError(error, req, res) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.post(async (req, res) => {
  try {
    if (
      !req.headers["authorization"] ||
      req.headers["authorization"] !== HELIUS_AUTHORIZATION_SECRET
    ) {
      console.warn(
        "Received webhook with invalid/missing authorization header"
      );
      console.warn(JSON.stringify(req.body));
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const mintAddress = req.query.mintAddress?.toString();
    if (!mintAddress) {
      res.status(400).json({
        success: false,
        message: `mintAddress is required`,
      });
      return;
    }

    const mintAddressPublicKey = tryPublicKey(mintAddress);
    if (!mintAddressPublicKey) {
      res.status(400).json({
        success: false,
        message: `mintAddress is not a valid public key`,
      });
      return;
    }

    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint);
    const mx = Metaplex.make(connection);
    const nft = await mx
      .nfts()
      .findByMint({ mintAddress: mintAddressPublicKey });

    const metadata: { [key: string]: any } = {
      updateAuthorityAddress: nft.updateAuthorityAddress.toString(),
      name: nft.name,
      symbol: nft.symbol,
      uri: nft.uri,
      isMutable: nft.isMutable,
      sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
      editionNonce: nft.editionNonce,
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

      description: nft.json?.description,
      externalURL: nft.json?.external_url,
      image: nft.json?.image,
    };

    nft.json?.attributes?.forEach((attribute, i) => {
      if (attribute.trait_type && attribute.value) {
        const safeTraitName = attribute.trait_type
          .toLowerCase()
          .replace(/[\s]+/g, "-")
          .replace(/[^a-z0-9\-]/g, "");
        metadata["___attribute___" + safeTraitName] = attribute.value;
      }
    });

    metadata["attributes"] = nft.json?.attributes
      ?.map((attribute) => attribute.trait_type)
      .filter(notEmpty);

    if (nft.json?.image) {
      const imageRes = await fetch(
        `https://1of1.tools/api/assets/nft/${mintAddress}/640?originalURL=${encodeURIComponent(
          nft.json?.image
        )}&returnType=json`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const responseJSON = await imageRes.json();
      const cachedImageURI = responseJSON.url;
      if (cachedImageURI) {
        metadata.cachedImage = cachedImageURI;
      }
    }

    const addRes = await addNFTMetadata(mintAddress, metadata);
    if (!addRes.isOk()) {
      console.log(`Failed to add metadata for ${mintAddress}`);

      // not a monitored NFT for creator or collection address
      res.status(200).json({
        success: true,
      });
      return;
    }

    res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
