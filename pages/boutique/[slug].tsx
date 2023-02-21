import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import { useEffect, useState } from "react";
import Header from "components/Header/Header";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import Layout from "components/Layout/Layout";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";
import { Collection } from "models/collection";
import CollectionSocial from "components/CollectionSocial/CollectionSocial";
import CollectionStats from "components/CollectionStats/CollectionStats";
import { GetServerSideProps } from "next";
import { NFTListing, NFTListings } from "models/nftListings";
import NFTCollectionFilter, {
  NFTFilterType,
} from "components/NFTCollectionFilter/NFTCollectionFilter";
import { parseCookies, setCookie } from "nookies";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import CachedNFTGrid from "components/NFTGrid/CachedNFTGrid";
import CollectionSearch from "components/CollectionSearch/CollectionSearch";
import CollectionFilters from "components/CollectionFilters/CollectionFilters";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { notEmpty } from "utils";

interface Props {
  collection: Collection;
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.query.slug as string;

  const collectionRes = await OneOfOneToolsClient.boutiqueCollection(slug);
  if (collectionRes.isErr()) {
    return {
      redirect: {
        destination:
          "/error?msg=" +
          encodeURIComponent(
            "Unable to retrieve collection: " + collectionRes.error.message
          ),
        permanent: false,
      },
    };
  }
  const collection = collectionRes.value;
  return { props: { collection } };
};

