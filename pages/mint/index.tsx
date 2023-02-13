import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import {
  CreateNftInput,
  CreateSftInput,
  Metaplex,
  toBigNumber,
  toMetaplexFileFromBrowser,
  walletAdapterIdentity,
  token,
} from "@metaplex-foundation/js";
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
import { network } from "utils/network";
import { useState } from "react";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import MintForm, {
  NFTFormData,
  TokenType,
  StorageProvider,
} from "components/MintForm/MintForm";
import {
  fileCategory,
  valid3DExtensions,
  validAudioExtensions,
  validImageExtensions,
  validVideoExtensions,
} from "utils/nftParse";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { notEmpty, pubKeyUrl, shortenedAddress, tryPublicKey } from "utils";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ArweaveStorageOptions } from "components/StorageConfig/Arweave/ArweaveStorageConfig";
import { GenesysGoStorageOptions } from "components/StorageConfig/GenesysGo/GenesysGoStorageConfig";
import { PublicKey } from "@solana/web3.js";
import { uploadFile, uploadMetadata } from "utils/storage";

const Model = dynamic(() => import("components/Model"), { ssr: false });

function pause(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}

const MintPage: NextPage = () => {
  const [mintingStatus, setMintingStatus] = useState<string>();
  const [isEditingNFT, setEditingNFT] = useState(false);
  const [mintedNFTAddress, setMintedNFTAddress] = useState<string>();
  const [mintedWithCrossMint, setMintedWithCrossMint] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string>();

  const wallet = useWallet();
  const { connection } = useConnection();
  const [file, setFile] = useState<File>();

  const updatedFileForNFT = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingNFT(true);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const mint = async (
    metadata: NFTFormData,
    coverImage: File | undefined,
    tokenType: TokenType,
    isCrossmint: boolean,
    storageProvider: StorageProvider,
    storageOptions: GenesysGoStorageOptions | ArweaveStorageOptions | undefined
  ) => {
    try {
      console.log("Minting...");
      setMintingStatus("Minting...");

      setMintedWithCrossMint(isCrossmint);

      if (!wallet || !wallet.connected || !wallet.publicKey) {
        throw new Error("No wallet connected.");
      }

      if (!file) {
        throw new Error("No media file provided.");
      }

      if (storageProvider === StorageProvider.GenesysGo && !storageOptions) {
        throw new Error(
          "Shadow Drive storage requires that you create and choose a storage account."
        );
      }

      if (storageProvider === StorageProvider.Arweave && !storageOptions) {
        throw new Error(
          "Arweave storage was chosen, but we were unable to initialize a connection via Bundlr."
        );
      }

      let recipientEmail: string | null = null;

      if (isCrossmint) {
        recipientEmail = prompt("Enter recipient email address");
        if (!recipientEmail) {
          return;
        }
        setRecipientEmail(recipientEmail);
      }

      let collectionPublicKey: PublicKey | null | undefined;
      if (metadata.collectionAddress) {
        collectionPublicKey = tryPublicKey(metadata.collectionAddress);
        if (!collectionPublicKey) {
          throw new Error("Collection address was not valid");
        }
      }

      const mx = Metaplex.make(connection);
      mx.use(walletAdapterIdentity(wallet));

      if (storageProvider === StorageProvider.NFTStorage) {
        mx.use(
          nftStorage({
            token: process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY ?? "",
          })!
        );
      }

      const category = fileCategory(file);

      console.log("Uploading media file...");
      setMintingStatus(`Uploading media file...`);
      const mediaFile = await toMetaplexFileFromBrowser(file);
      const mediaFileLocation = await uploadFile(
        file,
        mediaFile,
        mx,
        storageProvider,
        storageOptions
      );

      const fullMediaLocation = `${mediaFileLocation}?ext=${mediaFile.extension?.toLowerCase()}`;

      let fullCoverLocation: string | undefined;
      let files: { type: string; uri: string }[] = [
        { type: file.type, uri: fullMediaLocation },
      ];

      if (coverImage) {
        console.log("Uploading cover file...");
        setMintingStatus(`Uploading cover file...`);
        const coverMediaFile = await toMetaplexFileFromBrowser(coverImage);
        const coverFileLocation = await uploadFile(
          coverImage,
          coverMediaFile,
          mx,
          storageProvider,
          storageOptions
        );
        fullCoverLocation = `${coverFileLocation}?ext=${coverMediaFile.extension?.toLowerCase()}`;
      }

      const jsonMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        seller_fee_basis_points: metadata.royalties * 100,
        image: fullCoverLocation ?? fullMediaLocation,
        attributes: metadata.attributes
          .filter(
            (a) =>
              a.trait_type &&
              a.value &&
              a.trait_type.length > 0 &&
              a.value.length > 0
          )
          .map((a) => {
            return {
              trait_type: a.trait_type as string,
              value: a.value as string,
            };
          }),
        properties: {
          creators: metadata.creators.map((c) => {
            return { address: c.address, share: c.share };
          }),
          category: category,
          files: files,
        },
      };

      if (isCrossmint && recipientEmail) {
        console.log("Uploading metadata and writing to blockchain...");
        setMintingStatus("Uploading metadata and writing to blockchain...");
        const mintRes = await OneOfOneToolsClient.mint(
          jsonMetadata,
          recipientEmail
        );

        if (mintRes.isOk()) {
          const uploadId = mintRes.value.id;

          let isComplete = mintRes.value.isComplete;
          let retries = 0;
          let mintAddress: string | undefined;

          while (!isComplete) {
            const statusRes = await OneOfOneToolsClient.mintStatus(uploadId);
            if (statusRes.isOk()) {
              isComplete = statusRes.value.isComplete;
              mintAddress = statusRes.value.mintAddress;
            }
            retries++;
            if (isComplete || retries > 6) {
              break;
            }
            await pause(5000);
          }

          if (isComplete) {
            setMintedNFTAddress(mintAddress);
          } else {
            throw new Error("Timed out waiting for mint to complete.");
          }
        } else {
          throw new Error(mintRes.error.message);
        }
      } else {
        console.log("Uploading metadata...");
        setMintingStatus("Uploading metadata...");
        const newUri = await uploadMetadata(
          jsonMetadata,
          mx,
          storageProvider,
          storageOptions
        );

        console.log("Writing to blockchain...");
        setMintingStatus("Writing to blockchain...");

        if (tokenType === TokenType.Sft) {
          const sftOnChainMetadata: CreateSftInput = {
            uri: newUri,
            name: metadata.name,
            sellerFeeBasisPoints: metadata.royalties * 100,
            symbol: metadata.symbol,
            creators: metadata.creators
              .map((c) => {
                const publicKey = tryPublicKey(c.address ?? "");
                return publicKey && c.share
                  ? {
                      address: publicKey,
                      share: c.share,
                    }
                  : null;
              })
              .filter(notEmpty),
            decimals: metadata.decimals,
            tokenAmount: metadata.supply
              ? token(toBigNumber(metadata.supply), metadata.decimals)
              : undefined,
            tokenOwner: metadata.supply ? mx.identity().publicKey : undefined,
          };
          if (collectionPublicKey) {
            sftOnChainMetadata.collection = collectionPublicKey;
            sftOnChainMetadata.collectionAuthority = mx.identity();
          }
          const result = await mx
            .nfts()
            .createSft(sftOnChainMetadata, { commitment: "finalized" });
          setMintedNFTAddress(result.mintAddress.toString());
        } else {
          const nftOnChainMetadata: CreateNftInput = {
            uri: newUri,
            name: metadata.name,
            sellerFeeBasisPoints: metadata.royalties * 100,
            symbol: metadata.symbol,
            creators: metadata.creators
              .map((c) => {
                const publicKey = tryPublicKey(c.address ?? "");
                return publicKey && c.share
                  ? {
                      address: publicKey,
                      share: c.share,
                    }
                  : null;
              })
              .filter(notEmpty),
          };
          if (collectionPublicKey && tokenType !== TokenType.Collection) {
            nftOnChainMetadata.collection = collectionPublicKey;
            nftOnChainMetadata.collectionAuthority = mx.identity();
          }
          if (tokenType === TokenType.Collection) {
            nftOnChainMetadata.isCollection = true;
          }
          if (tokenType === TokenType.LimitedEdition) {
            nftOnChainMetadata.maxSupply = toBigNumber(metadata.supply ?? 0);
          } else if (tokenType === TokenType.OpenEdition) {
            nftOnChainMetadata.maxSupply = null;
          } else {
            nftOnChainMetadata.maxSupply = toBigNumber(0);
          }

          const result = await mx
            .nfts()
            .create(nftOnChainMetadata, { commitment: "finalized" });
          setMintedNFTAddress(result.mintAddress.toString());
        }
      }

      toast.success("Mint complete!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Minting failed.");
      }
      console.log(error);
      setMintedNFTAddress(undefined);
    }
    setMintingStatus(undefined);
  };

  const reset = () => {
    setMintingStatus(undefined);
    setEditingNFT(false);
    setMintedNFTAddress(undefined);
    setMintedWithCrossMint(false);
    setRecipientEmail(undefined);
    setFile(undefined);
  };

  return (
    <Layout>
      <div>
        <Head>
          <title>one / one tools</title>
          <meta name="description" content="one / one tools" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="mt-4">
          <Header title="Mint NFT" />
        </div>

        {!wallet || !wallet.publicKey ? (
          <div className="w-full h-[80vh] flex flex-col gap-10 items-center justify-center text-center text-3xl">
            <p>Connect your wallet to get started</p>
          </div>
        ) : !isEditingNFT || !file ? (
          <div className="w-full h-[80vh] flex flex-col gap-10 items-center justify-center text-center">
            <form>
              <label className="button">
                <input
                  type={"file"}
                  accept={validImageExtensions
                    .map((e) => "." + e)
                    .concat(validVideoExtensions.map((e) => "." + e))
                    .concat(validAudioExtensions.map((e) => "." + e))
                    .concat(valid3DExtensions.map((e) => "." + e))
                    .join(",")}
                  onChange={(e) => {
                    updatedFileForNFT(e);
                  }}
                  hidden
                ></input>
                <span className="py-5 px-5 inline-block">
                  <span className="text-2xl leading-5 block">
                    Upload a File
                  </span>
                  <span className="block mt-4 text-sm">
                    (Image, Video, Audio, 3D Model)
                  </span>
                </span>
              </label>
            </form>
          </div>
        ) : mintingStatus ? (
          <div className="animate-pulse w-full h-[80vh] flex flex-col gap-10 items-center justify-center text-center text-3xl">
            {mintingStatus}
          </div>
        ) : mintedNFTAddress ? (
          <div className="w-full h-[80vh] flex flex-col gap-4 items-center justify-center text-center text-3xl">
            <span>Mint Successful! 🎉</span>
            <a
              href={`/nft/${mintedNFTAddress}`}
              rel="noreferrer"
              target="_blank"
            >
              1of1.tools/nft/{shortenedAddress(mintedNFTAddress)}
            </a>
            <a
              href={pubKeyUrl(
                mintedNFTAddress,
                mintedWithCrossMint ? WalletAdapterNetwork.Devnet : network
              )}
              rel="noreferrer"
              target="_blank"
              className="text-sm"
            >
              View on Solana Explorer ({shortenedAddress(mintedNFTAddress)})
            </a>
            {mintedWithCrossMint && recipientEmail && (
              <span>
                Next Steps:{" "}
                <a
                  href={`mailto:${recipientEmail}?subject=Art coming your way!&body=To access it, go to https://www.crossmint.com/signin`}
                >
                  Let the recipient know
                </a>{" "}
                how to access their NFT.
              </span>
            )}
            <div className="mt-8">
              <button className="button largebutton" onClick={reset}>
                Mint {isEditingNFT ? "a New NFT" : "Another NFT"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-8 flex-col md:flex-row mt-8 px-1">
              <div className="relative w-full md:w-1/3 lg:w-1/2">
                {validImageExtensions.find((f) =>
                  file.name.toLowerCase().endsWith("." + f)
                ) ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="NFT Image"
                    className="w-full"
                  />
                ) : validVideoExtensions.find((f) =>
                    file.name.toLowerCase().endsWith("." + f)
                  ) ? (
                  <video playsInline autoPlay controls loop>
                    <source src={URL.createObjectURL(file)} />
                  </video>
                ) : validAudioExtensions.find((f) =>
                    file.name.toLowerCase().endsWith("." + f)
                  ) ? (
                  <audio autoPlay controls loop>
                    <source src={URL.createObjectURL(file)} />
                  </audio>
                ) : valid3DExtensions.find((f) =>
                    file.name.toLowerCase().endsWith("." + f)
                  ) ? (
                  <Model src={URL.createObjectURL(file)}></Model>
                ) : (
                  file.name
                )}
              </div>
              <div className="w-full md:w-2/3 lg:w-1/2">
                <MintForm
                  includeCoverImage={
                    validVideoExtensions.find((f) =>
                      file.name.toLowerCase().endsWith("." + f)
                    ) !== undefined ||
                    validAudioExtensions.find((f) =>
                      file.name.toLowerCase().endsWith("." + f)
                    ) !== undefined ||
                    valid3DExtensions.find((f) =>
                      file.name.toLowerCase().endsWith("." + f)
                    ) !== undefined
                  }
                  onComplete={mint}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MintPage;
