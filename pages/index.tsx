import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { NftsByAddressForm } from "components/Forms/NftsByAddress";
import { NftsByCreatorForm } from "components/Forms/NftsByCreator";
import { NftsByWalletOwnerForm } from "components/Forms/NftsByWalletOwner";
import { NftsByCollectionForm } from "components/Forms/NftsByCollection";
import Layout from "components/Layout/Layout";
import { SolanaAuthButton } from "components/Auth";
import { shortPubKey } from "utils";
import { signOut, useSession } from "next-auth/react";

enum SearchTab {
  creator,
  addresses,
  wallet,
  collection,
}

const tabsMap: Map<SearchTab, string> = new Map([
  [SearchTab.addresses, "Address"],
  [SearchTab.creator, "Creator"],
  [SearchTab.wallet, "Owner"],
  [SearchTab.collection, "Collection"],
]);

const Home: NextPage = () => {
  const [currentTab, setCurrentTab] = useState<SearchTab>(SearchTab.addresses);

  const { data: session, status } = useSession();

  return (
    <Layout isHome={true}>
      <div className="h-full">
        <Head>
          <title>one / one</title>
          <meta name="description" content="one / one tools" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="absolute top-5 right-5">
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
          ) : status == "loading" ? (
            "Signing in..."
          ) : (
            <SolanaAuthButton />
          )}
        </div>

        <div className="mx-auto w-full sm:w-[600px]">
          <div className="flex relative items-center justify-center h-[80px] text-sky-500 text-center mx-auto text-3xl font-medium ">
            <div className="absolute -inset-px rounded-xl opacity-75 border-2 border-transparent [background:linear-gradient(var(--quick-links-hover-bg,theme(colors.sky.50)),var(--quick-links-hover-bg,theme(colors.sky.50)))_padding-box,linear-gradient(to_top,theme(colors.indigo.400),theme(colors.cyan.400),theme(colors.sky.500))_border-box] dark:[--quick-links-hover-bg:theme(colors.slate.800)]"></div>
            <h2 className="relative">one / one</h2>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row items-center sm:items-start justify-between">
            <h1 className="text-slate-400">Search for NFTs:</h1>
            <ul className="flex gap-6">
              {[...tabsMap.entries()].map(([tabType, tabName]) => (
                <li key={tabName}>
                  <a
                    href="#"
                    onClick={() => setCurrentTab(tabType)}
                    className={
                      tabType == currentTab
                        ? "underline text-indigo-400"
                        : "text-indigo-500"
                    }
                  >
                    {tabName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2 h-[300px]">
            <ul className="bg-white bg-opacity-5 text-white rounded-lg overflow-hidden">
              <li className={currentTab == SearchTab.creator ? "" : "hidden"}>
                <NftsByCreatorForm />
              </li>
              <li className={currentTab == SearchTab.addresses ? "" : "hidden"}>
                <NftsByAddressForm />
              </li>
              <li className={currentTab == SearchTab.wallet ? "" : "hidden"}>
                <NftsByWalletOwnerForm />
              </li>
              <li
                className={currentTab == SearchTab.collection ? "" : "hidden"}
              >
                <NftsByCollectionForm />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
