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
import { DiscordGuild, DiscordGuildChannelIdPair } from "models/account";

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
  const [discordGuilds, setDiscordGuilds] = useState<
    DiscordGuild[] | null | undefined
  >();
  const [discordSubscriptions, setDiscordSubscriptions] =
    useState<DiscordGuildChannelIdPair[]>();

  const [errorReason, setErrorReason] = useState<string>();

  const updateNfts = (mintAddress: string, nft: NFTMetadata) => {
    setNfts((nfts) => new Map(nfts.set(mintAddress, nft)));
  };

  const getMoreNfts = async () => {
    if (!accountAddress) {
      return;
    }

    const newNftsRes = await OneOfOneToolsClient.creatorNFTs(
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
    dialectAddress: string | undefined,
    discordSubscriptions: DiscordGuildChannelIdPair[] | undefined,
    formfunctionNotifications: boolean | undefined,
    exchangeArtNotifications: boolean | undefined
  ) => {
    if (
      !accountAddress ||
      !session?.user?.id ||
      formfunctionNotifications === undefined ||
      exchangeArtNotifications === undefined
    ) {
      return;
    }

    setFormfunctionNotifications(formfunctionNotifications);
    setExchangeArtNotifications(exchangeArtNotifications);
    setDialectAddress(dialectAddress);
    setDiscordSubscriptions(discordSubscriptions);

    setIsShowingNotificationsModal(false);

    const result =
      await OneOfOneToolsClient.setDialectCreatorNotificationSubscriptionSettings(
        accountAddress,
        dialectAddress ?? session.user.id,
        formfunctionNotifications,
        exchangeArtNotifications
      );
    if (!result.isOk()) {
      toast.error(
        "Notification preferences failed to save: " + result.error.message
      );
      return;
    }

    if (discordGuilds && discordGuilds.length > 0) {
      const subscriptions = discordSubscriptions?.map((pair) => ({
        subscriberAddress: session.user.id,
        guildId: pair.guildId,
        channelId: pair.channelId,
        formfunctionNotifications: formfunctionNotifications,
        exchangeArtNotifications: exchangeArtNotifications,
      }));
      const result2 =
        await OneOfOneToolsClient.setDiscordCreatorNotificationSubscriptionSettings(
          accountAddress,
          subscriptions ?? []
        );
      if (!result2.isOk()) {
        console.log(result2.error.message);
        toast.error(
          "Notification preferences failed to save: " + result2.error.message
        );
        return;
      }

      toast.success("Notification preferences saved.");
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
        await OneOfOneToolsClient.dialectCreatorNotificationSubscriptionSettings(
          accountAddress
        );
      if (!result.isOk()) {
        toast.error(result.error.message);
        return;
      }
      setFormfunctionNotifications(
        result.value?.exchangeArtNotifications ?? true
      );
      setExchangeArtNotifications(
        result.value?.exchangeArtNotifications ?? true
      );
      setDialectAddress(result.value?.deliveryAddress ?? subscriberAddress);

      const result2 =
        await OneOfOneToolsClient.discordCreatorNotificationSubscriptionSettings(
          accountAddress
        );
      if (!result2.isOk()) {
        toast.error(result2.error.message);
        return;
      }
      setDiscordSubscriptions(result2.value);

      const result3 = await OneOfOneToolsClient.getCurrentUserAccount();
      if (!result3.isOk()) {
        console.log(result3.error.message);
        return;
      }
      setDiscordGuilds(
        result3.value.discordGuilds?.filter((g) => g.selectedChannelId != null)
      );

      setDidLoadNotificationSettings(true);
    };
    if (session?.user?.id && accountAddress) {
      loadNotificationSettings(accountAddress, session.user.id);
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

          {session && session.user?.id && didLoadNotificationSettings && (
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
            <LoadingGrid className="mt-10 mx-1 gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-6" />
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
          discordGuilds={discordGuilds ?? undefined}
          discordSubscriptions={discordSubscriptions}
          saveNotificationSettings={(
            dialectAddress,
            discordSubscriptions,
            formfunctionNotifications,
            exchangeArtNotifications
          ) => {
            saveNotificationSettings(
              dialectAddress,
              discordSubscriptions,
              formfunctionNotifications,
              exchangeArtNotifications
            );
          }}
        />
      )}
    </Layout>
  );
};

export default CreatorPage;
