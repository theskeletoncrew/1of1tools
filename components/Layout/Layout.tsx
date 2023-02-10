import { OneOfOneToolsClient } from "api-client";
import SolanaIcon from "components/Icons/SolanaIcon";
import MainNavigation from "components/MainNavigation/MainNavigation";
import SignupModal from "components/SignupModal/SignupModal";
import { create } from "domain";
import { signOut, useSession } from "next-auth/react";
import React, { ReactNode, useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";

type Props = {
  children?: ReactNode;
  isHome?: boolean;
};

const Layout = ({ children, isHome = false }: Props) => {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { data: session, status } = useSession();

  const saveAccount = async (
    isCreator: boolean,
    username: string,
    email: string | undefined,
    discordId: string | undefined,
    twitterUsername: string | undefined
  ): Promise<boolean> => {
    const createRes = await OneOfOneToolsClient.createAccount(
      isCreator,
      username,
      email,
      discordId,
      twitterUsername
    );
    if (createRes.isOk()) {
      toast.success("Account saved");
      return true;
    } else {
      toast.error("Failed to create account: " + createRes.error.message);
      return false;
    }
  };

  const cancelSignup = async () => {
    signOut();
  };

  useEffect(() => {
    if (session && !session.user?.account) {
      setShowSignupModal(true);
    }
  }, [session]);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ style: { fontSize: "13px" } }}
      />
      <SolanaIcon />
      <main>
        <div className="m-4 mt-3 sm:m-8 sm:mt-4">
          <MainNavigation />
          {children}
        </div>
      </main>
      <SignupModal
        isShowing={showSignupModal}
        close={cancelSignup}
        saveAccount={saveAccount}
      />
    </>
  );
};

export default Layout;
