import { tryPublicKey } from "utils";
import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  // Creator,
  // formatAmount,
  // Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
} from "@metaplex-foundation/js";
import GenesysGoStorageConfig, {
  GenesysGoStorageOptions,
} from "components/StorageConfig/GenesysGo/GenesysGoStorageConfig";
import { PublicKey } from "@solana/web3.js";
import { ShdwDrive } from "@shadow-drive/sdk";
// import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
// import { Connection } from "@solana/web3.js";
// import { useConnection } from "@solana/wallet-adapter-react";

interface Props {
  isEdit?: boolean;
  nft?: Sft | SftWithToken | Nft | NftWithToken;
  includeCoverImage: boolean;
  onComplete: (
    metadata: NFTFormData,
    coverImage: File | undefined,
    isCrossmint: boolean,
    storageProvider: StorageProvider,
    storageOptions: GenesysGoStorageOptions | undefined
  ) => void;
}

export interface MetadataAttribute {
  trait_type?: string;
  value?: string;
  [key: string]: unknown;
}

export interface MetadataCreator {
  address?: string | undefined;
  share?: number | undefined;
  [key: string]: unknown;
}

export interface NFTFormData {
  name: string;
  description: string;
  royalties: number;
  symbol: string;
  coverImage: File | undefined;
  attributes: MetadataAttribute[];
  creators: MetadataCreator[];
}

export enum StorageProvider {
  NFTStorage = "NFTStorage",
  GenesysGo = "GenesysGo",
}

export const storageProviderName = (provider: StorageProvider): string => {
  switch (provider) {
    case StorageProvider.GenesysGo:
      return "GenesysGo";
    case StorageProvider.NFTStorage:
      return "NFT.Storage";
  }
};

