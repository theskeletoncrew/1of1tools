import { Metaplex, MetaplexFile } from "@metaplex-foundation/js";
import { StorageProvider } from "components/MintForm/MintForm";
import { GenesysGoStorageOptions } from "components/StorageConfig/GenesysGo/GenesysGoStorageConfig";
import { uuid } from "uuidv4";

export const uploadFile = async (
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

export const uploadMetadata = async (
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
