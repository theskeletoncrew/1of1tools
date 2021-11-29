import { FC, ReactNode } from "react";
import { SolanaSignInProvider } from "../SolanaSignInProvider";

interface SolanaAuthProviderProps {
  requestUrl: string;
  callbackUrl: string;
  authDomain: string;
  children: ReactNode;
}

export const SolanaAuthProvider: FC<SolanaAuthProviderProps> = ({
  children,
  ...props
}) => {
  return <SolanaSignInProvider {...props}>{children}</SolanaSignInProvider>;
};
