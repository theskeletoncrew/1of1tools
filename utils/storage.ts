import { WebBundlr } from "@bundlr-network/client";
import { Metaplex, MetaplexFile } from "@metaplex-foundation/js";
import { ShdwDrive } from "@shadow-drive/sdk";
import { PublicKey } from "@solana/web3.js";
import { StorageProvider } from "components/MintForm/MintForm";
import { ArweaveStorageOptions } from "components/StorageConfig/Arweave/ArweaveStorageConfig";
import { GenesysGoStorageOptions } from "components/StorageConfig/GenesysGo/GenesysGoStorageConfig";
import { uuid } from "uuidv4";
var fileReaderStream = require("filereader-stream");

export const uploadFile = async (
  file: File,
  metaplexFile: MetaplexFile,
  mx: Metaplex,
  storageProvider: StorageProvider,
  storageOptions: GenesysGoStorageOptions | ArweaveStorageOptions | undefined
): Promise<string> => {
  if (storageProvider === StorageProvider.NFTStorage) {
    const remoteURL = await mx.storage().upload(metaplexFile);
    return remoteURL;
  } else if (storageProvider === StorageProvider.GenesysGo) {
    const options = storageOptions! as GenesysGoStorageOptions;
    return await uploadFileGenesysGo(
      file,
      options.shadowDrive,
      options.storageAccount
    );
  } else if (storageProvider === StorageProvider.Arweave) {
    const options = storageOptions! as ArweaveStorageOptions;
    const dataStream = fileReaderStream(file);
    return await uploadFileArweave(dataStream, file.type, options.bundlr);
  } else {
    throw new Error("Unknown Storage Provider");
  }
};

export const uploadMetadata = async (
  jsonMetadata: any,
  mx: Metaplex,
  storageProvider: StorageProvider,
  storageOptions: GenesysGoStorageOptions | ArweaveStorageOptions | undefined
): Promise<string> => {
  if (storageProvider === StorageProvider.NFTStorage) {
    const { uri } = await mx.nfts().uploadMetadata(jsonMetadata);
    return uri;
  } else if (storageProvider === StorageProvider.GenesysGo) {
    const options = storageOptions! as GenesysGoStorageOptions;
    const jsonBuffer = Buffer.from(JSON.stringify(jsonMetadata));
    const file = new File([jsonBuffer], uuid() + ".json");
    return uploadFileGenesysGo(
      file,
      options.shadowDrive,
      options.storageAccount
    );
  } else if (storageProvider === StorageProvider.Arweave) {
    const options = storageOptions! as ArweaveStorageOptions;
    const jsonBuffer = Buffer.from(JSON.stringify(jsonMetadata));
    return await uploadFileArweave(
      jsonBuffer,
      "application/json",
      options.bundlr
    );
  } else {
    throw new Error("Unknown Storage Provider");
  }
};

const uploadFileGenesysGo = async (
  file: File,
  shadowDrive: ShdwDrive,
  storageAccount: PublicKey
): Promise<string> => {
  const uploadResponse = await shadowDrive.uploadFile(storageAccount, file);

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
};

const uploadFileArweave = async (
  toUpload: string | Buffer,
  fileType: string,
  bundlr: WebBundlr
): Promise<string> => {
  const tx = await bundlr.upload(toUpload, {
    tags: [{ name: "Content-Type", value: fileType }],
  });
  return `https://arweave.net/${tx.id}`;
};
