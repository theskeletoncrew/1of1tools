import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { addBoutiqueCollectionEvent, setBoutiqueCollectionStats } from "db";
import { TransactionType } from "helius-sdk";
import { Collection } from "models/collection";
import { NFTEvent, OneOfOneNFTEvent, oneOfOneNFTEvent } from "models/nftEvent";
import { err, ok, Result } from "neverthrow";
import { notEmpty } from "utils";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

export const importAllEventsForCollection = async (
  collection: Collection
): Promise<
  Result<
    {
      totalVolume: number;
      monthVolume: number;
      weekVolume: number;
      dayVolume: number;
      athSale: OneOfOneNFTEvent | undefined;
    },
    Error
  >
> => {
  let totalVolume = 0;
  let monthVolume = 0;
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

  let athSale: OneOfOneNFTEvent | undefined;

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
    events
      .map((e) => oneOfOneNFTEvent(e))
      .filter(notEmpty)
      .forEach(async (event) => {
        if (collection.mintAddresses.includes(event.mint)) {
          const solAmount = event.amount / LAMPORTS_PER_SOL;

          totalVolume += solAmount;

          if (event.timestamp > nowInSeconds - dayInSeconds) {
            dayVolume += solAmount;
          }
          if (event.timestamp > nowInSeconds - 30 * dayInSeconds) {
            monthVolume += solAmount;
          }
          if (event.timestamp > nowInSeconds - 7 * dayInSeconds) {
            weekVolume += solAmount;
          }
          if (!athSale || event.amount > athSale.amount) {
            athSale = event;
          }
        }

        await addBoutiqueCollectionEvent(collection.slug, event);
      });

    paginationToken = responseJSON.paginationToken;
  } while (paginationToken);

  const setTotalVolumeRes = await setBoutiqueCollectionStats(
    collection.slug,
    totalVolume,
    monthVolume,
    weekVolume,
    dayVolume,
    athSale ?? null
  );
  if (!setTotalVolumeRes.isOk()) {
    return err(new Error("Failed to set collection total volume."));
  }

  return ok({
    totalVolume: totalVolume,
    monthVolume: monthVolume,
    weekVolume: weekVolume,
    dayVolume: dayVolume,
    athSale: athSale,
  });
};
