import "microtip/microtip.css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import React, { useMemo, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { NextPage } from "next";
import { network, clusterApiUrl } from "utils/network";
import { SolanaAuthProvider } from "components/Auth";
import { SessionProvider } from "next-auth/react";

export interface DialectProvidersProps {
  endpoint: string;
  children: ReactNode;
}

type AppPropsWithLayout = AppProps & {
  Component: NextPage;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  const wallets = useMemo(
    () => [
      new BraveWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter({ params: { network } }),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    []
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{ confirmTransactionInitialTimeout: 90 * 1000 }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider className="wallet-modal-theme">
          <SolanaAuthProvider
            authDomain={process.env.NEXT_PUBLIC_AUTH_DOMAIN || ""}
            requestUrl="/api/auth-challenge"
            callbackUrl="/"
          >
            <SessionProvider
              session={(pageProps as any).session}
              refetchInterval={0}
            >
              <Component {...pageProps} />
            </SessionProvider>
          </SolanaAuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
