import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Collection } from "models/collection";
import { classNames } from "utils";

interface Props {
  collection: Collection;
  numListings: number;
}

const CollectionStats: React.FC<Props> = ({ collection, numListings }) => {
  return (
    <div className="bg-indigo-300 bg-opacity-10 px-3 py-2 sm:p-5 rounded-xl flex gap-5 sm:gap-8 mr-1 justify-evenly items-center">
      <div className="flex-col flex-1 hidden md:flex">
        <label className="text-indigo-400 opacity-80 text-xs text-center">
          LISTED
        </label>
        <span className="text-base text-center whitespace-nowrap">
          {numListings} / {collection.mintAddresses.length}
        </span>
      </div>
      <div className="flex flex-col flex-1">
        <label
          className="text-indigo-400 opacity-80 text-xs text-center cursor-help"
          title="Alpha: Note that some stale listings may appear"
        >
          FLOOR*
        </label>
        <span
          className={classNames(
            "text-base text-center flex items-center gap-1",
            collection.floor && collection.floor.listing
              ? "justify-end"
              : "justify-center"
          )}
        >
          {collection.floor && collection.floor.listing ? (
            <>
              {(
                collection.floor.listing.amount / LAMPORTS_PER_SOL
              ).toLocaleString(undefined, {
                maximumFractionDigits: 3,
                minimumFractionDigits: 0,
              })}{" "}
              <svg
                width="14"
                height="14"
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
      </div>
      {collection.athSale && (
        <div className="flex-col flex-1 hidden sm:flex">
          <label className="text-indigo-400 opacity-80 text-xs text-center whitespace-nowrap">
            ATH SALE
          </label>
          <span className="text-base flex items-center justify-end gap-1">
            {collection.athSale ? (
              <>
                {(collection.athSale.amount / LAMPORTS_PER_SOL).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0,
                  }
                )}{" "}
                <svg
                  width="14"
                  height="14"
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
        </div>
      )}
      <div className="flex flex-col flex-1">
        <label className="text-indigo-400 opacity-80 text-xs text-center">
          VOLUME
        </label>
        <span className="text-base flex items-center justify-end gap-1">
          {collection.totalVolume ? (
            <>
              {collection.totalVolume.toLocaleString(undefined, {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
              })}{" "}
              <svg
                width="14"
                height="14"
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
      </div>
    </div>
  );
};

export default CollectionStats;
