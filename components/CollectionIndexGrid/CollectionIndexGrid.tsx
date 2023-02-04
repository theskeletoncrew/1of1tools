import Link from "next/link";
import { classNames } from "utils";
import { proxyImgUrl } from "utils/imgproxy";
import { Collection, CollectionFloor } from "models/collection";
import {
  Bars3Icon,
  ExclamationCircleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import LoadingImage from "components/LoadingImage/LoadingImage";
import { useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { urlForSource } from "utils/helius";

interface Props {
  items: Collection[];
  subtitle: string;
}

enum ViewType {
  List,
  Grid,
}

const CollectionIndexGrid: React.FC<Props> = ({ items, subtitle }) => {
  const [view, setView] = useState<ViewType>(ViewType.Grid);

  return (
    <div className="mx-1">
      <svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <g id="solana-icon">
            <path
              d="M3.80286 13.8188C3.90696 13.7147 4.0501 13.6539 4.20191 13.6539H17.9689C18.2205 13.6539 18.3463 13.9576 18.1685 14.1354L15.4489 16.855C15.3448 16.9591 15.2017 17.0198 15.0498 17.0198H1.28281C1.03124 17.0198 0.905451 16.7162 1.08329 16.5383L3.80286 13.8188Z"
              fill="url(#linear-gradient-1)"
            ></path>
            <path
              d="M3.80286 3.66482C3.9113 3.56072 4.05443 3.5 4.2019 3.5H17.9689C18.2205 3.5 18.3463 3.80362 18.1685 3.98146L15.4489 6.70103C15.3448 6.80513 15.2017 6.86585 15.0498 6.86585H1.28281C1.03124 6.86585 0.905451 6.56223 1.08329 6.3844L3.80286 3.66482Z"
              fill="url(#linear-gradient-2)"
            ></path>
            <path
              d="M15.4489 8.70938C15.3448 8.60528 15.2017 8.54456 15.0498 8.54456H1.28281C1.03124 8.54456 0.905451 8.84818 1.08329 9.02601L3.80286 11.7456C3.90696 11.8497 4.0501 11.9104 4.20191 11.9104H17.9689C18.2205 11.9104 18.3463 11.6068 18.1685 11.429L15.4489 8.70938Z"
              fill="url(#linear-gradient-3)"
            ></path>
          </g>
          <linearGradient
            id="linear-gradient-1"
            x1="16.6538"
            y1="1.87538"
            x2="7.1259"
            y2="20.1251"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#00FFA3"></stop>
            <stop offset="1" stop-color="#DC1FFF"></stop>
          </linearGradient>
          <linearGradient
            id="linear-gradient-2"
            x1="12.4877"
            y1="-0.299659"
            x2="2.95979"
            y2="17.9501"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#00FFA3"></stop>
            <stop offset="1" stop-color="#DC1FFF"></stop>
          </linearGradient>
          <linearGradient
            id="linear-gradient-3"
            x1="14.5575"
            y1="0.78106"
            x2="5.02959"
            y2="19.0308"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#00FFA3"></stop>
            <stop offset="1" stop-color="#DC1FFF"></stop>
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-center justify-between">
        <h3 className="sm:pl-5 text-indigo-400 text-xs sm:text-base">
          {subtitle}
        </h3>
        <div className="sm:mr-3 border border-1 text-indigo-600 border-indigo-600 rounded-lg flex gap-0 items-center justify-center">
          <button className="py-2 px-4" onClick={() => setView(ViewType.Grid)}>
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
      <div
        className={classNames(
          "mt-4",
          view === ViewType.Grid
            ? "grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6"
            : "flex flex-col"
        )}
      >
        <div
          className={
            view === ViewType.Grid
              ? "hidden"
              : "flex mx-2 sm:mx-4 my-4 text-indigo-400 border-b border-indigo-300 pb-4"
          }
        >
          <h3 className="flex-[3] pr-[80px]">Collection Name</h3>
          <div className="flex-1 text-right hidden sm:block">
            <span className="px-3">Items</span>
          </div>
          <div className="flex-1 text-right">
            <span
              className="px-3 cursor-help"
              title="Alpha: Note that some stale listings may appear"
            >
              Floor*
            </span>
          </div>
          <div className="flex-1 text-right">
            <span>Volume</span>
          </div>
        </div>
        {items.map((item, i) => {
          const floorUrl =
            item.floor && item.floor.listing
              ? urlForSource(item.floor.listing.marketplace, item.floor.mint)
              : null;

          return (
            <div
              key={i}
              className={classNames(
                "text-center flex items-center justify-center group relative",
                view == ViewType.Grid
                  ? "flex-col"
                  : "gap-y-4 hover:bg-indigo-300 hover:bg-opacity-5 p-1 sm:p-4 rounded-2xl"
              )}
            >
              <div
                className={classNames(
                  "aspect-1 rounded-lg overflow-hidden bg-indigo-500 bg-opacity-5 relative",
                  view === ViewType.Grid
                    ? "w-full"
                    : "w-[80px] flex justify-center items-center"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a>
                    <LoadingImage
                      src={proxyImgUrl(item.imageURL ?? "", 320, 320)}
                      loader={
                        <div className="w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs animate-pulse"></div>
                      }
                      unloader={
                        <div className="flex flex-col gap-2 justify-center items-center w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs">
                          <ExclamationCircleIcon className="w-8 h-8" />
                          <span>Too Large for Preview</span>
                        </div>
                      }
                      title={item.name}
                      alt={item.name}
                      data-orig-url={item.imageURL ?? ""}
                      className={classNames(
                        "mx-auto w-full sm:w-auto",
                        view === ViewType.Grid
                          ? "absolute group-hover:scale-125 transition-transform duration-300"
                          : ""
                      )}
                      loading="lazy"
                    />
                  </a>
                </Link>
              </div>
              <span
                className={classNames(
                  "block truncate",
                  view === ViewType.Grid
                    ? "w-full text-center text-xl mt-2"
                    : "flex-[3] text-left text-sm sm:text-base"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block truncate text-white group-hover:text-indigo-300",
                      view === ViewType.List ? "px-3 py-3" : ""
                    )}
                  >
                    {item.name}
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm",
                  view === ViewType.Grid
                    ? "w-full"
                    : "hidden sm:block flex-1 text-right"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block text-indigo-400",
                      view === ViewType.List ? "px-3 py-4" : ""
                    )}
                  >
                    {item.mintAddresses.length}{" "}
                    <span className={view == ViewType.List ? "hidden" : ""}>
                      NFTs
                    </span>
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm",
                  view === ViewType.Grid ? "w-full" : "flex-1 text-right"
                )}
              >
                <Link href={floorUrl ?? "#"}>
                  <a
                    title={item.floor ? item.floor.name : "No Listings"}
                    target={floorUrl ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={classNames(
                      "z-2 text-indigo-400",
                      view === ViewType.List
                        ? "px-3 py-4 w-full h-full block"
                        : "text-xs text-indigo-400 absolute top-2 right-2 bg-black px-2 py-1 rounded-lg bg-opacity-75",
                      view === ViewType.Grid &&
                        (!item.floor || !item.floor.listing)
                        ? "hidden"
                        : ""
                    )}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {item.floor && item.floor.listing ? (
                        <>
                          {(
                            item.floor.listing.amount / LAMPORTS_PER_SOL
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 3,
                            minimumFractionDigits: 0,
                          })}{" "}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <use href="#solana-icon"></use>
                          </svg>
                        </>
                      ) : (
                        "-"
                      )}
                    </span>
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm",
                  view === ViewType.Grid ? "hidden" : "flex-1 text-right"
                )}
              >
                <Link href={floorUrl ?? "#"}>
                  <a
                    title={item.floor ? item.floor.name : "No Listings"}
                    target={floorUrl ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={classNames(
                      "z-2 text-indigo-400",
                      view === ViewType.List
                        ? "py-4 w-full h-full block"
                        : "text-xs text-indigo-400 absolute top-2 right-2 bg-black px-2 py-1 rounded-lg bg-opacity-75"
                    )}
                  >
                    <span className="flex items-center justify-end gap-1 text-right">
                      {item.totalVolume ? (
                        <>
                          {item.totalVolume.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          })}{" "}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <use href="#solana-icon"></use>
                          </svg>
                        </>
                      ) : (
                        "-"
                      )}
                    </span>
                  </a>
                </Link>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionIndexGrid;
