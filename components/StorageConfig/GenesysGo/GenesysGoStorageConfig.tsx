import { useEffect, useState } from "react";
import { ShdwDrive, StorageAccountResponse } from "@shadow-drive/sdk";
import * as anchor from "@project-serum/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LoaderIcon, toast } from "react-hot-toast";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import { PublicKey } from "@solana/web3.js";

const bytesToHuman = (bytes: any, si = false, dp = 1) => {
  const thresh = si ? 1024 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};

export interface GenesysGoStorageOptions {
  shadowDrive: ShdwDrive;
  storageAccount: PublicKey;
}

interface Props {
  didChangeOptions: (options: GenesysGoStorageOptions | undefined) => void;
}

const GenesysGoStorageConfig: React.FC<Props> = ({ didChangeOptions }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [drive, setDrive] = useState<ShdwDrive>();
  const [accountName, setAccountName] = useState<string | undefined>();
  const [accountSize, setAccountSize] = useState<string | undefined>();
  const [accountResponse, setAccountResponse] =
    useState<StorageAccountResponse>();
  const [accountResponses, setAccountResponses] = useState<
    Array<StorageAccountResponse>
  >([]);
  const [isCreatingAccount, setCreatingAccount] = useState(false);
  const [uploadLocs, setUploadLocs] = useState<any>();
  const [isNewStorageAccount, setIsNewStorageAccount] = useState(false);
  const [isRefreshingAccounts, setRefreshingAccounts] = useState(false);

  const displayInitDriveError = () => {
    toast.error(
      "Shadow Drive not yet initialized. Please check your wallet connection and try again."
    );
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const drive = await new ShdwDrive(connection, wallet).init();
        await setDrive(drive);
      }
    })();
  }, [wallet, wallet?.publicKey, connection]);

  const refreshAccounts = async () => {
    if (!drive) {
      displayInitDriveError();
      return;
    }
    setRefreshingAccounts(true);
    const responses = await drive.getStorageAccounts("v2");
    setAccountResponses(responses);
    setRefreshingAccounts(false);
  };

  useEffect(() => {
    if (drive) {
      refreshAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drive]);

  const createAccount = async () => {
    if (!drive) {
      displayInitDriveError();
      return;
    }
    if (!accountName || !accountSize) {
      toast.error("An account name and size is required.");
      return;
    }

    try {
      setCreatingAccount(true);
      const result = await drive.createStorageAccount(
        accountName,
        accountSize,
        "v2"
      );
      toast.success(`Storage Account '${accountName}' Created`);
    } catch (e) {
      if (e instanceof Error) {
        if (!e.message.includes("User rejected the request")) {
          toast.error("Error creating account: " + e.message);
        }
      }
      console.log(e);
    }
    await refreshAccounts();
    setCreatingAccount(false);
  };

  const optionNameForResponse = (response: StorageAccountResponse): string => {
    return (
      response.account.identifier +
      " - " +
      bytesToHuman(new anchor.BN(response.account.storage).toNumber()) +
      " drive"
    );
  };

  const createStorageValue = "__CREATE__";

  const storageAccountDidChange = (val: string) => {
    let account = undefined;

    if (val === createStorageValue) {
      setAccountResponse(undefined);
      setIsNewStorageAccount(true);
    } else {
      setIsNewStorageAccount(false);
      if (val === "") {
        setAccountResponse(undefined);
      } else {
        const response = accountResponses.find(
          (r) => r.publicKey.toString() === val
        );
        setAccountResponse(response);
        account = response?.publicKey;
      }
    }

    didChangeOptions(
      drive && account
        ? {
            shadowDrive: drive,
            storageAccount: account,
          }
        : undefined
    );
  };

  return (
    <div>
      <label htmlFor="storageAccountName">GenesysGo Storage Account</label>
      <div className="mb-4 flex gap-2 justify-start items-center">
        <div>
          <select
            className="min-w-[200px]"
            defaultValue=""
            onChange={(e) => {
              storageAccountDidChange(e.target.value);
            }}
          >
            <option value="Select an Account"></option>
            {accountResponses.map((response, index) => {
              return (
                <option key={index} value={response.publicKey.toString()}>
                  {optionNameForResponse(response)}
                </option>
              );
            })}
            <option value={createStorageValue}>+ Create a New Account</option>
          </select>
        </div>
        <button
          className="button thinbutton flex justify-center items-center text-white text-xs"
          onClick={(e) => {
            e.preventDefault();
            refreshAccounts();
          }}
        >
          {isRefreshingAccounts ? <LoaderIcon /> : "Refresh"}
        </button>
      </div>

      {isNewStorageAccount && (
        <div>
          <label className="mb-4">
            Create a New Storage Account: (requires{" "}
            <a
              href="https://jup.ag/swap/SOL-SHDW"
              target="_blank"
              rel="noreferrer"
            >
              SHDW
            </a>
            )
          </label>
          <div className="sm:flex sm:items-end space-x-2">
            <div className="floatingLabelGroup">
              <label htmlFor="storageAccountName" className="floatingLabel">
                Name
              </label>
              <input
                type="text"
                name="storageAccountName"
                id="storageAccountName"
                disabled={isCreatingAccount}
                placeholder="skeleton-crew"
                value={accountName}
                className="block w-full text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="floatingLabelGroup sm:w-[260px]">
              <label htmlFor="storageAccountSize" className="floatingLabel">
                Size
              </label>
              <input
                type="text"
                name="storageAccountSize"
                id="storageAccountName"
                disabled={isCreatingAccount}
                placeholder="ex. '100KB', '1MB' or '10GB'"
                value={accountSize}
                className="block w-full text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                onChange={(e) => setAccountSize(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button thinbutton mb-1 sm:ml-3 sm:w-auto"
              onClick={(e) => {
                e.preventDefault();
                createAccount();
              }}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <div className="flex justify-center items-center w-full h-full text-white text-md">
                  <LoaderIcon />
                </div>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenesysGoStorageConfig;
