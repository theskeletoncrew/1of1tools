import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { setBoutiqueCollectionStats } from "db";
import { TransactionType } from "helius-sdk";
import { ATHSale } from "models/athSale";
import { Collection } from "models/collection";
import { NFTEvent } from "models/nftEvent";
import { err, ok, Result } from "neverthrow";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

export const updateVolumeForCollection = async (
  collection: Collection
): Promise<
  Result<
    {
      totalVolume: number;
      weekVolume: number;
      dayVolume: number;
      athSale: ATHSale;
    },
    Error
  >
> => {
  let totalVolume = 0;
  let dayVolume = 0;
  let weekVolume = 0;

  const nowInSeconds = new Date().getTime() / 1000;
  const dayInSeconds = 60 * 60 * 24;

  let paginationToken = null;

  let query: any = {
    types: [TransactionType.NFT_SALE, TransactionType.NFT_MINT],
    nftCollectionFilters: {},
  };

  if (collection.collectionAddress) {
    query.nftCollectionFilters.verifiedCollectionAddress = [
      collection.collectionAddress,
    ];
  } else {
    query.nftCollectionFilters.firstVerifiedCreator = [
      collection.firstVerifiedCreator,
    ];
  }
  let options: { [key: string]: any } = {
    limit: 1000,
  };

  let athSale = {
    amount: 0,
    mint: "",
    name: "",
    signature: "",
    timestamp: 0,
    source: "",
    buyer: "",
    seller: "",
  };

  do {
    if (paginationToken) {
      options["paginationToken"] = paginationToken;
    }

    const response = await fetch(
      `https://api.helius.xyz/v1/nft-events?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          options: options,
        }),
      }
    );

    const responseJSON: any = await response.json();

    if (!response.ok) {
      return err(new Error(responseJSON.error));
    }

    const events = responseJSON.result as NFTEvent[];
    events.forEach((event) => {
      const nft = event.nfts[0];
      if (nft && collection.mintAddresses.includes(nft.mint)) {
        const solAmount = event.amount / LAMPORTS_PER_SOL;

        totalVolume += solAmount;

        if (event.timestamp > nowInSeconds - dayInSeconds) {
          dayVolume += solAmount;
        }
        if (event.timestamp > nowInSeconds - 7 * dayInSeconds) {
          weekVolume += solAmount;
        }
        if (event.amount > athSale.amount) {
          athSale = {
            amount: event.amount,
            mint: nft.mint,
            name: nft.name,
            signature: event.signature,
            timestamp: event.timestamp,
            source: event.source,
            buyer: event.buyer,
            seller: event.seller,
          };
        }
      }
    });

    paginationToken = responseJSON.paginationToken;
  } while (paginationToken);

  const setTotalVolumeRes = await setBoutiqueCollectionStats(
    collection.slug,
    totalVolume,
    weekVolume,
    dayVolume,
    athSale
  );
  if (!setTotalVolumeRes.isOk()) {
    return err(new Error("Failed to set collection total volume."));
  }

  return ok({
    totalVolume: totalVolume,
    weekVolume: weekVolume,
    dayVolume: dayVolume,
    athSale: athSale,
  });
};
