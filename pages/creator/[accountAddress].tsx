import type { NextPage } from "next";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useRouter } from "next/router";
import { notEmpty, shortenedAddress, shortPubKey } from "utils";
import Header from "components/Header/Header";
import ErrorMessage from "components/ErrorMessage/ErrorMessage";
import { NFTMetadata } from "models/nftMetadata";
import NFTGrid from "components/NFTGrid/NFTGrid";
import { NFTS_PER_PAGE } from "utils/config";
import LoadingIndicator from "components/LoadingIndicator/LoadingIndicator";
import TwitterHandle from "components/TwitterHandle/TwitterHandle";
import Layout from "components/Layout/Layout";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import LoadingGrid from "components/LoadingGrid/LoadingGrid";
import {
  loadBonfidaName,
  loadTwitterName,
  resolveWalletAddress,
} from "utils/addressResolution";
import NotificationSubscriptionModal from "components/NotificationSubscriptionModal/NotificationSubscriptionModal";

const CreatorPage: NextPage = () => {
  const [isLoading, setLoading] = useState(false);

  const router = useRouter();
  const accountInput = router.query.accountAddress as string;

  const { data: session } = useSession();

  const [accountAddress, setAccountAddress] = useState<string>();
  const [eventsPaginationToken, setEventsPaginationToken] = useState<
    string | null
  >();
  const [nfts, setNfts] = useState<Map<string, NFTMetadata>>(new Map());
  const [hasMore, setHasMore] = useState(true);

  const [bonfidaName, setBonfidaName] = useState<string>();
  const [twitterName, setTwitterName] = useState<string>();

  const [isShowingNotificationsModal, setIsShowingNotificationsModal] =
    useState(false);
  const [didLoadNotificationSettings, setDidLoadNotificationSettings] =
    useState(false);
  const [formfunctionNotifications, setFormfunctionNotifications] =
    useState(false);
  const [exchangeArtNotifications, setExchangeArtNotifications] =
    useState(false);
  const [dialectAddress, setDialectAddress] = useState<string>();

  const [errorReason, setErrorReason] = useState<string>();

  const updateNfts = (mintAddress: string, nft: NFTMetadata) => {
    setNfts((nfts) => new Map(nfts.set(mintAddress, nft)));
  };

  const getMoreNfts = async () => {
    if (!accountAddress) {
      return;
    }

    const newNftsRes = await OneOfOneToolsClient.nftsCreatedBy(
      accountAddress,
      NFTS_PER_PAGE,
      eventsPaginationToken ?? undefined
    );
    if (newNftsRes.isOk()) {
      const nftAddresses = [
        ...new Set(
          newNftsRes.value.events
            .map((e) => (e.nfts.length > 0 ? e.nfts[0] : null))
            .filter(notEmpty)
            // .filter((n) => !n.burned)
            .map((n) => n.mint)
        ),
      ];

      const nftsRes = await OneOfOneToolsClient.nfts(nftAddresses);
      if (nftsRes.isErr()) {
        toast.error(nftsRes.error.message);
        return;
      }

      nftsRes.value.forEach((nft) => {
        updateNfts(nft.mint, nft);
      });

      const token =
        newNftsRes.value.paginationToken &&
        newNftsRes.value.paginationToken.length > 0
          ? newNftsRes.value.paginationToken
          : null;
      setEventsPaginationToken(token);
      setHasMore(token != null);
    }
  };

  const setupNotifications = async () => {
    if (!session) {
      toast.error("Your session expired. Please login and try again.");
      return;
    }

    setIsShowingNotificationsModal(true);
  };

  const saveNotificationSettings = async (
    formfunctionNotifications: boolean,
    exchangeArtNotifications: boolean,
    dialectAddress: string | undefined
  ) => {
    if (!accountAddress || !session?.user?.name) {
      return;
    }

    setFormfunctionNotifications(formfunctionNotifications);
    setExchangeArtNotifications(exchangeArtNotifications);
    setDialectAddress(dialectAddress);

    setIsShowingNotificationsModal(false);

    const result =
      await OneOfOneToolsClient.setCreatorNotificationSubscriptionSettings(
        accountAddress,
        dialectAddress ?? session.user.name,
        formfunctionNotifications,
        exchangeArtNotifications
      );
    if (result.isOk()) {
      toast.success("Notification preferences saved.");
    } else {
      toast.error(
        "Notification preferences failed to save: " + result.error.message
      );
    }
  };

  useEffect(() => {
    if (accountAddress) {
      if (bonfidaName === undefined) {
        loadBonfidaName(accountAddress).then((name) => setBonfidaName(name));
      }
      if (twitterName === undefined) {
        loadTwitterName(accountAddress).then((name) => setTwitterName(name));
      }
    }
  }, [accountAddress]);

  useEffect(() => {
    const loadNotificationSettings = async (
      accountAddress: string,
      subscriberAddress: string
    ) => {
      const result =
        await OneOfOneToolsClient.creatorNotificationSubscriptionSettings(
          accountAddress
        );
      if (result.isOk()) {
        setFormfunctionNotifications(
          result.value?.exchangeArtNotifications ?? false
        );
        setExchangeArtNotifications(
          result.value?.exchangeArtNotifications ?? false
        );
        setDialectAddress(result.value?.deliveryAddress ?? subscriberAddress);
        setDidLoadNotificationSettings(true);
      } else {
        toast.error(result.error.message);
      }
    };
    if (session?.user?.name && accountAddress) {
      loadNotificationSettings(accountAddress, session.user.name);
    }
  }, [session, accountAddress]);

  useEffect(() => {
    if (accountAddress) {
      getMoreNfts().then(() => {
        setLoading(false);
      });
    }
  }, [accountAddress]);

  useEffect(() => {
    if (accountInput && nfts.size == 0 && !isLoading) {
      setLoading(true);
      if (accountInput.endsWith(".sol")) {
        setBonfidaName(accountInput.substring(0, accountInput.length - 4));
      }
      if (accountInput?.startsWith("@")) {
        setTwitterName(accountInput.substring(1));
      }
      resolveWalletAddress(accountInput).then((accountPublicKey) => {
        if (accountPublicKey) {
          setAccountAddress(accountPublicKey.toString());
        } else {
          setErrorReason("Unable to resolve wallet address.");
          setLoading(false);
        }
      });
    }
  }, [accountInput]);

  return (
    <Layout>
      <Head>
        <title>one / one tools</title>
        <meta name="description" content="one / one tools" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <div className="mt-4">
          <Header
            title={
              bonfidaName
                ? `NFTs created by ${bonfidaName}.sol (${shortPubKey(
                    accountAddress
                  )})`
                : `NFTs created by ${shortPubKey(accountAddress)}`
            }
            right={twitterName ? <TwitterHandle handle={twitterName} /> : ""}
          />

          {session && session.user?.name && didLoadNotificationSettings && (
            <>
              <a
                href="#"
                onClick={setupNotifications}
                className="mt-2 float-right flex gap-1 items-center ml-auto mr-1 text-sky-300"
              >
                <BellAlertIcon className="w-5 h-5" />
                <span>Notify Me</span>
              </a>
              <div className="clear-both" />
            </>
          )}

          {nfts.size > 0 ? (
            <InfiniteScroll
              dataLength={nfts.size}
              next={getMoreNfts}
              hasMore={hasMore}
              loader={<LoadingIndicator />}
              endMessage={""}
            >
              <NFTGrid nfts={[...nfts.values()]} />
            </InfiniteScroll>
          ) : isLoading ? (
            <LoadingGrid />
          ) : (
            <ErrorMessage title={errorReason ? errorReason : "No NFTs found"} />
          )}
        </div>
      </div>
      {accountAddress && (
        <NotificationSubscriptionModal
          prompt={`Get notified when ${shortenedAddress(
            accountAddress
          )} lists new NFTs on the
          following exchanges:`}
          isShowing={isShowingNotificationsModal}
          close={() => setIsShowingNotificationsModal(false)}
          formfunctionNotifications={formfunctionNotifications}
          exchangeArtNotifications={exchangeArtNotifications}
          dialectAddress={dialectAddress}
          saveNotificationSettings={(
            formfunctionNotifications,
            exchangeArtNotifications,
            dialectAddress
          ) => {
            saveNotificationSettings(
              formfunctionNotifications,
              exchangeArtNotifications,
              dialectAddress
            );
          }}
        />
      )}
    </Layout>
  );
};

export default CreatorPage;
