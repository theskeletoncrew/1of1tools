import { Account } from "models/account";
import NextAuth, { DefaultSession } from "next-auth";

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      account: Account | null;
    } & DefaultSession["user"];
  }
}
