import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LoaderIcon, toast } from "react-hot-toast";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WebBundlr } from "@bundlr-network/client";
import BigNumber from "bignumber.js";

export interface ArweaveStorageOptions {
  bundlr: WebBundlr;
}

interface Props {
  didChangeOptions: (options: ArweaveStorageOptions | undefined) => void;
}

const ArweaveStorageConfig: React.FC<Props> = ({ didChangeOptions }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [bundlr, setBundlr] = useState<WebBundlr>();
  const [bundlrBalance, setBundlrBalance] = useState<BigNumber>();
  const [isAddingFunds, setAddingFunds] = useState(false);
  const [isWithdrawingFunds, setWithdrawingFunds] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        try {
          const myBundlr = new WebBundlr(
            "https://node1.bundlr.network",
            "solana",
            wallet,
            {
              providerUrl:
                process.env.NEXT_PUBLIC_SOLANA_MAINNET_ENDPOINT || "",
            }
          );
          await myBundlr.ready();
          setBundlr(myBundlr);
        } catch (error) {
          toast.error("Failed to initialize Bundlr.");
          console.log(error);
        }
      }
    })();
  }, [wallet, wallet?.publicKey, connection]);

  useEffect(() => {
    if (bundlr) {
      refreshBalance();
      didChangeOptions({ bundlr });
    }
  }, [bundlr]);

  const refreshBalance = async () => {
    if (!wallet || !wallet.publicKey) {
      toast.error("Connect your wallet first.");
      return;
    }
    if (!bundlr) {
      toast.error("Bundlr is not yet initialized.");
      return;
    }
    try {
      const curBalance = await bundlr.getBalance(wallet.publicKey.toString());
      setBundlrBalance(curBalance);
    } catch (error) {
      console.log("Failed to refresh Bundlr balance");
      console.log(error);
    }
  };

  const addFunds = async () => {
    if (!bundlr) {
      toast.error("Bundlr is not yet initialized.");
      return;
    }
    try {
      const fundsToAddStr = prompt("How much SOL do you want to add?");
      if (fundsToAddStr) {
        const fundsToAdd = Math.floor(
          LAMPORTS_PER_SOL * parseFloat(fundsToAddStr)
        );
        if (isNaN(fundsToAdd) || fundsToAdd <= 0) {
          toast.error("Invalid input");
          return;
        }

        setAddingFunds(true);
        const resp = await bundlr.fund(fundsToAdd);
        refreshBalance();
      }
    } catch (error) {
      toast.error("Failed to fund Bundlr balance");
      console.log(error);
    }
    setAddingFunds(false);
  };

  const withdrawFunds = async () => {
    if (!bundlr) {
      toast.error("Bundlr is not yet initialized.");
      return;
    }
    try {
      const fundsToWithdrawStr = prompt(
        "How much SOL do you want to withdraw?",
        bundlrBalance
          ? bundlrBalance.dividedBy(LAMPORTS_PER_SOL).minus(0.000005).toString()
          : undefined
      );
      if (fundsToWithdrawStr) {
        const fundsToWithdraw = Math.floor(
          LAMPORTS_PER_SOL * parseFloat(fundsToWithdrawStr)
        );
        if (isNaN(fundsToWithdraw) || fundsToWithdraw <= 0) {
          toast.error("Invalid input");
          return;
        }

        setWithdrawingFunds(true);
        const resp = await bundlr.withdrawBalance(fundsToWithdraw);
        refreshBalance();
      }
    } catch (error) {
      toast.error("Failed to withdraw Bundlr balance");
      console.log(error);
    }
    setWithdrawingFunds(false);
  };

  return (
    <div>
      <label htmlFor="storageAccountName">Bundlr</label>
      <div className="mb-4 flex gap-2 justify-start items-center">
        <p>
          <>
            Balance:{" "}
            {bundlr && bundlrBalance
              ? bundlr.utils
                  .unitConverter(bundlrBalance)
                  .toFixed(7, 2)
                  .toString() + " SOL"
              : "Loading..."}
          </>
        </p>
        <button
          className="button thinbutton flex justify-center items-center text-white text-xs"
          onClick={(e) => {
            e.preventDefault();
            addFunds();
          }}
        >
          {isAddingFunds ? <LoaderIcon /> : "Add Funds"}
        </button>
        {bundlrBalance &&
          bundlrBalance
            .dividedBy(LAMPORTS_PER_SOL)
            .minus(0.000005)
            .isGreaterThan(0) && (
            <button
              className="button thinbutton flex justify-center items-center text-white text-xs"
              onClick={(e) => {
                e.preventDefault();
                withdrawFunds();
              }}
            >
              {isWithdrawingFunds ? <LoaderIcon /> : "Withdraw Funds"}
            </button>
          )}
      </div>
      <p className="text-sky-400 text-xs">
        1of1.tools uses Bundlr for Arweave uploads. Fund your account before
        minting. Any unused funds can be withdrawn after.
      </p>
    </div>
  );
};

export default ArweaveStorageConfig;
