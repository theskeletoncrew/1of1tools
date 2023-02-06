import { NFTMetadata } from "models/nftMetadata";
import Link from "next/link";
import { shortenedAddress } from "utils";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { LazyLoadingImage } from "components/LoadingImage/LoadingImage";
import { NFTListings } from "models/nftListings";
import { urlForSource } from "utils/helius";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface Props {
  nfts: NFTMetadata[];
  listings?: NFTListings[];
}

const NFTGrid: React.FC<Props> = ({ nfts, listings }) => {
  return (
    <div className="mt-10 mx-1 grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6">
      {nfts.map((nft) => {
        const name =
          nft.onChainData?.data.name ?? nft.offChainData?.name ?? "Error";
        const imgURL = nft.offChainData?.image ?? "";
        const apiURL = `/api/assets/nft/${
          nft.mint
        }/640?originalURL=${encodeURIComponent(imgURL)}`;

        const listingItem = listings?.find((item) => item.mint === nft.mint);
        const listing = listingItem?.activeListings.reduce((prev, current) =>
          prev.amount <= current.amount ? prev : current
        );
        const listingURL =
          listingItem && listing
            ? urlForSource(listing.marketplace, listingItem.mint)
            : null;

        return (
          <div className="relative" key={nft.mint}>
            <Link href={`/nft/${nft.mint}`}>
              <a
                className="text-center cursor-pointer block group"
                title={shortenedAddress(nft.mint)}
              >
                <div className="w-full relative aspect-1 rounded-lg overflow-hidden flex justify-center items-center bg-indigo-500 bg-opacity-5">
                  <LazyLoadingImage
                    src={apiURL}
                    loader={
                      <div
                        className="w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs animate-pulse"
                        data-url={apiURL}
                      ></div>
                    }
                    unloader={
                      <div className="flex flex-col gap-2 justify-center items-center w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs">
                        <ExclamationCircleIcon className="w-8 h-8" />
                        <span>Too Large for Preview</span>
                      </div>
                    }
                    alt={name}
                    data-orig-url={imgURL}
                    className="mx-auto w-full sm:w-auto absolute group-hover:scale-125 transition-transform duration-300"
                  />
                </div>
                <span className="text-center w-full block mt-2 truncate text-white group-hover:text-indigo-300">
                  {name}
                </span>
              </a>
            </Link>
            {listingItem && listing && (
              <span className="font-light text-sm w-full">
                <Link href={listingURL ?? "#"}>
                  <a
                    title={listingItem.name}
                    target={listingURL ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="z-2 text-xs text-indigo-400 absolute top-2 right-2 bg-black px-2 py-1 rounded-lg bg-opacity-75"
                  >
                    <span className="flex items-center justify-end gap-1">
                      <>
                        {(listing.amount / LAMPORTS_PER_SOL).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 3,
                            minimumFractionDigits: 0,
                          }
                        )}{" "}
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
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NFTGrid;
