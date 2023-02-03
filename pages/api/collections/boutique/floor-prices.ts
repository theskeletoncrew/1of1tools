import { getBoutiqueCollections, setBoutiqueCollectionFloor } from "db";
import { CollectionFloor } from "models/collection";
import { NFTListings } from "models/nftListings";
import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

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

apiRoute.get(async (req, res) => {
  try {
    const collectionsRes = await getBoutiqueCollections(null, null);
    if (!collectionsRes.isOk()) {
      res.status(500).json({
        success: false,
        message: collectionsRes.error,
      });
      return;
    }

    const collections = collectionsRes.value;
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

    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i]!;

      let searchFilter = {};

      if (collection.collectionAddress) {
        searchFilter = {
          verifiedCollectionAddresses: [collection.collectionAddress],
        };
      } else if (collection.firstVerifiedCreator) {
        searchFilter = {
          firstVerifiedCreators: [collection.firstVerifiedCreator],
        };
      } else {
        console.log(
          `Collection ${collection.name} has neither a verified collection address or verified creator address`
        );
        continue;
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

            return currentNFTFloor.listing.amount <
              collectionFloor.listing.amount
              ? currentNFTFloor
              : collectionFloor;
          }, dummyFloor);

        if (floor.listing.amount < Number.MAX_SAFE_INTEGER) {
          console.log(`Floor for ${collection.name}: ${floor.listing.amount}`);
          const collectionsRes = await setBoutiqueCollectionFloor(
            collection.slug,
            floor
          );
          if (!collectionsRes.isOk()) {
            console.log(
              `Failed to save floor of collection: ${collection.name} as ${floor}`
            );
          } else {
            console.log(
              `Saved floor of collection: ${collection.name} as ${floor}`
            );
          }
        } else {
          console.log(`No listings: ${collection.name}`);
          const collectionsRes = await setBoutiqueCollectionFloor(
            collection.slug,
            null
          );
          if (!collectionsRes.isOk()) {
            console.log(
              `Failed to remove floor of collection: ${collection.name}`
            );
          } else {
            console.log(
              `Saved floor of collection: ${collection.name} as no floor`
            );
          }
        }
      } else {
        console.log(response);
      }
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

export default apiRoute;
