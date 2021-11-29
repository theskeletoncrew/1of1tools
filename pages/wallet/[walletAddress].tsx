import type { NextPage } from "next";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useRouter } from "next/router";
import { shortPubKey } from "utils";
import NFTGrid from "components/NFTGrid/NFTGrid";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import { NFTMetadata } from "models/nftMetadata";
import Header from "components/Header/Header";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import TwitterHandle from "components/TwitterHandle/TwitterHandle";
import { toast } from "react-hot-toast";
import Layout from "components/Layout/Layout";
import {
  loadBonfidaName,
  loadTwitterName,
  resolveWalletAddress,
} from "utils/addressResolution";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";

const WalletPage: NextPage = () => {
  const [isLoading, setLoading] = useState(false);

  const router = useRouter();
  const walletInput = router.query.walletAddress as string;

  const [walletAddress, setWalletAddress] = useState<string>();
  const [bonfidaName, setBonfidaName] = useState<string>();
  const [twitterName, setTwitterName] = useState<string>();

  const [page, setPage] = useState(1);
  const [nfts, setNfts] = useState<Map<string, NFTMetadata>>(new Map());
  const [hasMore, setHasMore] = useState(true);

  const [errorReason, setErrorReason] = useState<string>();

  const updateNfts = (mintAddress: string, nft: NFTMetadata) => {
    setNfts((nfts) => new Map(nfts.set(mintAddress, nft)));
  };

  const getMoreNfts = async () => {
    if (!walletAddress) {
      return;
    }

    const nftAddressesRes = await OneOfOneToolsClient.nftsOwnedBy(
      walletAddress,
      page + 1
    );
    if (nftAddressesRes.isOk()) {
      const result = nftAddressesRes.value;
      const nftAddresses = result.mints;
      const numberOfPages = result.numberOfPages;

      const nftsRes = await OneOfOneToolsClient.nfts(nftAddresses);
      if (nftsRes.isErr()) {
        toast.error("Failed to load nfts");
        setHasMore(false);
        return;
      }

      nftsRes.value.forEach((nft) => {
        updateNfts(nft.mint, nft);
      });

      setPage((page) => page + 1);
      setHasMore(page + 1 < numberOfPages);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      if (bonfidaName === undefined) {
        loadBonfidaName(walletAddress).then((name) => setBonfidaName(name));
      }
      if (twitterName === undefined) {
        loadTwitterName(walletAddress).then((name) => setTwitterName(name));
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      getMoreNfts().then(() => {
        setLoading(false);
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletInput && nfts.size == 0 && !isLoading) {
      setLoading(true);
      if (walletInput.endsWith(".sol")) {
        setBonfidaName(walletInput.substring(0, walletInput.length - 4));
      }
      if (walletInput?.startsWith("@")) {
        setTwitterName(walletInput.substring(1));
      }
      resolveWalletAddress(walletInput).then((walletPublicKey) => {
        if (walletPublicKey) {
          setWalletAddress(walletPublicKey.toString());
        } else {
          setErrorReason("Unable to resolve wallet address.");
          setLoading(false);
        }
      });
    }
  }, [walletInput]);

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
            title={
              bonfidaName
                ? `NFTs owned by ${bonfidaName}.sol (${shortPubKey(
                    walletAddress
                  )})`
                : `NFTs owned by ${shortPubKey(walletAddress)}`
            }
            right={twitterName ? <TwitterHandle handle={twitterName} /> : ""}
          />

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
            <LoadingGrid />
          ) : (
            <ErrorMessage title={errorReason ? errorReason : "No NFTs found"} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WalletPage;