const CollectionPage: NextPage<Props> = ({ collection }) => {
  const cookies = parseCookies();
  const filterPref = cookies["oo_filter"];

  const [isLoading, setLoading] = useState(true);
  const [allNftsMetadata, setAllNftsMetadata] = useState<OneOfOneNFTMetadata[]>(
    []
  );
  const [nftsMetadata, setNFTsMetadata] = useState<OneOfOneNFTMetadata[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [listings, setListings] = useState<NFTListings[]>([]);
  const [filter, setFilter] = useState<NFTFilterType>(
    filterPref ? (filterPref as NFTFilterType) : NFTFilterType.ALL_ITEMS
  );
  const [searchTerm, setSearchTerm] = useState<string>();
  const [attributes, setAttributes] = useState<{
    [key: string]: Set<string>;
  }>();
  const [attributeSelections, setAttributeSelections] = useState<{
    [key: string]: string | null;
  }>();

  const getNfts = async () => {
    if (!collection.mintAddresses || collection.mintAddresses.length === 0) {
      return;
    }

    setLoading(true);

    const nftsRes = await OneOfOneToolsClient.cachedNfts(
      collection.mintAddresses
    );

    if (nftsRes.isErr()) {
      toast.error("Failed to load more nfts: " + nftsRes.error.message);
    } else {
      let nfts = nftsRes.value.filter(notEmpty);
      setAllNftsMetadata(nfts);
      calculateAttributes(nfts);
    }

    setLoading(false);
  };

  const applySearchSortFilter = (
    nfts: OneOfOneNFTMetadata[],
    currentFilter: NFTFilterType,
    search: string | undefined,
    attributeSelections:
      | {
          [key: string]: string | null;
        }
      | undefined
  ) => {
    let newNFTMetadata = nfts;
    if (currentFilter === NFTFilterType.LISTED_ITEMS) {
      newNFTMetadata = newNFTMetadata.filter((m) =>
        listings.find((l) => l.mint === m.mint)
      );
    }
    if (search) {
      newNFTMetadata = newNFTMetadata.filter((n) =>
        n.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (attributeSelections) {
      newNFTMetadata = newNFTMetadata.filter((n) => {
        const missingAttribute = Object.keys(attributeSelections).find(
          (attribute) =>
            attributeSelections[attribute] &&
            n["_attrib__" + attribute.toLowerCase()]?.toString() !==
              attributeSelections[attribute]
        );
        if (n.name === "AQUA ESTHER") {
          console.log(n);
          console.log("missing: " + missingAttribute);
        }
        return missingAttribute === undefined;
      });
    }

    if (currentFilter === NFTFilterType.LISTED_ITEMS) {
      newNFTMetadata = newNFTMetadata.sort((nft1, nft2) => {
        const listing1: NFTListings = listings.find(
          (l) => l.mint === nft1.mint
        )!;
        const listing2: NFTListings = listings.find(
          (l) => l.mint === nft2.mint
        )!;
        return (
          (listing1.activeListings[0]?.amount ?? 0) -
          (listing2.activeListings[0]?.amount ?? 0)
        );
      });
    } else {
      newNFTMetadata = newNFTMetadata.sort((nft1, nft2) => {
        const numVal1 = parseInt(nft1.name.replace(/^\D+/g, ""));
        const numVal2 = parseInt(nft2.name.replace(/^\D+/g, ""));
        if (!isNaN(numVal1) && !isNaN(numVal2)) {
          return numVal1 - numVal2;
        }
        return nft1.name.localeCompare(nft2.name);
      });
    }

    setNFTsMetadata(newNFTMetadata);
  };

  const calculateAttributes = (nfts: OneOfOneNFTMetadata[]) => {
    let allAttributes: { [key: string]: Set<string> } = {};
    nfts.forEach((nft) => {
      nft.attributes?.forEach((attribute) => {
        let existingSet = allAttributes[attribute];
        if (!existingSet) {
          existingSet = new Set<string>();
        }
        const attributeValue =
          nft["_attrib__" + attribute.toLowerCase()]?.toString();
        if (attributeValue) {
          existingSet.add(attributeValue);
        }
        allAttributes[attribute] = existingSet;
      });
    });
    console.log(
      JSON.stringify(Object.values(allAttributes).map((v) => [...v]))
    );
    setAttributes(allAttributes);

    let emptyAttributeSelections: { [key: string]: string | null } = {};
    Object.keys(allAttributes).forEach((attribute) => {
      emptyAttributeSelections[attribute] = null;
    });
    setAttributeSelections(emptyAttributeSelections);
  };

  const removeSelection = (attribute: string, value: string | undefined) => {
    let updatedSelections = { ...attributeSelections };
    updatedSelections[attribute] = null;
    setAttributeSelections((currentSelections) => ({
      ...updatedSelections,
    }));
  };

  const loadListings = async () => {
    if (!collection.mintAddresses) {
      return;
    }
    const listingsRes = await OneOfOneToolsClient.activeBoutiqueListings(
      collection.slug
    );

    if (listingsRes.isErr()) {
      return;
    }

    const validListings = listingsRes.value.filter((l) =>
      collection.mintAddresses.includes(l.mint)
    );
    setListings(validListings);
  };

  useEffect(() => {
    applySearchSortFilter(
      allNftsMetadata,
      filter,
      searchTerm,
      attributeSelections
    );
  }, [allNftsMetadata, filter, searchTerm, attributeSelections]);

  useEffect(() => {
    getNfts();
  }, [listings]);

  useEffect(() => {
    loadListings();
  }, []);

  const title = `1of1.tools | ${collection.name} NFT Listings`;
  const url = `https://1of1.tools/boutique/${collection.slug}`;
  const description = `View ${collection.name} aggregated nft listings, owner information, historical activity, and all-time high sales across all marketplaces.`;
  const featuredImageURL = collection.imageURL
    ? `https://1of1.tools/api/assets/collection/${
        collection.slug
      }/640?originalURL=${encodeURIComponent(collection.imageURL)}`
    : null;

  return (
    <Layout>
      <div>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="icon" href="/favicon.ico" />

          <meta name="description" content={description} />
          <meta name="theme-color" content="#ffffff" />

          <meta property="og:url" content={url} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          {featuredImageURL && (
            <meta property="og:image" content={featuredImageURL} />
          )}

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          {featuredImageURL && (
            <meta name="twitter:image" content={featuredImageURL} />
          )}
        </Head>

        <div className="mt-4">
          {collection ? (
            <Header
              title={collection.name}
              subtitle={<CollectionSocial collection={collection} />}
              imgUrl={collection.imageURL ?? undefined}
              right={
                <CollectionStats
                  collection={collection}
                  numListings={listings.length}
                />
              }
            />
          ) : (
            <Header title="" />
          )}
        </div>

        <div className="mt-4">
          {listings && (
            <>
              <div className="mx-1 flex items-end justify-between h-[40px]">
                <div className="flex items-center gap-3 h-full max-w-[50%]">
                  {attributes && Object.keys(attributes).length > 0 && (
                    <CollectionFilters
                      attributes={attributes}
                      attributeSelections={attributeSelections ?? {}}
                      didChangeSelections={(selections) => {
                        setAttributeSelections(selections);
                        console.log(selections);
                      }}
                    />
                  )}
                  <CollectionSearch
                    searchTerm={searchTerm ?? ""}
                    didChangeSearch={(s) => setSearchTerm(s)}
                  />
                </div>
                <NFTCollectionFilter
                  filter={filter}
                  didChangeFilter={(newFilter) => {
                    setFilter(newFilter);

                    setCookie(null, "oo_filter", newFilter, {
                      maxAge: 30 * 24 * 60 * 60,
                      path: "/",
                    });
                  }}
                />
              </div>
              {attributeSelections &&
                Object.values(attributeSelections).find((s) => s !== null) && (
                  <div className="mt-4 flex gap-2">
                    {Object.keys(attributeSelections).map((attributeName) => {
                      const attributeValue = attributeSelections[attributeName];
                      return attributeValue !== null ? (
                        <label
                          key={attributeName}
                          className="button thinbutton"
                          onClick={() =>
                            removeSelection(attributeName, attributeValue)
                          }
                        >
                          <span>
                            {attributeName}:{" "}
                            {attributeSelections[attributeName]}
                          </span>
                          <span>
                            <XMarkIcon className="w-5 h-5" />
                          </span>
                        </label>
                      ) : (
                        ""
                      );
                    })}
                  </div>
                )}
            </>
          )}
          {isLoading ? (
            <LoadingGrid className="mt-10 mx-1 gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6" />
          ) : nftsMetadata.length > 0 ? (
            <div>
              <CachedNFTGrid
                nfts={nftsMetadata}
                listings={listings}
                isImported={true}
              />
            </div>
          ) : (
            <ErrorMessage title={errorMessage ?? "No NFTs found"} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CollectionPage;
