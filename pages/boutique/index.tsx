import type { NextPage } from "next";
import Head from "next/head";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import CollectionIndexGrid from "components/CollectionIndexGrid/CollectionIndexGrid";
import { Collection } from "models/collection";
import { useEffect, useState } from "react";
import { OneOfOneToolsClient } from "api-client";
import { toast } from "react-hot-toast";
import { tryPublicKey } from "utils";
import { Connection, PublicKey } from "@solana/web3.js";
import { clusterApiUrl, network } from "utils/network";
import { Metaplex, Nft } from "@metaplex-foundation/js";
import { COLLECTIONS_PER_PAGE } from "utils/config";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import BoutiqueCollectionsModal from "components/BoutiqueCollectionModal/BoutiqueCollectionModal";

const MAX_BOUTIQUE_COLLECTION_SIZE = 250;

const IndexPage: NextPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string>();
  const [hasMore, setHasMore] = useState(true);
  const [submitCollectionModalShown, setSubmitCollectionModalShown] =
    useState(false);

  const getMoreBoutiqueCollections = async () => {
    const collectionsRes = await OneOfOneToolsClient.boutiqueCollections(
      cursor
    );

    if (collectionsRes.isErr()) {
      toast.error(
        "Failed to load collections: " + collectionsRes.error.message
      );
      return;
    }

    const retCollections = collectionsRes.value;

    setCollections((prevCollections) => [
      ...prevCollections,
      ...retCollections.filter(
        (c) => prevCollections.find((c2) => c2.slug === c.slug) === undefined
      ),
    ]);
    setHasMore(retCollections.length >= COLLECTIONS_PER_PAGE);

    const lastCollection = retCollections.pop();
    if (lastCollection) {
      setCursor(lastCollection.name);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      setLoading(true);
      getMoreBoutiqueCollections().then(() => {
        setLoading(false);
      });
    }
  }, []);

  const loadNft = async (publicKey: PublicKey): Promise<Nft | null> => {
    try {
      const endpoint = clusterApiUrl(network);
      const connection = new Connection(endpoint);
      const mx = Metaplex.make(connection);
      const nft = (await mx
        .nfts()
        .findByMint({ mintAddress: publicKey })) as Nft;
      return nft;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const openSubmitCollection = () => {
    setSubmitCollectionModalShown(true);
  };

  const submitCollection = async (
    collectionAddress: string | null | undefined,
    mintList: string[] | null | undefined,
    collectionName: string | null | undefined,
    slug: string | null | undefined,
    twitterURL: string | null | undefined,
    discordURL: string | null | undefined,
    webURL: string | null | undefined
  ): Promise<boolean> => {
    let finalMintList = mintList ?? [];
    let imageURL: string | undefined;

    if (!slug || slug.length == 0) {
      toast.error("URL slug is required");
      return false;
    }

    if (collectionAddress) {
      const publicKey = tryPublicKey(collectionAddress);
      if (!publicKey) {
        toast.error("The address you entered is not a valid public key.");
        return false;
      }

      const nft = await loadNft(publicKey);
      if (!nft) {
        toast.error("Failed to load collection");
        return false;
      }

      imageURL = nft.json?.image;

      if (!mintList) {
        const mintListRes = await OneOfOneToolsClient.mintList(
          collectionAddress
        );
        if (!mintListRes.isOk()) {
          toast.error("Failed to load mint list for collection");
          return false;
        }
        finalMintList = mintListRes.value;
      }
    } else if (!mintList) {
      toast.error("You must supply either a collection address or mint list");
      return false;
    }

    if (finalMintList.length == 0) {
      toast.error("Failed to load mint list for collection");
      return false;
    } else if (finalMintList.length > MAX_BOUTIQUE_COLLECTION_SIZE) {
      toast.error(
        `We currently only accept boutique collections up to ${MAX_BOUTIQUE_COLLECTION_SIZE} nfts in size.`
      );
      return false;
    }

    if (!imageURL) {
      const nft = await loadNft(new PublicKey(finalMintList[0]!));
      if (!nft) {
        toast.error("Failed to load collection");
        return false;
      }
      imageURL = nft.json?.image;
    }

    const collection = {
      name: collectionName,
      slug: slug,
      collectionAddress: collectionAddress,
      imageURL: imageURL,
      twitterURL: twitterURL,
      discordURL: discordURL,
      webURL: webURL,
      approved: false,
      mintAddresses: finalMintList,
    } as Collection;

    const submitRes = await OneOfOneToolsClient.addBoutiqueCollection(
      collection
    );
    if (!submitRes.isOk()) {
      toast.error(submitRes.error.message);
      return false;
    }

    toast.success("Thanks! Your collection will appear here once approved.");
    setSubmitCollectionModalShown(false);
    return true;
  };

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
            title="Boutique Collections"
            right={
              <a
                href="#"
                onClick={openSubmitCollection}
                className="border border-1 border-indigo-600 bg-indigo-800 text-white rounded-xl px-6 py-3 hover:bg-indigo-600 hover:text-white"
              >
                Submit a Collection
              </a>
            }
          />
        </div>

        <div className="mt-4">
          {collections.length > 0 ? (
            <InfiniteScroll
              dataLength={collections.length}
              next={getMoreBoutiqueCollections}
              hasMore={hasMore}
              loader={<LoadingIndicator />}
              endMessage={""}
            >
              <CollectionIndexGrid
                items={collections}
                maxCollectionSize={MAX_BOUTIQUE_COLLECTION_SIZE}
              />
            </InfiniteScroll>
          ) : isLoading ? (
            <LoadingGrid />
          ) : (
            <ErrorMessage title="No collections found" />
          )}
        </div>

        <div className="mt-4"></div>
      </div>
      <BoutiqueCollectionsModal
        prompt={`Provide the Metaplex Certified Collection address below. We review and accept collections of ${MAX_BOUTIQUE_COLLECTION_SIZE} or fewer NFTs.`}
        isShowing={submitCollectionModalShown}
        maxNFTs={MAX_BOUTIQUE_COLLECTION_SIZE}
        close={() => setSubmitCollectionModalShown(false)}
        submitCollection={(
          collectionAddress,
          mintList,
          collectionName,
          slug,
          twitterURL,
          discordURL,
          webURL
        ) => {
          return submitCollection(
            collectionAddress,
            mintList,
            collectionName,
            slug,
            twitterURL,
            discordURL,
            webURL
          );
        }}
      />
    </Layout>
  );
};

export default IndexPage;
