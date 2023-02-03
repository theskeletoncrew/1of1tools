import { GetServerSideProps } from "next";
import { useEffect } from "react";
import FormData from "form-data";
import { Constants } from "models/constants";
import { OneOfOneToolsClient } from "api-client";
import { useSession } from "next-auth/react";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { unstable_getServerSession } from "next-auth";

interface Props {
  result: string;
}

export default function DiscordConnectPage(props: Props) {
  const { data: session } = useSession();

  useEffect(() => {
    setTimeout(() => {
      window.close();
    }, 1000);
  }, []);

  return <p className="mt-10 text-center">{props.result}</p>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    console.log(context.query);
    const code = context.query.code as string;
    const guildId = context.query.guild_id as string;
    const clientId = Constants.DISCORD_APP_ID;
    const clientSecret = process.env.DISCORD_OAUTH_SECRET;
    const redirectURI = Constants.DISCORD_OAUTH_REDIRECT_URI;

    if (!code) {
      throw new Error("Failed - code missing.");
    }
    if (!clientId) {
      throw new Error("Failed - clientId missing.");
    }
    if (!clientSecret) {
      throw new Error("Failed - clientSecret missing.");
    }
    if (!redirectURI) {
      throw new Error("Failed - redirectURI missing.");
    }

    const data = new FormData();
    data.append("client_id", clientId);
    data.append("client_secret", clientSecret);
    data.append("grant_type", "authorization_code");
    data.append("code", code);
    data.append("redirect_uri", redirectURI);

    const response = await fetch(`${Constants.DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: data.getHeaders(),
      body: data.getBuffer(),
    });
    if (!response.ok) {
      return {
        props: {
          result: "Failed Authentication.",
        },
      };
    }

    const result = await response.json();
    const discordAccessToken = result.access_token;
    const discordTokenType = result.token_type;
    const discordRefreshToken = result.refresh_token;

    const discordRes = await OneOfOneToolsClient.connectDiscord(
      discordAccessToken,
      discordTokenType,
      discordRefreshToken,
      guildId,
      context.req.headers.cookie
    );

    if (discordRes.isErr()) {
      return {
        props: {
          result: discordRes.error.message,
        },
      };
    }

    return {
      props: {
        result: `Returning to ${Constants.PRODUCT_NAME}!`,
      },
    };
  } catch (error) {
    return {
      props: {
        result: (error as Error).message,
      },
    };
  }
};
