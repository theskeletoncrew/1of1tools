import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import { NFTMetadata } from "models/nftMetadata";
import Head from "next/head";
import { shortPubKey, tryPublicKey } from "utils";
import { useRouter } from "next/router";
import { Connection, PublicKey } from "@solana/web3.js";
import { Metaplex, Nft } from "@metaplex-foundation/js";
import { network } from "utils/network";
import { useEffect, useState } from "react";
import { clusterApiUrl } from "utils/network";
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
  const [isLoading, setLoading] = useState(true);
  const [nftsMetadata, setNFTsMetadata] = useState<NFTMetadata[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  const getMoreNfts = async () => {
    if (!collection.mintAddresses) {
      return;
    }
    const nftsRes = await OneOfOneToolsClient.nfts(
      collection.mintAddresses.slice(
        page * NFTS_PER_PAGE,
        (page + 1) * NFTS_PER_PAGE
      )
    );

    if (nftsRes.isErr()) {
      toast.error("Failed to load more nfts: " + nftsRes.error.message);
      return;
    }

    setNFTsMetadata((nftsMetadata) => [
      ...nftsMetadata,
      ...nftsRes.value.filter(
        (n) => nftsMetadata.find((n2) => n2.mint === n.mint) === undefined
      ),
    ]);
    setHasMore((page + 1) * NFTS_PER_PAGE < collection.mintAddresses.length);
    setPage(page + 1);
  };

  useEffect(() => {
    setNFTsMetadata([]);
    if (collection.mintAddresses.length > 0) {
      getMoreNfts().then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
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
              right={<CollectionStats collection={collection} />}
            />
          ) : (
            <Header title="" />
          )}
        </div>

        <div className="mt-4">
          {nftsMetadata.length > 0 ? (
            <InfiniteScroll
              dataLength={nftsMetadata.length}
              next={getMoreNfts}
              hasMore={hasMore}
              loader={<LoadingIndicator />}
              endMessage={""}
            >
              <NFTGrid nfts={nftsMetadata} />
            </InfiniteScroll>
          ) : isLoading ? (
            <LoadingGrid />
          ) : (
            <ErrorMessage title={errorMessage ?? "No NFTs found"} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CollectionPage;
