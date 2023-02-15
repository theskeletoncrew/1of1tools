import { Collection, CollectionFloor } from "models/collection";
import { NFTListings } from "models/nftListings";
import { err, ok, Result } from "neverthrow";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

export const recalculateFloorPrice = async (
  collection: Collection
): Promise<Result<CollectionFloor | null, Error>> => {
  try {
    const dummyFloor: CollectionFloor = {
      mint: "",
      name: "",
      listing: {
        amount: Number.MAX_SAFE_INTEGER,
        marketplace: "",
        seller: "",
        signature: "",
      },
    };

    let searchFilter = {};

    if (collection.firstVerifiedCreator) {
      searchFilter = {
        firstVerifiedCreators: [collection.firstVerifiedCreator],
      };
    } else if (collection.collectionAddress) {
      searchFilter = {
        verifiedCollectionAddresses: [collection.collectionAddress],
      };
    } else {
      console.error(
        `Collection ${collection.name} has neither a verified collection address or verified creator address`
      );
      return err(
        new Error(
          "Collection had neither a verified creator or collection address"
        )
      );
    }

    const response = await fetch(
      `https://api.helius.xyz/v1/active-listings?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchFilter,
          options: {
            limit: 250,
          },
        }),
      }
    );
    const responseJSON = await response.json();

    if (response.ok) {
      const listings = responseJSON.result as NFTListings[];
      const floor: CollectionFloor = listings
        .filter((n) => collection.mintAddresses.includes(n.mint))
        .reduce((collectionFloor, currentNFT) => {
          const currentNFTFloor = currentNFT.activeListings.reduce(
            (nftFloor, listing) => {
              return listing.amount < nftFloor.listing.amount
                ? ({
                    mint: currentNFT.mint,
                    name: currentNFT.name,
                    listing: listing,
                  } as CollectionFloor)
                : nftFloor;
            },
            dummyFloor
          );

          return currentNFTFloor.listing.amount < collectionFloor.listing.amount
            ? currentNFTFloor
            : collectionFloor;
        }, dummyFloor);

      if (floor.listing.amount < Number.MAX_SAFE_INTEGER) {
        console.log(`Floor for ${collection.slug}: ${floor.listing.amount}`);
        return ok(floor);
      } else {
        console.log(`No listings: ${collection.slug}`);
        return ok(null);
      }
    } else {
      console.error(response);
      return err(
        new Error(`Failed to fetch active listings for ${collection.slug}`)
      );
    }
  } catch (error) {
    console.error(`Failed to save floor of collection: ${collection.name}`);
    console.error(error);
    return err(error as Error);
  }
};
