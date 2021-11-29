import { NFTMetadata } from "models/nftMetadata";
import Link from "next/link";
import { shortenedAddress } from "utils";
import { proxyImgUrl } from "utils/imgproxy";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import LoadingImage from "components/LoadingImage/LoadingImage";

interface Props {
  nfts: NFTMetadata[];
}

const NFTGrid: React.FC<Props> = ({ nfts }) => {
  return (
    <div className="mt-10 mx-1 grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6">
      {nfts.map((nft) => {
        const name =
          nft.onChainData?.data.name ?? nft.offChainData?.name ?? "Error";
        const imgURL = nft.offChainData?.image ?? "";
        return (
          <Link href={`/nft/${nft.mint}`} key={nft.mint}>
            <a
              className="text-center cursor-pointer block"
              title={shortenedAddress(nft.mint)}
            >
              <div className="w-full aspect-1 rounded-lg overflow-hidden flex justify-center items-center bg-indigo-500 bg-opacity-5">
                <LoadingImage
                  src={proxyImgUrl(imgURL, 320, 320)}
                  loader={
                    <div className="w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs animate-pulse"></div>
                  }
                  unloader={
                    <div className="flex flex-col gap-2 justify-center items-center w-full aspect-1 bg-indigo-500 bg-opacity-5 text-xs">
                      <ExclamationCircleIcon className="w-8 h-8" />
                      <span>Too Large for Preview</span>
                    </div>
                  }
                  alt={name}
                  data-orig-url={imgURL}
                  className="mx-auto w-full sm:w-auto"
                  loading="lazy"
                />
              </div>
              <span className="text-center w-full block mt-2 truncate">
                {name}
              </span>
            </a>
          </Link>
        );
      })}
    </div>
  );
};

export default NFTGrid;
