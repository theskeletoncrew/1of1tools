import { XCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Modal from "react-modal";
import { toast } from "react-hot-toast";

interface Props {
  prompt: string;
  isShowing: boolean;
  maxNFTs: number;
  close: () => void;
  submitCollection: (
    collectionAddress: string | null | undefined,
    mintList: string[] | null | undefined,
    collectionName: string | null | undefined,
    slug: string | null | undefined,
    twitterURL: string | null | undefined,
    discordURL: string | null | undefined,
    webURL: string | null | undefined
  ) => Promise<boolean>;
}

const BoutiqueCollectionsModal: React.FC<Props> = ({
  prompt,
  isShowing,
  maxNFTs,
  close,
  submitCollection,
}) => {
  const [collectionAddress, setCollectionAddress] = useState<string>();
  const [mintListStr, setMintListStr] = useState<string>();
  const [collectionName, setCollectionName] = useState<string>();
  const [slug, setSlug] = useState<string>();
  const [twitterURL, setTwitterURL] = useState<string>();
  const [discordURL, setDiscordURL] = useState<string>();
  const [webURL, setWebURL] = useState<string>();

  return (
    <Modal
      ariaHideApp={false}
      isOpen={isShowing}
      onRequestClose={close}
      contentLabel="Submit Collection"
      style={{
        overlay: { backgroundColor: "rgba(255,255,255,0.2)" },
        content: {
          inset: "0",
          position: "relative",
          backgroundColor: "rgb(15 23 42)",
          border: "1px solid rgb(204, 204, 204, 0.33)",
          borderRadius: "8px",
        },
      }}
    >
      <div className="relative">
        <h2>Submit a Collection (up to {maxNFTs} NFTs)</h2>
        <button
          className="p-2 absolute right-[-15px] top-[-15px]"
          onClick={close}
        >
          <span title="Delete">
            <XCircleIcon className="w-5 h-5" />
          </span>
        </button>
        <form onSubmit={(e) => e.preventDefault()} className="mt-6">
          <div className="flex flex-col gap-2 mt-5">
            <label htmlFor="collectionName">Collection Name:</label>
            <input
              type="text"
              id="collectionName"
              name="collectionName"
              defaultValue={collectionName}
              placeholder="ex. Skeleton Crew Skulls"
              onChange={(e) => {
                setCollectionName(e.currentTarget.value);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 mt-5">
              <label
                htmlFor="slug"
                className="flex justify-between items-center"
              >
                <span>URL Slug:</span>
                <span className="text-xs">1of1.tools/boutique/[slug]</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                defaultValue={slug}
                placeholder="ex. skeleton-crew-skulls"
                onBlur={(e) => {
                  e.currentTarget.value = e.currentTarget.value
                    .toLowerCase()
                    .replace(/[\s]+/g, "-")
                    .replace(/[^a-z\-]/g, "");
                }}
                onChange={(e) => {
                  setSlug(e.currentTarget.value);
                }}
              />
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <label
                htmlFor="twitterURL"
                className="flex justify-between items-center"
              >
                <span>Twitter Link:</span>
                <span className="text-xs">optional</span>
              </label>
              <input
                type="text"
                id="twitterURL"
                name="twitterURL"
                defaultValue={twitterURL}
                placeholder="ex. https://twitter.com/skeletoncrewrip"
                onChange={(e) => {
                  setTwitterURL(e.currentTarget.value);
                }}
              />
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <label
                htmlFor="discordURL"
                className="flex justify-between items-center"
              >
                <span>Discord Link:</span>
                <span className="text-xs">optional</span>
              </label>
              <input
                type="text"
                id="discordURL"
                name="discordURL"
                defaultValue={discordURL}
                placeholder="ex. https://discord.gg/skeletoncrewrip"
                onChange={(e) => {
                  setDiscordURL(e.currentTarget.value);
                }}
              />
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <label
                htmlFor="webURL"
                className="flex justify-between items-center"
              >
                <span>Website Link:</span>
                <span className="text-xs">optional</span>
              </label>
              <input
                type="text"
                id="webURL"
                name="webURL"
                defaultValue={webURL}
                placeholder="ex. https://skeletoncrew.rip"
                onChange={(e) => {
                  setWebURL(e.currentTarget.value);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-5">
            <label
              htmlFor="collectionAddress"
              className="flex justify-between items-center"
            >
              <span>Collection Address:</span>
              <span className="text-xs">
                for Metaplex Certified Collections
              </span>
            </label>
            <input
              type="text"
              id="collectionAddress"
              name="collectionAddress"
              defaultValue={collectionAddress}
              onChange={(e) => {
                setCollectionAddress(e.currentTarget.value);
              }}
            />
          </div>
          <p className="italic text-center text-sm my-4">or</p>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="mintList"
              className="flex justify-between items-center"
            >
              <span>Mint List:</span>
              <span className="text-xs">
                enter one address per line, no commas
              </span>
            </label>
            <textarea
              id="mintList"
              name="mintList"
              defaultValue={mintListStr}
              onChange={(e) => {
                setMintListStr(e.currentTarget.value);
              }}
              rows={3}
            />
          </div>
          <div className="buttons">
            <button
              type="button"
              className="button cancelButton"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button"
              onClick={async () => {
                const success = await submitCollection(
                  collectionAddress,
                  mintListStr
                    ? mintListStr?.split("\n").map((m) => m.trim())
                    : null,
                  collectionName,
                  slug,
                  twitterURL,
                  discordURL,
                  webURL
                );
                if (success) {
                  setCollectionAddress("");
                }
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BoutiqueCollectionsModal;
