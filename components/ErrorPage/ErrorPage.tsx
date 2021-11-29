import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import Head from "next/head";

interface Props {
  message: string;
}

const ErrorPage: React.FC<Props> = ({ message }) => {
  return (
    <Layout>
      <>
        <Head>
          <title>Error</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="mt-4">
          <Header title="Error" />
          <div className="px-4 py-40 flex flex-col gap-4 text-center text-xl justify-center items-center text-indigo-400">
            <ExclamationTriangleIcon className="w-10 h-10" />
            <p>{message}</p>
          </div>
        </div>
      </>
    </Layout>
  );
};

export default ErrorPage;
