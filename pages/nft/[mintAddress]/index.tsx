import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { OneOfOneToolsClient } from "api-client";
import { NFTAttribute, NFTMetadata } from "models/nftMetadata";
import { NFTEvent } from "models/nftEvent";
import { shortenedAddress, tryPublicKey } from "utils";
import { clusterApiUrl, network } from "utils/network";
import {
  Connection,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import {
  isNft,
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
} from "@metaplex-foundation/js";
import { useEffect, useState } from "react";
import { PaginationToken } from "models/paginationToken";
import Header from "components/Header/Header";
import ErrorPage from "components/ErrorPage/ErrorPage";
import Layout from "components/Layout/Layout";
import EventsTable from "components/EventsTable/EventsTable";
import NFTAttributesTable from "components/NFTAttributesTable/NFTAttributesTable";
import NFTDetailsTable from "components/NFTDetailsTable/NFTDetailsTable";
import { useSession } from "next-auth/react";
import NFTOwnerControls from "components/NFTOwnerControls/NFTOwnerControls";
import NFTCreatorControls from "components/NFTCreatorControls/NFTCreatorControls";
import { useWallet } from "@solana/wallet-adapter-react";
import NFTDisplay from "components/NFTDisplay/NFTDisplay";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import { toast } from "react-hot-toast";
import NotificationSubscriptionModal from "components/NotificationSubscriptionModal/NotificationSubscriptionModal";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { NFTListings } from "models/nftListings";
import Link from "next/link";
import { humanReadableSource, urlForSource } from "utils/helius";

const EVENTS_PER_PAGE = 25;

interface Props {
  nftMetadata: NFTMetadata;
  cachedImage: string | null;
  isImported: boolean;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const mintAddress = context.query.mintAddress as string;
  const i = context.query.i as string;
  const isImported = i === "1" ? true : false;

  try {
    let nftMetadata: NFTMetadata | null = null;
    let cachedImage: string | null = null;

    if (isImported) {
      let importedRes = await OneOfOneToolsClient.cachedNfts([mintAddress]);
      if (importedRes.isOk()) {
        const metadata = importedRes.value[0]!;
        cachedImage = metadata.cachedImage ?? metadata.image;
      }
    }

    const maxRetries = 1;
    for (let i = 0; i <= maxRetries; i++) {
      let metadataRes = await OneOfOneToolsClient.nfts([mintAddress]);

      if (metadataRes.isErr()) {
        throw new Error("Unable to load NFT: " + metadataRes.error.message);
      }

      nftMetadata = metadataRes.value[0] ?? null;
      if (
        (!nftMetadata ||
          !nftMetadata.onChainData ||
          !nftMetadata.offChainData) &&
        i < maxRetries
      ) {
        continue;
      }
      break;
    }

    if (!nftMetadata || !nftMetadata.onChainData || !nftMetadata.offChainData) {
      throw new Error("Metadata unavailable");
    }

    // if (
    //   nftMetadata.onChainData.tokenStandard &&
    //   nftMetadata.onChainData.tokenStandard != "NonFungible" &&
    //   nftMetadata.onChainData.tokenStandard != "NonFungibleEdition"
    // ) {
    //   throw new Error(
    //     "Unexpected token type: " + nftMetadata.onChainData.tokenStandard
    //   );
    // }

    return { props: { nftMetadata, cachedImage, isImported } };
  } catch (error) {
    console.log(error);
    return {
      redirect: {
        destination:
          "/error?msg=" +
          encodeURIComponent((error as Error) ? (error as Error).message : ""),
        permanent: false,
      },
    };
  }
};

const NFTPage: NextPage<Props> = ({ nftMetadata, cachedImage, isImported }) => {
  const onChainData = nftMetadata.onChainData!;
  const offChainData = nftMetadata.offChainData!;

  const [isLoading, setLoading] = useState(false);
  const [events, setEvents] = useState<NFTEvent[]>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [eventsPaginationToken, setEventsPaginationToken] = useState<
    PaginationToken | undefined
  >();
  const [hasMore, setHasMore] = useState(true);

  const [isLoadingListing, setLoadingListing] = useState(true);
  const [listing, setListing] = useState<NFTListings>();

  const [nft, setNft] = useState<Nft | Sft | SftWithToken | NftWithToken>();
  const [parentNft, setParentNft] = useState<Nft>();
  const [collectionNft, setCollectionNft] = useState<Nft>();
  const [owner, setOwner] = useState<string>();
  const { data: session } = useSession();
  const wallet = useWallet();

  const [isShowingNotificationsModal, setIsShowingNotificationsModal] =
    useState(false);
  const [didLoadNotificationSettings, setDidLoadNotificationSettings] =
    useState(false);
  const [formfunctionNotifications, setFormfunctionNotifications] =
    useState(false);
  const [exchangeArtNotifications, setExchangeArtNotifications] =
    useState(false);
  const [dialectAddress, setDialectAddress] = useState<string>();

  useEffect(() => {
    const loadExtendedData = async (address: string) => {
      const publicKey = tryPublicKey(address);

      if (publicKey) {
        const endpoint = clusterApiUrl(network);
        const connection = new Connection(endpoint);
        const mx = Metaplex.make(connection);
        const nft = await mx.nfts().findByMint({ mintAddress: publicKey });

        // if (!isNft(nft)) {
        //   return;
        // }

        setNft(nft);

        if (isNft(nft) && !nft.edition.isOriginal) {
          // const parentNft = (await mx.nfts().findByMetadata({
          //   mintAddress: nft.edition.parent,
          // })) as Nft;
          // setParentNft(parentNft);
          // console.log(parentNft);
        }

        if (nft.collection) {
          const collectionNft = await mx
            .nfts()
            .findByMint({ mintAddress: nft.collection?.address });
          setCollectionNft(collectionNft as Nft);
        }

        const largestAccounts = await connection.getTokenLargestAccounts(
          new PublicKey(address)
        );
        const largetAccountAddress = largestAccounts?.value[0]?.address;
        if (largetAccountAddress) {
          const largestAccountInfo = await connection.getParsedAccountInfo(
            largetAccountAddress
          );
          setOwner(
            (largestAccountInfo.value?.data as ParsedAccountData).parsed.info
              .owner ?? undefined
          );
        }
      }
    };
    if (onChainData) {
      loadExtendedData(onChainData.mint);
    } else {
      setNft(undefined);
      setParentNft(undefined);
      setCollectionNft(undefined);
    }
  }, [onChainData]);

  const getMoreEvents = async (isFirstLoad: boolean = false) => {
    const eventsRes = await OneOfOneToolsClient.events(
      nftMetadata.mint,
      isImported,
      EVENTS_PER_PAGE,
      eventsPaginationToken
    );

    if (eventsRes.isErr()) {
      toast.error(eventsRes.error.message);
      return;
    }

    const result = eventsRes.value;

    const token: PaginationToken | undefined =
      result.paginationToken && result.paginationToken.length > 0
        ? result.paginationToken
        : undefined;
    const more = token !== undefined;

    setEvents((events) =>
      isFirstLoad ? result.events : (events ?? []).concat(result.events)
    );
    setEventsPaginationToken(token);
    setHasMore(more);
  };

  const loadListings = async () => {
    const firstVerifiedCreator = onChainData.data.creators
      .find((c) => c.verified)
      ?.address?.toString();
    if (!firstVerifiedCreator) {
      console.log("could not determine first verified creator");
      return;
    }

    const listingsRes = await OneOfOneToolsClient.activeListingNFT(
      nftMetadata.mint,
      firstVerifiedCreator
    );

    if (listingsRes.isErr()) {
      toast.error(listingsRes.error.message);
      return;
    }

    const result = listingsRes.value;

    setListing(result);
  };

  const setupNotifications = async () => {
    if (!session) {
      toast.error("Your session expired. Please login and try again.");
      return;
    }

    setIsShowingNotificationsModal(true);
  };

  const saveNotificationSettings = async (
    dialectAddress: string | undefined,
    formfunctionNotifications: boolean | undefined,
    exchangeArtNotifications: boolean | undefined
  ) => {
    if (
      !nftMetadata.mint ||
      !session?.user?.id ||
      formfunctionNotifications === undefined ||
      exchangeArtNotifications === undefined
    ) {
      return;
    }

    setFormfunctionNotifications(formfunctionNotifications);
    setExchangeArtNotifications(exchangeArtNotifications);
    setDialectAddress(dialectAddress);

    setIsShowingNotificationsModal(false);

    const result =
      await OneOfOneToolsClient.setDialectNftNotificationSubscriptionSettings(
        nftMetadata.mint,
        dialectAddress ?? session.user.id,
        formfunctionNotifications,
        exchangeArtNotifications
      );
    if (result.isOk()) {
      toast.success("Notification preferences saved.");
    } else {
      toast.error(
        "Notification preferences failed to save: " + result.error.message
      );
    }
  };

  useEffect(() => {
    const loadNotificationSettings = async (
      mintAddress: string,
      subscriberAddress: string
    ) => {
      const result =
        await OneOfOneToolsClient.dialectNFTNotificationSubscriptionSettings(
          mintAddress
        );
      if (result.isOk()) {
        setFormfunctionNotifications(
          result.value?.exchangeArtNotifications ?? false
        );
        setExchangeArtNotifications(
          result.value?.exchangeArtNotifications ?? false
        );
        setDialectAddress(result.value?.deliveryAddress ?? subscriberAddress);
        setDidLoadNotificationSettings(true);
      } else {
        toast.error(result.error.message);
      }
    };
    if (session?.user?.id && nftMetadata.mint) {
      loadNotificationSettings(nftMetadata.mint, session.user.id);
    }
  }, [session, nftMetadata.mint]);

  useEffect(() => {
    setLoading(true);
    getMoreEvents(true).then(() => {
      setLoading(false);
    });
    loadListings().then(() => {
      setLoadingListing(false);
    });
  }, []);

  if (!isLoading && errorMessage) {
    return <ErrorPage message={errorMessage} />;
  } else {
    const title = `1of1.tools - ${offChainData.name}: ${onChainData.mint}`;
    const url = `https://1of1.tools/nft/${nftMetadata.mint}`;
    const description = `View ${offChainData.name} aggregated nft listings, owner information, and historical activity across all marketplaces.`;
    const featuredImageURL = cachedImage
      ? cachedImage
      : offChainData.image
      ? `https://1of1.tools/api/assets/nft/${
          nftMetadata.mint
        }/640?originalURL=${encodeURIComponent(offChainData.image)}`
      : "https://1of1.tools/images/1of1tools-boutique-collections.png";

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
            <meta property="og:image" content={featuredImageURL} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={featuredImageURL} />
          </Head>

          <div className="mt-4">
            <Header
              title={offChainData.name}
              subtitle={offChainData.description}
            />

            {session && session.user?.id && didLoadNotificationSettings && (
              <>
                <a
                  href="#"
                  onClick={setupNotifications}
                  className="mt-2 float-right flex gap-1 items-center ml-auto mr-1 text-sky-300"
                >
                  <BellAlertIcon className="w-5 h-5" />
                  <span>Notify Me</span>
                </a>
                <div className="clear-both" />
              </>
            )}

            <div className="p-1 mt-4 md:mt-8">
              <div className="flex flex-col gap-6 md:p-0 md:flex-row md:gap-10">
                <div className="w-full md:w-2/5 xl:w-1/2">
                  {isLoading ? (
                    <div className="flex flex-col gap-2 justify-center items-center w-full h-[400px] rounded-xl bg-indigo-500 bg-opacity-10 text-xs animate-pulse">
                      <span>Loading...</span>
                    </div>
                  ) : (
                    nft && <NFTDisplay nft={nft} />
                  )}
                </div>
                <div className="w-full md:w-3/5 xl:w-1/2">
                  {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {[...Array(9)].map((attribute, i) => (
                        <div
                          key={i}
                          className="px-4 pt-2 pb-3 rounded-lg bg-white bg-opacity-5 text-center focus:outline-none min-h-[70px]"
                        >
                          <span className="relative"></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    (offChainData.attributes ?? []).length > 0 && (
                      <div className="mb-4">
                        <NFTAttributesTable
                          attributes={offChainData.attributes ?? []}
                        />
                      </div>
                    )
                  )}
                  <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                    {isLoading || !onChainData || !offChainData ? (
                      <div className="min-h-[100px]" />
                    ) : (
                      <NFTDetailsTable
                        nft={nft}
                        collectionNft={collectionNft}
                        parentNft={parentNft}
                        owner={owner}
                        sellerFeeBasisPoints={offChainData.sellerFeeBasisPoints}
                        mintAddress={onChainData.mint}
                        updateAuthority={onChainData.updateAuthority}
                        collectionAddress={onChainData.collection?.key}
                        isMutable={onChainData.isMutable}
                      />
                    )}
                  </div>

                  {isLoadingListing ? (
                    <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                      <div className="min-h-[100px]" />
                    </div>
                  ) : (
                    listing && (
                      <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                        <div className="flex gap-4 items-center justify-between">
                          <div>
                            <label className=" text-indigo-500 text-sm">
                              LISTED
                            </label>
                            <div className="flex gap-2 items-center text-3xl">
                              <span>
                                {(listing.activeListings[0]?.amount ?? 0) /
                                  LAMPORTS_PER_SOL}
                              </span>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <use href="#solana-icon"></use>
                              </svg>
                            </div>
                          </div>
                          <Link
                            href={
                              urlForSource(
                                listing.activeListings[0]!.marketplace,
                                listing.mint
                              ) ?? "#"
                            }
                          >
                            <a target="_blank" rel="noreferrer">
                              <button className="button">
                                View on{" "}
                                {humanReadableSource(
                                  listing.activeListings[0]!.marketplace
                                )}
                              </button>
                            </a>
                          </Link>
                        </div>
                      </div>
                    )
                  )}

                  {wallet && wallet.publicKey?.toString() == owner && nft && (
                    <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                      <NFTOwnerControls
                        nft={nft}
                        wallet={wallet}
                        imageUrl={offChainData.image ?? ""}
                      />
                    </div>
                  )}

                  {onChainData &&
                    wallet &&
                    wallet.publicKey?.toString() ==
                      onChainData.updateAuthority &&
                    nft && (
                      <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                        <NFTCreatorControls
                          nftAddress={nft.address.toString()}
                        />
                      </div>
                    )}
                </div>
              </div>

              {events && events.length > 0 ? (
                <InfiniteScroll
                  dataLength={events.length}
                  next={getMoreEvents}
                  hasMore={hasMore}
                  loader={<LoadingIndicator />}
                  endMessage={""}
                >
                  <EventsTable events={events} />
                </InfiniteScroll>
              ) : isLoading ? (
                <LoadingIndicator />
              ) : (
                <EventsTable events={[]} />
              )}
            </div>
          </div>
        </div>
        <NotificationSubscriptionModal
          prompt={`Get notified about events affecting ${shortenedAddress(
            nftMetadata.mint
          )} on the
          following exchanges:`}
          isShowing={isShowingNotificationsModal}
          close={() => setIsShowingNotificationsModal(false)}
          formfunctionNotifications={formfunctionNotifications}
          exchangeArtNotifications={exchangeArtNotifications}
          dialectAddress={dialectAddress}
          saveNotificationSettings={(
            dialectAddress,
            discordSubscriptions, // note we are intentionally ignoring here - creator only for now
            formfunctionNotifications,
            exchangeArtNotifications
          ) => {
            saveNotificationSettings(
              dialectAddress,
              formfunctionNotifications,
              exchangeArtNotifications
            );
          }}
        />
      </Layout>
    );
  }
};

export default NFTPage;
