import React from "react";
import { useSolanaSignIn } from "components/Auth";

export const SolanaAuthButton = () => {
  const { authenticate, wallet, walletNotSelected } = useSolanaSignIn();

  return (
    <div className="flex flex-col items-center">
      <button
        className="button walletButton thinbutton solana-auth-btn sign-in gap-2"
        onClick={() => authenticate()}
      >
        {wallet && !walletNotSelected && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            width={18}
            height={18}
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
          />
        )}{" "}
        Sign in
      </button>
    </div>
  );
};