const MintForm: React.FC<Props> = ({
  isEdit = false,
  nft = undefined,
  includeCoverImage,
  onComplete,
}) => {
  const [name, setName] = useState<string>(nft?.json?.name ?? "");
  const [description, setDescription] = useState<string>(
    nft?.json?.description ?? ""
  );
  const [royalties, setRoyalties] = useState<number | undefined>(
    nft?.json?.seller_fee_basis_points
      ? nft?.json?.seller_fee_basis_points / 100.0
      : undefined
  );
  const [symbol, setSymbol] = useState<string>(nft?.json?.symbol ?? "");
  const [coverImage, setCoverImage] = useState<File>();
  const [attributes, setAttributes] = useState<MetadataAttribute[]>(
    nft?.json?.attributes ?? [{ trait_type: "", value: "" }]
  );
  const [creators, setCreators] = useState<MetadataCreator[]>(
    nft?.json?.properties?.creators ?? [
      { address: "", share: "" as any } as MetadataCreator,
    ]
  );
  const [storageProvider, setStorageProvider] = useState<StorageProvider>(
    StorageProvider.NFTStorage
  );
  const [genesysGoDrive, setGenesysGoDrive] = useState<ShdwDrive>();
  const [genesysGoStorageAccount, setGenesysGoStorageAccount] =
    useState<PublicKey>();
  // const [totalBytes, setTotalBytes] = useState(0);
  // const [storageCostEstimate, setStorageCostEstimate] = useState("");

  // const { connection } = useConnection();

  const updatedCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setCoverImage(file);
      // recalculateTotalBytes();
    }
  };

  // const recalculateTotalBytes = () {
  //   const coverImageBytes = coverImage?.size ?? 0;
  //   const bytes = coverImageBytes;
  //   setTotalBytes(bytes);
  // }

  const updateStorageProvider = async (provider: StorageProvider) => {
    setStorageProvider(provider);

    // const mx = Metaplex.make(connection);

    // if (provider == StorageProvider.NFTStorage) {
    //   mx.use(
    //     nftStorage({ token: process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY ?? "" })
    //   );
    //   console.log("provider: NFTStorage");
    // } else {
    //   setStorageCostEstimate("");
    //   return;
    // }

    // const cost = await mx.storage().getUploadPriceForBytes(totalBytes);

    // if (cost.basisPoints.eqn(0)) {
    //   setStorageCostEstimate("FREE");
    // } else {
    //   setStorageCostEstimate(formatAmount(cost));
    // }
  };

  const validateAndSaveNFTs = async (isCrossmint: boolean) => {
    try {
      if (!name || name.length === 0) {
        throw "Name is required.";
      }

      if (!description || description.length === 0) {
        throw "Description is required.";
      }

      if (!symbol) {
        throw "Symbol is required.";
      }
      if (symbol.length > 7) {
        throw "Symbol is too long.";
      }

      if (royalties === undefined) {
        throw "Royalties percentage is required.";
      }

      if (royalties != 0 && (royalties < 1 || royalties > 100)) {
        throw "Royalties should be entered as a number from 0-100.";
      }

      if (includeCoverImage && !coverImage) {
        throw "Cover image is required";
      }

      if (
        attributes.length !=
        [...new Set(attributes.map((a) => a.trait_type))].length
      ) {
        throw "Attribute names should be unique";
      }

      let shareSum = 0;
      for (const creator of creators) {
        if (!creator.address) {
          throw "Please specify all member public keys";
        }
        if (!creator.share) {
          throw "Please specify all member shares";
        }
        const memberPubkey = tryPublicKey(creator.address);
        if (!memberPubkey) {
          throw "Invalid member public key, unable to cast to PublicKey";
        }
        if (creator.share < 0) {
          throw "Member percent cannot be negative";
        }
        shareSum += creator.share;
      }
      if (shareSum !== 100) {
        throw `Sum of all shares must equal to 100`;
      }
      if (!creators || creators.length == 0) {
        throw "Please specify at least one member";
      }
      if (!creators || creators.length > 4) {
        throw "Candy Machine allows a maximum of 4 creators";
      }
      if (
        creators.length != [...new Set(creators.map((c) => c.address))].length
      ) {
        throw "Creators must be unique";
      }

      let storageOptions: GenesysGoStorageOptions | undefined;
      if (storageProvider === StorageProvider.GenesysGo) {
        if (!genesysGoDrive) {
          throw "Could not initialize GenesysGo";
        }
        if (!genesysGoStorageAccount) {
          throw "GenesysGo requires that you create and select a storage account.";
        }
        storageOptions = {
          shadowDrive: genesysGoDrive,
          storageAccount: genesysGoStorageAccount,
        };
      }

      onComplete(
        {
          name: name,
          description: description,
          royalties: royalties,
          symbol: symbol,
          coverImage: coverImage,
          attributes: attributes,
          creators: creators,
        },
        coverImage,
        isCrossmint,
        storageProvider,
        storageOptions
      );
    } catch (e) {
      toast.error("Error: " + e);
    }
  };

  return (
    <main className="flex flex-1 flex-col justify-center items-center mb-12">
      <form className="w-full max-w-xl">
        <div>
          <label>Name</label>
          <input
            id="name"
            name="name"
            className="w-full mb-3"
            type="text"
            placeholder=""
            onChange={(e) => {
              setName(e.target.value);
            }}
            value={name}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            id="description"
            name="description"
            className="w-full mb-3"
            rows={2}
            placeholder=""
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            value={description}
          />
        </div>

        <div>
          <label>Royalties (0-100%)</label>
          <input
            id="royalties"
            name="royalties"
            className="w-full mb-3"
            type="number"
            placeholder=""
            onChange={(e) => {
              const intval: any = isNaN(parseInt(e.target.value))
                ? ""
                : parseInt(e.target.value);
              setRoyalties(intval);
            }}
            value={royalties ?? ""}
          />
        </div>

        <div>
          <label>Symbol</label>
          <input
            id="symbol"
            name="symbol"
            className="w-full mb-3"
            type="text"
            placeholder=""
            onChange={(e) => {
              setSymbol(e.target.value);
            }}
            value={symbol}
          />
        </div>

        {includeCoverImage && (
          <div className="mb-3">
            <label>Cover Image</label>
            <div className="flex items-center space-x-4">
              <label className="button whitespace-nowrap">
                <input
                  type={"file"}
                  accept=".jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    updatedCoverImage(e);
                  }}
                  hidden
                ></input>
                Upload a Cover Image
              </label>
              <span className="min-w-0 truncate">{coverImage?.name ?? ""}</span>
            </div>
          </div>
        )}

        <div className="mt-6 mb-6">
          <h2 className="text-left text-lg mb-2">Attributes</h2>
          <div className="w-full flex flex-wrap">
            <div className="w-3/5 pr-3 mb-6 md:mb-0">
              <label>Name</label>
              {attributes &&
                attributes.map((attribute, i) => {
                  return (
                    <input
                      key={`attribute-${i}-name`}
                      id={`attribute-${i}-name`}
                      name={`attribute-${i}-name`}
                      className="w-full mb-3"
                      type="text"
                      placeholder=""
                      onChange={(e) => {
                        const updatedAttributes = attributes;
                        updatedAttributes[i]!.trait_type = e.target.value;
                        setAttributes([...updatedAttributes]);
                      }}
                      value={attribute.trait_type}
                    />
                  );
                })}
            </div>
            <div className="w-2/5">
              <label>Value</label>
              {attributes.map((attribute, i) => {
                return (
                  <input
                    key={`attribute-${i}-value`}
                    id={`attribute-${i}-value`}
                    name={`attribute-${i}-value`}
                    className="w-full mb-3"
                    type="text"
                    onChange={(e) => {
                      const updatedAttributes = attributes;
                      updatedAttributes[i]!.value = e.target.value;
                      setAttributes([...updatedAttributes]);
                    }}
                    value={attribute.value}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button
                className="button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setAttributes([
                    ...attributes,
                    {
                      name: "",
                      value: "",
                    },
                  ]);
                }}
              >
                Add
              </button>
              <button
                className="button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (attributes.length == 1) {
                    setAttributes([
                      {
                        name: "",
                        value: "",
                      },
                    ]);
                  } else {
                    setAttributes(
                      attributes.filter(
                        (item, index) => index !== attributes.length - 1
                      )
                    );
                  }
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-left text-lg mb-2">Creator Royalties</h2>
          <div className="w-full flex flex-wrap mb-2">
            <div className="w-3/5 pr-3 mb-6 md:mb-0">
              <label>Wallet Address</label>
              {creators &&
                creators.map((creator, i) => {
                  return (
                    <input
                      key={`creator-${i}-address`}
                      id={`creator-${i}-address`}
                      name={`creator-${i}-address`}
                      className="w-full mb-3"
                      type="text"
                      placeholder="Address"
                      onChange={(e) => {
                        const updatedCreators = creators;
                        updatedCreators[i] = {
                          address: e.target.value as any,
                          share: creator.share,
                          verified: creator.verified,
                        };
                        setCreators([...updatedCreators]);
                      }}
                      value={creator.address}
                    />
                  );
                })}
            </div>
            <div className="w-2/5">
              <label>Percent (0-100)</label>
              {creators.map((creator, i) => {
                return (
                  <div className="flex" key={`creator-${i}-percent`}>
                    <input
                      id={`creator-${i}-percent`}
                      name={`creator-${i}-percent`}
                      type="number"
                      placeholder="Share"
                      min={0}
                      step={1}
                      className="w-full mb-3"
                      onChange={(e) => {
                        const updatedCreators = creators;
                        updatedCreators[i] = {
                          address: creator.address,
                          share: isNaN(parseInt(e.target.value))
                            ? ("" as any)
                            : parseInt(e.target.value),
                          verified: creator.verified,
                        };
                        setCreators([...updatedCreators]);
                      }}
                      value={creator.share ?? ""}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button
                className="button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCreators([
                    ...creators,
                    {
                      address: "",
                      share: 0,
                      verified: false,
                    },
                  ]);
                }}
              >
                Add
              </button>
              <button
                className="button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (creators.length == 1) {
                    setCreators([
                      {
                        address: "",
                        share: 0,
                        verified: false,
                      },
                    ]);
                  } else {
                    setCreators(
                      creators.filter(
                        (item, index) => index !== creators.length - 1
                      )
                    );
                  }
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <fieldset className="w-full">
            <label htmlFor="storageProvider" className="block">
              Decentralized Storage Provider:
            </label>
            <select
              id="storageProvider"
              name="storageProvider"
              value={storageProvider}
              className="w-full mt-1 block"
              onChange={(e) =>
                updateStorageProvider(e.target.value as StorageProvider)
              }
            >
              <option value="">Select a Storage Type</option>
              {Object.keys(StorageProvider).map((key) => (
                <option
                  key={StorageProvider[key as StorageProvider]}
                  value={StorageProvider[key as StorageProvider]}
                >
                  {storageProviderName(StorageProvider[key as StorageProvider])}
                </option>
              ))}
            </select>
          </fieldset>

          {storageProvider == StorageProvider.GenesysGo ? (
            <div className="mt-2">
              <GenesysGoStorageConfig
                didChangeOptions={(options) => {
                  setGenesysGoDrive(options?.shadowDrive);
                  setGenesysGoStorageAccount(options?.storageAccount);
                }}
              />
            </div>
          ) : (
            ""
          )}
        </div>

        <div className="text-center mt-8 mx-auto flex gap-4 items-top justify-top">
          {isEdit ? (
            <div className="w-full">
              <button
                className="button thinbutton w-full"
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  validateAndSaveNFTs(false);
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <div className="w-full">
                <button
                  className="button thinbutton w-full"
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    validateAndSaveNFTs(false);
                  }}
                >
                  Mint to
                  <br />
                  Your Wallet
                </button>
              </div>
              <p className="pt-4"> or </p>
              <div className="w-full">
                <button
                  className="button thinbutton w-full"
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    validateAndSaveNFTs(true);
                  }}
                >
                  Mint & Email
                  <br />
                  w/Crossmint
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </main>
  );
};

export default MintForm;
