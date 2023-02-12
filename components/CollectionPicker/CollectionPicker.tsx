import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import {
  JsonMetadata,
  Metaplex,
  Metadata,
  Nft,
  Sft,
} from "@metaplex-foundation/js";

interface Props {
  collectionAddress: string | undefined;
  didChangeCollection: (collectionAddress: string) => void;
}

const CollectionPicker: React.FC<Props> = ({
  collectionAddress,
  didChangeCollection,
}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [collections, setCollections] = useState<
    Metadata<JsonMetadata<string>>[]
  >([]);
  const [isLoadingCollections, setLoadingCollections] = useState(false);

  useEffect(() => {
    const loadCollections = async () => {
      if (wallet?.publicKey) {
        setLoadingCollections(true);
        try {
          const mx = Metaplex.make(connection);
          const nfts = await mx
            .nfts()
            .findAllByOwner({ owner: wallet.publicKey });
          const collectionNfts = nfts.filter(
            (n) =>
              n.collectionDetails != null &&
              // if you're not the update authority on the collection
              // you won't be able to sign on behalf of the collection
              // to verify the nft's inclusion in the collection
              n.updateAuthorityAddress.toString() ===
                wallet.publicKey?.toString()
          );
          setCollections(collectionNfts as Metadata<JsonMetadata<string>>[]);
        } catch (error) {
          toast.error("Failed to load collections.");
          console.log(error);
        }
        setLoadingCollections(false);
      }
    };
    loadCollections();
  }, [wallet, wallet?.publicKey, connection]);

  return (
    <div>
      <label htmlFor="collection">Add to a Collection?</label>
      <div className="mb-4 flex gap-2 justify-start items-center">
        <div>
          <select
            className="min-w-[200px]"
            disabled={isLoadingCollections}
            value={collectionAddress ?? ""}
            onChange={(e) => didChangeCollection(e.target.value)}
          >
            {isLoadingCollections ? (
              <option value="">Loading</option>
            ) : (
              <>
                <option value="">Select a Collection</option>
                {collections.map((collection) => {
                  const address = collection.mintAddress.toString();
                  return (
                    <option key={address} value={address}>
                      {collection.name}
                    </option>
                  );
                })}
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CollectionPicker;
