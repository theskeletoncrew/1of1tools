import { NFTMetadata } from "models/nftMetadata";
import Link from "next/link";
import { classNames, shortenedAddress } from "utils";
import { proxyImgUrl } from "utils/imgproxy";
import { Collection } from "models/collection";
import {
  Bars3Icon,
  ExclamationCircleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import LoadingImage from "components/LoadingImage/LoadingImage";
import { useState } from "react";

interface Props {
  items: Collection[];
  maxCollectionSize: number;
}

enum ViewType {
  List,
  Grid,
}

const CollectionIndexGrid: React.FC<Props> = ({ items, maxCollectionSize }) => {
  const [view, setView] = useState<ViewType>(ViewType.Grid);

  return (
    <div className="mx-1">
      <div className="flex items-center justify-between">
        <h3 className="pl-5 text-indigo-400">
          Hyped collections of {maxCollectionSize} NFTs or less
        </h3>
        <div className="mr-3 border border-1 text-indigo-600 border-indigo-600 rounded-lg flex gap-0 items-center justify-center">
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
            ? "grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
            : "flex flex-col"
        )}
      >
        {items.map((item, i) => {
          return (
            <Link href={`/boutique/${item.slug}`} key={i}>
              <a
                className={classNames(
                  "text-center cursor-pointer flex items-center justify-center group",
                  view == ViewType.Grid
                    ? "flex-col"
                    : "gap-4 hover:bg-indigo-300 hover:bg-opacity-5 p-4 rounded-2xl relative"
                )}
                title={shortenedAddress(item.name)}
              >
                <div
                  className={classNames(
                    "aspect-1 rounded-lg overflow-hidden bg-indigo-500 bg-opacity-5",
                    view === ViewType.Grid
                      ? "w-full group-hover:scale-105 relative transition-transform duration-300"
                      : "w-[80px] flex justify-center items-center"
                  )}
                >
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
                    alt={item.name}
                    data-orig-url={item.imageURL ?? ""}
                    className="mx-auto w-full sm:w-auto"
                    loading="lazy"
                  />
                </div>
                <span
                  className={classNames(
                    "w-full block truncate text-white",
                    view === ViewType.Grid
                      ? "text-center text-xl mt-2 relative group-hover:translate-y-1 transition-transform duration-300"
                      : "text-left"
                  )}
                >
                  {item.name}
                </span>
                <span
                  className={classNames(
                    "font-light text-indigo-400",
                    view === ViewType.Grid
                      ? "w-full text-sm group-hover:translate-y-1 transition-transform duration-300"
                      : "w-[20%] text-right"
                  )}
                >
                  {item.mintAddresses.length} NFTs
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionIndexGrid;
