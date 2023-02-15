// import { useWallet } from "@solana/wallet-adapter-react";
import { SolanaAuthButton } from "components/Auth/SolanaAuthButton";
import { signOut, useSession } from "next-auth/react";
import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowLeftOnRectangleIcon,
  BellAlertIcon,
  PlusCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { classNames, shortPubKey } from "utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalButton } from "@solana/wallet-adapter-react-ui";
import { toast } from "react-hot-toast";

const AuthenticationRow: React.FC = () => {
  const { data: session, status } = useSession();
  const { wallet, connected, disconnect, publicKey } = useWallet();

  const copyAddressToClipboard = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      toast.success("Copied!");
    }
  };

  const navigationItems = [
    {
      name: "Mint an NFT/SFT",
      description:
        "Create 1/1s, Limited Editions, Open Editions, Collections, and Allowlist Tokens. Save to your wallet or send via email.",
      href: "/mint",
      icon: PlusCircleIcon,
      onClick: null,
    },
    {
      name: "Account Settings",
      description: "Mange your wallets, and notification subscriptions.",
      href: "/account/wallets",
      icon: BellAlertIcon,
      onClick: null,
    },
    {
      name: "Logout",
      description: "Sign out of your account.",
      href: "#",
      icon: ArrowLeftOnRectangleIcon,
      onClick: () => {
        signOut();
      },
    },
  ];

  const walletItems = [
    {
      name: "Copy Address",
      href: "#",
      onClick: () => {
        copyAddressToClipboard();
      },
      icon: PlusCircleIcon,
    },
    {
      name: "Disconnect",
      href: "#",
      onClick: () => {
        disconnect();
      },
      icon: PlusCircleIcon,
    },
  ];

  return (
    <>
      {session ? (
        <div className="flex gap-4 items-center text-sm text-indigo-400">
          {wallet && connected ? (
            <>
              <Popover className="relative">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={classNames(
                        open ? "text-indigo-500" : "text-indigo-400",
                        "group inline-flex items-center rounded-md text-sm font-medium hover:text-indigo-300 py-3"
                      )}
                    >
                      <WalletIcon
                        className={classNames(
                          open ? "text-indigo-500" : "text-indigo-400",
                          "mr-2 h-5 w-5 group-hover:text-indigo-300"
                        )}
                        aria-hidden="true"
                      />
                      <span>{shortPubKey(publicKey)}</span>
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel
                        className={classNames(
                          "absolute left-1/2 z-10 mt-3 w-screen max-w-[200px] px-2 sm:px-0 -translate-x-1/2 transform"
                        )}
                      >
                        {({ close }) => (
                          <div className="overflow-hidden rounded-lg shadow-lg">
                            <div
                              className={classNames(
                                "relative grid gap-2 bg-white p-4",
                                navigationItems.length > 3
                                  ? "lg:grid-cols-2"
                                  : ""
                              )}
                            >
                              {walletItems.map((item) => (
                                <Link href={item.href} key={item.name}>
                                  <a
                                    onClick={() => {
                                      item.onClick && item.onClick();
                                      close();
                                    }}
                                    className="text-center rounded-lg p-3 transition duration-150 ease-in-out hover:bg-slate-100"
                                  >
                                    <div>
                                      <p className="text-base font-medium text-gray-900">
                                        {item.name}
                                      </p>
                                    </div>
                                  </a>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>

              <EllipsisVerticalIcon
                className="text-indigo-400 h-5 w-5"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <button
                className="walletButton thinbutton solana-auth-btn relative whitespace-nowrap"
                onClick={(e) => {
                  const buttons =
                    document.getElementsByClassName("hiddenWalletButton");
                  if (buttons.length > 0) {
                    (buttons.item(0) as HTMLElement).click();
                  }
                }}
              >
                Connect Wallet
              </button>
              <WalletModalButton className="hiddenWalletButton absolute opacity-0 w-0 h-0 overflow-hidden" />
            </>
          )}

          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={classNames(
                    open ? "text-indigo-500" : "text-indigo-400",
                    "group inline-flex items-center rounded-md text-sm font-medium hover:text-indigo-300 py-3"
                  )}
                >
                  <span>
                    <span className="hidden md:inline">welcome back </span>
                    {session.user?.account
                      ? `@${session.user.account.username}`
                      : shortPubKey(session.user?.id)}
                  </span>
                  <ChevronDownIcon
                    className={classNames(
                      open ? "text-indigo-500" : "text-indigo-400",
                      "ml-1 h-5 w-5 group-hover:text-indigo-300"
                    )}
                    aria-hidden="true"
                  />
                </Popover.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel
                    className={classNames(
                      "absolute right-0 z-10 mt-3 w-screen max-w-md px-2 sm:px-0",
                      navigationItems.length > 3 ? "lg:max-w-3xl" : ""
                    )}
                  >
                    {({ close }) => (
                      <div className="overflow-hidden rounded-lg shadow-lg">
                        <div
                          className={classNames(
                            "relative grid gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8",
                            navigationItems.length > 3 ? "lg:grid-cols-2" : ""
                          )}
                        >
                          {navigationItems.map((item) => (
                            <Link href={item.href} key={item.name}>
                              <a
                                onClick={() => {
                                  item.onClick && item.onClick();
                                  close();
                                }}
                                className="-m-3 flex items-start rounded-lg p-3 transition duration-150 ease-in-out hover:bg-slate-100"
                              >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-indigo-500 text-white sm:h-12 sm:w-12">
                                  <item.icon
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                  />
                                </div>
                                <div className="ml-4">
                                  <p className="text-base font-medium text-gray-900 -mt-[2px]">
                                    {item.name}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.description}
                                  </p>
                                </div>
                              </a>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
      ) : status == "unauthenticated" ? (
        <SolanaAuthButton />
      ) : (
        ""
      )}
    </>
  );
};

export default AuthenticationRow;
