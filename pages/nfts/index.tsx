import type { NextPage } from "next";
import { NFTMetadata } from "models/nftMetadata";
import Head from "next/head";
import NFTGrid from "components/NFTGrid/NFTGrid";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { OneOfOneToolsClient } from "api-client";
import { NFTS_PER_PAGE } from "utils/config";
import { toast } from "react-hot-toast";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import InfiniteScroll from "react-infinite-scroll-component";

const NftsPage: NextPage = () => {
  const [isLoading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<Map<string, NFTMetadata>>(
    new Map<string, NFTMetadata>()
  );
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  const mintAddresses: string[] =
    typeof router.query.mintAddresses === "string"
      ? [router.query.mintAddresses]
      : (router.query.mintAddresses as string[]);

  const updateNfts = (mintAddress: string, nft: NFTMetadata) => {
    setNfts((nfts) => new Map(nfts.set(mintAddress, nft)));
  };

  const getMoreNfts = async () => {
    if (!mintAddresses) {
      return;
    }
    const metadataRes = await OneOfOneToolsClient.nfts(
      mintAddresses.slice(page * NFTS_PER_PAGE, (page + 1) * NFTS_PER_PAGE - 1)
    );
    if (metadataRes.isErr()) {
      toast.error(metadataRes.error.message);
      return;
    }

    metadataRes.value.forEach((nft) => {
      updateNfts(nft.mint, nft);
    });

    setHasMore((page + 1) * NFTS_PER_PAGE < mintAddresses.length);
    setPage(page + 1);
  };

  useEffect(() => {
    if (mintAddresses && nfts.size == 0 && !isLoading) {
      setLoading(true);
      getMoreNfts().then(() => {
        setLoading(false);
      });
    }
  }, [mintAddresses]);

  return (
    <Layout>
      <div>
        <Head>
          <title>one / one tools</title>
          <meta name="description" content="one / one tools" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="mt-4">
          <Header
            title="NFTs by Address"
            subtitle={
              mintAddresses
                ? mintAddresses.length == 1
                  ? mintAddresses[0]
                  : `Searching for ${mintAddresses.length} NFTs`
                : undefined
            }
          />
        </div>

        <div className="mt-4">
          {nfts.size > 0 ? (
            <InfiniteScroll
              dataLength={nfts.size}
              next={getMoreNfts}
              hasMore={hasMore}
              loader={<LoadingIndicator />}
              endMessage={""}
            >
              <NFTGrid nfts={[...nfts.values()]} />
            </InfiniteScroll>
          ) : isLoading ? (
            <LoadingGrid className="mt-10 mx-1 gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6" />
          ) : (
            <ErrorMessage title="No NFTs found" />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NftsPage;
