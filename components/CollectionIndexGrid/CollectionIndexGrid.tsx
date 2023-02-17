import Link from "next/link";
import { classNames, shortenedAddress } from "utils";
import { Collection } from "models/collection";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { LazyLoadingImage } from "components/LoadingImage/LoadingImage";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { humanReadableSource, urlForSource } from "utils/helius";
import { CollectionSortType } from "components/CollectionSort/CollectionSort";

interface Props {
  items: Collection[];
  view: ViewType;
  sort: CollectionSortType;
  updateSort: (newSort: CollectionSortType) => void;
}

export enum ViewType {
  LIST = "LIST",
  GRID = "GRID",
}

const CollectionIndexGrid: React.FC<Props> = ({
  items,
  view,
  sort,
  updateSort,
}) => {
  return (
    <div className="mx-1">
      <div
        className={classNames(
          "mt-4",
          view === ViewType.GRID
            ? "grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6"
            : "flex flex-col"
        )}
      >
        <div
          className={
            view === ViewType.GRID
              ? "hidden"
              : "flex mx-2 sm:mx-4 my-4 text-indigo-400 border-b border-indigo-300 pb-4"
          }
        >
          <div className="flex-[3] pr-[80px]">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.NAME_ASC)}
              className="pr-3 flex gap-1 items-center"
            >
              Collection Name
              <ChevronUpIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.NAME_ASC ? "" : "hidden"
                )}
              />
            </a>
          </div>
          <div className="flex-1 text-right whitespace-nowrap hidden lg:block">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.SIZE_ASC)}
              className="px-3 flex gap-1 items-center justify-end"
            >
              Items
              <ChevronUpIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.SIZE_ASC ? "" : "hidden"
                )}
              />
            </a>
          </div>
          <div className="flex-1 text-right whitespace-nowrap">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.FLOOR_DESC)}
              className="px-3 flex gap-1 items-center justify-end"
              title="Alpha: Note that some stale listings may appear"
            >
              Floor*
              <ChevronDownIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.FLOOR_DESC ? "" : "hidden"
                )}
              />
            </a>
          </div>
          <div className="flex-1 text-right whitespace-nowrap hidden lg:block">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.ATH_SALE_DESC)}
              className="px-3 flex gap-1 items-center justify-end"
            >
              ATH Sale
              <ChevronDownIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.ATH_SALE_DESC ? "" : "hidden"
                )}
              />
            </a>
          </div>
          <div className="flex-1 text-right whitespace-nowrap hidden lg:block">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.DAILY_VOLUME_DESC)}
              className="px-3 flex gap-1 items-center justify-end"
            >
              24hr Vol
              <ChevronDownIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.DAILY_VOLUME_DESC ? "" : "hidden"
                )}
              />
            </a>
          </div>
          <div className="flex-1 text-right whitespace-nowrap hidden sm:block">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.WEEKLY_VOLUME_DESC)}
              className="px-3 flex gap-1 items-center justify-end"
            >
              1wk Vol
              <ChevronDownIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.WEEKLY_VOLUME_DESC ? "" : "hidden"
                )}
              />
            </a>
          </div>
          <div className="flex-1 text-right whitespace-nowrap">
            <a
              href="#"
              onClick={() => updateSort(CollectionSortType.TOTAL_VOLUME_DESC)}
              className="px-3 flex gap-1 items-center justify-end"
            >
              Total Vol
              <ChevronDownIcon
                className={classNames(
                  "w-4 h-4",
                  sort === CollectionSortType.TOTAL_VOLUME_DESC ? "" : "hidden"
                )}
              />
            </a>
          </div>
        </div>
        {items.map((item, i) => {
          const collectionImageURL = item.cachedImage ?? item.imageURL ?? "";
          const floorUrl =
            item.floor && item.floor.listing
              ? urlForSource(item.floor.listing.marketplace, item.floor.mint)
              : null;

          return (
            <div
              key={item.slug}
              className={classNames(
                "text-center flex items-center justify-center group relative",
                view == ViewType.GRID
                  ? "flex-col"
                  : "gap-y-4 hover:bg-indigo-300 hover:bg-opacity-5 p-1 sm:p-4 rounded-2xl"
              )}
            >
              <div
                className={classNames(
                  "aspect-1 rounded-lg overflow-hidden bg-indigo-500 bg-opacity-5 relative",
                  view === ViewType.GRID
                    ? "w-full"
                    : "w-[80px] flex justify-center items-center"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a>
                    <LazyLoadingImage
                      src={collectionImageURL}
                      loader={
                        <div className="w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs animate-pulse"></div>
                      }
                      unloader={
                        <div
                          className="flex flex-col gap-2 justify-center items-center w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs"
                          data-url={item.cachedImage ?? ""}
                        >
                          <ExclamationCircleIcon className="w-8 h-8" />
                          <span>Too Large for Preview</span>
                        </div>
                      }
                      title={item.name}
                      alt={item.name}
                      data-orig-url={item.imageURL ?? ""}
                      className={classNames(
                        "mx-auto w-full sm:w-auto",
                        view === ViewType.GRID
                          ? "absolute group-hover:scale-125 transition-transform duration-300"
                          : ""
                      )}
                    />
                  </a>
                </Link>
              </div>
              <span
                className={classNames(
                  "block truncate",
                  view === ViewType.GRID
                    ? "w-full text-center text-xl mt-2"
                    : "flex-[3] text-left text-sm sm:text-base"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block truncate text-white group-hover:text-indigo-300",
                      view === ViewType.LIST ? "px-3 py-3" : ""
                    )}
                  >
                    {item.name}
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm",
                  view === ViewType.GRID
                    ? "w-full"
                    : "hidden lg:block flex-1 text-right"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block text-indigo-400",
                      view === ViewType.LIST ? "px-3 py-4" : ""
                    )}
                  >
                    {item.mintAddresses.length}{" "}
                    <span className={view == ViewType.LIST ? "hidden" : ""}>
                      NFTs
                    </span>
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm",
                  view === ViewType.GRID ? "w-full" : "flex-1 text-right"
                )}
              >
                <Link href={floorUrl ?? "#"}>
                  <a
                    title={item.floor ? item.floor.name : "No Listings"}
                    target={floorUrl ? "_blank" : "_self"}
                    rel="noreferrer"
                    className={classNames(
                      "z-2 text-indigo-400",
                      view === ViewType.LIST
                        ? "px-3 py-4 w-full h-full block"
                        : "text-xs text-indigo-400 absolute top-2 right-2 bg-black px-2 py-1 rounded-lg bg-opacity-75",
                      view === ViewType.GRID &&
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
                  "font-light text-sm hidden",
                  view === ViewType.GRID ? "" : "flex-1 text-right lg:block"
                )}
              >
                <Link
                  href={
                    item.athSale
                      ? `https://explorer.solana.com/tx/${item.athSale.signature}`
                      : `/boutique/${item.slug}`
                  }
                >
                  <a
                    className={classNames(
                      "w-full text-indigo-400 block",
                      view === ViewType.LIST ? "px-3 py-4" : ""
                    )}
                    title={
                      item.athSale
                        ? `${item.athSale.name} sold by ${shortenedAddress(
                            item.athSale.seller
                          )} to ${shortenedAddress(
                            item.athSale.buyer
                          )} on ${humanReadableSource(
                            item.athSale.source
                          )} for ${(
                            item.athSale.amount / LAMPORTS_PER_SOL
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          })} SOL`
                        : ""
                    }
                  >
                    <span className="flex items-center justify-end gap-1 text-right">
                      {item.athSale ? (
                        <>
                          {(
                            item.athSale.amount / LAMPORTS_PER_SOL
                          ).toLocaleString(undefined, {
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
              <span
                className={classNames(
                  "font-light text-sm hidden",
                  view === ViewType.GRID ? "" : "flex-1 text-right lg:block"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block text-indigo-400",
                      view === ViewType.LIST ? "px-3 py-4" : ""
                    )}
                    title="1 Day Volume"
                  >
                    <span className="flex items-center justify-end gap-1 text-right">
                      <>
                        {(item.dayVolume ?? 0).toLocaleString(undefined, {
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
                    </span>
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm hidden",
                  view === ViewType.GRID ? "" : "flex-1 text-right sm:block"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block text-indigo-400",
                      view === ViewType.LIST ? "px-3 py-4" : ""
                    )}
                    title="1 Week Volume"
                  >
                    <span className="flex items-center justify-end gap-1 text-right">
                      {(item.weekVolume ?? 0).toLocaleString(undefined, {
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
                    </span>
                  </a>
                </Link>
              </span>
              <span
                className={classNames(
                  "font-light text-sm",
                  view === ViewType.GRID ? "hidden" : "flex-1 text-right"
                )}
              >
                <Link href={`/boutique/${item.slug}`}>
                  <a
                    className={classNames(
                      "w-full block text-indigo-400",
                      view === ViewType.LIST ? "px-3 py-4" : ""
                    )}
                    title="Total Volume"
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
