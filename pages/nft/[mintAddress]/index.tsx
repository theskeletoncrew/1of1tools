import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { OneOfOneToolsClient } from "api-client";
import {
  NFTMetadata,
  NFTMetadataOnChain,
  NFTMetadataOffChain,
} from "models/nftMetadata";
import { NFTEvent } from "models/nftEvent";
import { shortenedAddress, tryPublicKey } from "utils";
import { clusterApiUrl, network } from "utils/network";
import { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
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
import { useRouter } from "next/router";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import { toast } from "react-hot-toast";
import NotificationSubscriptionModal from "components/NotificationSubscriptionModal/NotificationSubscriptionModal";
import { BellAlertIcon } from "@heroicons/react/24/outline";

const EVENTS_PER_PAGE = 25;

const NFTPage: NextPage = () => {
  const [isLoading, setLoading] = useState(false);

  const router = useRouter();
  const mintAddress = router.query.mintAddress as string;

  const [events, setEvents] = useState<NFTEvent[]>();
  const [onChainData, setOnChainData] = useState<NFTMetadataOnChain>();
  const [offChainData, setOffChainData] = useState<NFTMetadataOffChain>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [eventsPaginationToken, setEventsPaginationToken] = useState<
    PaginationToken | undefined
  >();
  const [hasMore, setHasMore] = useState(true);

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
      mintAddress,
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
    const more = token != undefined;

    setEvents((events) =>
      isFirstLoad ? result.events : (events ?? []).concat(result.events)
    );
    setEventsPaginationToken(token);
    setHasMore(more);
  };

  const setupNotifications = async () => {
    if (!session) {
      toast.error("Your session expired. Please login and try again.");
      return;
    }

    setIsShowingNotificationsModal(true);
  };

  const saveNotificationSettings = async (
    formfunctionNotifications: boolean,
    exchangeArtNotifications: boolean,
    dialectAddress: string | undefined
  ) => {
    if (!mintAddress || !session?.user?.name) {
      return;
    }

    setFormfunctionNotifications(formfunctionNotifications);
    setExchangeArtNotifications(exchangeArtNotifications);
    setDialectAddress(dialectAddress);

    setIsShowingNotificationsModal(false);

    const result =
      await OneOfOneToolsClient.setNftNotificationSubscriptionSettings(
        mintAddress,
        dialectAddress ?? session.user.name,
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
        await OneOfOneToolsClient.nftNotificationSubscriptionSettings(
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
    if (session?.user?.name && mintAddress) {
      loadNotificationSettings(mintAddress, session.user.name);
    }
  }, [session, mintAddress]);

  useEffect(() => {
    const loadNFTData = async (address: string) => {
      try {
        let nftMetadata: NFTMetadata | null = null;

        const maxRetries = 1;
        for (let i = 0; i <= maxRetries; i++) {
          let metadataRes = await OneOfOneToolsClient.nfts([address], true);
          if (metadataRes.isErr()) {
            console.log(metadataRes.error.message);
            setErrorMessage("Failed to load NFT.");
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

        if (
          !nftMetadata ||
          !nftMetadata.onChainData ||
          !nftMetadata.offChainData
        ) {
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

        setOnChainData(nftMetadata.onChainData);
        setOffChainData(nftMetadata.offChainData);
      } catch (error) {
        console.log(error);
        setErrorMessage(
          (error as Error) ? (error as Error).message : undefined
        );
      }
    };

    if (mintAddress && !isLoading) {
      setEvents(undefined);
      setLoading(true);
      loadNFTData(mintAddress).then(() => {
        getMoreEvents(true).then(() => {
          setLoading(false);
        });
      });
    }
  }, [mintAddress]);

  if (!isLoading && errorMessage) {
    return <ErrorPage message={errorMessage} />;
  } else {
    const title = `one / one tools${
      " - " + offChainData?.name + ": " + onChainData?.mint
    }`;
    const desc = title;

    return (
      <Layout>
        <div>
          <Head>
            <title>{title}</title>
            <meta name="description" content={desc} />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <div className="mt-4">
            <Header
              title={isLoading ? "Loading..." : offChainData?.name ?? ""}
              subtitle={offChainData?.description}
            />

            {session && session.user?.name && didLoadNotificationSettings && (
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
                    (offChainData?.attributes ?? []).length > 0 && (
                      <div className="mb-4">
                        <NFTAttributesTable
                          attributes={offChainData?.attributes ?? []}
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
                        onChainData={onChainData}
                        offChainData={offChainData}
                        collectionNft={collectionNft}
                        parentNft={parentNft}
                        owner={owner}
                      />
                    )}
                  </div>

                  {session?.user?.name == owner && wallet && nft && (
                    <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                      <NFTOwnerControls
                        nft={nft}
                        wallet={wallet}
                        imageUrl={offChainData?.image ?? ""}
                      />
                    </div>
                  )}

                  {onChainData &&
                    session?.user?.name == onChainData.updateAuthority &&
                    wallet &&
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
        {mintAddress && (
          <NotificationSubscriptionModal
            prompt={`Get notified about events affecting ${shortenedAddress(
              mintAddress
            )} on the
          following exchanges:`}
            isShowing={isShowingNotificationsModal}
            close={() => setIsShowingNotificationsModal(false)}
            formfunctionNotifications={formfunctionNotifications}
            exchangeArtNotifications={exchangeArtNotifications}
            dialectAddress={dialectAddress}
            saveNotificationSettings={(
              formfunctionNotifications,
              exchangeArtNotifications,
              dialectAddress
            ) => {
              saveNotificationSettings(
                formfunctionNotifications,
                exchangeArtNotifications,
                dialectAddress
              );
            }}
          />
        )}
      </Layout>
    );
  }
};

export default NFTPage;
