import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import { NFTMetadata } from "models/nftMetadata";
import Head from "next/head";
import { useEffect, useState } from "react";
import NFTGrid from "components/NFTGrid/NFTGrid";
import Header from "components/Header/Header";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import InfiniteScroll from "react-infinite-scroll-component";
import { NFTS_PER_PAGE } from "utils/config";
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
  const [nftsMetadata, setNFTsMetadata] = useState<NFTMetadata[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [listings, setListings] = useState<NFTListings[]>([]);
  const [filter, setFilter] = useState<NFTFilterType>(
    filterPref ? (filterPref as NFTFilterType) : NFTFilterType.ALL_ITEMS
  );

  const getMoreNfts = async (
    currentPage: number,
    currentFilter: NFTFilterType
  ) => {
    if (!collection.mintAddresses || collection.mintAddresses.length === 0) {
      setHasMore(false);
      return;
    }

    setLoading(true);

    const mintAddresses =
      currentFilter === NFTFilterType.ALL_ITEMS
        ? collection.mintAddresses
        : collection.mintAddresses.filter((m) =>
            listings.find((l) => l.mint === m)
          );

    const pageOfMintAddresses = mintAddresses.slice(
      currentPage * NFTS_PER_PAGE,
      (currentPage + 1) * NFTS_PER_PAGE
    );

    const nftsRes = await OneOfOneToolsClient.nfts(
      pageOfMintAddresses,
      true,
      false
    );

    if (nftsRes.isErr()) {
      toast.error("Failed to load more nfts: " + nftsRes.error.message);
    } else {
      const newNFTMetadata =
        currentPage === 0
          ? nftsRes.value
          : nftsRes.value.filter(
              (n) => nftsMetadata.find((n2) => n2.mint === n.mint) === undefined
            );

      if (currentPage > 0) {
        setNFTsMetadata((nftsMetadata) => [...nftsMetadata, ...newNFTMetadata]);
      } else {
        setNFTsMetadata(newNFTMetadata);
      }
      setHasMore(
        (currentPage + 1) * NFTS_PER_PAGE < collection.mintAddresses.length
      );
      setPage(currentPage + 1);
    }

    setLoading(false);
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
    getMoreNfts(0, filter);
  }, [filter, listings]);

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
            <div className="mx-1 flex items-end justify-end h-[40px]">
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
            <InfiniteScroll
              dataLength={nftsMetadata.length}
              next={() => getMoreNfts(page, filter)}
              hasMore={hasMore}
              loader={<LoadingIndicator />}
              endMessage={""}
            >
              <NFTGrid
                nfts={nftsMetadata}
                listings={listings}
                isImported={true}
              />
            </InfiniteScroll>
          ) : (
            <ErrorMessage title={errorMessage ?? "No NFTs found"} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CollectionPage;
