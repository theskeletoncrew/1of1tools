import type { NextPage } from "next";
import Head from "next/head";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import CollectionIndexGrid, {
  ViewType,
} from "components/CollectionIndexGrid/CollectionIndexGrid";
import { Collection } from "models/collection";
import { useEffect, useState } from "react";
import { OneOfOneToolsClient } from "api-client";
import { toast } from "react-hot-toast";
import { classNames, tryPublicKey } from "utils";
import { Connection, PublicKey } from "@solana/web3.js";
import { clusterApiUrl, network } from "utils/network";
import { Metaplex, Nft } from "@metaplex-foundation/js";
import { COLLECTIONS_PER_PAGE } from "utils/config";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import BoutiqueCollectionsModal from "components/BoutiqueCollectionModal/BoutiqueCollectionModal";
import CollectionSort, {
  CollectionSortType,
} from "components/CollectionSort/CollectionSort";
import { Bars3Icon, Squares2X2Icon } from "@heroicons/react/24/outline";

const MAX_BOUTIQUE_COLLECTION_SIZE = 250;

const IndexPage: NextPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string>();
  const [hasMore, setHasMore] = useState(true);
  const [submitCollectionModalShown, setSubmitCollectionModalShown] =
    useState(false);
  const [sort, setSort] = useState<CollectionSortType>(
    CollectionSortType.TOTAL_VOLUME_DESC
  );
  const [view, setView] = useState<ViewType>(ViewType.Grid);

  const getMoreBoutiqueCollections = async (
    chosenSort: CollectionSortType | undefined,
    providedCursor: string | undefined = undefined
  ) => {
    if (isLoading) {
      return;
    }

    setLoading(true);

    const collectionsRes = await OneOfOneToolsClient.boutiqueCollections({
      sort: chosenSort,
      cursor: providedCursor,
      limit: COLLECTIONS_PER_PAGE,
    });

    if (collectionsRes.isErr()) {
      return;
    }

    const retCollections = collectionsRes.value;

    if (!providedCursor) {
      setCollections(retCollections);
    } else {
      setCollections((prevCollections) => [
        ...prevCollections,
        ...retCollections.filter(
          (c) => prevCollections.find((c2) => c2.slug === c.slug) === undefined
        ),
      ]);
    }

    setHasMore(retCollections.length >= COLLECTIONS_PER_PAGE);

    const lastCollection = retCollections.pop();
    if (lastCollection) {
      setCursor(lastCollection.slug);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      getMoreBoutiqueCollections(sort).then(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getMoreBoutiqueCollections(sort).then(() => {
      setLoading(false);
    });
  }, [sort]);

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

    if (mintList) {
      const firstInvalidMint = mintList.find((m) => tryPublicKey(m) === null);
      if (firstInvalidMint !== undefined) {
        toast.error(
          "Your mint list contains one or more invalid addresses: " +
            firstInvalidMint
        );
        return false;
      }
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
      nameLowercase: collectionName?.toLowerCase(),
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

  const title = `1of1.tools | Boutique NFT Collection Listings`;
  const url = `https://1of1.tools/boutique`;
  const description = `View Boutique Collections and their aggregated nft listings, owner information, historical activity, and all-time high sales across all marketplaces.`;
  const featuredImageURL =
    "https://1of1.tools/images/1of1tools-boutique-collections.png";

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
          <meta name="twitter:image" content={featuredImageURL} />
        </Head>

        <div className="mt-4">
          <Header
            title="Boutique Collections"
            right={
              <a
                href="#"
                onClick={openSubmitCollection}
                className="hidden sm:inline border border-1 border-indigo-600 bg-indigo-800 text-white rounded-xl px-6 py-3 hover:bg-indigo-600 hover:text-white"
              >
                Submit a Collection
              </a>
            }
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="hidden md:block pl-5 text-indigo-400 text-base">
            Hyped collections of {MAX_BOUTIQUE_COLLECTION_SIZE} NFTs or less
          </h3>
          <div className="flex gap-3 items-center h-[40px] justify-between w-full md:w-auto md:justify-end">
            <div className="h-full order-1 md:order-0">
              <CollectionSort
                sort={sort}
                didChangeSort={(newSort) => {
                  setSort(newSort);
                }}
              />
            </div>
            <div className="sm:mr-3 border border-1 text-indigo-600 border-indigo-600 h-full rounded-lg flex gap-0 items-center justify-center order-0 md:order-1">
              <button className="px-4" onClick={() => setView(ViewType.Grid)}>
                <Squares2X2Icon
                  className={classNames(
                    "w-5 h-5",
                    view === ViewType.Grid ? "text-indigo-400" : ""
                  )}
                />
              </button>
              <button
                className="py-2 px-4 border-l border-indigo-600"
                onClick={() => setView(ViewType.List)}
              >
                <Bars3Icon
                  className={classNames(
                    "w-5 h-5",
                    view === ViewType.List ? "text-indigo-400" : ""
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingGrid className="mt-8 mx-1 gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6" />
          ) : collections.length > 0 ? (
            <InfiniteScroll
              dataLength={collections.length}
              next={() => getMoreBoutiqueCollections(sort, cursor)}
              hasMore={hasMore}
              loader={<LoadingIndicator />}
              endMessage={""}
            >
              <CollectionIndexGrid
                items={collections}
                sort={sort}
                updateSort={(newSort) => {
                  setSort(newSort);
                }}
                view={view}
              />
            </InfiniteScroll>
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
