import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import { useEffect, useState } from "react";
import Header from "components/Header/Header";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import Layout from "components/Layout/Layout";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";
import { Collection } from "models/collection";
import CollectionSocial from "components/CollectionSocial/CollectionSocial";
import CollectionStats from "components/CollectionStats/CollectionStats";
import { GetServerSideProps } from "next";
import { NFTListings } from "models/nftListings";
import NFTCollectionFilter, {
  NFTFilterType,
} from "components/NFTCollectionFilter/NFTCollectionFilter";
import { parseCookies, setCookie } from "nookies";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import CachedNFTGrid from "components/NFTGrid/CachedNFTGrid";
import CollectionSearch from "components/CollectionSearch/CollectionSearch";

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
      let nfts = nftsRes.value;
      setAllNftsMetadata(nfts);
    }

    setLoading(false);
  };

  const applySearchSortFilter = (
    nfts: OneOfOneNFTMetadata[],
    currentFilter: NFTFilterType,
    search: string | undefined
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
    newNFTMetadata = newNFTMetadata.sort((nft1, nft2) => {
      const numVal1 = parseInt(nft1.name.replace(/^\D+/g, ""));
      const numVal2 = parseInt(nft2.name.replace(/^\D+/g, ""));
      if (!isNaN(numVal1) && !isNaN(numVal2)) {
        return numVal1 - numVal2;
      }
      return nft1.name.localeCompare(nft2.name);
    });

    setNFTsMetadata(newNFTMetadata);
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
    applySearchSortFilter(allNftsMetadata, filter, searchTerm);
  }, [allNftsMetadata, filter, searchTerm]);

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
            <div className="mx-1 flex items-end justify-between h-[40px]">
              <CollectionSearch
                searchTerm={searchTerm ?? ""}
                didChangeSearch={(s) => setSearchTerm(s)}
              />
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
          )}
          {isLoading ? (
            <LoadingGrid className="mt-10 mx-1 gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6" />
          ) : nftsMetadata.length > 0 ? (
            <CachedNFTGrid
              nfts={nftsMetadata}
              listings={listings}
              isImported={true}
            />
          ) : (
            <ErrorMessage title={errorMessage ?? "No NFTs found"} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CollectionPage;
