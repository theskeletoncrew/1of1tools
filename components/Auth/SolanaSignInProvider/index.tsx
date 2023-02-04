import React from "react";
import { Wallet, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { toast } from "react-hot-toast";
import { getSession, signIn, signOut } from "next-auth/react";
import { signInMessage } from "components/Auth";
import { useRouter } from "next/router";

export interface SolanaAuthState {
  publicKey: PublicKey | null;
  wallet: Wallet | null;
  walletNotSelected: boolean;
  authenticate(): void;
  disconnectWallet(): void;
}

export interface SolanaSignInProviderProps {
  children: ReactNode;
  requestUrl: string;
  callbackUrl: string;
  authDomain: string;
}
export const SolanaSignInProvider: FC<SolanaSignInProviderProps> = ({
  children,
  requestUrl,
  callbackUrl,
  authDomain: domain,
}) => {
  const { publicKey, signMessage, connect, wallet, connected, disconnect } =
    useWallet();
  const { setVisible } = useWalletModal();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const authenticate = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const { nonce } = await fetch(`${requestUrl}?publicKey=${publicKey}`)
        .then((resp) => resp.json())
        .then((data) => data);

      if (!signMessage) {
        throw new Error("Wallet does not support signing");
      }

      const message = signInMessage(nonce, domain);
      const encodedMsg = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMsg);

      const result = await signIn("credentials", {
        publicKey: publicKey!.toString(),
        payload: message,
        signature: Array.from(signature).toString(),
        redirect: false,
        callbackUrl,
      });

      if (result) {
        if (result.ok) {
          toast.success("Signed in!");
        } else if (result.error) {
          toast.error("Sign in failed.");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name !== "WalletSignMessageError" ||
          error.message !== "User rejected the request."
        ) {
          toast.error(`Signing failed: ${error.message}`);
        }
      } else {
        console.log(error);
      }
    }
    setIsSigningIn(false);
  }, [domain, publicKey, requestUrl, callbackUrl, signMessage]);

  // useEffect(() => {
  //   if (wallet?.readyState == WalletReadyState.Installed) {
  //     connect();
  //   }
  // }, [wallet?.readyState, connect]);

  useEffect(() => {
    if (isSigningIn) {
      if (connected) {
        const loadAndAuthenticate = async () => {
          const session = await getSession();
          if (!session || !session.user) {
            authenticate();
          }
        };
        loadAndAuthenticate();
      } else {
        openWalletModal();
      }
    }
  }, [connected, authenticate, isSigningIn]);

  const disconnectWallet = async () => {
    setIsSigningIn(false);
    await disconnect();
    await signOut();
  };

  const openWalletModal = () => {
    setVisible(true);
  };

  let walletNotSelected = !wallet;

  return (
    <SolanaAuthContext.Provider
      value={{
        authenticate: () => {
          setIsSigningIn(true);
        },
        publicKey,
        wallet,
        walletNotSelected,
        disconnectWallet,
      }}
    >
      {children}
    </SolanaAuthContext.Provider>
  );
};

const SolanaAuthContext = createContext<SolanaAuthState>({} as SolanaAuthState);

export const useSolanaSignIn = () => {
  return useContext(SolanaAuthContext);
};
