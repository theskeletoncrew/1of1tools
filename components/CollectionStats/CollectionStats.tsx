import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Collection } from "models/collection";
import { classNames } from "utils";

interface Props {
  collection: Collection;
}

const CollectionStats: React.FC<Props> = ({ collection }) => {
  return (
    <>
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
      <div className="bg-indigo-300 bg-opacity-10 px-3 py-2 sm:p-5 rounded-xl flex gap-5 sm:gap-8 mr-1 justify-evenly items-center">
        <div className="flex-col flex-1 hidden sm:flex">
          <label className="text-indigo-400 text-sm text-center">Supply</label>
          <span className="text-xs text-center">
            {collection.mintAddresses.length}
          </span>
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-indigo-400 text-sm text-center">Floor</label>
          <span
            className={classNames(
              "text-xs text-center flex items-center gap-1",
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
        <div className="flex flex-col flex-1">
          <label className="text-indigo-400 text-sm text-center">Volume</label>
          <span className="text-xs flex items-center justify-end gap-1">
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
    </>
  );
};

export default CollectionStats;
