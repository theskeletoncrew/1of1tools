import React from "react";
import { useSolanaSignIn } from "components/Auth";
import { shortenedAddress } from "utils";

export const SolanaAuthButton = () => {
  const {
    authenticate,
    wallet,
    walletNotSelected,
    publicKey,
    disconnectWallet,
  } = useSolanaSignIn();

  const pubKeySlice = publicKey ? shortenedAddress(publicKey.toString()) : null;

  return (
    <div className="flex flex-col items-center">
      <button
        className="button walletButton thinbutton solana-auth-btn sign-in gap-2"
        onClick={() => authenticate()}
      >
        {wallet && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            width={18}
            height={18}
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
          />
        )}{" "}
        Sign in
        {/* {!walletNotSelected && pubKeySlice ? " with " + pubKeySlice : ""} */}
      </button>

      {/* {wallet && (
        <button
          className="solana-auth-btn change-wallet text-[11px] font-display text-slate-400 bold mt-10 hover:underline"
          onClick={() => disconnectWallet()}
        >
          or use a different wallet
        </button>
      )} */}
    </div>
  );
};
