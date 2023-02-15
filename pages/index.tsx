import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { NftsByAddressForm } from "components/Forms/NftsByAddress";
import { NftsByCreatorForm } from "components/Forms/NftsByCreator";
import { NftsByWalletOwnerForm } from "components/Forms/NftsByWalletOwner";
import { NftsByCollectionForm } from "components/Forms/NftsByCollection";
import Layout from "components/Layout/Layout";
import type SwiperCore from "swiper";
import { Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "styles/Index.module.css";
import Link from "next/link";
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Collection } from "models/collection";
import { OneOfOneToolsClient } from "api-client";
import { classNames } from "utils";
import { OneOfOneNFTEvent } from "models/nftEvent";
import { humanReadableEventShort } from "utils/helius";
import { NFTMetadata } from "models/nftMetadata";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { LazyLoadingImage } from "components/LoadingImage/LoadingImage";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

enum SearchTab {
  creator,
  addresses,
  wallet,
  collection,
}

const tabsMap: Map<SearchTab, string> = new Map([
  [SearchTab.addresses, "Address"],
  [SearchTab.creator, "Creator"],
  [SearchTab.wallet, "Owner"],
  [SearchTab.collection, "Collection"],
]);

const Home: NextPage = () => {
  const [currentTab, setCurrentTab] = useState<SearchTab>(SearchTab.addresses);
  const [isLoading, setLoading] = useState(false);
  const [boutiqueCollections, setBoutiqueCollections] =
    useState<Collection[]>();
  const [latestBoutiqueEvents, setLatestBoutiqueEvents] =
    useState<OneOfOneNFTEvent[]>();
  const [latestBoutiqueEventsMetadata, setLatestBoutiqueEventsMetadata] =
    useState<NFTMetadata[]>();

  const boutiqueSwiperRef = useRef<SwiperCore>();
  const boutiqueEventsSwiperRef = useRef<SwiperCore>();

  useEffect(() => {
    const loadBoutiqueCollections = async () => {
      const collectionsRes = await OneOfOneToolsClient.boutiqueCollections({
        limit: 8,
      });
      if (collectionsRes.isOk()) {
        setBoutiqueCollections(collectionsRes.value);
      }
    };
    const loadLatestEvents = async () => {
      const eventsRes = await OneOfOneToolsClient.latestBoutiqueEvents({
        limit: 8,
      });
      if (eventsRes.isOk()) {
        setLatestBoutiqueEvents(eventsRes.value.events);
        setLatestBoutiqueEventsMetadata(eventsRes.value.nfts);
      }
    };
    if (!isLoading) {
      setLoading(true);
      Promise.all([loadBoutiqueCollections(), loadLatestEvents()]).then(() => {
        setLoading(false);
      });
    }
  }, []);

  const title = `1of1.tools | Utilities for 1/1 Artists and NFT Collectors`;
  const url = `https://1of1.tools`;
  const description = `View 1/1 Collections, their aggregated nft listings, owner information, historical activity, and all-time high sales across all marketplaces.`;
  const featuredImageURL =
    "https://1of1.tools/images/1of1tools-boutique-collections.png";

  return (
    <Layout isHome={true}>
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

      <div className="mx-auto w-[75vw]">
        <div className="max-w-[600px] mx-auto">
          <div className="mt-12 flex flex-col sm:flex-row items-center sm:items-start justify-between">
            <h1 className="text-slate-400">Search for NFTs:</h1>
            <ul className="flex gap-6">
              {[...tabsMap.entries()].map(([tabType, tabName]) => (
                <li key={tabName}>
                  <a
                    href="#"
                    onClick={() => setCurrentTab(tabType)}
                    className={
                      tabType == currentTab
                        ? "underline text-indigo-400"
                        : "text-indigo-500"
                    }
                  >
                    {tabName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2 h-[300px]">
            <ul className="bg-white bg-opacity-5 text-white rounded-lg overflow-hidden">
              <li
                className={classNames(
                  currentTab == SearchTab.creator ? "" : "hidden"
                )}
              >
                <NftsByCreatorForm />
              </li>
              <li
                className={classNames(
                  currentTab == SearchTab.addresses ? "" : "hidden"
                )}
              >
                <NftsByAddressForm />
              </li>
              <li
                className={classNames(
                  currentTab == SearchTab.wallet ? "" : "hidden"
                )}
              >
                <NftsByWalletOwnerForm />
              </li>
              <li
                className={classNames(
                  currentTab == SearchTab.collection ? "" : "hidden"
                )}
              >
                <NftsByCollectionForm />
              </li>
            </ul>
          </div>
        </div>
        <div className={`mt-10 ${styles.homeRow}`}>
          <div className="flex justify-between items-center">
            <h5 className={styles.rowTitle}>
              <span className="hidden sm:inline">Popular </span>Boutique
              Collections
            </h5>
            <Link href="/boutique">
              <a>See All</a>
            </Link>
          </div>
          <Swiper
            slidesPerView={2}
            slidesPerGroup={2}
            spaceBetween={15}
            onBeforeInit={(swiper) => {
              boutiqueSwiperRef.current = swiper;
            }}
            modules={[Navigation]}
            breakpoints={{
              640: {
                slidesPerView: 3,
                slidesPerGroup: 3,
              },
              768: {
                slidesPerView: 4,
                slidesPerGroup: 4,
              },
              1024: {
                slidesPerView: 5,
                slidesPerGroup: 5,
              },
              1280: {
                slidesPerView: 6,
                slidesPerGroup: 6,
              },
            }}
            className="h-full"
          >
            {isLoading ? (
              <>
                {[...Array(6).keys()].map((i) => (
                  <SwiperSlide key={`boutique-collection-loading-${i}`}>
                    <div className={`${styles.rowDrop} animate-pulse`}>
                      <div className={`${styles.dropImageWrapper}`}></div>
                      <span className={styles.rowDropDescription}>
                        <h5
                          className={`bg-slate-600 bg-opacity-25 mx-auto my-2 w-3/4 h-[20px]`}
                        ></h5>
                      </span>
                    </div>
                  </SwiperSlide>
                ))}
              </>
            ) : (
              <>
                {boutiqueCollections?.map((collection) => {
                  const imgURL = collection.imageURL
                    ? `/api/assets/collection/${
                        collection.slug
                      }/640?originalURL=${encodeURIComponent(
                        collection.imageURL
                      )}`
                    : "";
                  return (
                    <SwiperSlide key={`boutique-collection-${collection.slug}`}>
                      <div className={styles.rowDrop}>
                        <Link href={`/boutique/${collection.slug}`}>
                          <a className={`${styles.rowDropImageWrapper} group`}>
                            {collection.imageURL && (
                              <div className={styles.dropImageWrapper}>
                                <LazyLoadingImage
                                  src={imgURL}
                                  loader={
                                    <div
                                      className={`${styles.dropImage} w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs animate-pulse`}
                                      data-url={imgURL}
                                    ></div>
                                  }
                                  unloader={
                                    <div
                                      className={`${styles.dropImage} flex flex-col gap-2 justify-center items-center w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs`}
                                    >
                                      <ExclamationCircleIcon className="w-8 h-8" />
                                      <span>Image Unavailable</span>
                                    </div>
                                  }
                                  alt={collection.name}
                                  data-orig-url={collection.imageURL}
                                  className={`${styles.dropImage} group-hover:scale-125 transition-transform duration-300`}
                                />
                              </div>
                            )}
                            <span className={styles.rowDropDescription}>
                              <h5 className={styles.rowDropTitle}>
                                {collection.name}
                              </h5>
                              <p> </p>
                            </span>
                          </a>
                        </Link>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </>
            )}
          </Swiper>
          <div
            onClick={() => boutiqueSwiperRef.current?.slidePrev()}
            className={`${styles.rowDropNav} ${styles.rowDropNavPrev}`}
          >
            <ArrowLeftCircleIcon />
          </div>
          <div
            onClick={() => boutiqueSwiperRef.current?.slideNext()}
            className={`${styles.rowDropNav} ${styles.rowDropNavNext}`}
          >
            <ArrowRightCircleIcon />
          </div>
        </div>

        <div className={`mt-10 ${styles.homeRow}`}>
          <h5 className={styles.rowTitle}>Latest Boutique Activity</h5>
          <Swiper
            slidesPerView={2}
            slidesPerGroup={2}
            spaceBetween={15}
            onBeforeInit={(swiper) => {
              boutiqueEventsSwiperRef.current = swiper;
            }}
            modules={[Navigation]}
            breakpoints={{
              640: {
                slidesPerView: 3,
                slidesPerGroup: 3,
              },
              768: {
                slidesPerView: 4,
                slidesPerGroup: 4,
              },
              1024: {
                slidesPerView: 5,
                slidesPerGroup: 5,
              },
              1280: {
                slidesPerView: 6,
                slidesPerGroup: 6,
              },
            }}
            className="h-full"
          >
            {isLoading ? (
              <>
                {[...Array(6).keys()].map((i) => (
                  <SwiperSlide key={`boutique-events-loading-${i}`}>
                    <div className={`${styles.rowDrop} animate-pulse`}>
                      <div className={`${styles.dropImageWrapper}`}></div>
                      <span className={styles.rowDropDescription}>
                        <h5
                          className={`bg-slate-600 bg-opacity-25 mx-auto my-2 w-3/4 h-[20px]`}
                        ></h5>
                        <p
                          className={`bg-slate-600 bg-opacity-25 mx-auto w-1/2 h-[16px]`}
                        ></p>
                      </span>
                    </div>
                  </SwiperSlide>
                ))}
              </>
            ) : (
              <>
                {latestBoutiqueEvents?.map((event, i) => {
                  const metadata = latestBoutiqueEventsMetadata?.find(
                    (m) => m.mint === event.mint
                  );
                  const imgURL = metadata?.offChainData?.image
                    ? `/api/assets/nft/${
                        event.mint
                      }/640?originalURL=${encodeURIComponent(
                        metadata.offChainData.image
                      )}`
                    : "";

                  return (
                    <SwiperSlide key={`activity-${event.signature}`}>
                      <div className={styles.rowDrop}>
                        <Link href={`/nft/${event.mint}`}>
                          <a className={`${styles.rowDropImageWrapper} group`}>
                            <div className={styles.dropImageWrapper}>
                              <LazyLoadingImage
                                src={imgURL}
                                loader={
                                  <div
                                    className={`${styles.dropImage} w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs animate-pulse`}
                                    data-url={imgURL}
                                  ></div>
                                }
                                unloader={
                                  <div
                                    className={`${styles.dropImage} flex flex-col gap-2 justify-center items-center w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs`}
                                  >
                                    <ExclamationCircleIcon className="w-8 h-8" />
                                    <span>Image Unavailable</span>
                                  </div>
                                }
                                alt={event.description}
                                data-orig-url={
                                  metadata?.offChainData?.image ?? ""
                                }
                                className={`${styles.dropImage} group-hover:scale-125 transition-transform duration-300`}
                              />
                            </div>
                            <span className={styles.rowDropDescriptionLong}>
                              <h5 className={styles.rowDropTitleLong}>
                                {humanReadableEventShort(event)}
                              </h5>
                              <span>
                                {dayjs(event.timestamp * 1000).toNow(true)} ago
                              </span>
                            </span>
                          </a>
                        </Link>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </>
            )}
          </Swiper>
          <div
            onClick={() => boutiqueEventsSwiperRef.current?.slidePrev()}
            className={`${styles.rowDropNav} ${styles.rowDropNavPrev}`}
          >
            <ArrowLeftCircleIcon />
          </div>
          <div
            onClick={() => boutiqueEventsSwiperRef.current?.slideNext()}
            className={`${styles.rowDropNav} ${styles.rowDropNavNext}`}
          >
            <ArrowRightCircleIcon />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
