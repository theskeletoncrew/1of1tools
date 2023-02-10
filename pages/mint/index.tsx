import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Metaplex,
  MetaplexFile,
  toMetaplexFileFromBrowser,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
import { network } from "utils/network";
import { useState } from "react";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import MintForm, {
  NFTFormData,
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
import { GenesysGoStorageOptions } from "components/StorageConfig/GenesysGo/GenesysGoStorageConfig";
import { ShadowFile } from "@shadow-drive/sdk";

function pause(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}
import { uuid } from "uuidv4";

const Model = dynamic(() => import("components/Model"), { ssr: false });

const MintPage: NextPage = () => {
  const [mintingStatus, setMintingStatus] = useState<string>();
  const [isEditingNFT, setEditingNFT] = useState(false);
  const [mintedNFTAddress, setMintedNFTAddress] = useState<string>();
  const [mintedWithCrossMint, setMintedWithCrossMint] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string>();

  const router = useRouter();

  const wallet = useWallet();
  const { connection } = useConnection();
  const [file, setFile] = useState<File>();

  const updatedFileForNFT = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingNFT(true);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (
    file: File,
    metaplexFile: MetaplexFile,
    mx: Metaplex,
    storageProvider: StorageProvider,
    storageOptions: GenesysGoStorageOptions | undefined
  ): Promise<string> => {
    if (storageProvider === StorageProvider.NFTStorage) {
      const remoteURL = await mx.storage().upload(metaplexFile);
      return remoteURL;
    } else if (storageProvider === StorageProvider.GenesysGo) {
      const options = storageOptions!;
      const uploadResponse = await options.shadowDrive.uploadFile(
        options.storageAccount,
        file
      );

      if (
        uploadResponse.upload_errors.length > 0 ||
        uploadResponse.finalized_locations.length < 1
      ) {
        console.log(uploadResponse.message);
        console.log(uploadResponse.upload_errors);
        throw new Error("Error uploading media file to Shadow Drive");
      }

      const remoteURL = uploadResponse.finalized_locations[0]!;
      return remoteURL;
    } else {
      throw new Error("Unknown Storage Provider");
    }
  };

  const uploadMetadata = async (
    jsonMetadata: any,
    mx: Metaplex,
    storageProvider: StorageProvider,
    storageOptions: GenesysGoStorageOptions | undefined
  ): Promise<string> => {
    if (storageProvider === StorageProvider.NFTStorage) {
      const { uri } = await mx.nfts().uploadMetadata(jsonMetadata);
      return uri;
    } else if (storageProvider === StorageProvider.GenesysGo) {
      const options = storageOptions!;
      const jsonBuffer = Buffer.from(JSON.stringify(jsonMetadata));
      const file = new File([jsonBuffer], uuid() + ".json");
      // const shadowFile = {
      //   name: ,
      //   file: new Blob([jsonBuffer]),
      // } as ShadowFile;
      const uploadResponse = await options.shadowDrive.uploadFile(
        options.storageAccount,
        file
      );
      if (
        uploadResponse.upload_errors.length > 0 ||
        uploadResponse.finalized_locations.length < 1
      ) {
        console.log(uploadResponse.message);
        console.log(uploadResponse.upload_errors);
        throw new Error("Error uploading media file to Shadow Drive");
      }

      const remoteURL = uploadResponse.finalized_locations[0]!;
      return remoteURL;
    } else {
      throw new Error("Unknown Storage Provider");
    }
  };

  const mint = async (
    metadata: NFTFormData,
    coverImage: File | undefined,
    isCrossmint: boolean,
    storageProvider: StorageProvider,
    storageOptions: GenesysGoStorageOptions | undefined
  ) => {
    try {
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

      let recipientEmail: string | null = null;

      if (isCrossmint) {
        recipientEmail = prompt("Enter recipient email address");
        if (!recipientEmail) {
          return;
        }
        setRecipientEmail(recipientEmail);
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

      setMintingStatus(`Uploading media file...`);
      console.log("Uploading media file...");
      const mediaFile = await toMetaplexFileFromBrowser(file);
      let mediaFileLocation = await uploadFile(
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
        setMintingStatus(`Uploading cover file...`);
        console.log("Uploading cover file...");
        const coverMediaFile = await toMetaplexFileFromBrowser(coverImage);
        let coverFileLocation = await uploadFile(
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
        const result = await mx.nfts().create({
          /** The URI that points to the JSON metadata of the asset. */
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
        });

        setMintedNFTAddress(result.mintAddress.toString());
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

        {!isEditingNFT || !file ? (
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
              href={pubKeyUrl(
                mintedNFTAddress,
                mintedWithCrossMint ? WalletAdapterNetwork.Devnet : network
              )}
              rel="noreferrer"
              target="_blank"
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
