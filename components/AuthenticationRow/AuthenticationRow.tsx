// import { useWallet } from "@solana/wallet-adapter-react";
import { SolanaAuthButton } from "components/Auth/SolanaAuthButton";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { shortPubKey } from "utils";

const AuthenticationRow: React.FC = () => {
  const { data: session, status } = useSession();
  // const { wallet, publicKey, disconnect } = useWallet();

  return (
    <>
      {session ? (
        <div className="flex gap-2 text-slate-200">
          <span>Signed in as:</span>
          <span>
            <Link href={`/wallet/${session.user?.id}`}>
              <a>
                {session.user?.account
                  ? `@${session.user.account.username}`
                  : shortPubKey(session.user?.id)}
              </a>
            </Link>
          </span>
          <span>|</span>
          <span>
            <Link href={`/mint`}>
              <a>Mint an NFT</a>
            </Link>
          </span>
          <span>|</span>
          <span>
            <Link href={`/account/wallets`}>
              <a>Account Settings</a>
            </Link>
          </span>
          <span>|</span>
          <a
            href="#"
            onClick={() => {
              signOut();
            }}
          >
            Logout
          </a>
        </div>
      ) : // <>
      //   <button
      //     className="walletButton relative whitespace-nowrap"
      //     onClick={(e) => {
      //       const buttons =
      //         document.getElementsByClassName("hiddenWalletButton");
      //       if (buttons.length > 0) {
      //         (buttons.item(0) as HTMLElement).click();
      //       }
      //     }}
      //   >
      //     Connect Wallet
      //   </button>
      //   <WalletModalButton className="hiddenWalletButton absolute opacity-0 w-0 h-0 overflow-hidden" />
      // </>
      status == "unauthenticated" ? (
        <SolanaAuthButton />
      ) : (
        ""
      )}
    </>
  );
};

export default AuthenticationRow;
