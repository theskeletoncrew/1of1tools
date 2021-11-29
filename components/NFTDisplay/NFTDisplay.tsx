import { proxyImgUrl } from "utils/imgproxy";
import { CloudArrowDownIcon } from "@heroicons/react/24/outline";
import { Nft, NftWithToken, Sft, SftWithToken } from "@metaplex-foundation/js";
import dynamic from "next/dynamic";
import LoadingImage from "components/LoadingImage/LoadingImage";

interface Props {
  nft: Nft | NftWithToken | Sft | SftWithToken;
}

const valid3DExtensions = ["glb", "gltf", "gltf-binary"];
const validVideoExtensions = ["mp4", "mov", "webm", "m4v", "ogv", "ogg"];
const validAudioExtensions = ["mp3", "wav", "oga", "flac"];
const validImageExtensions = ["jpg", "jpeg", "png", "gif"];

const NFTDisplay: React.FC<Props> = ({ nft }) => {
  let uri = nft.json?.image ?? "";
  let type = "image";

  if (
    nft.json &&
    nft.json.properties &&
    nft.json.properties.files &&
    nft.json.properties.files.length > 0
  ) {
    for (let i = 0; i < nft.json.properties.files.length; i++) {
      const file = nft.json.properties.files[i];
      if (file && file.uri) {
        try {
          new URL(file.uri);
        } catch {
          // skip if not a valid url
          continue;
        }
        const parts = file.uri.split("ext=");
        const extension = parts.length > 1 ? parts[1] : null;
        if (
          file.type?.startsWith("model/") ||
          file.type?.startsWith("vr/") ||
          (extension && valid3DExtensions.includes(extension))
        ) {
          type = "model";
          uri = file.uri;
          break;
        } else if (
          file.type?.startsWith("video/") ||
          (extension && validVideoExtensions.includes(extension))
        ) {
          type = "video";
          uri = file.uri;
          break;
        } else if (
          file.type?.startsWith("audio/") ||
          (extension && validAudioExtensions.includes(extension))
        ) {
          type = "audio";
          uri = file.uri;
          break;
        } else if (
          file.type?.startsWith("image/") ||
          (extension && validImageExtensions.includes(extension))
        ) {
          type = "image";
          uri = file.uri;
          break;
        }
      }
    }
  }

  if (type === "model") {
    const Model = dynamic(() => import("components/Model"), {
      ssr: false,
    });
    return <Model src={uri}></Model>;
  } else if (type === "video") {
    return (
      <video autoPlay controls loop className="w-full">
        <source src={uri} />
      </video>
    );
  } else if (type === "audio") {
    return (
      <audio autoPlay controls loop className="w-full">
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
