import Link from "next/link";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { signOut, useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SolanaAuthButton } from "components/Auth";
import { shortPubKey } from "utils";

interface Props {}

const MainNavigation: React.FC<Props> = ({}) => {
  const { data: session, status } = useSession();
  const { wallet, publicKey, disconnect } = useWallet();

  return (
    <nav>
      <ul className="flex justify-between items-center text-sm">
        <li>
          <Link href="/">
            <a className="text-indigo-500">one / one</a>
          </Link>
        </li>
        <li>
          {session ? (
            <div className="flex gap-3">
              <span>
                Signed in as:{" "}
                <a href={`/wallet/${session.user?.name}`}>
                  {shortPubKey(session.user?.name)}
                </a>
              </span>
              <span>|</span>
              <span>
                <a href={`/mint`}>Mint an NFT</a>
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
          {/* <a
            href="https://discord.gg/skeletoncrewrip"
            className="text-indigo-500 text-xs"
          >
            Another SKULLISH Skeleton Crew Product
          </a> */}
        </li>
      </ul>
    </nav>
  );
};

export default MainNavigation;
