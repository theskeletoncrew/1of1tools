import { GlobeAltIcon } from "@heroicons/react/24/outline";
import DiscordIcon from "components/Icons/DiscordIcon";
import TwitterIcon from "components/Icons/TwitterIcon";
import { Collection } from "models/collection";

interface Props {
  collection: Collection;
}

const CollectionSocial: React.FC<Props> = ({ collection }) => {
  return (
    <div className="flex gap-1 items-center -ml-1">
      <span className="hidden md:block px-1 py-1">Project Links:</span>
      {collection.twitterURL && (
        <a
          href={collection.twitterURL}
          target="_blank"
          rel="noreferrer"
          className="px-1 sm:py-1 text-indigo-400 hover:text-white"
        >
          <TwitterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
      )}
      {collection.discordURL && (
        <a
          href={collection.discordURL}
          target="_blank"
          rel="noreferrer"
          className="px-1 sm:py-1 text-indigo-400 hover:text-white"
        >
          <DiscordIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
      )}
      {collection.webURL && (
        <a
          href={collection.webURL}
          target="_blank"
          rel="noreferrer"
          className="px-1 sm:py-1 text-indigo-400 hover:text-white"
        >
          <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
      )}
    </div>
  );
};

export default CollectionSocial;
