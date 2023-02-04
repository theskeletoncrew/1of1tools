import type { GetServerSideProps, NextPage } from "next";
import { OneOfOneToolsClient } from "api-client";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import AccountSettingsNav from "components/AccountSettingsNav/AccountSettingsNav";
import { classNames } from "utils";
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

  return (
    <Layout>
      <Head>
        <title>one / one tools</title>
        <meta name="description" content="one / one tools" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="mt-4">
        <Header title={"Account Settings"} />
      </div>

      <AccountSettingsNav currentTab="notifications" />

      <div className="mx-2">
        <div className="flex gap-10">
          <div className="border-t-2 border-indigo-800 w-full pt-4 px-6">
            Coming Soon
            {/* <ul>
          {subscriptions.map((subscription, i) => (
            <li
              key={i}
              className={classNames(
                "py-4 px-6",
                i % 2 == 1 ? "bg-indigo-700" : "bg-indigo-800"
              )}
            >
              {walletAddress}
            </li>
          ))}
        </ul> */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
