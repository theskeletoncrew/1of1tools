import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as base58 from "bs58";
import * as util from "tweetnacl-util";
import { sign } from "tweetnacl";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseAdmin } from "utils/firebase";
import { signInMessage, AUTH_DOMAIN } from "components/Auth";
import { parsePayload } from "components/Auth";
import { getAccountByWallet } from "db";

const providers = [
  CredentialsProvider({
    name: "Solana",
    credentials: {
      publicKey: {
        label: "Public Key",
        type: "text",
        placeholder: "0x0",
      },
      payload: {
        label: "Payload",
        type: "text",
        placeholder: "n/a",
      },
      signature: {
        label: "Signature",
        type: "text",
        placeholder: "0x0",
      },
    },
    async authorize(credentials, req) {
      try {
        const payload = credentials?.payload.toString();
        const publicKey: string | undefined = credentials?.publicKey.toString();
        const signature = credentials?.signature.toString();

        if (!payload || !publicKey || !signature) {
          throw new Error("Credentials not provided");
        }

        // verify the TTL
        const ttlVerified = await verifyTTL(publicKey);
        if (!ttlVerified) {
          throw new Error("Nonce is expired");
        }

        // get the nonce from the database
        let dbNonce = await getNonce(publicKey);
        if (!dbNonce) {
          throw new Error("Public Key not in DB");
        }

        const { nonce, domain } = parsePayload(payload);

        // verify the payload
        const constructedMessage = signInMessage(nonce, domain);

        if (domain !== AUTH_DOMAIN) {
          throw new Error("AUTH_DOMAIN does not match domain sent from client");
        }

        if (constructedMessage !== payload) {
          throw new Error("Invalid payload");
        }

        if (nonce !== dbNonce) {
          throw new Error("Nonce is invalid");
        }

        const payloadUInt8 = util.decodeUTF8(payload);
        const publicKeyUInt8 = base58.decode(publicKey);
        const signatureUInt8 = qptua(signature);

        // verify that the bytes were signed with the private key
        if (
          !sign.detached.verify(payloadUInt8, signatureUInt8, publicKeyUInt8)
        ) {
          throw new Error("invalid signature");
        }

        const accountRes = await getAccountByWallet(publicKey);
        const user = {
          id: publicKey,
          account: accountRes.isOk() ? accountRes.value : null,
        } as User;
        return user;
      } catch (e) {
        return null;
      }
    },
  }),
];

const useSecureCookies = process.env.NODE_ENV !== "development";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers/credentials
  providers,
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.id;
        token.user = user;
      }
      return token;
    },
  },
  // cookies: {
  //   sessionToken: {
  //     name: `${cookiePrefix}next-auth.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: useSecureCookies,
  //     },
  //   },
  //   callbackUrl: {
  //     name: `${cookiePrefix}next-auth.callback-url`,
  //     options: {
  //       sameSite: "lax",
  //       path: "/",
  //       secure: useSecureCookies,
  //     },
  //   },
  //   csrfToken: {
  //     name: `__Host-next-auth.csrf-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: useSecureCookies,
  //     },
  //   },
  //   pkceCodeVerifier: {
  //     name: `${cookiePrefix}next-auth.pkce.code_verifier`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: useSecureCookies,
  //       maxAge: 900,
  //     },
  //   },
  //   state: {
  //     name: `${cookiePrefix}next-auth.state`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: useSecureCookies,
  //       maxAge: 900,
  //     },
  //   },
  //   nonce: {
  //     name: `${cookiePrefix}next-auth.nonce`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: useSecureCookies,
  //     },
  //   },
  // },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/?error=login",
    verifyRequest: "/",
    newUser: "/",
  },
};

const db = getFirestore(firebaseAdmin);

const getNonce = async (pubkey: string) => {
  const doc = await db.doc(`signinattempts/${pubkey}`).get();
  if (doc.exists) {
    return doc.data()?.nonce;
  }
  return undefined;
};

const verifyTTL = async (pubkey: string) => {
  const doc = await db.doc(`signinattempts/${pubkey}`).get();
  const ttl = doc.data()?.ttl;
  if (ttl < +new Date()) {
    return false;
  }
  return true;
};

/**
 * Function to take a query param to a Uint8Array
 * @param qp
 * @returns Uint8Array to pass to tweetnacl functions
 */
const qptua = (qp: string | string[]) =>
  Uint8Array.from(
    qp
      .toString()
      .split(",")
      .map((e) => parseInt(e))
  );

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default async function auth(req: any, res: any) {
  return await NextAuth(req, res, authOptions);
}
