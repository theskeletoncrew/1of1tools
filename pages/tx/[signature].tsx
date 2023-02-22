import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { OneOfOneToolsClient } from "api-client";
import { NFTEvent } from "models/nftEvent";
import { shortenedAddress, tryPublicKey, txUrl } from "utils";
import { clusterApiUrl, network } from "utils/network";
import {
  Connection,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import {
  isNft,
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
} from "@metaplex-foundation/js";
import { useEffect, useState } from "react";
import Header from "components/Header/Header";
import Layout from "components/Layout/Layout";
import NFTDetailsTable from "components/NFTDetailsTable/NFTDetailsTable";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import NFTDisplay from "components/NFTDisplay/NFTDisplay";
import {
  humanReadableEventPastTense,
  humanReadableEventType,
  humanReadableSource,
  urlForSource,
} from "utils/helius";
import { OneOfOneNFTMetadata } from "models/oneOfOneNFTMetadata";
import { loadBonfidaName, loadTwitterName } from "utils/addressResolution";
import { TransactionType } from "helius-sdk";
import Link from "next/link";
import { Square2StackIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Props {
  nftMetadata: OneOfOneNFTMetadata;
  event: NFTEvent;
  isImported: boolean;
  eventDescriptionLinked: string;
  eventDescriptionUnlinked: string;
  eventDescriptionUnlinkedShort: string;
}

export const getEventDescription = async (
  nftEvent: NFTEvent,
  metadata: OneOfOneNFTMetadata,
  includeLinks: boolean,
  includeTypeAndName: boolean
): Promise<string> => {
  const nft = nftEvent.nfts?.length > 0 ? nftEvent.nfts[0] : null;

  const source = nftEvent.source;
  const url = `https://1of1.tools/nft/${nft?.mint}?i=1`;
  const sourceURL = nft ? urlForSource(source, nft.mint) : null;

  const typeText = humanReadableEventPastTense(nftEvent.type);

  let sellerText: string = "";
  let buyerText: string = "";

  if (nftEvent.seller) {
    let sellerURL = nftEvent?.seller
      ? `https://1of1.tools/wallet/${nftEvent.seller}`
      : null;
    let sellerName = shortenedAddress(nftEvent.seller);
    let sellerPt2: string = "";

    const sellerTwitter = await loadTwitterName(nftEvent.seller);
    if (sellerTwitter) {
      sellerPt2 = includeLinks
        ? ` ([${sellerName}](${sellerURL}))`
        : ` (${sellerName})`;
      sellerName = `@${sellerTwitter}`;
      sellerURL = `https://twitter.com/${sellerTwitter}`;
    } else {
      const sellerBonafida = await loadBonfidaName(nftEvent.seller);
      if (sellerBonafida) {
        sellerName = sellerBonafida + ".sol";
      }
    }

    sellerText = includeLinks
      ? ` by [${sellerName}](${sellerURL})${sellerPt2}`
      : ` by ${sellerName}${sellerPt2}`;
  }

  if (nftEvent.buyer) {
    let buyerURL = nftEvent?.buyer
      ? `https://1of1.tools/wallet/${nftEvent.buyer}`
      : null;
    let buyerName = shortenedAddress(nftEvent.buyer);
    let buyerPt2: string = "";

    const buyerTwitter = await loadTwitterName(nftEvent.buyer);
    if (buyerTwitter) {
      buyerPt2 = includeLinks
        ? ` ([${buyerName}](${buyerURL}))`
        : ` (${buyerName})`;
      buyerName = `@${buyerTwitter}`;
      buyerURL = `https://twitter.com/${buyerTwitter}`;
    } else {
      const buyerBonafida = await loadBonfidaName(nftEvent.buyer);
      if (buyerBonafida) {
        buyerName = buyerBonafida;
      }
    }

    const buyerRelationship = nftEvent.seller ? "to" : "by";
    buyerText = includeLinks
      ? ` ${buyerRelationship} [${buyerName}](${buyerURL})${buyerPt2}`
      : ` ${buyerRelationship} ${buyerName}${buyerPt2}`;
  }

  const priceText =
    nftEvent.type === TransactionType.NFT_BID ||
    nftEvent.type === TransactionType.NFT_SALE
      ? ` for ${nftEvent.amount / LAMPORTS_PER_SOL} SOL`
      : "";
  const sourceText = sourceURL
    ? ` on [${humanReadableSource(source)}](${sourceURL})`
    : ` on ${humanReadableSource(source)}`;

  const description = `${
    includeTypeAndName ? `${typeText}: ${metadata.name} ` : ""
  }${sellerText}${buyerText}${priceText}${sourceText}`;
  return description;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const signature = context.query.signature as string;
  const i = context.query.i as string;
  const isImported = i === "1" ? true : false;

  try {
    const metadataRes = await OneOfOneToolsClient.event(signature, isImported);
    if (metadataRes.isErr()) {
      throw new Error("Unable to load NFT: " + metadataRes.error.message);
    }

    const nftMetadata = metadataRes.value.nft ?? null;
    const event = metadataRes.value.event ?? null;

    const eventDescriptionLinked = await getEventDescription(
      event,
      nftMetadata,
      true,
      true
    );

    const eventDescriptionUnlinked = await getEventDescription(
      event,
      nftMetadata,
      false,
      true
    );

    const eventDescriptionUnlinkedShort = await getEventDescription(
      event,
      nftMetadata,
      false,
      false
    );

    if (!nftMetadata || !event) {
      throw new Error("Metadata or NFT unavailable");
    }

    return {
      props: {
        nftMetadata,
        event,
        isImported,
        eventDescriptionLinked,
        eventDescriptionUnlinked,
        eventDescriptionUnlinkedShort,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      redirect: {
        destination:
          "/error?msg=" +
          encodeURIComponent((error as Error) ? (error as Error).message : ""),
        permanent: false,
      },
    };
  }
};

const NFTPage: NextPage<Props> = ({
  nftMetadata,
  event,
  isImported,
  eventDescriptionLinked,
  eventDescriptionUnlinked,
  eventDescriptionUnlinkedShort,
}) => {
  const [nft, setNft] = useState<Nft | Sft | SftWithToken | NftWithToken>();
  const [parentNft, setParentNft] = useState<Nft>();
  const [collectionNft, setCollectionNft] = useState<Nft>();
  const [owner, setOwner] = useState<string>();
  const { data: session } = useSession();
  const wallet = useWallet();

  useEffect(() => {
    const loadExtendedData = async (address: string) => {
      const publicKey = tryPublicKey(address);

      if (publicKey) {
        const endpoint = clusterApiUrl(network);
        const connection = new Connection(endpoint);
        const mx = Metaplex.make(connection);
        const nft = await mx.nfts().findByMint({ mintAddress: publicKey });

        // if (!isNft(nft)) {
        //   return;
        // }

        setNft(nft);

        if (isNft(nft) && !nft.edition.isOriginal) {
          // const parentNft = (await mx.nfts().findByMetadata({
          //   mintAddress: nft.edition.parent,
          // })) as Nft;
          // setParentNft(parentNft);
          // console.log(parentNft);
        }

        if (nft.collection) {
          const collectionNft = await mx
            .nfts()
            .findByMint({ mintAddress: nft.collection?.address });
          setCollectionNft(collectionNft as Nft);
        }

        const largestAccounts = await connection.getTokenLargestAccounts(
          new PublicKey(address)
        );
        const largetAccountAddress = largestAccounts?.value[0]?.address;
        if (largetAccountAddress) {
          const largestAccountInfo = await connection.getParsedAccountInfo(
            largetAccountAddress
          );
          setOwner(
            (largestAccountInfo.value?.data as ParsedAccountData).parsed.info
              .owner ?? undefined
          );
        }
      }
    };
    if (nftMetadata) {
      loadExtendedData(nftMetadata.mint);
    } else {
      setNft(undefined);
      setParentNft(undefined);
      setCollectionNft(undefined);
    }
  }, [nftMetadata]);

  const title = `1of1.tools - ${humanReadableEventPastTense(event.type)}: ${
    nftMetadata.name
  } | ${event.signature}`;
  const url = `https://1of1.tools/tx/${event.signature}?i=${
    isImported ? "1" : "0"
  }`;
  const description = `View ${nftMetadata.name} aggregated nft listings, owner information, and historical activity across all marketplaces.`;
  const featuredImageURL =
    nftMetadata.cachedImage ??
    nftMetadata.image ??
    "https://1of1.tools/images/1of1tools-boutique-collections.png";

  return (
    <Layout>
      <div>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="icon" href="/favicon.ico" />

          <meta name="description" content={description} />
          <meta name="theme-color" content="#ffffff" />

          <meta property="og:url" content={url} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={featuredImageURL} />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={featuredImageURL} />
        </Head>

        <div className="mt-4">
          <Header
            title={`${humanReadableEventPastTense(event.type)}: ${
              nftMetadata.name
            }`}
            subtitle={eventDescriptionUnlinkedShort}
          />
          <div className="p-1 mt-4 md:mt-8">
            <div className="flex flex-col gap-6 md:p-0 md:flex-row md:gap-10">
              <div className="w-full md:w-2/5 xl:w-1/2">
                {nft && <NFTDisplay nft={nft} />}
              </div>
              <div className="w-full md:w-3/5 xl:w-1/2">
                <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                  <table className="w-full text-sm rounded-md">
                    <tbody>
                      <tr>
                        <td className="pr-10">Event Transaction:</td>
                        <td className="text-right text-indigo-300 flex items-center justify-end gap-1">
                          <a href={txUrl(event.signature, network)}>
                            {shortenedAddress(event.signature)}
                          </a>
                          <Square2StackIcon
                            className="w-5 h-5 cursor-pointer text-indigo-400"
                            onClick={async () => {
                              await navigator.clipboard.writeText(
                                event.signature
                              );
                              toast.success("Copied!");
                            }}
                          />
                          <Link
                            href={`https://solscan.io/tx/${event.signature}`}
                          >
                            <a target="_blank" rel="noreferrer">
                              <img
                                src="/images/solscan.png"
                                alt="Solscan"
                                width="14"
                                height="14"
                              />
                            </a>
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                  <div className="flex gap-4 items-center justify-between">
                    <div>
                      <label className=" text-indigo-500 text-sm">
                        {humanReadableEventType(event.type).toUpperCase()}
                      </label>
                      <div className="flex gap-2 items-center text-3xl">
                        <span>{(event.amount ?? 0) / LAMPORTS_PER_SOL}</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <use href="#solana-icon"></use>
                        </svg>
                      </div>
                    </div>
                    <Link
                      href={urlForSource(event.source, nftMetadata.mint) ?? "#"}
                    >
                      <a target="_blank" rel="noreferrer">
                        <button className="button">
                          View on {humanReadableSource(event.source)}
                        </button>
                      </a>
                    </Link>
                  </div>
                </div>

                <div className="px-4 pt-3 pb-4 mb-4 sm:mb-3 rounded-lg bg-white bg-opacity-5 focus:outline-none">
                  <NFTDetailsTable
                    nft={nft}
                    collectionNft={collectionNft}
                    parentNft={parentNft}
                    owner={owner}
                    sellerFeeBasisPoints={nftMetadata.sellerFeeBasisPoints}
                    mintAddress={nftMetadata.mint}
                    updateAuthority={nftMetadata.updateAuthorityAddress}
                    collectionAddress={nftMetadata.collection?.address}
                    isMutable={nftMetadata.isMutable}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NFTPage;
