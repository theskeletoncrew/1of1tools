import { Session } from "next-auth";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
  Redirect,
} from "next";

export async function currentSession(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
): Promise<Session | null> {
  const session = await unstable_getServerSession(
    args[0],
    args[1],
    authOptions
  );

  return session;
}

export function loginRedirect(): { redirect: Redirect } {
  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
}
