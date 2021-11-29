import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import { useRouter } from "next/router";
import { PublicKey } from "@solana/web3.js";
import {
  Metaplex,
  toMetaplexFileFromBrowser,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
import { network } from "utils/network";
import { useRef, useState } from "react";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import MintForm, { NFTFormData } from "components/MintForm/MintForm";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { pubKeyUrl, shortenedAddress } from "utils";
import Image from "next/image";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

function pause(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}

const Model = dynamic(() => import("components/Model"), { ssr: false });

const validImageFormats = [".jpg", ".jpeg", ".png", ".gif"];
const validVideoFormats = [".mp4", ".mov", ".webm", ".m4v", ".ogv", ".ogg"];
const validAudioFormats = [".mp3", ".wav", ".oga", ".flac"];
const valid3DFormats = [".glb", ".gltf", ".gltf-binary"];

const MintPage: NextPage = () => {
  const [isLoading, setLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<string>();
  const [isEditingNFT, setEditingNFT] = useState(false);
  const [mintedNFTAddress, setMintedNFTAddress] = useState<string>();
  const [mintedWithCrossMint, setMintedWithCrossMint] = useState(false);

  const router = useRouter();

  const wallet = useWallet();
  const { connection } = useConnection();
  const [file, setFile] = useState<File>();
  const [coverFile, setCoverFile] = useState<File>();
  const progressToastId = useRef<string | null>(null);

  const updatedFileForNFT = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingNFT(true);
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const mint = async (metadata: NFTFormData, isCrossmint: boolean) => {
    try {
      setMintingStatus("Minting...");
      setMintedWithCrossMint(isCrossmint);

      if (!wallet || !wallet.connected || !wallet.publicKey) {
        throw new Error("No wallet connected.");
      }

      if (!file) {
        throw new Error("No media file provided.");
      }

      let recipientEmail: string | null = null;

      if (isCrossmint) {
        recipientEmail = prompt("Enter recipient email address");
        if (!recipientEmail) {
          return;
        }
      }

      const mx = Metaplex.make(connection);
      mx.use(walletAdapterIdentity(wallet));
      mx.use(
        nftStorage({
          token: process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY ?? "",
        })!
      );

      setMintingStatus(`Uploading media file...`);
      const mediaFile = await toMetaplexFileFromBrowser(file);
      const mediaFileLocation = await mx.storage().upload(mediaFile);
      const fullMediaLocation = `${mediaFileLocation}?ext=${mediaFile.extension?.toLowerCase()}`;

      let fullCoverLocation: string | undefined;
      let files: { type: string; uri: string }[] = [
        { type: file.type, uri: fullMediaLocation },
      ];

      if (coverFile) {
        setMintingStatus(`Uploading cover file...`);
        const coverMediaFile = await toMetaplexFileFromBrowser(coverFile);
        const coverFileLocation = await mx.storage().upload(coverMediaFile);
        fullCoverLocation = `${coverFileLocation}?ext=${coverMediaFile.extension?.toLowerCase()}`;
      }

      const jsonMetadata = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        seller_fee_basis_points: metadata.royalties * 100,
        image: fullCoverLocation ?? fullMediaLocation,
        attributes: metadata.attributes
          .filter((a) => a.name.length > 0 && a.value.length > 0)
          .map((a) => {
            return { trait_type: a.name, value: a.value };
          }),
        properties: {
          creators: metadata.creators.map((c) => {
            return { address: c.address, share: c.percent };
          }),
          files: files,
        },
      };

      if (isCrossmint && recipientEmail) {
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
        setMintingStatus("Uploading metadata...");
        const { uri: newUri } = await mx.nfts().uploadMetadata(jsonMetadata);

        setMintingStatus("Writing to blockchain...");
        const result = await mx.nfts().create({
          /** The URI that points to the JSON metadata of the asset. */
          uri: newUri,
          name: metadata.name,
          sellerFeeBasisPoints: metadata.royalties * 100,
          symbol: metadata.symbol,
          creators: metadata.creators.map((c) => {
            return { address: new PublicKey(c.address), share: c.percent };
          }),
        });

        setMintedNFTAddress(result.mintAddress.toString());
      }

      progressToastId.current && toast.dismiss(progressToastId.current);
      progressToastId.current = null;
      toast.success("Mint complete!");
    } catch (error) {
      progressToastId.current && toast.dismiss(progressToastId.current);
      progressToastId.current = null;

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Minting failure");
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
                  accept={validImageFormats
                    .concat(validVideoFormats)
                    .concat(validAudioFormats)
                    .concat(valid3DFormats)
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
          </div>
        ) : (
          <>
            <div className="flex gap-8 flex-col md:flex-row mt-8 px-1">
              <div className="relative w-full md:w-1/3 lg:w-1/2">
                {validImageFormats.find((f) =>
                  file.name.toLowerCase().endsWith(f)
                ) ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="NFT Image"
                    className="w-full"
                  />
                ) : validVideoFormats.find((f) =>
                    file.name.toLowerCase().endsWith(f)
                  ) ? (
                  <video autoPlay controls loop>
                    <source src={URL.createObjectURL(file)} />
                  </video>
                ) : validAudioFormats.find((f) =>
                    file.name.toLowerCase().endsWith(f)
                  ) ? (
                  <audio autoPlay controls loop>
                    <source src={URL.createObjectURL(file)} />
                  </audio>
                ) : valid3DFormats.find((f) =>
                    file.name.toLowerCase().endsWith(f)
                  ) ? (
                  <Model src={URL.createObjectURL(file)}></Model>
                ) : (
                  file.name
                )}
              </div>
              <div className="w-full md:w-2/3 lg:w-1/2">
                <MintForm
                  includeCoverImage={
                    validVideoFormats.find((f) =>
                      file.name.toLowerCase().endsWith(f)
                    ) !== undefined ||
                    validAudioFormats.find((f) =>
                      file.name.toLowerCase().endsWith(f)
                    ) !== undefined ||
                    valid3DFormats.find((f) =>
                      file.name.toLowerCase().endsWith(f)
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
