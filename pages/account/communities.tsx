import type { GetServerSideProps, NextPage } from "next";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import AccountSettingsNav from "components/AccountSettingsNav/AccountSettingsNav";
import { Constants } from "models/constants";
import { DiscordAccount, DiscordGuild } from "models/account";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { currentSession, loginRedirect } from "utils/session";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await currentSession(context.req, context.res);
  if (!session) {
    return loginRedirect();
  }

  return {
    props: {},
  };
};

const AccountPage: NextPage = () => {
  const { data: session } = useSession();

  const [discordAccount, setDiscordAccount] = useState<DiscordAccount>();
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>();

  const loadAccountDiscord = async () => {
    const accountRes = await OneOfOneToolsClient.getCurrentUserAccount();
    if (accountRes.isOk()) {
      const account = accountRes.value;
      if (account.discordAccount) {
        setDiscordAccount(account.discordAccount);
      }
      if (account.discordGuilds) {
        setDiscordGuilds(account.discordGuilds);
      }
    }
  };

  const connectDiscord = async () => {
    if (!session) {
      toast.error("You must be logged in");
      return;
    }

    window.open(Constants.DISCORD_BOT_OAUTH_URL, "_blank");
    window.addEventListener(
      "focus",
      async () => {
        loadAccountDiscord();
      },
      { once: true }
    );
  };

  useEffect(() => {
    loadAccountDiscord();
  }, []);

  const guildChannelChosen = async (guildId: string, channelId: string) => {
    const channelRes = await OneOfOneToolsClient.selectDiscordChannel(
      guildId,
      channelId
    );
    if (channelRes.isOk()) {
      toast.success("Saved");
    } else {
      toast.error(channelRes.error.message);
    }
  };

  const deleteGuild = async (guildId: string) => {
    if (confirm("Are you sure you want to delete this Discord server?")) {
      const deleteRes = await OneOfOneToolsClient.disconnectDiscordGuild(
        guildId
      );
      if (deleteRes.isOk()) {
        setDiscordGuilds((guilds) => guilds?.filter((g) => g.id !== guildId));
        toast.success("Deleted");
      } else {
        toast.error(deleteRes.error.message);
      }
    }
  };

  return (
    <Layout>
      <Head>
        <title>one / one tools</title>
        <meta name="description" content="one / one tools" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="mt-4">
        <Header
          title={"Account Settings"}
          right={`@${session?.user.account?.username}`}
        />
      </div>

      <AccountSettingsNav currentTab="communities" />

      {session?.user.id === "5awsmonFXxL4xCNQTYVgw8zGWXEzAcoTbirxYEYqxwh3" ? (
        <div className="mx-2">
          <div className="flex gap-10">
            <div className="border-t-2 pt-4 px-6 border-indigo-800 w-full">
              <h2 className="text-xl">Discord Servers:</h2>
              <div className="mt-4 mb-8">
                {!discordGuilds || discordGuilds.length == 0 ? (
                  "None"
                ) : (
                  <table className="text-left">
                    <tr className="text-indigo-300">
                      <th>Name</th>
                      <th>Notification Channel</th>
                    </tr>
                    {discordGuilds?.map((guild) => (
                      <tr key={guild.id}>
                        <td className="pr-10 align-middle">
                          <span className="text-indigo-400">{guild.name}</span>
                        </td>
                        <td className="pr-4 pt-4 align-middle">
                          <form action="#">
                            <div className="flex items-center gap-2 text-lg">
                              <select
                                key={`${guild.id}-channels`}
                                id={`${guild.id}-channels`}
                                onChange={(e) => {
                                  guildChannelChosen(guild.id, e.target.value);
                                }}
                                defaultValue={guild.selectedChannelId ?? ""}
                                className="w-full"
                              >
                                <option value="">Select a Channel</option>
                                {guild.channels?.map((channel) => (
                                  <option
                                    key={`${guild.id}-${channel.id}`}
                                    value={channel.id}
                                  >
                                    {channel.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </form>
                        </td>
                        <td className="pt-4 align-middle">
                          <button onClick={() => deleteGuild(guild.id)}>
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </table>
                )}
              </div>
              <button className="button" onClick={connectDiscord}>
                + Connect a Discord Server
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-2">
          <div className="flex gap-10">
            <div className="border-t-2 border-indigo-800 w-full pt-4 px-6">
              Coming Soon
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AccountPage;
