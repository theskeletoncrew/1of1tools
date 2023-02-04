import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { NftsByAddressForm } from "components/Forms/NftsByAddress";
import { NftsByCreatorForm } from "components/Forms/NftsByCreator";
import { NftsByWalletOwnerForm } from "components/Forms/NftsByWalletOwner";
import { NftsByCollectionForm } from "components/Forms/NftsByCollection";
import Layout from "components/Layout/Layout";
import AuthenticationRow from "components/AuthenticationRow/AuthenticationRow";
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
} from "@heroicons/react/24/outline";
import { Collection } from "models/collection";
import { OneOfOneToolsClient } from "api-client";
import { classNames } from "utils";

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

  const swiperRefs = useRef<SwiperCore[]>([]);

  useEffect(() => {
    const loadBoutiqueCollections = async () => {
      const collectionsRes = await OneOfOneToolsClient.boutiqueCollections(
        null,
        8
      );
      if (collectionsRes.isOk()) {
        setBoutiqueCollections(collectionsRes.value);
      }
    };
    if (!isLoading) {
      setLoading(true);
      loadBoutiqueCollections().then(() => {
        setLoading(false);
      });
    }
  }, []);

  return (
    <Layout isHome={true}>
      <Head>
        <title>one / one</title>
        <meta name="description" content="one / one tools" />
        <link rel="icon" href="/favicon.ico" />
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
            <h5 className={styles.rowTitle}>Popular Boutique Collections</h5>
            <a href="/boutique">See All</a>
          </div>
          <Swiper
            slidesPerView={2}
            slidesPerGroup={2}
            spaceBetween={15}
            onBeforeInit={(swiper) => {
              swiperRefs.current = [
                ...swiperRefs.current.slice(0, 0),
                swiper,
                ...swiperRefs.current.slice(1),
              ];
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
          >
            {boutiqueCollections?.map((collection, i) => {
              return (
                <SwiperSlide key={`row-fest-drop-${i}`}>
                  <div className={styles.rowDrop}>
                    <Link href={`/boutique/${collection.slug}`}>
                      <a className={styles.rowDropImageWrapper}>
                        {collection.imageURL && (
                          <img
                            className={styles.rowDropImage}
                            src={collection.imageURL}
                            alt={collection.name}
                          />
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
          </Swiper>
          <div
            onClick={() => swiperRefs.current[0]?.slidePrev()}
            className={`${styles.rowDropNav} ${styles.rowDropNavPrev}`}
          >
            <ArrowLeftCircleIcon />
          </div>
          <div
            onClick={() => swiperRefs.current[0]?.slideNext()}
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
