import { proxyImgUrl } from "utils/imgproxy";
import { CloudArrowDownIcon } from "@heroicons/react/24/outline";
import { Nft, NftWithToken, Sft, SftWithToken } from "@metaplex-foundation/js";
import dynamic from "next/dynamic";
import LoadingImage from "components/LoadingImage/LoadingImage";
import { parseUriTypeFromNftJson } from "utils/nftParse";

interface Props {
  nft: Nft | NftWithToken | Sft | SftWithToken;
}

const NFTDisplay: React.FC<Props> = ({ nft }) => {
  const { type, uri } = nft.json
    ? parseUriTypeFromNftJson(nft.json)
    : { type: "image", uri: "" };

  if (type === "model") {
    const Model = dynamic(() => import("components/Model"), {
      ssr: false,
    });
    return <Model src={uri}></Model>;
  } else if (type === "video") {
    return (
      <video
        playsInline
        autoPlay
        controls
        loop
        poster={nft.json?.image}
        className="w-full"
      >
        <source src={uri} />
      </video>
    );
  } else if (type === "audio") {
    return (
      <audio playsInline autoPlay controls loop className="w-full">
        <source src={uri} />
      </audio>
    );
  } else {
    return (
      <LoadingImage
        src={proxyImgUrl(uri, 1024, 1024)}
        backupSrc={uri}
        loader={
          <div className="flex flex-col gap-2 justify-center items-center w-full h-[400px] rounded-xl bg-indigo-500 bg-opacity-10 text-xs animate-pulse">
            <CloudArrowDownIcon className="w-6 h-6" />
            <span>Loading...</span>
          </div>
        }
        alt={nft.name}
        data-orig-url={uri}
        className="rounded-xl w-full"
        loading="lazy"
      />
    );
  }
};

export default NFTDisplay;
