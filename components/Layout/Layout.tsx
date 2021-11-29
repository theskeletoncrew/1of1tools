import MainNavigation from "components/MainNavigation/MainNavigation";
import React, { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

type Props = {
  children?: ReactNode;
  isHome?: boolean;
};

const Layout = ({ children, isHome = false }: Props) => {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ style: { fontSize: "13px" } }}
      />
      <main>
        <div
          className={
            isHome
              ? "p-8 min-h-[100vh] flex items-center justify-center"
              : "m-4 mt-3 sm:m-8 sm:mt-4"
          }
        >
          {!isHome && <MainNavigation />}
          {children}
        </div>
      </main>
    </>
  );
};

export default Layout;
